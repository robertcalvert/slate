// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '@slate/slate';

import Session from '../auth/sessionAuthStrategy';

const routes: Route[] = [
    {
        method: 'GET',
        path: '/',
        handler: async (req, res) => {
            // Logout of the session
            await Session.logout(req);

            // Redirect to the root
            return res.redirect('/');
        }
    }
];

export default routes;
