// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import http from 'http';

import { Request } from '../core/request';
import { Response } from '../core/response';

import { MiddlewareHandler, Middleware } from '../middleware';
import { RouterHandler, Router } from '../router';

// Server class to handle HTTP requests, and middleware
export class Server {
    private middlewareHandler = new MiddlewareHandler();
    private routerHandler = new RouterHandler();

    // Method to register a new middleware
    useMiddleware(middleware: Middleware) {
        this.middlewareHandler.use(middleware);
    }

    // Method to register a new router
    userRouter(router: Router) {
        this.routerHandler.use(router);
    }

    // Start the server
    start(port: number = 3000) {
        const server = http.createServer((rawReq, rawRes) => {
            // Wrap the raw request and response objects into our custom objects
            const req = new Request(rawReq);
            const res = new Response(rawRes, req);

            // This is the outer most point at which we can handle any
            // unhandled errors in the response flow
            try {
                // Execute middleware before executing the route
                this.middlewareHandler.execute(req, res, () => {
                    this.routerHandler.execute(req, res);
                });

            } catch (error) {
                if (!res.headersSent) {
                    res.serverError(error); // Handle the response error
                } else {
                    console.error(error);   // Handle the error
                }

            }

            // Ensure that the response is always ended
            if (!res.finished) {
                res.end();
            }

        });

        // Start the server and log the URL for easier opening
        server.listen(port);
        console.log(`Server is running on http://localhost:${port}`);
    }
}
