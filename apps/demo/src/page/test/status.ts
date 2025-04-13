// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '@slate/slate';

const routes: Route[] = [
    {
        method: '*',
        path: '/{code:[1-5][0-9]{2}}',
        auth: {
            isOptional: true    // Authentication is optional
        },
        handler: (req, res) => {
            switch (req.params.code) {
                case '500':
                    throw new Error('This is a test error');

                default:
                    return res.status(parseInt(req.params.code));
            }

        }
    }
];

export default routes;
