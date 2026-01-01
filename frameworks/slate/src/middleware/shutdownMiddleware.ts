// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Middleware } from '.';

// Middleware to handle requests when the server is in the process of shutting down
export const ShutdownMiddleware: Middleware = (req, res, next) => {
    if (req.server.isShuttingDown) {
        // Rejects incoming requests when the server is shutting down
        return res
                .header('connection', 'close')  // Close the connection
                .serviceUnavailable();

    } else {
        return next(); // Pass to the next middleware or route handler

    }

};
