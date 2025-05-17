// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { DataSource, DataSourceOptions } from 'typeorm';

import { DataProvider } from '@slate/slate';

// Creates a data provider for the TypeORM ORM
export function provider(options: DataSourceOptions): DataProvider {
    return {
        create: async (server) => {
            // Create the data source
            const ds = new DataSource(options);

            // Initialize the data source
            await ds.initialize()
                .then(() => {
                    if (!options.logging) server.logger.info('DataSource initialized');
                })
                .catch((error) => {
                    server.logger.error(error);
                });

            return ds;
        }
    };
}
