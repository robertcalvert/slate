// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '@slate/slate';

const routes: Route[] = [
    {
        method: ['GET', 'POST'],
        path: '/',
        auth: {
            isOptional: true    // Authentication is optional
        },
        handler: (req, res) => {
            return res.view('test/form', req.payload);
        }
    }
];

export default routes;
