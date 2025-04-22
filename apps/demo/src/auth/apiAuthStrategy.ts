// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { AuthStrategy, HeaderAuthStrategy } from '@slate/slate';

import { EntityManager } from 'typeorm';
import { ApiKey } from '../entity/api/key';

// Define the options for the API authentication strategy
const options: HeaderAuthStrategy.Options = {
    scheme: 'Bearer',   // The authentication scheme being used (Bearer Token)

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
};

// Create the base authentication strategy using the provided options
const base = HeaderAuthStrategy.strategy(options);

// Defines the API authentication strategy
const ApiAuthStrategy: AuthStrategy = {
    authenticate: (req) => {
        // Delegate the authentication to the base strategy
        return base.authenticate(req);
    }
};

export default ApiAuthStrategy;
