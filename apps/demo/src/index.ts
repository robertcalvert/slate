// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Import the needful from the framework
import { Server } from '@slate/slate';

import * as Marko from '@slate/marko';
import * as TypeORM from '@slate/typeorm';

// Import our application specific components
import configuration from './configuration';

import PageRouter from './router/pageRouter';
import ApiRouter from './router/apiRouter';
import StaticRouter from './router/staticRouter';

import SessionAuthStrategy from './auth/sessionAuthStrategy';
import ApiAuthStrategy from './auth/apiAuthStrategy';

// Create and configure the server
const server = new Server(configuration);

server.useRouter(PageRouter);
server.useRouter(ApiRouter);
server.useRouter(StaticRouter);

server.useAuthStrategy('session', SessionAuthStrategy);
server.useAuthStrategy('api', ApiAuthStrategy);

server.useViewProvider(Marko.provider(configuration.marko));

server.useDataProvider(TypeORM.provider(configuration.dataSource));

// Start the server
server.start();
