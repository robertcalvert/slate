// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Router } from '@slate/slate';

// The API router, responsible for handling routes that return API responses (backend data)
const ApiRouter: Router = {
    path: 'api',
    defaults: {
        auth: {
            strategy: 'api' // Use the api strategy by default
        }
    }
};

export default ApiRouter;
