// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { AppOptions } from '@slate/chalk';

// Import the individual configurations
import DataSourceOptions from './datasource';

// Bring everything together for the complete configuration
const config: AppOptions = {
    datasource: DataSourceOptions
};

export default config;
