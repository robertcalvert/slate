// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request, RequestAuth } from '../core/request';

import { AuthStrategy } from '.';

// Interface defining the options for the strategy
export interface Options {
    readonly scheme: string,                                                            // The authentication scheme (e.g., "Basic", "Bearer")
    readonly authenticate: (req: Request, credential: string) => Promise<RequestAuth>;  // Function to authenticate the request
}

// Creates a header authentication strategy
export function strategy(options: Options): AuthStrategy {
    return {
        authenticate: async (req: Request) => {
            // Retrieve the authorization header from the request
            const authorization = req.headers.authorization;
            if (authorization) {
                // Extract scheme and credential from the authorization header
                const [scheme, credential] = authorization.split(/\s+/);

                // Validate the scheme and credential
                if (credential && scheme.toLowerCase() === options.scheme.toLowerCase()) {
                    // Try and authenticate the credential
                    return options.authenticate(req, credential);
                }
            }

            return { isAuthenticated: false }; // Unauthenticated
        }
    };
}
