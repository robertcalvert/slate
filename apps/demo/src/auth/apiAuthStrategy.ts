// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    AuthStrategy,
    HeaderAuthStrategy, HeaderAuthStrategyOptions
} from '@slate/slate';

// Define the strategy options
const options: HeaderAuthStrategyOptions = {
    scheme: 'Bearer',   // The authentication scheme being used (Bearer Token)

    // Function to authenticate the token provided in the authorization header
    authenticate: (_req, token) => {
        return { isAuthenticated: token === 'DEVELOPMENT' };
    }
};

// The API authentication strategy
const ApiAuthStrategy: AuthStrategy = {
    authenticate: (req) => {
        // Delegate to the header strategy
        return HeaderAuthStrategy.authenticate(req, options);
    }
};

export default ApiAuthStrategy;
