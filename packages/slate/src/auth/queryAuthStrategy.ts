// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request, RequestAuth } from '../core/request';

import { AuthStrategy } from '.';

// Interface defining the options for the strategy
export interface QueryAuthStrategyOptions {
    readonly name: string,                                                      // The name of the query parameter
    readonly authenticate: (req: Request, credential: string) => RequestAuth;   // Function to authenticate the request
}

// Query string authentication strategy implementation
export const QueryAuthStrategy: AuthStrategy<QueryAuthStrategyOptions> = {
    authenticate: (req: Request, options?: QueryAuthStrategyOptions) => {
        // Ensure that options are provided
        if (options) {
            // Try and get the credential from the query string
            const credential = req.query[options.name]?.toString();
            if (credential) {
                // Try and authenticate the credential
                return options.authenticate(req, credential);
            }
        }

        return { isAuthenticated: false }; // Unauthenticated
    }
};
