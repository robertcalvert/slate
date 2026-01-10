// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Import the needful from the framework
import { App } from '@slate/chalk';

import * as TypeORM from '@slate/typeorm';

// Import our application specific components
import config from './config';

import ApiRouter from './routers/apiRouter';
import StaticRouter from './routers/staticRouter';

import SessionAuthStrategy from './auth/sessionAuthStrategy';
import ApiAuthStrategy from './auth/apiAuthStrategy';

// Create and configure the application
const app = new App(config);

app.server
    // Register our routers
    .router(ApiRouter)                                              // API routing
    .router(StaticRouter)                                           // Static routing

    // Register our authentication strategies
    .auth.strategy('session', SessionAuthStrategy)                  // Auth strategy for session based routing
    .auth.strategy('api', ApiAuthStrategy)                          // Auth strategy for API based routing

    // Register our providers
    .data.provider('demo', TypeORM.provider(config.dataSource));    // TypeORM for database access

// Start the application
app.start();
