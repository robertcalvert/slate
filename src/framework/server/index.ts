// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import http from 'http';

import { Configuration } from '../core/configuration';

import { Request } from '../core/request';
import { Response } from '../core/response';

import { MiddlewareHandler, Middleware } from '../middleware';
import { RouterHandler, Router } from '../router';
import { ViewHandler, ViewProvider } from '../view';

// Server class to handle HTTP requests, and middleware
export class Server {
    private configuration: Configuration;
    private middlewareHandler = new MiddlewareHandler();
    private routerHandler = new RouterHandler();
    private viewHandler = new ViewHandler();

    // Initializes the server object
    constructor(configuration: Configuration) {
        this.configuration = configuration;
    }

    // Method to register a new middleware
    useMiddleware(middleware: Middleware) {
        this.middlewareHandler.use(middleware);
    }

    // Method to register a new router
    useRouter(router: Router) {
        this.routerHandler.use(router);
    }

    // Method to register a new view provider
    useViewProvider(provider: ViewProvider) {
        this.viewHandler.use(provider);
    }

    // Start the server
    start() {
        const server = http.createServer((rawReq, rawRes) => {
            // Wrap the raw request and response objects into our custom objects
            const req = new Request(rawReq);
            const res = new Response(rawRes, req, this.viewHandler);

            // This is the outer most point at which we can handle any
            // unhandled errors in the response flow
            try {
                // Execute middleware before executing the route
                this.middlewareHandler.execute(req, res, () => {
                    this.routerHandler.execute(req, res);
                });

            } catch (error) {
                if (!res.headersSent) {
                    res.serverError(error).end();   // Handle the response error
                } else {
                    console.error(error);           // Handle the error
                }

            }

            // Ensure that the response is always ended
            if (res.isError && !res.finished) {
                res.end();
            }

        });

        // Get the needful
        const { host, port } = this.configuration.server;

        // Start the server and log the URL for easier opening
        server.listen(port, host);
        console.log(`Server is running on http://${host}:${port}`);
    }
}
