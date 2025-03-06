// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '@slate/slate';

const routes: Route[] = [
    {
        method: ['GET', 'POST'],
        path: '/',
        handler: async (req, res) => {
            if (req.method === 'POST') res.logger.info(req.payload);
            return res.view('login/index', req.payload);
        }
    }
];

export default routes;
