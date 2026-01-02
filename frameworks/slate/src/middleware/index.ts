// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';
import { Response } from '../core/response';

import { LoggerMiddleware } from './loggerMiddleware';
import { ShutdownMiddleware } from './shutdownMiddleware';
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
    private readonly middlewares: Middleware[] = [];    // Array of registered middleware

    // Always use the framework middlewares
    constructor() {
        this.use(LoggerMiddleware);                     // Logs the request
        this.use(ShutdownMiddleware);                   // Handles requests during a server shutdown
        this.use(NoTrailingSlashMiddleware);            // Removes any trailing slashes in the URL
    }

    // Method to add a middleware to the handler
    use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    // Method to execute the registered middleware functions
    async execute(req: Request, res: Response, handler: MiddlewareNext) {
        return execute(req, res, this.middlewares, handler);
    }
}

// Method to execute middleware functions in the order they were added
export async function execute(
    req: Request,
    res: Response,
    stack: Middleware | Middleware[] | undefined,
    handler: MiddlewareNext
) {
    // Simply call the handler when there is no middleware
    if (!stack) return handler();

    // The stack could be a single middleware or an array of middlewares
    const middlewares = Array.isArray(stack) ? stack : [stack];

    let index = 0; // Keep track of the current middleware being executed

    // Function to move to the next middleware in the chain
    const next: MiddlewareNext = () => {
        if (index < middlewares.length) {
            // Call the middleware
            return middlewares[index++](req, res, next);
        }

        // Done, call the handler
        return handler();
    };

    return next(); // Start executing the middlewares
}
