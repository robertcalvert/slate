// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request } from '../core/request';
import { Response } from '../core/response';

// Export the framework provided strategies for optional inclusion by the application
export * from './bearerAuthStrategy';

// Interface defining a generic authentication strategy
export interface AuthStrategy<T extends object = object> {
    authenticate: (req: Request, options?: T) => boolean;       // Function to authenticate a request
}

// Interface representing a registered authentication strategy instance
interface AuthStrategyInstance<T extends object = object> {
    strategy: AuthStrategy<T>;                                  // The authentication strategy implementation
    options?: T;                                                // Optional configuration for the strategy
}

// Auth class to manage requests authentication
export class AuthHandler<T extends object = object> {
    private strategies = new Map<string, AuthStrategyInstance<T>>();   // Array of registered strategies

    // Method to add a new strategy to the handler
    use<U extends T>(name: string, strategy: AuthStrategy<U>, options?: U) {
        this.strategies.set(name, { strategy: strategy as AuthStrategy<object>, options });
    }

    // Method to authenticates a request using the specified strategy
    authenticate(req: Request, res: Response, strategy: string): boolean {
        const instance = this.strategies.get(strategy);

        // If no strategy is found or authentication fails, mark the response as unauthorized
        if (!instance || !instance.strategy.authenticate(req, instance.options)) {
            res.unauthorized();
            return false;
        }

        return true;

    }

}
