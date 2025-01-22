// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Fs from 'fs';
import * as Path from 'path';

import { Request } from '../core/request';
import { Response } from '../core/response';

import * as PathUtils from '../utils/pathUtils';

// Export the router definition(s) for optional inclusion by the application
export * from './pageRouter';

// Interface for defining a router
export interface Router {
    readonly path: string;
    routes?: Route[];
}

// Interface for defining a route
export interface Route {
    readonly method: string;                // The HTTP method (e.g., 'GET', 'POST') for the route
    path: string;                           // The route path, which may include dynamic parameters (e.g., '/users/{id}')
    readonly excludeFileName?: boolean;     // Optional flag to exclude the file name in the path
    readonly isCaseSensitive?: boolean;     // Optional flag to make the route path case-sensitive

    readonly handler: (req: Request, res: Response) => void;    // The function to handle requests for the route

    _regex?: RegExp;            // Internal precompiled regex for the path
    _paramNames?: string[];     // Internal param names captured by the regex
}

// Router class to manage routes and handle requests
export class RouterHandler {
    private routes: Route[] = []; // Array of registered routes

    // Method to add a new router to the handler
    use(router: Router) {
        // Try and get the routes when not explicitly provided by the router
        if (router.path && !router.routes) {
            const path = Path.join(PathUtils.srcpath, router.path)
            router.routes = this.getRoutes(router, path);
        }

        // Add our routers routes when needed...
        if (router.routes) {
            this.routes = this.routes.concat(router.routes);
        }

    }

    // Method to handle incoming requests
    execute(req: Request, res: Response) {
        // Try and find a route that matches the request
        const route = this.routes.find(r => this.matchRoute(r, req));

        // If a matching route is found, call its handler
        if (route) {
            return route.handler(req, res);
        }

        // No route found...
        res.status(404)
            .type('text/plain')
            .end('Not Found');
    }

    // Method to get the routes array for a directory recursively
    private getRoutes(router: Router, path: string, routes: Route[] = []): Route[] | undefined {
        // Check that the path exists...
        if (!Fs.existsSync(path)) {
            console.warn(`Directory not found. Router: "${router.path}", Path: "${path}"`)

        } else {
            // Iterate over the files in the specified path
            Fs.readdirSync(path).forEach((file) => {
                // Get the full path to the file
                const filePath = Path.join(path, file);

                // Check if the file is actually a directory
                if (Fs.statSync(filePath).isDirectory()) {
                    // Recursively get the routes from the subdirectory
                    this.getRoutes(router, filePath, routes);

                } else if (['.ts', '.js'].includes(Path.extname(file).toLowerCase())) {
                    // Get the route definitions from the file
                    const definitions: Route[] = require(PathUtils.stripExtension(filePath)).default;

                    // Derive the directory and file name prefixes
                    const dirPrefix: string = Path.basename(router.path);
                    const fileNamePrefix = Path.basename(file, Path.extname(file));

                    // Massage the paths for each route definition
                    definitions.forEach((route) => {
                        // Construct the path based on conditions
                        let path = '';

                        // Include the directory prefix when not the first router
                        // The first router is classed as the "default" router and
                        // as such paths are anchored to the root of the base URL
                        if (this.routes.length > 0) {
                            path += `/${dirPrefix}`;
                        }

                        // Add the file name prefix when needed...
                        if (!route.excludeFileName) {
                            path += `/${fileNamePrefix}`;
                        }

                        // Only update the routes path if we have a constructed path
                        // Removing any trailing slashes
                        if (path) {
                            route.path = `${path}${route.path}`.replace(/\/+$/, '');
                        }

                        // Compile the regex and dynamic parameters for the route
                        const { regex, paramNames } = this.compileRouteRegex(route);
                        route._regex = regex;
                        route._paramNames = paramNames;

                    });

                    // Add the definitions to the routes
                    routes.push(...definitions);
                }
            });

        }

        // Only return the routes when we have at least one route
        if (routes.length > 0) {
            return routes;
        }

    }

    // Compiles a regular expression for the route path and extracts any parameter names
    private compileRouteRegex(route: Route): { regex: RegExp; paramNames: string[] } {
        const paramNames: string[] = [];

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

        // Compile the regex for the route path and dynamic parameters
        // Determine the sensitivity based on the route
        const regex = new RegExp(regexStr, route.isCaseSensitive ? '' : 'i');

        return { regex, paramNames };
    }

    // Method to try and match the incoming request to a given route
    private matchRoute(route: Route, req: Request): boolean {
        if (route.method !== req.method && route.method !== '*') {
            return false;
        }

        // If the path regex exists, test it against the URL
        if (route._regex) {
            const match = route._regex.exec(req.url.pathname || '');
            if (match) {
                // If a match is found, extract the parameters and attach them to the request
                route._paramNames?.forEach((param, index) => {
                    req.params[param] = match[index + 1]; // match[0] is the full URL match
                });

                return true;
            }
        }

        return false;
    }

}
