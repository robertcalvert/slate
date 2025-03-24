// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Fs from 'fs';
import * as Path from 'path';

import merge from 'deepmerge';

import { Server } from '../server';
import { Request } from '../core/request';
import { Response, ResponseCacheOptions, ResponseSecurityOptions } from '../core/response';

import { Middleware } from '../middleware';

import * as PathUtils from '../utils/pathUtils';

// Defines the supported HTTP methods for routing
// You can still use other HTTP methods via the wildcard ('*'), but they must be handled manually in the route handler
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Interface for defining a router
export interface Router {
    // The path to the folder that contains the route files
    readonly path?: string;

    // The router's middleware
    // Each router can provide middleware that runs last in the pipeline before handling the route
    readonly middleware?: Middleware;

    // Default options for the routes, which can be overridden on the individual route level
    readonly defaults?: {
        cache?: ResponseCacheOptions;           // Default cache-control options
        auth?: RouteAuthOptions;                // Default authentication options
        security?: ResponseSecurityOptions;     // Default security options
    }

    // The routes for the router
    // You can either provide a predefined set of routes here or let the framework populate them based on the 'path'
    routes?: Route[];
}

// Interface for defining a route
export interface Route {
    // The HTTP method can be:
    // 1. A single method (e.g., 'GET')
    // 2. A wildcard ('*') to allow any method
    // 3. An array of specific methods (e.g., ['GET', 'POST'])
    readonly method: '*' | HttpMethod | HttpMethod[];

    path: string;                                   // The route path, which may include dynamic parameters (e.g., '/users/{id}')
    readonly excludeFileName?: boolean;             // Optional flag to exclude the file name in the path
    readonly isCaseSensitive?: boolean;             // Optional flag to make the route path case-sensitive

    readonly cache?: ResponseCacheOptions;          // The routes cache-control options
    readonly auth?: RouteAuthOptions;               // The routes authentication options
    readonly security?: ResponseSecurityOptions;    // The routes security options

    readonly handler: RouteHandler;                 // The function to handle requests for the route
}

// Defines authentication options for a route
export interface RouteAuthOptions {
    strategy?: string | string[];           // The authentication strategies to be used
    isOptional?: boolean;                   // Optional flag to make the authentication optional
}

// Type for the route handler function
export type RouteHandler = (req: Request, res: Response) => Promise<Response>;

// Interface for a route group
// This is a collection of method handlers for the same path
interface RouteGroup {
    router: Router;                         // The router the group is for
    regex: RegExp;                          // The regex for the path
    paramNames: string[];                   // Param names captured by the regex
    methods: Record<string, Route>;         // The supported methods and their route
}

// Router class to manage routes and handle requests
export class RouterHandler {
    private server: Server;                             // The server
    private groups = new Map<string, RouteGroup>();     // Array of registered route groups

    // Initializes the router handler
    constructor(server: Server) {
        this.server = server;
    }

