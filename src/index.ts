// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Import the needful from the framework
import {
    Server,
    PageRouter, ApiRouter, StaticRouter,
    MarkoViewProvider
} from './framework';

// Import our configuration
import configuration from './configuration';

// Create a new instance of the server
const server = new Server(configuration);

// Use the framework provided routers
server.useRouter(PageRouter);
server.useRouter(ApiRouter);
server.useRouter(StaticRouter);

// Use Marko as the view provider
server.useViewProvider(MarkoViewProvider);

// Start the server
server.start();
