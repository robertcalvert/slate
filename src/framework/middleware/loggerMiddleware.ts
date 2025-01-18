// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';
import { Response } from '../core/response';
import { Middleware } from '../core/middleware';

// Middleware to log requests
export const LoggerMiddleware: Middleware = (req: Request, res: Response, next: () => void) => {
    // Log the start of the request
    console.log(`Request starting HTTP/${req.httpVersion} ${req.method} ${req.url}`);

    // Log the close of the request
    req.raw.once('close', () => {
        console.log(`Request finished in ${req.timer.elapsedTime}ms ${res.raw.statusCode} ${res.headers['content-type']}`);
    });

    // Pass to the next middleware or route handler
    next();

};