    // Method to add a new router to the handler
    use(router: Router) {
        // The first router is classed as the "default" router
        const isDefaultRouter = this.groups.size === 0;

        // Try and get the routes for the router when not explicitly provided
        if (router.path && !router.routes) {
            // Create the route array
            const routes: Route[] = [];

            // Get the resolved router path
            const resolvedRouterPath = Path.resolve(router.path);

            // The default router paths are anchored to the root of the base URL,
            // while non-default routes are anchored to the last folder of their routers path
            const lastFolderInPath = Path.basename(resolvedRouterPath);

            // Internal function to get routes from a directory recursively
            const getRoutes = (router: Router, path: string) => {
                // Check that the path exists...
                if (!Fs.existsSync(path)) {
                    this.server.logger.warn(`Directory not found. Router: "${lastFolderInPath}", Path: "${path}"`);
                    return;
                }

                // Iterate over the files in the specified path
                Fs.readdirSync(path).forEach((file) => {
                    // Get the full path to the file
                    const filePath = Path.join(path, file);

                    // Process directories recursively
                    if (Fs.statSync(filePath).isDirectory()) {
                        getRoutes(router, filePath);

                    } else if (Path.extname(file).toLowerCase() === PathUtils.extname) {
                        // Get the route definitions from the file
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        const definitions: Route[] = require(PathUtils.stripExtension(filePath)).default;

                        // Determine the directory prefix based on the router
                        const relativePath = path.replace(resolvedRouterPath, '').replace(/\\/g, '/');
                        const directoryPrefix = isDefaultRouter ? relativePath : '/' + lastFolderInPath + relativePath;

                        // Get the file name prefix
                        const fileNamePrefix = Path.basename(file, Path.extname(file));

                        // Resolve the path for each route definition
                        definitions.forEach((route) => {
                            // Always include the directory prefix
                            let routePath = `${directoryPrefix}`;

                            // Add the file name prefix when needed...
                            if (!route.excludeFileName) {
                                routePath += `/${fileNamePrefix}`;
                            }

                            // Only update the path if we have a constructed path
                            // Removing any trailing slashes
                            if (routePath) {
                                route.path = `${routePath}${route.path}`.replace(/\/+$/, '');
                            }

                        });

                        // Add the route definitions to the routes array
                        routes.push(...definitions);
                    }
                });

            };

            // Get the routes from the directory recursively
            getRoutes(router, resolvedRouterPath);

            // We automatically include a 404 (Not Found) route for the router
            routes.push({
                method: '*',
                path: isDefaultRouter ? '{path:.*}' : `/${lastFolderInPath}/{path:.*}`,
                auth: {
                    isOptional: true  // Allow access even when not authenticated
                },
                handler: async (_req, res) => {
                    return res.notFound();
                }
            });

            // Assign the routes to the router
            router.routes = routes;
        }

        // If the router has routes, apply default settings, compile their regex, and register them by group
        if (router.routes) {
            // We must insure that the default routers 404 (Not Found) route
            // is always the last group in the collection
            const lastDefaultGroup = [...this.groups].pop();

            router.routes.forEach((route) => {
                // Merge the route settings with default router settings
                if (router.defaults) {
                    route = merge(router.defaults as Route, route);
                }

                // Determine the group key
                const key = route.path;

                // Add the route group if not already registered
                if (!this.groups.has(key)) {
                    // Initialize the parameter names array
                    const paramNames: string[] = [];

                    // Construct a regular expression for the path and extracts any parameter names
                    // Escape the forward slashes to match literal slashes
                    let regexStr = route.path
                        .replace(/\//g, '\\/')
                        .replace(/{([^:}]+)(?::([^}]+))?}/g, (_, paramName: string, pattern: string | undefined) => {
                            // If a regex pattern is provided, use it; otherwise, default to [^/]+
                            paramNames.push(paramName);
                            return pattern ? `(${pattern})` : '([^\\/]+)';
                        });

                    // Add anchors to match the full URL path
                    regexStr = `^${regexStr}$`;

                    this.groups.set(key, {
                        // Compile the regex, determining the sensitivity based on the route
                        regex: new RegExp(regexStr, route.isCaseSensitive ? '' : 'i'),
                        paramNames: paramNames,
                        methods: {} as Record<HttpMethod, Route>,
                        router: router
                    });
                }

                // Add the route to the group for the supported method(s)
                if (typeof route.method === 'string') {
                    this.groups.get(key)!.methods[route.method] = route;
                } else {
                    if (Array.isArray(route.method)) {
                        route.method.forEach((method) => {
                            this.groups.get(key)!.methods[method.toString()] = route;
                        });
                    }
                }

            });

            // Push the default routers last group to the bottom again
            if (lastDefaultGroup) {
                this.groups.delete(lastDefaultGroup[0]);
                this.groups.set(lastDefaultGroup[0], lastDefaultGroup[1]);
            }

        }

    }

    // Method to handle incoming requests
    async execute(req: Request, res: Response): Promise<Response> {
        // Find a matching route group
        for (const group of this.groups.values()) {
            const match = group.regex.exec(req.url.pathname || '');
            if (!match) continue; // Skip if no match

            req.router = group.router; // Pin the router to the request

            // Define a function that will execute the route handler
            const handler: RouteHandler = async (): Promise<Response> => {
                // Find the route for the request method
                const route = group.methods[req.method] || group.methods['*'];
                if (!route) return res.methodNotAllowed(Object.keys(group.methods));

                req.route = route; // Pin the route to the request

                // Set the cache-control header for the response based on the route configuration.
                // This will only be applied once the response begins,
                // and can be overridden within the route handler if needed
                if (req.method === 'GET' && route.cache) res.cache(route.cache);

                // Set the security headers for the response based on the route configuration.
                if (route.security) res.security(route.security);

                // Perform authentication if the route requires it...
                if (route.auth?.strategy) {
                    // A route could have a single strategy or an array of strategies
                    const strategies = Array.isArray(route.auth.strategy) ? route.auth.strategy : [route.auth.strategy];

                    let isAuthenticated = false;
                    for (const strategy of strategies) {
                        isAuthenticated = await req.authenticate(strategy);
                        if (isAuthenticated) break;
                    }

                    if (!isAuthenticated && !route.auth?.isOptional) {
                        return res.unauthorized();
                    }
                }

                // Extract the parameters and attach them to the request
                group.paramNames.forEach((param, index) => {
                    req.params[param] = match[index + 1]; // match[0] is the full match
                });

                // Begin parsing the request
                req.parse();

                // Wait until the request has fully ended before handling it
                return new Promise((resolve, reject) => {
                    req.raw.on('end', () => {
                        // If the response is in error, then no need to pass to the route handler
                        if (res.isError) return resolve(res);

                        resolve(route.handler(req, res)); // Execute the route handler
                    });

                    req.raw.on('error', reject);
                });

            };

            // Check if the route has a middleware function defined
            if (group.router.middleware) {
                // Execute the middleware function for the route
                return group.router.middleware(req, res, handler);
            } else {
                return handler(req, res); // Execute the handler
            }

        }

        return res.notFound(); // No matching route
    }

}
