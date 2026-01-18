// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Import the needful from the framework
import { App } from '@slate/chalk';

import config from './config';

import SessionAuthStrategy from './auth/sessionAuthStrategy';
import ApiAuthStrategy from './auth/apiAuthStrategy';

// Create and configure the application
const app = new App(config);

app.server
    // Register our authentication strategies
    .auth.strategy('session', SessionAuthStrategy)                  // Auth strategy for session based routing
    .auth.strategy('api', ApiAuthStrategy);                         // Auth strategy for API based routing

// Start the application
app.start();
