// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import * as Slate from '@slate/slate';
import * as Marko from '@slate/marko';

import { AppRouterOptions, RouterHandler } from '../routers';

import * as PathUtils from '../utils/pathUtils';

// Type defining the application options
export type AppOptions = {
    readonly server?: Slate.ServerOptions;      // Slate server options
    readonly router?: AppRouterOptions;         // The router options
}

// Application class to handle initializing and managing the Slate server
export class App {
    private readonly options: AppOptions;       // The provided application options
    readonly server: Slate.Server;              // The Slate server

    private readonly routerHandler: RouterHandler;

    // Initializes the application
    constructor(options: AppOptions) {
        this.options = options;
        this.server = new Slate.Server(options.server);
        this.routerHandler = new RouterHandler(this.server);
    }

    // Start the application
    async start() {
        // Register the routers
        this.routerHandler.use(this.options.router);

        // Register Marko as the view provider
        this.server.view.provider(Marko.provider({
            // Array of paths to the template files, lookup is top down
            templates: [
                Path.join(PathUtils.appBaseDir, 'views'),       // Application
                Path.join(PathUtils.chalkBaseDir, 'views')      // Chalk
            ],

            // Method to get the global context
            context: (req) => {
                return {
                    $global: {
                        auth: req.auth      // Include the request authentication
                    }
                };
            }

        }));

        // Start the server
        return await this.server.start();
    }

}
