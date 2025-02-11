// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Fs from 'fs';
import * as Path from 'path';

import { Request } from '../core/request';
import { Response } from '../core/response';

import * as PathUtils from '../utils/pathUtils';

// Export the router definitions for optional inclusion by the application
export * from './pageRouter';
export * from './apiRouter';
export * from './staticRouter';

// Interface for defining a router
export interface Router {
    // The path to the route files (relative to the srcpath)
    // If provided, routes will be automatically populated from this path
    readonly path?: string;

    // The routes for the router
    // You can either provide a predefined set of routes here or let the framework populate them based on the 'path'
    routes?: Route[];
}

// Defines the supported HTTP methods for routing
// You can still use other HTTP methods via the wildcard ('*'), but they must be handled manually in the route handler
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Type for the router handler function
type RouteHandler = (req: Request, res: Response) => void;

// Interface for defining a route
export interface Route {
    // The HTTP method can be:
    // 1. A single method (e.g., 'GET')
    // 2. A wildcard ('*') to allow any method
    // 3. An array of specific methods (e.g., ['GET', 'POST'])
    readonly method: '*' | HttpMethod | HttpMethod[];

    path: string;                           // The route path, which may include dynamic parameters (e.g., '/users/{id}')
    readonly excludeFileName?: boolean;     // Optional flag to exclude the file name in the path
    readonly isCaseSensitive?: boolean;     // Optional flag to make the route path case-sensitive

    readonly handler: RouteHandler;         // The function to handle requests for the route
}

// Interface for a route group
// This is a collection of method handlers for the same path
interface RouteGroup {
    regex: RegExp;                          // The regex for the path
    paramNames: string[];                   // Param names captured by the regex
    methods: Record<string, RouteHandler>;  // The supported methods and their handler
}

// Router class to manage routes and handle requests
export class RouterHandler {
    private groups = new Map<string, RouteGroup>();     // Array of registered route groups

    // Method to add a new router to the handler
    use(router: Router) {
        // Try and get the routes for the router when not explicitly provided
        if (router.path && !router.routes) {
            // Create the route array
            const routes: Route[] = [];

            // Get the base path for the router
            const path = Path.join(PathUtils.srcpath, router.path!);

            // Internal function to get routes from a directory recursively
            const getRoutes = (router: Router, path: string) => {
                // Check that the path exists...
                if (!Fs.existsSync(path)) {
                    console.warn(`Directory not found. Router: "${router.path}", Path: "${path}"`);
                    return;
                }

                // Iterate over the files in the specified path
                Fs.readdirSync(path).forEach((file) => {
                    // Get the full path to the file
                    const filePath = Path.join(path, file);

                    // Process directories recursively
                    if (Fs.statSync(filePath).isDirectory()) {
                        getRoutes(router, filePath);

                    } else if (['.ts', '.js'].includes(Path.extname(file).toLowerCase())) {
                        // Get the route definitions from the file
                        // eslint-disable-next-line @typescript-eslint/no-require-imports
                        const definitions: Route[] = require(PathUtils.stripExtension(filePath)).default;

                        // Determine the directory prefix based on the router
                        // The first router is classed as the "default" router and
                        // as such paths are anchored to the root of the base URL
                        // all other routers are anchored to the last folder name in the path
                        const lastFolderInPath = router.path!.includes('/')
                            ? router.path!.replace(/.*\//, '')
                            : router.path!;

                        const relativePath = path.replace(Path.resolve(Path.join(PathUtils.srcpath, router.path!)), '')
                            .replace(/\\/g, '/');

                        let directoryPrefix: string;
                        if (this.groups.size > 0) {
                            directoryPrefix = '/' + lastFolderInPath + relativePath;
                        } else {
                            directoryPrefix = relativePath; // "default" router
                        }

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
            getRoutes(router, path);

            // Only assign the routes if there are any
            router.routes = routes.length > 0 ? routes : undefined;
        }

        // If the router has routes, compile their regex and register them by group
        if (router.routes) {
            router.routes.forEach((route) => {
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
                        methods: {} as Record<HttpMethod, RouteHandler>
                    });
                }

                // Add the handler to the group for the supported method(s)
                if (typeof route.method === 'string') {
                    this.groups.get(key)!.methods[route.method] = route.handler;
                } else {
                    if (Array.isArray(route.method)) {
                        route.method.forEach((method) => {
                            this.groups.get(key)!.methods[method.toString()] = route.handler;
                        });
                    }
                }

            });

        }

    }

    // Method to handle incoming requests
    execute(req: Request, res: Response): void {
        // Find a matching route group
        for (const group of this.groups.values()) {
            const match = group.regex.exec(req.url.pathname || '');
            if (!match) continue; // Skip if no match

            // Find the handler for the request method
            const handler = group.methods[req.method || 'GET'] || group.methods['*'];
            if (!handler) {
                // Method not supported
                return res.methodNotAllowed(Object.keys(group.methods)).end();
            }

            // If a handler is found, extract the parameters and attach them to the request
            group.paramNames.forEach((param, index) => {
                req.params[param] = match[index + 1]; // match[0] is the full match
            });

            return handler(req, res); // Execute the handler
        }

        res.notFound().end(); // No matching route
    }

}
