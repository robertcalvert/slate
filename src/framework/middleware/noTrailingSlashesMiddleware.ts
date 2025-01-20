// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';
import { Response } from '../core/response';

import { Middleware } from "./";

// Middleware to ensures that URLs do not have trailing slashes (except for the root).
export const NoTrailingSlashesMiddleware : Middleware = (req: Request, res: Response, next: () => void) => {
    if (req.url && req.url !== '/' && req.url.endsWith('/')) {
        // Redirect to the URL without the trailing slashes
        // We use a 307 so that it is temporary, and the method and body of the original request are preserved
        res.redirect(req.url.replace(/\/+$/, ''), 307)

    } else {
        next(); // Pass to the next middleware or route handler

    }

};
