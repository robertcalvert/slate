// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { DataSourceOptions } from 'typeorm';

import { ServerOptions } from '@slate/slate';

// Import the individual configurations
import TypeORMConfig from './typeorm';

// Type defining the structure of the configuration
type Configuration = {
    server?: ServerOptions;                 // Server options
    dataSource: DataSourceOptions;          // TypeORM data source options
}

// Bring everything together for the complete configuration
const configuration: Configuration = {
    dataSource: TypeORMConfig
};

export default configuration;
