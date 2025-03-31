// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request, RequestAuth } from '../core/request';

// Export the framework provided strategies for optional use by applications
export * as QueryAuthStrategy from './queryAuthStrategy';
export * as HeaderAuthStrategy from './headerAuthStrategy';
export * as CookieAuthStrategy from './cookieAuthStrategy';

// Interface defining a generic authentication strategy
export interface AuthStrategy {
    readonly authenticate: (req: Request) => Promise<RequestAuth>;  // Function to authenticate a request
}

// Auth class to manage requests authentication
export class AuthHandler {
    private strategies = new Map<string, AuthStrategy>();           // Array of registered strategies

    // Method to add a new strategy to the handler
    use(name: string, strategy: AuthStrategy) {
        this.strategies.set(name, strategy);
    }

    // Method to authenticates a request using the named strategy
    async authenticate(req: Request, name: string): Promise<boolean> {
        const strategy = this.strategies.get(name);
        if (strategy) {
            // Try and authenticate using the strategy
            const auth = await strategy.authenticate(req);
            if (auth.isAuthenticated) {
                // Populate the request
                req.auth = auth;
                req.auth.strategy = name;

                return true; // Authenticated
            }
        }

        return false; // Unauthenticated
    }

}
