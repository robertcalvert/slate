// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { Router } from '@slate/slate';

// The page router, responsible for handling routes that return web pages (frontend views)
const PageRouter: Router = {
    path: Path.join(__dirname, '../page'),
    defaults: {
        cache: {
            private: true,          // The response is specific to the user
            noStore: true           // Prevent storing the response in caches
        },
        auth: {
            strategy: 'session'     // Use the session strategy by default
        },
        security: {
            noSniff: true,          // Prevent MIME type sniffing by browsers
            xFrame: 'SAMEORIGIN'    // Restrict iframe embedding to the same origin
        }
    },
    middleware: async (req, res, handler) => {
        // Attempt to execute the provided handler function
        try {
            await handler(req, res);
        } catch (error) {
            res.serverError(error); // Handle the error
        }

        // If an error was raised, render the error view
        if (res.isError) {
            res.view('error', {
                status: res.raw.statusCode,
                message: res.statusMessage,
                details: res.error?.details,
                stack: res.error?.raw?.stack
            });
        }

        return res; // Return the response

    }
};

export default PageRouter;
