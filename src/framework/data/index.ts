// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Server } from '../server';

// Export the provider(s) for optional inclusion by the application
export * from './typeORMDataProvider';

// Interface defining a generic data provider
export interface DataProvider<T extends object = object> {
    create: (server: Server, options: T) => Promise<object>;
}

// Data class to manage data providers
export class DataHandler<T extends object = object> {
    private server: Server;     // The server
    private provider?: object;  // The current data provider, which must be set before data can be accessed

    // Initializes the data handler
    constructor(server: Server) {
        this.server = server;
    }

    // Sets the data provider to be used for accessing data
    async use<U extends T>(provider: DataProvider<U>, options: U) {
        this.provider = await provider.create(this.server, options);
    }

    // Gets the data provider as the defined object type
    getDataProvider<T = object>(): T {
        if (!this.provider) throw new Error('No data provider has been registered.');
        return this.provider as T;
    }

}
