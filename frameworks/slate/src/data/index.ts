// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Server } from '../server';

// Interface defining a generic data provider
export interface DataProvider {
    create: () => Promise<object>;      // Initialize the provider and return the created resource
    destroy?: () => Promise<void>;      // Release any held resources
}

// Interface defining an instance of a registered data provider
interface ProviderEntry {
    provider: DataProvider;             // The data provider
    instance: object;                   // The resource created by the provider
}

// Data class to manage data providers
export class DataHandler {
    private readonly server: Server;                                // The server
    private readonly entries = new Map<string, ProviderEntry>();    // Array of registered providers

    // Initializes the data handler
    constructor(server: Server) {
        this.server = server;
    }

    // Method to add a new provider to the handler
    async use(name: string, provider: DataProvider) {
        if (this.entries.has(name)) {
            const message = `DataProvider "${name}" is already registered.`;
            this.server.logger.error(message);
            throw new Error(message);
        }

        // Register the provider
        try {
            const instance = await provider.create();
            this.entries.set(name, { provider, instance });
            this.server.logger.debug(`DataProvider "${name}" successfully registered.`);

        } catch (error) {
            this.server.logger.error(`Failed to register DataProvider "${name}".`);
            this.server.logger.error(error);
            throw error;
        }

    }

    // Gets a provider instance as the defined object type
    // Falls back to the first registered provider if no name is given
    get<T = object>(name?: string): T {
        const entry = name
            ? this.entries.get(name)
            : this.entries.values().next().value;

        if (!entry) {
            throw new Error(
                name
                    ? `No DataProvider registered for "${name}".`
                    : 'No DataProviders have been registered.'
            );
        }

        return entry.instance as T;
    }

    // Method to destroy all registered providers
    async destroy() {
        // Wait for all destroy promises to settle
        await Promise.allSettled(
            Array.from(this.entries, async ([name, { provider }]) => {
                if (typeof provider.destroy !== 'function') return;

                try {
                    await provider.destroy();
                    this.server.logger.debug(`DataProvider "${name}" successfully destroyed.`);

                } catch (error) {
                    this.server.logger.error(`Failed to destroy DataProvider "${name}".`);
                    this.server.logger.error(error);

                }
            })
        );

        // Final cleanup
        this.entries.clear();
    }

}
