// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Env,
    Request, Response,
    CookieAuthStrategy
} from '@slate/slate';

import { AuthStrategy } from '.';

import { EntityManager, IsNull } from 'typeorm';
import { User, UserLogin, UserSession } from '../entities';

import * as Password from '../utils/password';

// Extend RequestAuth with properties and helpers for the authentication flow
declare module '@slate/slate' {
    interface RequestAuth {
        user?: User;                                // The user entity for the authenticated user
        session?: UserSession;                      // The user session entity for the authenticated user
        login?: (                                   // Method to handle user login
            req: Request,
            res: Response,
            email: string,
            password: string,
        ) => Promise<boolean>;
        logout?: (req: Request) => Promise<void>;   // Method to handle user logout
    }
}

// Type defining the options for the strategy
export type SessionAuthStrategyOptions = {
    cookie?: string;    // The name of the session cookie
}

// Factory that merges custom options into the base strategy and registers the decorator middleware
export const SessionAuthStrategy: AuthStrategy = {
    name: 'session',
    create(server, options?: SessionAuthStrategyOptions) {
        const { cookie = 'sid' } = options ?? {};   // Get the cookie name

        // Register middleware to decorate the request auth with the session methods
        server.middleware((req, res, next) => {
            // Method to handle user login
            req.auth.login = async (
                req: Request,
                res: Response,
                email: string,
                password: string
            ) => {
                // Use the entity manager
                const em = req.getDataProvider().manager as EntityManager;

                // Try and load the user login
                const userLogin = await em.findOne(UserLogin, {
                    where: { user: { email } },
                    relations: [
                        'user',                                 // Include the user
                        'user.scopes',                          // and the users scopes
                        'user.roles', 'user.roles.scopes'       // and the users role scopes
                    ]
                });

                if (userLogin) {
                    // In development, set the password if not already set
                    if (Env.isDevelopment && !userLogin.password) {
                        userLogin.password = await Password.hash(password);
                        await em.save(userLogin);
                    }

                    // Validate the password
                    const passwordIsValid = await Password.compare(password, userLogin.password);
                    if (passwordIsValid) {
                        // Populate a scopes array based on the users scopes
                        const scopes: string[] = [];
                        userLogin.user.scopes.forEach(function (s) {
                            scopes.push(s.id);
                        });

                        // Include none duplicate role scopes in the scopes array
                        userLogin.user.roles.forEach(function (r) {
                            r.scopes.forEach(function (s) {
                                if (!scopes.includes(s.id)) scopes.push(s.id);
                            });
                        });

                        // Create the user session
                        const userSession = await em.save(UserSession, {
                            user: userLogin.user,
                            ipAddress: req.client.ip,
                            userAgent: req.client.userAgent,
                            scopes: scopes
                        });

                        // Create the session cookie
                        res.cookie(cookie, userSession.id);

                        // Valid, login successful
                        return true;
                    }
                }

                // Invalid, login failed
                return false;
            };

            // Method to handle user logout
            req.auth.logout = async (req: Request) => {
                // We can only logout if we are authenticated
                if (req.auth.isAuthenticated) {
                    // Get the session form the request auth
                    const session = req.auth.session;
                    if (session) {
                        // Use the entity manager
                        const em = req.getDataProvider().manager as EntityManager;

                        // Close the session
                        session.closedAt = new Date();
                        await em.save(session);
                    }
                }
            };

            return next();
        });

        // Create the base authentication strategy
        const base = CookieAuthStrategy.strategy({
            name: cookie,
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
                        session: userSession,           // Attach the user session
                        scopes: userSession.scopes,     // Attach the sessions scopes
                    };
                }

                return { isAuthenticated: false };      // Unauthenticated
            }
        });

        // Delegate the authentication to the base strategy
        return { authenticate: (req) => base.authenticate(req) };

    }
};
