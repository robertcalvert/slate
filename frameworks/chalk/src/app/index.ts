// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Slate from '@slate/slate';
import * as Marko from '@slate/marko';

import { AppRouterOptions, RouterHandler } from '../routers';
import { AppAuthOptions, AuthHandler } from '../auth';
import { AppDataSourceOptions, DataHandler } from '../data';

import * as Paths from '../utils/paths';

// Type defining the application options
export type AppOptions = {
    readonly server?: Slate.ServerOptions;          // Slate server options
    readonly router?: AppRouterOptions;             // Router options
    readonly auth?: AppAuthOptions;                 // Authentication strategy options
    readonly datasource?: AppDataSourceOptions;     // TypeORM data source(s)
}

// Application class to handle initializing and managing the Slate server
export class App {
    private readonly options: AppOptions;       // The provided application options
    readonly server: Slate.Server;              // The Slate server

    private readonly routerHandler: RouterHandler;
    private readonly authHandler: AuthHandler;
    private readonly dataHandler: DataHandler;

    // Initializes the application
    constructor(options: AppOptions) {
        this.options = options;
        this.server = new Slate.Server(options.server);
        this.routerHandler = new RouterHandler(this.server);
        this.authHandler = new AuthHandler(this.server);
        this.dataHandler = new DataHandler(this.server);
    }

    // Start the application
    async start() {
        // Register the routers
        this.routerHandler.use(this.options.router);

        // Register Marko as the view provider
        this.server.view.provider(Marko.provider({
            // Array of paths to the template files, lookup is top down
            templates: [
                Paths.appViewsPath,     // Application
                Paths.chalkViewsPath    // Chalk
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

        // Register the authentication strategies
        this.authHandler.use(this.options.auth);

        // Register the data source(s)
        this.dataHandler.use(this.options.datasource);

        // Start the server
        return await this.server.start();
    }

}
