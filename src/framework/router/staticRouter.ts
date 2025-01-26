// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import { Request } from '../core/request';
import { Response } from '../core/response';

import { Router } from "./";

import * as PathUtils from '../utils/pathUtils';

// Path to the static assets directory
const staticPublicPath : string = Path.join(PathUtils.srcpath, 'static/public/');

// The handler function to serve static files
const handler = (req: Request, res: Response) => {
    // Join all request parameters and append them to the static public path
    const path = staticPublicPath  + Object.values(req.params).join('.');
    res.file(path);
}

// The static router, responsible for handling routes
// that serve static files (e.g., CSS, JavaScript)
export const StaticRouter: Router = {
    routes: [
        {
            method: 'GET',
            path: '/{file}\\.{extension}',
            handler: handler
        },
        {
            method: 'GET',
            path: '/static/{path:.*}',
            handler: handler
        }
    ]
}
