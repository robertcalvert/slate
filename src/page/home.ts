// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '../framework';

const routes: Route[] = [
    {
        method: 'GET',
        path: '/',
        excludeFileName: true, // Exclude the file name as we are the root
        handler: (_req, res) => {
            res.view('home', { name: 'World' });
        }
    }
];

export default routes;
