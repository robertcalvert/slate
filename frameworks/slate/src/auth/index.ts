// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Server } from '../server';
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
    private server: Server;                                         // The server
    private strategies = new Map<string, AuthStrategy>();           // Array of registered strategies

    // Initializes the authentication handler
    constructor(server: Server) {
        this.server = server;
    }

    // Method to add a new strategy to the handler
    use(name: string, strategy: AuthStrategy) {
        this.strategies.set(name, strategy);
    }

    // Method to authenticates a request using the named strategy
    async authenticate(req: Request, name: string): Promise<boolean> {
        const strategy = this.strategies.get(name);

        if (!strategy) {
            this.server.logger.warn(`Authentication strategy "${name}" not found.`);

        } else {
            // Try and authenticate using the strategy
            const auth = await strategy.authenticate(req);
            if (auth.isAuthenticated) {
                req.auth = auth;                // Attach the authentication to the request
                req.auth.strategy = name;       // Store which strategy was used

                return true; // Authenticated
            }
        }

        return false; // Unauthenticated
    }

}
