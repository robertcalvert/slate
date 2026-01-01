// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Middleware } from '.';

// Middleware to ensures that URLs do not have trailing slashes (except for the root).
export const NoTrailingSlashMiddleware: Middleware = (req, res, next) => {
    // Get the needful...
    const { pathname, queryString } = req.url;

    // Check to see if we are not the root and have trailing slashes
    if (pathname && pathname !== '/' && pathname.endsWith('/')) {
        // Redirect to the URL without the trailing slashes
        // We use a 307 so that it is temporary, and the method and body of the original request are preserved
        return res.redirect((pathname.replace(/\/+$/, '') || '/') + queryString, 307);

    } else {
        return next(); // Pass to the next middleware

    }

};
