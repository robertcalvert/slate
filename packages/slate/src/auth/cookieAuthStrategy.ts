// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';

import { AuthStrategy } from '.';

// Interface defining the options for the strategy
export interface CookieAuthStrategyOptions {
    readonly name: string,                                                  // The name of the cookie
    readonly authenticate: (req: Request, credential: string) => boolean;   // Function to authenticate the request
}

// Cookie authentication strategy implementation
export const CookieAuthStrategy: AuthStrategy<CookieAuthStrategyOptions> = {
    authenticate: (req: Request, options?: CookieAuthStrategyOptions): boolean => {
        // Ensure that options are provided before proceeding with authentication
        if (!options) return false;

        // Try and get the credential from the cookies
        const credential = req.cookies[options.name];
        if (!credential) return false;

        // Try and authenticate the credential
        return options.authenticate(req, credential);
    }
};
