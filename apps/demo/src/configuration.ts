// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { DataSourceOptions } from 'typeorm';

import { Configuration } from '@slate/slate';

// The data source configuration
const dataSource: DataSourceOptions = {
    type: 'sqlite',                                     // Database type
    database: 'data/database.sqlite',                   // Path to storage
    entities: [                                         // Entities to be included
        Path.join(__dirname, '/entity/**/*{.ts,.js}')
    ],
    synchronize: true,                                  // Auto create the database schema on launch
    logging: true                                       // Enable logging
};

// The complete configuration
const configuration: Configuration = {
    server: {
        host: 'localhost',                  // The hostname for the server
        port: 3000                          // The port number on which the server will run
    },
    dataSource: dataSource                  // The data source options
};

export default configuration;
