// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Export the provider(s) for optional inclusion by the application
export * from './typeORMDataProvider';

// Interface defining a generic data provider
export interface DataProvider<T extends object = object> {
    create: (options: T) => Promise<object>;
}

// Data class to manage data providers
export class DataHandler<T extends object = object> {
    // The current data provider, which must be set before data can be accessed
    private provider?: object;

    // Sets the data provider to be used for accessing data
    async use<U extends T>(provider: DataProvider<U>, options: U) {
        this.provider = await provider.create(options);
    }

    // Gets the data provider as the defined object type
    getDataProvider<T = object>(): T {
        if (!this.provider) throw new Error('No data provider has been registered.');
        return this.provider as T;
    }

}
