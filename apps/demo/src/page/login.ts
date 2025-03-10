// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '@slate/slate';

import Session from '../auth/sessionAuthStrategy';

const routes: Route[] = [
    {
        method: ['GET', 'POST'],
        path: '/',
        auth: {
            isOptional: true    // Authentication is optional
        },
        handler: async (req, res) => {
            if (req.method === 'POST') {
                const { email, password } = req.payload;
                if (Session.login(req, email, password)) return res.redirect('/');
            }

            return res.view('login/index', req.payload);
        }
    }
];

export default routes;
