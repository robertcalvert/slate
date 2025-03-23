// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { Router } from '@slate/slate';

// The API router, responsible for handling routes that return API responses (backend data)
const ApiRouter: Router = {
    path: Path.join(__dirname, '../api'),
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
            xFrame: 'DENY'                  // Prevent responses from being embedded in iframes
        }
    }
};

export default ApiRouter;
