// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Request, Response,
    AuthStrategy,
    CookieAuthStrategy, CookieAuthStrategyOptions
} from '@slate/slate';

// Define the strategy options
const options: CookieAuthStrategyOptions = {
    name: 'sid',    // The name of the session cookie

    // Function to authenticate the session cookie
    authenticate: (_req, cookie) => {
        return { isAuthenticated: cookie === 'DEVELOPMENT' };
    }
};

// The session authentication strategy
const SessionAuthStrategy: AuthStrategy & {
    login: (req: Request, res: Response, email: string, password: string) => boolean;   // Method to handle user login
    logout: (req: Request) => void;                                                     // Method to handle user logout
} = {
    authenticate: (req) => {
        // Delegate to the cookie strategy
        return CookieAuthStrategy.authenticate(req, options);
    },
    login: (_req: Request, res: Response, email: string, password: string) => {
        const isValid = email === 'test@test.com' && password === 'password';
        if (isValid) {
            res.cookie(options.name, 'DEVELOPMENT');
        }

        return isValid;
    },
    logout: () => { }
};

export default SessionAuthStrategy;
