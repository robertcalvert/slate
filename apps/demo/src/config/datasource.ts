// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { AppDataSourceOptions } from '@slate/chalk';

// Options for the data source used by TypeORM
const options: AppDataSourceOptions = {
    type: 'sqlite',                                             // Database type
    database: process.env.DATABASE || 'data/demo.sqlite',       // Path to storage
    synchronize: true,                                          // Auto create the database schema on launch
    logging: true                                               // Enable logging
};

export default options;
