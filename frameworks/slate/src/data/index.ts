// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Server } from '../server';

// Interface defining a generic data provider
export interface DataProvider {
    create: (server: Server) => Promise<object>;
}

// Data class to manage data providers
export class DataHandler {
    private server: Server;     // The server
    private providers = new Map<string, object>();      // Array of registered providers

    // Initializes the data handler
    constructor(server: Server) {
        this.server = server;
    }

    // Method to add a new provider to the handler
    async use(name: string, provider: DataProvider) {
        const instance = await provider.create(this.server);
        this.providers.set(name, instance);
    }

    // Gets a data provider as the defined object type
    getDataProvider<T = object>(name?: string): T {
        const provider = name ? this.providers.get(name) : this.providers.values().next().value;

        if (!provider) {
            throw new Error(`No data provider registered for "${name}".`);
        }

        return provider as T;
    }

}
