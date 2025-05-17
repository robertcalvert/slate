// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Middleware } from '.';

// Middleware to log incoming HTTP requests and responses
export const LoggerMiddleware: Middleware = (req, res, next) => {
    // Log the start of the request
    req.logger.http(`Request starting HTTP/${req.httpVersion} ${req.method} ${req.url.pathname}${req.url.queryString}`);

    // Attach a listener to log when the response is finished
    res.raw.once('finish', () => {
        // If the response is a server error, then log the error
        // We log here as the status could have been set outside of the framework handlers
        if (res.isServerError) {
            req.logger.error(res.error?.raw || res.error?.details || res.statusMessage);
        }

        // Prepare the finished log message
        let logMessage = `Request finished in ${req.timer.elapsedTime}ms ${res.raw.statusCode}`;

        // Append content-type if available
        if (res.headers['content-type']) {
            logMessage += ` ${res.headers['content-type']}`;
        }

        req.logger.http(logMessage);
    });

    return next(); // Pass to the next middleware or route handler

};
