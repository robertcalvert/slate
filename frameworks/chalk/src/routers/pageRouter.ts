// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import merge from 'deepmerge';

import * as Slate from '@slate/slate';

import { Router } from '.';

import * as PathUtils from '../utils/pathUtils';

// The page router, responsible for handling routes that return web pages (frontend views)
const BASE_ROUTER: Slate.Router = {
    // Default configuration options used for each route in the router
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
        Path.join(PathUtils.chalkBaseDir, 'pages'),     // Chalk
        Path.join(PathUtils.appBaseDir, 'pages')        // Application
    ]
};

// Factory that merges custom options into the base router
const PageRouter: Router = {
    create(options?) {
        return merge(BASE_ROUTER, options ?? {}) as Slate.Router;
    }
};

export default PageRouter;
