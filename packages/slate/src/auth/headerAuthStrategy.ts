// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';

import { AuthStrategy } from '.';

// Interface defining the options for the strategy
export interface HeaderAuthStrategyOptions {
    readonly scheme: string,                                                // The authentication scheme (e.g., "Basic", "Bearer")
    readonly authenticate: (req: Request, credential: string) => boolean;   // Function to authenticate the request
}

// Header authentication strategy implementation
export const HeaderAuthStrategy: AuthStrategy<HeaderAuthStrategyOptions> = {
    authenticate: (req: Request, options?: HeaderAuthStrategyOptions): boolean => {
        // Ensure that options are provided before proceeding with authentication
        if (!options) return false;

        // Retrieve the authorization header from the request
        const authorization = req.headers.authorization;
        if (!authorization) return false; // No authorization header

        // Extract scheme and credential from the authorization header
        const [scheme, credential] = authorization.split(/\s+/);

        // Validate the scheme and credential
        if (!credential || scheme.toLowerCase() !== options.scheme.toLowerCase()) {
            return false; // Invalid scheme or missing credential
        }

        // Try and authenticate the credential
        return options.authenticate(req, credential);
    }
};
