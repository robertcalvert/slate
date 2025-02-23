// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Middleware } from './';

// Middleware to log incoming HTTP requests and responses
export const LoggerMiddleware: Middleware = (req, res, next) => {
    // Log the start of the request
    req.logger.http(`Request starting HTTP/${req.httpVersion} ${req.method} ${req.url.pathname}${req.url.queryString}`);

    // Attach a listener to log when the request is closed
    req.raw.once('close', () => {
        // If the response is a server error, then log the error
        // We log here as the status could have been set outside of the framework handlers
        if (res.isServerError) {
            req.logger.error(res.error?.raw, res.error?.details || 'Unknown Server Error');
        }

        // Prepare the finished log message
        const logMessage = `Request finished in ${req.timer.elapsedTime}ms ${res.raw.statusCode}`;

        // Only include content-type in the log if it is defined
        if (res.headers['content-type']) {
            req.logger.http(`${logMessage} ${res.headers['content-type']}`);
        } else {
            req.logger.http(logMessage); // No content-type to log
        }

    });

    return next(req, res); // Pass to the next middleware or route handler

};
