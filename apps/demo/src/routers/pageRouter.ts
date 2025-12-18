// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { Router } from '@slate/slate';

// The page router, responsible for handling routes that return web pages (frontend views)
const PageRouter: Router = {
    defaults: {
        cache: {
            private: true,          // The response is specific to the user
            noStore: true           // Prevent storing the response in caches
        },
        auth: {
            strategy: 'session'     // Use the session strategy by default
        },
        security: {
            noSniff: true,                                  // Prevent MIME type sniffing by browsers
            xFrame: 'SAMEORIGIN',                           // Restrict iframe embedding to the same origin
            referrer: 'strict-origin-when-cross-origin'     // Referrer will be sent as origin for cross-origin requests, only for secure requests
        }
    },
    middleware: async (req, res, handler) => {
        // Attempt to execute the provided handler function
        try {
            await handler(req, res);
        } catch (error) {
            res.serverError(error); // Handle the error
        }

        // If an error was raised, return the error view
        if (res.isError) {
            return res.view('error', {
                status: res.raw.statusCode,
                message: res.statusMessage,
                details: res.error?.details,
                stack: res.error?.raw?.stack
            });
        }

        return res; // Return the response

    },
    routes: Path.join(__dirname, '../pages')    // Path to the page route files
};

export default PageRouter;
