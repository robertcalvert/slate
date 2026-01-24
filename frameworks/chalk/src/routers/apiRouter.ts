// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import merge from 'deepmerge';

import { Router as SlateRouter} from '@slate/slate';

import { Router } from '.';

import * as Paths from '../utils/paths';

// The API router, responsible for handling routes that return API responses (backend data)
const BASE_ROUTER: SlateRouter = {
    basePath: '/api',                       // Mount the routes under a base URL path
    defaults: {
        cache: {
            private: true,                  // The response is specific to the user
            noStore: true                   // Prevent storing the response in caches
        },
        auth: {
            strategy: ['api', 'session']    // Try api first, and then fall back to session
        },
        security: {
            noSniff: true,                  // Prevent MIME type sniffing by browsers
            xFrame: 'DENY',                 // Prevent responses from being embedded in iframes
            referrer: 'origin'              // Only the origin part of the URL is sent as the referrer
        }
    },
    // Array of paths to the API route files, lookup is bottom up (as duplicates override)
    routes: [
        Paths.chalkApiPath,     // Chalk
        Paths.appApiPath        // Application
    ]
};

// Factory that merges custom options into the base router
const ApiRouter: Router = {
    create(options?) {
        return merge(BASE_ROUTER, options ?? {}) as SlateRouter;
    }
};

export default ApiRouter;
