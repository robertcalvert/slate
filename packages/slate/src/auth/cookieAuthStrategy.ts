// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request, RequestAuth } from '../core/request';

import { AuthStrategy } from '.';

// Interface defining the options for the strategy
export interface CookieAuthStrategyOptions {
    readonly name: string,                                                      // The name of the cookie
    readonly authenticate: (req: Request, credential: string) => RequestAuth;   // Function to authenticate the request
}

// Cookie authentication strategy implementation
export const CookieAuthStrategy: AuthStrategy<CookieAuthStrategyOptions> = {
    authenticate: (req: Request, options?: CookieAuthStrategyOptions) => {
        // Ensure that options are provided
        if (options) {
            // Try and get the credential from the cookie
            const credential = req.cookies[options.name];
            if (credential) {
                // Try and authenticate the credential
                return options.authenticate(req, credential);
            }
        }

        return { isAuthenticated: false }; // Unauthenticated
    }
};
