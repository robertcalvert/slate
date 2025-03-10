// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';

import { AuthStrategy } from '.';

// Interface defining the options for the strategy
export interface QueryAuthStrategyOptions {
    name: string,                                                   // The name of the query parameter
    authenticate: (req: Request, credential: string) => boolean;    // Function to authenticate the request
}

// Query string authentication strategy implementation
export const QueryAuthStrategy: AuthStrategy<QueryAuthStrategyOptions> = {
    authenticate: (req: Request, options?: QueryAuthStrategyOptions): boolean => {
        // Ensure that options are provided before proceeding with authentication
        if (!options) return false;

        // Try and get the credential from the query string
        const credential = req.query[options.name]?.toString();
        if (!credential) return false;

        // Try and authenticate the credential
        return options.authenticate(req, credential);
    }
};
