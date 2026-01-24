// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Server,
    AuthStrategy as SlateAuthStrategy
} from '@slate/slate';

import { SessionAuthStrategy, SessionAuthStrategyOptions } from './sessionAuthStrategy';
import { ApiAuthStrategy, ApiAuthStrategyOptions } from './apiAuthStrategy';

// Defines the authentication strategy options for the application
// Each property can be:
// 1. false             Explicitly disables the strategy
// 2. true              Enables the strategy with default options
// 3. undefined         Enables the strategy with default options (same as true)
// 4. options           Enables the strategy with the provided options
export type AppAuthOptions = {
    readonly session?: boolean | SessionAuthStrategyOptions;
    readonly api?: boolean | ApiAuthStrategyOptions;
}

// Interface defining an authentication strategy
export interface AuthStrategy {
    name: string;                                                       // The name of the strategy
    create(server: Server, options?: unknown): SlateAuthStrategy;       // Function to create the Slate strategy
}

// Auth class to manage the authentication strategies
export class AuthHandler {
    private readonly server: Server;              // The Slate server

    // Initializes the authentication handler
    constructor(server: Server) {
        this.server = server;
    }

    // Method to register the strategies on the Slate server
    use(options?: AppAuthOptions) {
        // Helper to register a single strategy based on its options
        const register = (strategy: AuthStrategy, options?: boolean | unknown) => {
            if (options === false) return; // Disabled

            // True or undefined means use the defaults
            const instance = (options === true || options === undefined)
                ? strategy.create(this.server)
                : strategy.create(this.server, options);    // Custom options

            this.server.auth.strategy(strategy.name, instance);
        };

        // Register the strategies
        register(SessionAuthStrategy, options?.session);
        register(ApiAuthStrategy, options?.api);

    }
}
