// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Request, Response,
    AuthStrategy, CookieAuthStrategy
} from '@slate/slate';

import * as Password from '../utils/password';

import { EntityManager, IsNull } from 'typeorm';
import { UserLogin } from '../entity/user/login';
import { UserSession } from 'src/entity/user/session';

// Define the options for the session authentication strategy
const options: CookieAuthStrategy.Options = {
    name: 'sid',    // The name of the session cookie

    // Function to authenticate the session cookie
    authenticate: async (req, cookie) => {
        // Use the entity manager
        const em = req.getDataProvider().manager as EntityManager;

        // Try and load the user session
        const userSession = await em.findOne(UserSession, {
            where: { id: cookie, closedAt: IsNull() },
            relations: ['user']
        });

        if (userSession) {
            // Bump the updated at timestamp
            userSession.updatedAt = new Date();
            await em.save(userSession);

            return {
                isAuthenticated: true,          // Authenticated
                user: userSession.user,         // Attach the user
                userSession: userSession        // Attach the user session
            };
        }

        return { isAuthenticated: false };      // Unauthenticated
    }
};

// Create the base authentication strategy using the provided options
const base = CookieAuthStrategy.strategy(options);

// Defines the session authentication strategy
const SessionAuthStrategy: AuthStrategy & {
    login: (req: Request, res: Response, email: string, password: string) => Promise<boolean>;  // Method to handle user login
    logout: (req: Request) => Promise<void>;                                                    // Method to handle user logout
} = {
    authenticate: (req) => {
        // Delegate the authentication to the base strategy
        return base.authenticate(req);
    },
    login: async (req: Request, res: Response, email: string, password: string) => {
        // Use the entity manager
        const em = req.getDataProvider().manager as EntityManager;

        // Try and load the user login
        const userLogin = await em.findOne(UserLogin, {
            where: { user: { email } },
            relations: ['user']
        });

        if (userLogin) {
            // Validate the password
            const passwordIsValid = await Password.compare(password, userLogin.password);
            if (passwordIsValid) {
                // Create the user session
                const userSession = await em.save(UserSession, {
                    user: userLogin.user,
                    ipAddress: req.client.ip,
                    userAgent: req.client.userAgent
                });

                // Create the session cookie
                res.cookie(options.name, userSession.id);

                // Valid, login successful
                return true;
            }
        }

        // Invalid, login failed
        return false;
    },
    logout: async (req) => {
        // We can only logout if we are authenticated
        if (req.auth.isAuthenticated) {
            // Get the user session form the request auth
            const userSession = req.auth.userSession as UserSession;
            if (userSession) {
                // Use the entity manager
                const em = req.getDataProvider().manager as EntityManager;

                // Close the session
                userSession.closedAt = new Date();
                await em.save(userSession);
            }
        }
    }
};

export default SessionAuthStrategy;
