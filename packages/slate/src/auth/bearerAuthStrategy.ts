// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';

import { AuthStrategy } from '.';

// Interface defining options for Bearer authentication
interface BearerAuthStrategyOptions {
    scheme?: string,
    authenticate?: (req: Request, token: string) => boolean;
}

// Default authentication options for the Bearer strategy
const defaultBearerAuthOptions: BearerAuthStrategyOptions = {
    scheme: 'Bearer',
    authenticate: (_req, token): boolean => { return token === 'DEVELOPMENT'; } // Override as needed
};

// Bearer authentication strategy implementation
export const BearerAuthStrategy: AuthStrategy<BearerAuthStrategyOptions> = {
    authenticate: (req: Request, options?: BearerAuthStrategyOptions): boolean => {
        // Merge provided options with the default options
        options = {
            ...defaultBearerAuthOptions,
            ...options
        };

        // Retrieve the authorization header from the request
        const authorization = req.headers.authorization;
        if (!authorization) return false; // No authorization header

        // Extract scheme and token from the authorization header
        const [scheme, token] = authorization.split(/\s+/);

        // Validate the scheme and token
        if (!token || scheme.toLowerCase() !== options.scheme!.toLowerCase()) {
            return false; // Invalid scheme or missing token
        }

        // Authenticate the token using the provided strategy
        return options.authenticate!(req, token);
    }
};
