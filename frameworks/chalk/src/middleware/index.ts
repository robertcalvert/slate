// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Env, Server } from '@slate/slate';

import * as ApiResponse from '@slate/api-response';

export type AppMiddlewareOptions = {
    readonly apiResponse?: ApiResponse.ApiResponseOptions;
}

// Class to manage the middleware
export class MiddlewareHandler {
    private readonly server: Server;        // The Slate server

    // Initializes the middleware handler
    constructor(server: Server) {
        this.server = server;
    }

    // Method to register the middleware on the Slate server
    use(options?: AppMiddlewareOptions) {
        // Construct the options object for the API response middleware
        const apiResponseOptions: ApiResponse.ApiResponseOptions = {
            ...options?.apiResponse,

            // Define the onSend hook to run before the JSON response is finalized
            onSend(req, res, payload) {
                // Inject the current timestamp into the response metadata
                payload.meta = {
                    ...payload.meta,
                    timestamp: new Date().toISOString()
                };

                // Include the duration only in non production environments
                if (!Env.isProduction) payload.meta.duration_ms = req.timer.elapsedTime;

                // Fall down to the application defined hook if provided
                options?.apiResponse?.onSend?.(req, res, payload);
            }
        };

        this.server.middleware(ApiResponse.mw(apiResponseOptions));   // Decorates the response with res.api()
    }
}
