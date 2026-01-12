// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import merge from 'deepmerge';

import * as Slate from '@slate/slate';

import { Router } from '.';

import * as PathUtils from '../utils/pathUtils';

// The API router, responsible for handling routes that return API responses (backend data)
const BASE_ROUTER: Slate.Router = {
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
        Path.join(PathUtils.chalkBaseDir, 'api'),       // Chalk
        Path.join(PathUtils.appBaseDir, 'api')          // Application
    ]
};

// Factory that merges custom options into the base router
const ApiRouter: Router = {
    create(options?) {
        return merge(BASE_ROUTER, options ?? {}) as Slate.Router;
    }
};

export default ApiRouter;
