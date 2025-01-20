// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from "../framework"

const routes: Route[] = [
    {
        method: 'GET',
        path: '/',
        prependFileName: false,
        handler: (req, res) => {
            res.status(200)
                .type('text/plain')
                .end('Hello, World!');
        }
    }
]

export default routes;
