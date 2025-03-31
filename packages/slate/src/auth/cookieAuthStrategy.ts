// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request, RequestAuth } from '../core/request';

import { AuthStrategy } from '.';

// Interface defining the options for the strategy
export interface Options {
    readonly name: string,                                                              // The name of the cookie
    readonly authenticate: (req: Request, credential: string) => Promise<RequestAuth>;  // Function to authenticate the request
}

// Creates a cookie authentication strategy
export function strategy(options: Options): AuthStrategy {
    return {
        authenticate: async (req: Request) => {
            // Try and get the credential from the cookie
            const credential = req.cookies[options.name];
            if (credential) {
                // Try and authenticate the credential
                return options.authenticate(req, credential);
            }

            return { isAuthenticated: false }; // Unauthenticated
        }
    };
}
