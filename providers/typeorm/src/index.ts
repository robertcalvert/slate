// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { DataSource, DataSourceOptions } from 'typeorm';

import { DataProvider } from '@slate/slate';

// Creates a data provider for TypeORM
export function provider(options: DataSourceOptions): DataProvider {
    let datasource: DataSource;                         // The data source instance

    return {
        create: async () => {
            datasource = new DataSource(options);       // Create the data source
            await datasource.initialize();              // Initialize the data source
            return datasource;                          // Return the data source
        },
        destroy: async () => {
            if (!datasource) return;                    // Nothing to do
            await datasource.destroy();                 // Destroy the data source
        }
    };
}
