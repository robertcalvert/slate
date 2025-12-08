// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Server } from '@slate/slate';

import { AppConfiguration } from '../config';

// Application class to handle initializing and managing the Slate server
export class App {
    readonly server: Server; // The Slate server

    // Initializes the application
    constructor(config: AppConfiguration) {
        this.server = new Server(config.server);
    }

    // Start the application
    async start() {
        return await this.server.start();
    }

}
