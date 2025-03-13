// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Route } from '@slate/slate';

import Session from '../auth/sessionAuthStrategy';

const routes: Route[] = [
    {
        method: ['GET', 'POST'],
        path: '/',
        auth: {
            isOptional: true    // Authentication is optional
        },
        handler: async (req, res) => {
            // If we are already authenticated then redirect to the root
            if (req.auth.isAuthenticated) return res.redirect('/');

            if (req.method === 'POST') {
                // Get the payload
                const { email, password } = req.payload;

                // Try and login
                const isLoggedIn = await Session.login(req, res, email, password);
                if (isLoggedIn) {
                    // Login successful, redirect to the root
                    return res.redirect('/');
                }

                // Login unsuccessful, populate the error
                req.payload.error = {
                    message: 'Invalid email or password.'
                };

            }

            // Not logged in, render the login view
            return res.view('login', req.payload);
        }
    }
];

export default routes;
