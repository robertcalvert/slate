// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '../../framework';

const routes: Route[] = [
    {
        method: 'GET',
        path: '/',
        handler: (_req, res) => {
            res.end(
                {
                    data: 'Hello, World!'
                }
            );
        }
    }
];

export default routes;
