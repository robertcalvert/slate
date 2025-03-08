// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { DataSourceOptions } from 'typeorm';

// Import the needful from the framework
import {
    Server,
    PageRouter, ApiRouter, StaticRouter,
    BearerAuthStrategy
} from '@slate/slate';

// Import the providers from the optional packages
import { MarkoViewProvider } from '@slate/marko';
import { TypeORMDataProvider } from '@slate/typeorm';

// Import our configuration
import configuration from './configuration';

// Create a new instance of the server
const server = new Server(configuration);

// Use the framework provided routers
server.useRouter(PageRouter);
server.useRouter(ApiRouter);
server.useRouter(StaticRouter);

// Use the bearer auth strategy for our API routes
server.useAuthStrategy('api', BearerAuthStrategy);

// Use Marko as our view provider
server.useViewProvider(MarkoViewProvider);

// Use TypeORM as our data provider
server.useDataProvider(TypeORMDataProvider, configuration.dataSource as DataSourceOptions);

// Start the server
server.start();
