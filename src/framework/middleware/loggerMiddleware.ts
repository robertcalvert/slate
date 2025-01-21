// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';
import { Response } from '../core/response';

import { Middleware } from "./";

// Middleware to log incoming HTTP requests and responses
export const LoggerMiddleware: Middleware = (req: Request, res: Response, next: () => void) => {
    // Log the start of the request
    console.log(`Request starting HTTP/${req.httpVersion} ${req.method} ${req.url.pathname}${req.url.queryString}`);

    // Log the close of the request
    req.raw.once('close', () => {
        // Prepare the log message
        const logMessage = `Request finished in ${req.timer.elapsedTime}ms ${res.raw.statusCode}`;

        // Only include content-type in the log if it is defined
        if (res.headers['content-type']) {
            console.log(`${logMessage} ${res.headers['content-type']}`);
        } else {
            console.log(logMessage); // No content-type to log
        }

    });

    next(); // Pass to the next middleware or route handler

};
