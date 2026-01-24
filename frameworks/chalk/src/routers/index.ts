// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Server,
    Router as SlateRouter
} from '@slate/slate';
import { RouteDefaultOptions } from '@slate/slate/src/router';

import PageRouter from './pageRouter';
import ApiRouter from './apiRouter';
import StaticRouter from './staticRouter';

// Defines the router options for the application
// Each property can be:
// 1. false             Explicitly disables the router
// 2. true              Enables the router with default options
// 3. undefined         Enables the router with default options (same as true)
// 4. RouterOptions     Enables the router with the provided options
export type AppRouterOptions = {
    readonly page?: boolean | RouterOptions;        // The page router options
    readonly api?: boolean | RouterOptions;         // The API router options
    readonly static?: boolean | RouterOptions;      // The static router options
}

// Defines the options for a single router instance
export type RouterOptions = {
    // The base URL path to mount the routes under
    basePath?: string;

    // Default configuration options used for each route in the router
    // These can be overridden individually on each route
    readonly defaults?: RouteDefaultOptions;
}

// Interface for defining a router
export interface Router {
    create(options?: RouterOptions): SlateRouter;   // Function to create the Slate router
}

// Router class to manage the routers
export class RouterHandler {
    private readonly server: Server;                // The Slate server

    // Initializes the router handler
    constructor(server: Server) {
        this.server = server;
    }

    // Method to register the routers on the Slate server
    use(options?: AppRouterOptions) {
        // Helper to register a single router based on its options
        const register = (router: Router, options?: boolean | RouterOptions) => {
            if (options === false) return; // Disabled

            // True or undefined means use the defaults
            const instance = (options === true || options === undefined)
                ? router.create()
                : router.create(options);   // Custom options

            this.server.router(instance);
        };

        // Register the routers
        register(PageRouter, options?.page);
        register(ApiRouter, options?.api);
        register(StaticRouter, options?.static);

    }
}
