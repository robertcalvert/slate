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
    path: string;
    routes?: Route[];
}

// Interface for defining a route
export interface Route {
    method: string;
    path: string;
    prependFileName?: boolean;
    handler: (req: Request, res: Response) => void;
}

// Router class to manage routes and handle requests
export class RouterHandler {
    private routes: Route[] = []; // Array of registered routes

    // Method to add a new router to the handler
    use(router: Router) {
        // Try and get the routes when not explicitly provided by the router
        if (!router.routes && router.path) {
            const path = Path.join(PathUtils.srcpath, router.path)
            router.routes = this.getRoutes(path);
        }

        // Add our routers routes when needed...
        if (router.routes) {
            this.routes = this.routes.concat(router.routes);
        }

    }

    // Method to handle incoming requests
    execute(req: Request, res: Response) {
        const { method, url } = req; // Extract the needful

        // Try and find a route that matches the request method and URL
        const route = this.routes.find(r => (r.method === method || r.method === '*') && r.path === url);

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
    private getRoutes(path: string, routes: Route[] = []): Route[] | undefined {
        // Iterate over the entries in the specified path
        Fs.readdirSync(path).forEach((entry) => {
            // Get the full path for the current entry
            const fullPath = Path.join(path, entry);

            // Check if the entry is a directory
            if (Fs.statSync(fullPath).isDirectory()) {
                // Recursively load routes from the subdirectory
                this.getRoutes(fullPath, routes);

            } else if (['.ts', '.js'].includes(Path.extname(entry).toLowerCase())) {
                // Get the route definitions from the file
                const definitions: Route[] = require(PathUtils.stripExtension(fullPath)).default;

                // Derive the directory and file name prefixes
                let dirPrefix = path.replace(Path.resolve(PathUtils.srcpath), '').replace(/\\/g, '/');
                const filenamePrefix = '/' + entry.split('.').slice(0, -1).join('.');

                // If this is the first router (the "default" router),
                // do not include the top-level directory name (e.g., "page")
                if (this.routes.length === 0) {
                    dirPrefix = dirPrefix.substring(dirPrefix.split('/')[1].length + 1);
                }

                // Massage the paths for each route definition
                definitions.forEach((route) => {
                    const path = []; // Array to build the final path

                    // Add the directory prefix when needed...
                    if (dirPrefix.length > 0) {
                        path.push(dirPrefix);
                    }

                    // Add the file name prefix when needed...
                    if (route.prependFileName ?? true) {
                        path.push(filenamePrefix);
                    }

                    // Construct the full path by combining the path parts
                    if (path.length > 0) {
                        route.path = (path.join() + route.path).replace(/\/+$/, ''); // Remove trailing slashes
                    }

                });

                // Add the definitions to the routes
                routes.push(...definitions);
            }
        });

        // Only return the routes when we have at least one route
        if (routes.length > 0) {
            return routes;
        }

    }

}
