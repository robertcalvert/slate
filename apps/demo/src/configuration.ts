// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { DataSourceOptions } from 'typeorm';

import { Configuration } from '@slate/slate';

import * as Marko from '@slate/marko';

// Marko configuration
const marko: Marko.ViewProviderOptions = {
    path: Path.join(__dirname, 'view'),                  // The path to the view files

    // Method to get the global context
    context: (req) => {
        return {
            $global: {
                auth: req.auth                          // Include the request authentication
            }
        };
    }
};

// The data source configuration
const dataSource: DataSourceOptions = {
    type: 'sqlite',                                     // Database type
    database: 'data/database.sqlite',                   // Path to storage
    entities: [                                         // Entities to be included
        Path.join(__dirname, 'entity/**/*{.ts,.js}')
    ],
    synchronize: true,                                  // Auto create the database schema on launch
    logging: true                                       // Enable logging
};

// The complete configuration
const configuration: Configuration & {
    marko: Marko.ViewProviderOptions;       // View provider options
    dataSource: DataSourceOptions;          // Date source options
} = {
    server: {
        host: 'localhost',                  // The hostname for the server
        port: 3000                          // The port number on which the server will run
    },
    marko: marko,                           // The Marko view provider options
    dataSource: dataSource                  // The TypeORM data source options
};

export default configuration;
