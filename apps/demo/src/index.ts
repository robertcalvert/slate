// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Import the needful from the framework
import { Server } from '@slate/slate';

import * as Marko from '@slate/marko';
import * as TypeORM from '@slate/typeorm';

// Import our application specific components
import Config from './config';

import PageRouter from './router/pageRouter';
import ApiRouter from './router/apiRouter';
import StaticRouter from './router/staticRouter';

import SessionAuthStrategy from './auth/sessionAuthStrategy';
import ApiAuthStrategy from './auth/apiAuthStrategy';

// Create and configure the server
const server = new Server(Config.server);

server
    // Register our routers
    .router(PageRouter)                                     // Page routing
    .router(ApiRouter)                                      // API routing
    .router(StaticRouter)                                   // Static routing

    // Register our authentication strategies
    .auth.strategy('session', SessionAuthStrategy)          // Auth strategy for session based routing
    .auth.strategy('api', ApiAuthStrategy)                  // Auth strategy for API based routing

    // Register our providers
    .view.provider(Marko.provider(Config.marko))                    // Marko for rendering
    .data.provider('demo', TypeORM.provider(Config.dataSource))     // TypeORM for database access

    // Start the server
    .listen();
