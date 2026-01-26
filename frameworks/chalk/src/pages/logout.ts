// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '@slate/slate';

const routes: Route[] = [
    {
        method: 'GET',
        path: '/',
        auth: {
            isOptional: true    // Authentication is optional
        },
        handler: async (req, res) => {
            // Logout of the session when needed...
            if (req.auth.isAuthenticated) await req.auth.logout!(req);

            // Redirect to the root
            return res.redirect('/');
        }
    }
];

export default routes;
