// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '../../framework';

const routes: Route[] = [
    {
        method: 'GET',
        path: '/',
        handler: async (_req, res) => {
            return res.api({
                message: 'Hello, World!'
            });
        }
    }
];

export default routes;
