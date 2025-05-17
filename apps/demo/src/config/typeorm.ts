// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { DataSourceOptions } from 'typeorm';

// Options for the data source used by TypeORM
const options: DataSourceOptions = {
    type: 'sqlite',                                             // Database type
    database: process.env.DATABASE || 'data/demo.sqlite',       // Path to storage
    entities: [                                                 // Entities to be included
        Path.join(__dirname, '../entities/**/*{.ts,.js}')
    ],
    synchronize: true,                                          // Auto create the database schema on launch
    logging: true                                               // Enable logging
};

export default options;
