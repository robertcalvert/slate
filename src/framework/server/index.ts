// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import http from 'http';
import https from 'https';

import { Configuration } from '../core/configuration';

import { Request } from '../core/request';
import { Response } from '../core/response';

import { MiddlewareHandler, Middleware } from '../middleware';
import { RouterHandler, Router } from '../router';
import { AuthHandler, AuthStrategy } from '../auth';
import { ViewHandler, ViewProvider } from '../view';
import { DataHandler, DataProvider } from '../data';
import { Logger, LoggerHandler } from '../logger';

// Server class to handle HTTP requests, and middleware
export class Server {
    private configuration: Configuration;
    private loggerHandler = new LoggerHandler();
    private middlewareHandler = new MiddlewareHandler();
    private routerHandler = new RouterHandler(this);
    private authHandler = new AuthHandler();
    private viewHandler = new ViewHandler();
    private dataHandler = new DataHandler(this);

    // Initializes the server object
    constructor(configuration: Configuration) {
        this.configuration = configuration;
    }

    // Method to retrieve the logger instance
    get logger(): Logger {
        return this.loggerHandler;
    }

    // Method to register a new middleware
    useMiddleware(middleware: Middleware) {
        this.middlewareHandler.use(middleware);
    }

    // Method to register a new auth strategy
    useAuthStrategy<T extends object>(name: string, strategy: AuthStrategy<T>, options?: T) {
        this.authHandler.use(name, strategy, options);
    }

    // Method to register a new router
    useRouter(router: Router) {
        this.routerHandler.use(router);
    }

    // Method to register a new view provider
    useViewProvider(provider: ViewProvider) {
        this.viewHandler.use(provider);
    }

    // Method to register a new data provider
    useDataProvider<T extends object>(provider: DataProvider<T>, options: T) {
        this.dataHandler.use(provider, options);
    }

    // Method to handler incoming requests
    private requestHandler = (rawReq: http.IncomingMessage, rawRes: http.ServerResponse) => {
        // Wrap the raw request and response objects into our custom objects
        const req = new Request(rawReq, {
            logger: this.loggerHandler,     // Allow access to the log handler
            authHandler: this.authHandler,  // Allow access to the auth handler
            dataHandler: this.dataHandler   // Allow access to the data handler
        });

        const res = new Response(rawRes, {
            logger: this.loggerHandler,     // Allow access to the log handler
            viewHandler: this.viewHandler   // Allow access to the view handler
        });

        // Establish mutual references between request and response
        req.response(res);
        res.request(req);

        // Execute middleware before executing the route
        this.middlewareHandler
            .execute(req, res, () => this.routerHandler.execute(req, res))
            .catch((error) => {
                res.serverError(error); // Handle the response error
            })
            .finally(() => {
                // Ensure that the response is always ended
                if (!res.isStream && !res.finished) res.end();
            });

    };

    // Start the server
    start() {
        // Get the needful
        const { host, port, ssl } = this.configuration.server;
        const protocol = ssl ? 'https' : 'http';

        // Create the appropriate server based on the protocol
        const server = ssl
            ? https.createServer(ssl, this.requestHandler)
            : http.createServer(this.requestHandler);

        // Start the server and log the URL for easier opening
        server.listen(port, host, () => {
            this.logger.info(`Server is running on ${protocol}://${host}:${port}`);
        });

    }

}
