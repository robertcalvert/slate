// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import http from 'http';
import https from 'https';
import { Socket } from 'net';

import merge from 'deepmerge';

import Env from '../utils/env';

import { Request } from '../core/request';
import { Response } from '../core/response';

import { MiddlewareHandler, Middleware } from '../middleware';
import { RouterHandler, RouteMap, Route, Router } from '../router';
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
    private readonly options: ServerOptions;                    // The provided server options

    private server!: http.Server | https.Server;                // The underlying node server
    private readonly connections = new Set<Socket>();           // The servers open connections
    private readonly requests = new Set<Request>();             // The servers inflight requests

    private readonly loggerHandler = new LoggerHandler();
    private readonly middlewareHandler = new MiddlewareHandler();
    private readonly routerHandler = new RouterHandler(this);
    private readonly authHandler = new AuthHandler(this);
    private readonly viewHandler = new ViewHandler(this);
    private readonly dataHandler = new DataHandler(this);

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

    // Returns the logger instance
    get logger(): Logger {
        return this.loggerHandler;
    }

    // Returns the map of registered routes
    get routes(): RouteMap {
        return this.routerHandler.routes;
    }

    // Method to register a middleware
    use(middleware: Middleware): this {
        this.middlewareHandler.use(middleware);
        return this;
    };

    // Method to register a single route
    route(route: Route): this {
        this.routerHandler.addRoute(route);
        return this;
    };

    // Method to register a router
    router(router: Router): this {
        this.routerHandler.use(router);
        return this;
    };

    // Method to register an authentication strategy
    auth = {
        strategy: (name: string, strategy: AuthStrategy): this => {
            this.authHandler.use(name, strategy);
            return this;
        }
    };

    // Method to register a view provider
    view = {
        provider: (provider: ViewProvider): this => {
            this.viewHandler.use(provider);
            return this;
        }
    };

    // Method to register a data provider
    data = {
        provider: (name: string, provider: DataProvider): this => {
            this.dataHandler.use(name, provider);
            return this;
        }
    };

    // Start the server
    async start() {
        // Get the needful
        const { host, port, ssl } = this.options;
        const protocol = ssl ? 'https' : 'http';

        // Create the appropriate server based on the protocol
        this.server = ssl
            ? https.createServer(ssl, this.requestHandler)
            : http.createServer(this.requestHandler);

        // Start the providers
        await this.dataHandler.start();
        this.routerHandler.start();

        // Keep track of open connections
        this.server.on('connection', (socket) => {
            this.connections.add(socket);
            socket.once('close', () => this.connections.delete(socket));
            socket.once('error', (error: Error) => {
                this.logger.error(error);
                this.connections.delete(socket);
            });
        });

        // Wait for the server to become ready
        await new Promise<void>((resolve, reject) => {
            this.server.once('listening', () => resolve());
            this.server.once('error', (error) => reject(error));
            this.server.listen(port, host);
        });

        // Log the URL for easier opening
        this.logger.info(`Hosting environment: ${Env.NODE_ENV}`);
        this.logger.info(`Now listening on: ${protocol}://${host}:${port}`);
    }

    // Method to handler incoming requests
    private requestHandler = async (rawReq: http.IncomingMessage, rawRes: http.ServerResponse) => {
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

        // Keep track of inflight requests
        this.requests.add(req);
        const cleanup = () => this.requests.delete(req);
        rawRes.once('finish', cleanup);     // Completed successfully
        rawRes.once('close', cleanup);      // Client aborted or error occurred

        // Execute middleware before executing the route
        try {
            await this.middlewareHandler.execute(req, res, () => this.routerHandler.execute(req, res));
        } catch (error) {
            // Handle the response error
            res.serverError(error);
        } finally {
            // Ensure that the response is always ended
            if (!res.finished) res.end();
        }

    };

}
