// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { Router, RouteHandler } from '@slate/slate';

// Path to the public static assets directory
const publicAssetsPath  = Path.join(__dirname, '../static/public');

// The handler function to serve static files
const handler: RouteHandler = async (req, res) => {
    // Join all request parameters and append them to the routers path
    const path = Path.join(publicAssetsPath, Object.values(req.params).join('.'));
    return res.file(path);
};

// The static router, responsible for handling routes that serve static files (e.g., CSS, JavaScript)
const StaticRouter: Router = {
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
            path: '/{file}.{extension}',
            handler: handler
        },
        {
            method: 'GET',
            path: '/static/{path:.*}',
            handler: handler
        }
    ]
};

export default StaticRouter;
