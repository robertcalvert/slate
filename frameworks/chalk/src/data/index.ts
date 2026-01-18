// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { DataSourceOptions } from 'typeorm';

import * as Slate from '@slate/slate';
import * as TypeORM from '@slate/typeorm';

import * as Paths from '../utils/paths';

// Defines data source options for the application
export type AppDataSourceOptions = DataSourceOptions | Record<string, DataSourceOptions>;

// Default entity paths to automatically include in the first data source
const defaultEntities = [
    Paths.chalkEntitiesPath,        // Chalk
    Paths.appEntitiesPath           // Application
];

// Data class to manage data sources
export class DataHandler {
    private readonly server: Slate.Server;          // The Slate server

    // Initializes the data handler
    constructor(server: Slate.Server) {
        this.server = server;
    }

    // Method to register the data sources with the Slate server
    use(options?: AppDataSourceOptions) {
        if (!options) return;

        // The options could be a single data source or a collection of data sources
        const sources = this.isSingleDataSource(options)
            ? { default: options }
            : options;     // Named data source(s)

        // Register each data source
        for (const [index, [name, datasource]] of Object.entries(sources).entries()) {
            // Normalize the entities into an array
            const entities = Array.isArray(datasource.entities)
                ? datasource.entities
                : [];

            // Prepare the data source options before registering
            // Automatically include the default entities in the first data source
            const options = index === 0
                ? {
                    ...datasource,                                  // Copy all existing options
                    entities: [...entities, ...defaultEntities]     // Include the default entities
                }
                : datasource;                                       // Use the original data source

            // Register the data source
            this.server.data.provider(name, TypeORM.provider(options));
        }
    }

    // Type guard that determines if the provided options is a single data source
    private isSingleDataSource(options: AppDataSourceOptions): options is DataSourceOptions {
        return (
            typeof options === 'object' &&      // Must be an object
            options !== null &&                 // Must not be null
            'type' in options                   // Must define a data source type
        );
    }

}
