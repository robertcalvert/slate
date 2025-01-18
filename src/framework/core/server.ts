// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import http from 'http';
import { Middleware, MiddlewareHandler } from '../core/middleware';
import { Request } from '../core/request';
import { Response } from '../core/response';
import { LoggerMiddleware } from '../middleware/loggerMiddleware';

// Server class to handle HTTP requests, and middleware
export class Server {
    private middlewareHandler = new MiddlewareHandler();

    constructor() {
        // Always use our middleware(s)
        this.use(LoggerMiddleware);
    }

    // Method to register a new middleware
    use(middleware: Middleware) {
        this.middlewareHandler.use(middleware);
    }

    // Start the server
    start(port: number = 3000) {
        const server = http.createServer((rawReq, rawRes) => {
            // Wrap the raw request objects into our custom objects
            const req = new Request(rawReq);
            const res = new Response(rawRes);

            // Execute middleware before handling the request
            this.middlewareHandler.execute(req, res, () => {
                res.status(200)
                    .type('text/plain')
                    .end('Hello, World!');
            });

        });

        // Start the server and log the URL for easier opening
        server.listen(port);
        console.log(`Server is running on http://localhost:${port}`);
    }
}
