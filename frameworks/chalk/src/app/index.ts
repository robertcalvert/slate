// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { Server, ServerOptions } from '@slate/slate';
import * as Marko from '@slate/marko';

// Type defining the application options
export type AppOptions = {
    readonly server?: ServerOptions;            // Slate server options
}

// Application class to handle initializing and managing the Slate server
export class App {
    private readonly options: AppOptions;       // The provided application options
    readonly server: Server;                    // The Slate server

    // Initializes the application
    constructor(options: AppOptions) {
        this.options = options;
        this.server = new Server(options.server);
    }

    // Start the application
    async start() {
        // Register Marko as the view provider
        this.server.view.provider(Marko.provider({
            // Array of paths to the template files, lookup is top down
            templates: [
                Path.join(Path.dirname(require.main!.filename), 'views'),       // Application
                Path.join(__dirname, '../views')                                // Chalk
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
