// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { AuthStrategy, HeaderAuthStrategy } from '@slate/slate';

// Define the options for the API authentication strategy
const options: HeaderAuthStrategy.Options = {
    scheme: 'Bearer',   // The authentication scheme being used (Bearer Token)

    // Function to authenticate the token provided in the authorization header
    authenticate: async (_req, token) => {
        return { isAuthenticated: token === 'DEVELOPMENT' };
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
