// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '@slate/slate';

const routes: Route[] = [
    {
        method: '*',
        path: '/500',
        auth: {
            isOptional: true    // Authentication is optional
        },
        handler: () => {
            throw new Error('This is a test error');
        }
    }
];

export default routes;
