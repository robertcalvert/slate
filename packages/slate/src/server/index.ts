// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import http from 'http';
import https from 'https';

import merge from 'deepmerge';

import Env from '../utils/env';

import { Request } from '../core/request';
import { Response } from '../core/response';

import { MiddlewareHandler, Middleware } from '../middleware';
import { RouterHandler, Router } from '../router';
import { AuthHandler, AuthStrategy } from '../auth';
import { ViewHandler, ViewProvider } from '../view';
import { DataHandler, DataProvider } from '../data';
import { Logger, LoggerHandler } from '../logger';

// Type defining the server options
export type ServerOptions = {
    host?: string;                          // The hostname for the server
    port?: number;                          // The port number on which the server will run
    ssl?: https.ServerOptions               // SSL options including certificates and keys etc.
}

// The default server options
const DEFAULT_OPTIONS: ServerOptions = {
    host: process.env.HOST || 'localhost',
    port: parseInt(process.env.PORT || '3000')
};

// Server class to handle requests
export class Server {
    private options: ServerOptions;
    private loggerHandler = new LoggerHandler();
    private middlewareHandler = new MiddlewareHandler();
    private routerHandler = new RouterHandler(this);
    private authHandler = new AuthHandler(this);
    private viewHandler = new ViewHandler();
    private dataHandler = new DataHandler(this);

    // Initializes the server
    constructor(options?: ServerOptions) {
        this.options = options
            ? merge(DEFAULT_OPTIONS, {
                ...options,
                // Set the port based on options and environment, with sensible defaults
                port: options.port || parseInt(process.env.PORT || (options.ssl ? '3001' : String(DEFAULT_OPTIONS.port)))
            })
            : DEFAULT_OPTIONS;
    }

    // Method to retrieve the logger instance
    get logger(): Logger {
        return this.loggerHandler;
    }

    // Method to register a middleware
    use = (middleware: Middleware): this => {
        this.middlewareHandler.use(middleware);
        return this;
    };

    // Method to register a router
    router = (router: Router): this => {
        this.routerHandler.use(router);
        return this;
    };

    // Method to register an authentication strategy
    auth = {
        strategy: (name: string, strategy: AuthStrategy): Server => {
            this.authHandler.use(name, strategy);
            return this;
        }
    };

    // Method to register a view provider
    view = {
        provider: (provider: ViewProvider): Server => {
            this.viewHandler.use(provider);
            return this;
        }
    };

    // Method to register a data provider
    data = {
        provider: async (name: string, provider: DataProvider) => {
            await this.dataHandler.use(name, provider);
        }
    };

    // Start the server
    listen() {
        // Get the needful
        const { host, port, ssl } = this.options;
        const protocol = ssl ? 'https' : 'http';

        // Create the appropriate server based on the protocol
        const server = ssl
            ? https.createServer(ssl, this.requestHandler)
            : http.createServer(this.requestHandler);

        // Start the server and log the URL for easier opening
        server.listen(port, host, () => {
            this.logger.info(`Hosting environment: ${Env.NODE_ENV}`);
            this.logger.info(`Now listening on: ${protocol}://${host}:${port}`);
        });

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

}
