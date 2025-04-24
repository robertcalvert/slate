// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Fs from 'fs';
import * as Path from 'path';

import merge from 'deepmerge';

import { Server } from '../server';
import { Request } from '../core/request';
import { Response, ResponseCacheOptions, ResponseSecurityOptions } from '../core/response';

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
    readonly middleware?: RouterMiddleware;

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

// Type for router middleware
export type RouterMiddleware = (req: Request, res: Response, handler: RouteHandler) => Response | Promise<Response>;

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
    scope?: string;                         // The scope required to access the route
    isOptional?: boolean;                   // Optional flag to make the authentication optional
}

// Type for the route handler function
export type RouteHandler = (req: Request, res: Response) => Response | Promise<Response>;

// Interface for a route group
// This is a collection of method handlers for the same path
interface RouteGroup {
    router?: Router;                        // The router the group is for
    regex: RegExp;                          // The regex for the path
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
            router.routes = this.loadRoutes(router, isDefaultRouter);
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

                // Add the route to the handler
                this.addRoute(route, router);

            });

            // Push the default routers last group to the bottom again
            if (lastDefaultGroup) {
                this.groups.delete(lastDefaultGroup[0]);
                this.groups.set(lastDefaultGroup[0], lastDefaultGroup[1]);
            }

        }

    }

    // Method to load the routes for a router
    private loadRoutes(router: Router, isDefaultRouter: boolean): Route[] {
        // Create the route array
        const routes: Route[] = [];

        // Get the resolved base path
        const basePath = Path.resolve(router.path!);

        // The default router paths are anchored to the root of the base URL,
        // while non-default routes are anchored to the last folder of their routers path
        const routerFolder = Path.basename(basePath);

        // Internal function to get routes from a directory recursively
        const walk = (path: string) => {
            // Check that the path exists...
            if (!Fs.existsSync(path)) {
                this.server.logger.warn(`Directory not found. Router: "${routerFolder}", Path: "${path}"`);
                return;
            }

            // Iterate over the files in the specified path
            for (const file of Fs.readdirSync(path)) {
                // Get the full path to the file
                const fullPath = Path.join(path, file);

                // Process directories recursively
                if (Fs.statSync(fullPath).isDirectory()) {
                    walk(fullPath);
                    continue;
                }

                // Check that the file has the expected extension
                if (Path.extname(file).toLowerCase() !== PathUtils.extname) continue;

                // Get the route definitions from the file
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const definitions: Route[] = require(PathUtils.stripExtension(fullPath)).default;

                // Determine the directory prefix based on the router
                const relativePath = path.replace(basePath, '').replace(/\\/g, '/');
                const dirPrefix = isDefaultRouter ? relativePath : '/' + routerFolder + relativePath;

                // Get the file name prefix
                const filePrefix = Path.basename(file, Path.extname(file));

                // Resolve the path for each route definition
                definitions.forEach(route => {
                    // Always include the directory prefix
                    let routePath = `${dirPrefix}`;

                    // Add the file prefix when needed...
                    if (!route.excludeFileName) routePath += `/${filePrefix}`;

                    // Only update the path if we have a constructed path
                    // Removing any trailing slashes
                    if (routePath) {
                        route.path = `${routePath}${route.path}`.replace(/\/+$/, '');
                    }

                });

                // Add the route definitions to the routes array
                routes.push(...definitions);
            }
        };

        // Get the routes from the directory recursively
        walk(basePath);

        // We automatically include a 404 (Not Found) route for the router
        routes.push({
            method: '*',
            path: isDefaultRouter ? '{path:.*}' : `/${routerFolder}/{path:.*}`,
            auth: {
                isOptional: true    // Allow access even when not authenticated
            },
            handler: (_req, res) => res.notFound()
        });

        return routes;
    }

    // Method to add a single route to the handler
    addRoute(route: Route, router?: Router) {
        // Determine the group key
        const key = route.path;

        // Add the route group if not already registered
        if (!this.groups.has(key)) {
            this.groups.set(key, {
                router: router,
                regex: this.compileRouteRegex(route),
                methods: {} as Record<HttpMethod, Route>
            });
        }

        // Add the route to the group for the supported method(s)
        const methods = Array.isArray(route.method) ? route.method : [route.method];
        methods.forEach(method => {
            this.groups.get(key)!.methods[method] = route;
        });

    }

    // Method to compile the route regex
    private compileRouteRegex(route: Route): RegExp {
        // The route path to compile
        const path = route.path;

        // Start the regex pattern with the beginning of the string anchor
        let pattern = '^';

        // Iterate through the path string
        let i = 0;
        while (i < path.length) {
            const char = path[i];

            // Start of dynamic parameter
            if (char === '{') {
                i++;
                let braceCount = 1;
                let param = '';
                while (i < path.length && braceCount > 0) {
                    if (path[i] === '{') braceCount++;
                    else if (path[i] === '}') braceCount--;

                    // Add the current character to the parameter string, but stop once braces are matched
                    if (braceCount > 0) param += path[i];
                    i++;
                }

                // Separate the parameter name and its regex
                const [name, regex = '[^/]+'] = param.split(/:(.+)/);

                // Append the regex pattern for the parameter
                pattern += `(?<${name}>${regex})`;

            } else {
                // Escape special regex chars
                if ('^$\\.*+?()[]'.includes(char)) {
                    pattern += '\\' + char;
                } else {
                    pattern += char;
                }
                i++;
            }
        }

        // Add the end of string anchor
        pattern += '$';

        // Compile the regex, determining the sensitivity based on the route
        return new RegExp(pattern, route.isCaseSensitive ? '' : 'i');
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
                    const strategies = Array.isArray(route.auth.strategy)
                        ? route.auth.strategy
                        : [route.auth.strategy];

                    // Attempt to authenticate the request using the strategies
                    let isAuthenticated = false;
                    for (const strategy of strategies) {
                        isAuthenticated = await req.authenticate(strategy);
                        if (isAuthenticated) break;
                    }

                    // If authentication failed, check if the route allows optional authentication
                    if (!isAuthenticated && !route.auth?.isOptional) {
                        return res.unauthorized();
                    }

                    // If the route specifies a required scope, ensure we have authorization
                    if (route.auth.scope && !req.isAuthorized(route.auth.scope)) {
                        return res.forbidden();
                    }

                }

                // Extract the parameters and attach them to the request
                if (match && match.groups) {
                    for (const key in match.groups) {
                        req.params[key] = match.groups[key];
                    }
                }

                // Begin parsing the request
                req.parse();

                // Wait until the request has fully ended before handling it
                return new Promise((resolve, reject) => {
                    req.raw.on('end', () => {
                        // If the response is in error, then no need to pass to the route handler
                        if (res.isError) return resolve(res);

                        try {
                            resolve(route.handler(req, res)); // Execute the route handler
                        } catch (error) {
                            reject(error);
                        }

                    });

                    req.raw.on('error', reject);
                });

            };

            // Check if the route has a middleware function defined
            return group.router?.middleware
                ? group.router.middleware(req, res, handler)    // Execute the middleware function for the route
                : handler(req, res);                            // Execute the handler

        }

        return res.notFound(); // No matching route
    }

}
