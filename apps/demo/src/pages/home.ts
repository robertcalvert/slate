// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '@slate/slate';

const routes: Route[] = [
    {
        method: 'GET',
        path: '/',
        excludeFileName: true,  // Exclude the file name as we are the root
        auth: {
            isOptional: true    // Authentication is optional
        },
        handler: (_req, res) => {
            return res.view('home', { name: 'World' });
        }
    }
];

export default routes;
