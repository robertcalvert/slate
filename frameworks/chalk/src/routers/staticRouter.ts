// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import merge from 'deepmerge';

import * as Slate from '@slate/slate';

import { Router } from '.';

import * as PathUtils from '../utils/pathUtils';

// Paths to the public static asset directories
const appPublicDir = Path.join(PathUtils.appBaseDir, 'static', 'public');       // Application
const chalkPublicDir = Path.join(PathUtils.chalkBaseDir, 'static', 'public');   // Chalk

// The handler function to serve static files
const handler: Slate.RouteHandler = async (req, res) => {
    // Join the request parameters to make the file path
    const relativePath = Object.values(req.params).join('.');

    // Try and serve the file from the application
    await res.file(Path.join(appPublicDir, relativePath));

    // If the call failed, then fallback to the framework
    if (res.isError) await res.file(Path.join(chalkPublicDir, relativePath));

    return res;
};

// Factory that merges custom options into the base router
const StaticRouter: Router = {
    create(options?) {
        // Handle the base path override as needed...
        const basePath = options?.basePath ?? '/static';
        if (options?.basePath) options.basePath = undefined;    // Clear (else Slate would prefix)

        // The static router, responsible for handling routes that serve static files (e.g., CSS, JavaScript)
        const BASE_ROUTER = {
            defaults: {
                cache: {
                    public: true,               // The response can be cached by shared caches
                    maxAge: 31536000            // 1 year
                },
                security: {
                    noSniff: true,              // Prevent MIME type sniffing by browsers
                    referrer: 'no-referrer'     // No referrer information will be sent
                }
            },
            // Predefined routes to handle the static file paths
            routes: [
                {
                    method: 'GET',
                    path: '/{file}.{extension}',        // e.g. "/robots.txt"
                    handler: handler
                },
                {
                    method: 'GET',
                    path: `${basePath}/{path:.*}`,      // e.g. "/static/css/app.css"
                    handler: handler
                }
            ]
        };

        return merge(BASE_ROUTER, options ?? {}) as Slate.Router;
    }
};

export default StaticRouter;
