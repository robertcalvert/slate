// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request, RequestAuth } from '../core/request';

// Export the framework provided strategies for optional use by the application
export * from './queryAuthStrategy';
export * from './headerAuthStrategy';
export * from './cookieAuthStrategy';

// Interface defining a generic authentication strategy
export interface AuthStrategy<T extends object = object> {
    readonly authenticate: (req: Request, options?: T) => RequestAuth;      // Function to authenticate a request
}

// Interface representing a registered authentication strategy instance
interface AuthStrategyInstance<T extends object = object> {
    readonly strategy: AuthStrategy<T>;                                 // The authentication strategy implementation
    readonly options?: T;                                               // Optional configuration for the strategy
}

// Auth class to manage requests authentication
export class AuthHandler<T extends object = object> {
    private strategies = new Map<string, AuthStrategyInstance<T>>();   // Array of registered strategies

    // Method to add a new strategy to the handler
    use<U extends T>(name: string, strategy: AuthStrategy<U>, options?: U) {
        this.strategies.set(name, { strategy: strategy as AuthStrategy<object>, options });
    }

    // Method to authenticates a request using the specified strategy
    authenticate(req: Request, strategy: string): boolean {
        const instance = this.strategies.get(strategy);
        if (instance) {
            // Try and authenticate using the strategy
            const auth = instance.strategy.authenticate(req, instance.options);
            if (auth.isAuthenticated) {
                // Populate the request
                req.auth = auth;
                req.auth.strategy = strategy;

                return true; // Authenticated
            }
        }

        return false; // Unauthenticated
    }

}
