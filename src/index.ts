// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Import the needful from the framework
import {
    Server,
    PageRouter, ApiRouter, StaticRouter,
    MarkoViewProvider
} from './framework';

const server = new Server(); // Create a new instance of the server

// Use the framework provided routers
server.useRouter(PageRouter);
server.useRouter(ApiRouter);
server.useRouter(StaticRouter);

// Use Marko as the view provider
server.useViewProvider(MarkoViewProvider);

// Start the server
server.start();
