// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Fs from 'fs';
import * as Path from 'path';

import merge from 'deepmerge';
import { ZodTypeAny } from 'zod';

import { Server } from '../server';
import { Request, RequestValidationTarget, RequestValidationErrors } from '../core/request';
import { Response, ResponseCacheOptions, ResponseSecurityOptions } from '../core/response';

import { Middleware, execute as middleware } from '../middleware';

import * as PathUtils from '../utils/pathUtils';

// Catch-all route path pattern
const CATCH_ALL_ROUTE_PATH = '/{path:.*}';

// Defines the supported HTTP methods for routing
// You can still use other HTTP methods via the wildcard ('*'), but they must be handled manually in the route handler
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// Interface for defining a router
export interface Router {
    // The base URL path to mount the routes under
    basePath?: string;

    // Middleware specific to the router
    // Runs mid‑pipeline, before the route is matched
    readonly middleware?: Middleware | Middleware[];

    // Default configuration options for all routes in this router
    // These can be overridden individually on each route
    readonly defaults?: {
        cache?: ResponseCacheOptions;           // Default cache-control options
        auth?: RouteAuthOptions;                // Default authentication options
        security?: ResponseSecurityOptions;     // Default security options
        payload?: RoutePayloadOptions;          // Default payload options
    }

    // Defines the routes for this router.
    // Accepts either:
    // - A string representing the path to a folder containing route files
    // - An array of strings representing multiple folder paths
    // - An array of defined routes
    routes: string | string[] | Route[];
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
    readonly payload?: RoutePayloadOptions;         // The routes payload options
    readonly validation?: RouteValidationOptions;   // The routes validation options

    readonly tags?: string[];                       // Tags that can be used to categorize the route

    // Middleware specific to the route
    // Runs at the very end of the pipeline, just before the route handler
    readonly middleware?: Middleware | Middleware[];

    readonly handler: RouteHandler;                 // The function to handle requests for the route
}

// Defines the authentication options for a route
export interface RouteAuthOptions {
    strategy?: string | string[];           // The authentication strategies to be used
    scope?: string | string[];              // The scope required to access the route
    isOptional?: boolean;                   // Optional flag to make the authentication optional
}

// Defines the payload options for a route
export interface RoutePayloadOptions {
    allowed?: string | string[];            // Allowed content types
    defaultContentType?: string;            // Content type if none is provided (default: application/json)
    maxBytes?: number;                      // Maximum size of the overall payload (default: 1MB)
    multipart?: {
        maxParts?: number;                  // Maximum total parts (fields + files)
        maxFields?: number;                 // Maximum field parts
        maxFiles?: number;                  // Maximum file parts
        maxFieldNameBytes?: number;         // Maximum size of a single field name (default: 100 bytes)
        maxFieldValueBytes?: number;        // Maximum size of a single field value (default: 1MB)
        maxFileValueBytes?: number;         // Maximum size of a single file
    };
}

// Defines the validation options for a route
export type RouteValidationOptions = {
    [Target in RequestValidationTarget]?: ZodTypeAny;   // Validation schema for each request target
} & {
    // Optional handler called when validation fails
    onFail?: (req: Request, res: Response, errors: RequestValidationErrors) => void;
};

// Type for the route handler function
export type RouteHandler = (req: Request, res: Response) => Response | Promise<Response>;

// A map of route paths to their corresponding route mapping
export type RouteMap = Map<string, RouteMapping>;

// Interface for defining a route mapping
// Represents the methods and their corresponding routes for a specific path
interface RouteMapping {
    router?: Router;                        // The router
    regex: RegExp;                          // The regex for the path
    methods: Record<string, Route>;         // The supported methods and their route
}

// Router class to manage routes and handle requests
export class RouterHandler {
    private readonly server: Server;                // The server
    private readonly map: RouteMap = new Map();     // Collection of registered route mappings

    // Initializes the router handler
    constructor(server: Server) {
        this.server = server;
    }

    // Method to get the routes map
    get routes(): RouteMap {
        return this.map;
    }

    // Method to add a new router to the handler
    use(router: Router) {
        let routes: Route[] = [];

        // Load routes based on the router
        if (typeof router.routes === 'string') {
            // Single folder path
            routes = this.loadRoutes(router, router.routes);

        } else if (Array.isArray(router.routes)) {
            if (router.routes.every(r => typeof r === 'string')) {
                // Multiple folder paths
                routes = router.routes.flatMap(path => this.loadRoutes(router, path));

            } else {
                // Array of defined routes
                routes = router.routes;

            }
        }

        // Resolve the routers base path
        router.basePath = (router.basePath ?? '').replace(/^\/$/, '');

        routes.forEach((route) => {
            // Merge the route settings with default router settings
            if (router.defaults) {
                route = merge(router.defaults as Route, route);
            }

            // Prefix each route with the routers base path
            route.path = router.basePath + route.path;

            // Add the route to the map
            this.addRoute(route, router);
        });
    }

