// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { Router } from '@slate/slate';

// The page router, responsible for handling routes that return web pages (frontend views)
const PageRouter: Router = {
    path: Path.join(__dirname, '../page'),
    defaults: {
        auth: {
            strategy: 'session' // Use the session strategy by default
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
