// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from './request';
import { Response } from './response';

// Type for middleware functions
// Each middleware receives a request (req), response (res),
// and a 'next' function to call the next middleware in the chain
export type Middleware = (req: Request, res: Response, next: () => void) => void;

// Class to handle middleware functions and their execution in sequence
export class MiddlewareHandler {
    // Private array to store middleware functions
    private middlewares: Middleware[] = [];

    // Method to add a middleware to the handler
    use(middleware: Middleware) {
        this.middlewares.push(middleware);
    }

    // Method to execute all middleware functions in the order they were added
    execute(req: Request, res: Response, finalHandler: () => void) {
        let index = -1; // Keep track of the current middleware being executed

        // Function to move to the next middleware in the chain
        const next = () => {
            index++;

            if (index < this.middlewares.length) {
                // Call the middleware
                this.middlewares[index](req, res, next);
            } else {
                // Done, call the final handler
                finalHandler();
            }
        };

        // Start executing the middlewares
        next();
    }
}
