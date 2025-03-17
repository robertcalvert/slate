// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { Router } from '@slate/slate';

// The API router, responsible for handling routes that return API responses (backend data)
const ApiRouter: Router = {
    path: Path.join(__dirname, '../api'),
    defaults: {
        auth: {
            strategy: ['api', 'session'] // Try api first, and then fall back to session
        }
    }
};

export default ApiRouter;
