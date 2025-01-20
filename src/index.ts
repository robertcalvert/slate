// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Server, PageRouter } from './framework';

const server = new Server(); // Create a new instance of the server

// Use the framework provided routers
server.userRouter(PageRouter);

// Start the server
server.start();