    // Method to load the routes for a given path
    private loadRoutes(router: Router, path: string): Route[] {
        // Create the route array
        const routes: Route[] = [];

        // Fully resolve the absolute path to the routes
        const routesPath = Path.resolve(path);

        // Internal function to get routes from a directory recursively
        const walk = (path: string) => {
            // Check that the path exists...
            if (!Fs.existsSync(path)) {
                this.server.logger.warn(`Directory not found for router: "${path}".`);
                return;
            }

            // Iterate over the files in the specified path
            for (const file of Fs.readdirSync(path)) {
                // Get the full path to the file
                const fullPath = Path.join(path, file);

                // Process subdirectories recursively
                if (Fs.statSync(fullPath).isDirectory()) {
                    walk(fullPath);
                    continue;
                }

                // Skip files that do not have the expected extension
                if (Path.extname(file).toLowerCase() !== PathUtils.extname) continue;

                // Import route definitions from the file
                // eslint-disable-next-line @typescript-eslint/no-require-imports
                const definitions: Route[] = require(PathUtils.stripExtension(fullPath)).default;

                // Get the file details...
                const fileName = Path.basename(file, Path.extname(file));
                const relativePath = path.replace(routesPath, '').replace(/\\/g, '/');

                // Resolve the path for each route
                definitions.forEach(route => {
                    let routePath = relativePath;

                    // Add the file name prefix when needed...
                    if (!route.excludeFileName) routePath += `/${fileName}`;

                    // Only update the path if we have a resolved path
                    // Removing any trailing slashes
                    if (routePath) {
                        route.path = `${routePath}${route.path}`.replace(/\/+$/, '');
                    }

                });

                // Add the route definitions to the routes
                routes.push(...definitions);
            }
        };

        // Get the routes from the directory recursively
        walk(routesPath);

        // We automatically include a 404 (Not Found) route for the router
        routes.push({
            method: '*',                    // All methods
            path: CATCH_ALL_ROUTE_PATH,     // Catch-all
            auth: {
                isOptional: true            // Allow access even when not authenticated
            },
            handler: (_req, res) => res.notFound()
        });

        return routes;
    }

    // Method to add a single route to the handler
    addRoute(route: Route, router?: Router) {
        // Determine the key
        const key = route.path;

        // Get or create the route entry
        let entry = this.map.get(key);
        if (!entry) {
            entry = {
                router,
                regex: this.compileRouteRegex(route),
                methods: {} as Record<HttpMethod, Route>
            };

            this.map.set(key, entry);
        }

        // Add the the supported method(s)
        const methods = Array.isArray(route.method) ? route.method : [route.method];
        for (const method of methods) {
            entry.methods[method] = route;
        }

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

    // Method to adjusts the routes ready for routing
    start() {
        // Ensure the catch-all route is the last entry in the routing map
        const wildcard = this.map.get(CATCH_ALL_ROUTE_PATH);
        if (wildcard) {
            this.map.delete(CATCH_ALL_ROUTE_PATH);
            this.map.set(CATCH_ALL_ROUTE_PATH, wildcard);
        }

    }

    // Method to handle incoming requests
    async execute(req: Request, res: Response): Promise<Response> {
        // Try and find a matching route
        for (const mapping of this.map.values()) {
            const match = mapping.regex.exec(req.url.pathname || '');
            if (!match) continue; // Skip if no match

            req.router = mapping.router; // Pin the router to the request

            // Define a function that will execute the route handler
            const handler: RouteHandler = async (): Promise<Response> => {
                // Find the route for the request method
                const route = mapping.methods[req.method] || mapping.methods['*'];
                if (!route) return res.methodNotAllowed(Object.keys(mapping.methods));

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

                // Parse the request
                await req.parse();

                // Validate the request
                req.validate();

                // If the response is in error, then no need to pass to the route handler
                if (res.isError) return res;

                // Check if the route has middleware defined
                return route.middleware
                    ? middleware(req, res, route.middleware, () => route.handler(req, res)) // Execute the middleware
                    : route.handler(req, res);                                              // Execute the handler

            };

            // Check if the router has middleware defined
            return mapping.router?.middleware
                ? middleware(req, res, mapping.router.middleware, () => handler(req, res))  // Execute the middleware
                : handler(req, res);                                                        // Execute the handler

        }

        return res.notFound(); // No matching route
    }

}
