// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { DataSourceOptions } from 'typeorm';

import { Configuration } from './framework';

// The data source configuration
const dataSource: DataSourceOptions = {
    type: 'sqlite',                         // Database type
    database: 'data/database.sqlite',       // Path to storage
    entities: ['src/entity/**/*.ts'],       // Entities to be included
    synchronize: true,                      // Auto create the database schema on launch
    logging: true                           // Enable logging
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
