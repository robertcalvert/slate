// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { DataSource, DataSourceOptions } from 'typeorm';

import { DataProvider } from '@slate/slate';

// Creates a data provider for TypeORM
export function provider(options: DataSourceOptions): DataProvider {
    let ds: DataSource;                     // The data source instance

    return {
        create: async () => {
            ds = new DataSource(options);   // Create the data source
            await ds.initialize();          // Initialize the data source
            return ds;                      // Return the data source
        },
        destroy: async () => {
            if (!ds) return;                // Nothing to do
            await ds.destroy();             // Destroy the data source
        }
    };
}
