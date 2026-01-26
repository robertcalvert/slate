// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import merge from 'deepmerge';

import { Router as SlateRouter } from '@slate/slate';

import { Router } from '.';

import * as Paths from '../utils/paths';

// The page router, responsible for handling routes that return web pages (frontend views)
const BASE_ROUTER: SlateRouter = {
    // Default configuration options used for each route in the router
    defaults: {
        payload: {
            // Only allow form based payloads
            allowed: [
                'application/x-www-form-urlencoded',
                'multipart/form-data'
            ]
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
    // Middleware that catches errors, and returns a view error page
    middleware: async (req, res, next) => {
        try {
            await next();               // Attempt to execute
        } catch (error) {
            res.serverError(error);     // Handle the error
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
    // Array of paths to the page route files, lookup is bottom up (as duplicates override)
    routes: [
        Paths.chalkPagesPath,       // Chalk
        Paths.appPagesPath          // Application
    ]
};

// Factory that merges custom options into the base router
const PageRouter: Router = {
    create(options?) {
        return merge(BASE_ROUTER, options ?? {}) as SlateRouter;
    }
};

export default PageRouter;
