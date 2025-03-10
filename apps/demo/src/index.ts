// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { DataSourceOptions } from 'typeorm';

// Import the needful from the framework
import {
    Server,
    PageRouter, ApiRouter, StaticRouter,
} from '@slate/slate';

import { MarkoViewProvider } from '@slate/marko';
import { TypeORMDataProvider } from '@slate/typeorm';

// Import our application specific components
import configuration from './configuration';
import ApiAuthStrategy from './auth/apiAuthStrategy';

// Create and configure the server
const server = new Server(configuration);

server.useRouter(PageRouter);
server.useRouter(ApiRouter);
server.useRouter(StaticRouter);

server.useAuthStrategy('api', ApiAuthStrategy);

server.useViewProvider(MarkoViewProvider);

server.useDataProvider(TypeORMDataProvider, configuration.dataSource as DataSourceOptions);

// Start the server
server.start();
