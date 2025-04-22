// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';
import { Response } from '../core/response';

import { LoggerMiddleware } from './loggerMiddleware';
import { NoTrailingSlashMiddleware } from './noTrailingSlashMiddleware';

// Type for middleware functions
// Middleware functions process incoming requests and responses,
// then call the 'next' function to pass control to the next middleware in the chain
export type Middleware = (req: Request, res: Response, next: MiddlewareNext) => Response | Promise<Response>;

// Type for the 'next' function in middleware
// This function is called to continue the middleware execution flow,
// allowing the next middleware in the chain to handle the request
export type MiddlewareNext = () => Response | Promise<Response>;

// Class to handle middleware functions and their execution in sequence
export class MiddlewareHandler {
    // Private array to store middleware functions
    private middlewares: Middleware[] = [];

    // Always use the framework middlewares
    constructor() {
        this.use(LoggerMiddleware);             // Logs the request
        this.use(NoTrailingSlashMiddleware);    // Removes any trailing slashes
    }

    // Method to add a middleware to the handler
    use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    // Method to execute all middleware functions in the order they were added
    async execute(req: Request, res: Response, handler: MiddlewareNext) {
        let index = 0; // Keep track of the current middleware being executed

        // Function to move to the next middleware in the chain
        const next: MiddlewareNext = () => {
            if (index < this.middlewares.length) {
                // Call the middleware
                return this.middlewares[index++](req, res, next);
            }

            // Done, call the handler
            return handler();

        };

        return next(); // Start executing the middlewares

    }
}
