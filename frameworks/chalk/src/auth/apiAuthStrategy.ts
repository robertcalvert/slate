// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { HeaderAuthStrategy } from '@slate/slate';

import { AuthStrategy } from '.';

import { EntityManager } from 'typeorm';
import { ApiKey } from '../entities';

// Extend RequestAuth with properties for the authentication
declare module '@slate/slate' {
    interface RequestAuth {
        key?: string;
    }
}

// Type defining the options for the strategy
export type ApiAuthStrategyOptions = {
    scheme?: string;                                    // The authentication header scheme
}

// Factory that merges custom options into the base strategy
export const ApiAuthStrategy: AuthStrategy = {
    name: 'api',
    create(server, options?: ApiAuthStrategyOptions) {
        const { scheme = 'Bearer' } = options ?? {};    // Get the scheme

        // Create the base authentication strategy
        const base = HeaderAuthStrategy.strategy({
            scheme,
            // Function to authenticate the token provided in the authorization header
            authenticate: async (req, token) => {
                // Use the entity manager
                const em = req.getDataProvider().manager as EntityManager;

                // Try and load the key
                const apiKey = await em.findOne(ApiKey, {
                    where: { id: token },
                    relations: [
                        'user',                         // Include the user
                        'scopes',                       // and the keys scopes
                        'roles', 'roles.scopes'         // and the keys role scopes
                    ]
                });

                if (apiKey) {
                    // Populate a scopes array based on the keys scopes
                    const scopes: string[] = [];
                    apiKey.scopes.forEach(function (s) {
                        scopes.push(s.id);
                    });

                    // Include none duplicate role scopes in the scopes array
                    apiKey.roles.forEach(function (r) {
                        r.scopes.forEach(function (s) {
                            if (!scopes.includes(s.id)) scopes.push(s.id);
                        });
                    });

                    return {
                        isAuthenticated: true,          // Authenticated
                        key: token,                     // Attach the token used to authenticate
                        user: apiKey.user,              // Attach the user
                        scopes: scopes                  // Attach the keys scopes
                    };
                }

                return { isAuthenticated: false };      // Unauthenticated
            }
        });

        // Delegate the authentication to the base strategy
        return { authenticate: (req) => base.authenticate(req) };

    }
};
