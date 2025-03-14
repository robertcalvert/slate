// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { DataSource, DataSourceOptions } from 'typeorm';

import { DataProvider } from '@slate/slate';

// TypeORM data provider implementation
export const TypeORMDataProvider: DataProvider<DataSourceOptions> = {
    create: async (server, options) => {
        // Create the data source
        const dataSource = new DataSource(options);

        // Initialize the data source
        dataSource.initialize()
            .then(() => {
                if (!options.logging) server.logger.info('DataSource initialized');
            })
            .catch((error) => {
                server.logger.error(error);
            });

        return dataSource;
    }
};
