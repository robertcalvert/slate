// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Interface for defining Cross-Origin Resource Sharing (CORS) policies
export interface CorsOptions {
    origin?: string | string[];     // Allowed origins that can access this resource
    allowedHeaders?: string[];      // Request headers permitted in cross-origin requests (preflight validation)
    exposedHeaders?: string[];      // Response headers that can be exposed to browser JavaScript
    credentials?: boolean;          // Whether credentials (cookies, auth) are included in cross-origin requests
    maxAge?: number;                // How long (in seconds) the browser may cache preflight (OPTIONS) responses
}

// The default CORS policy
export const DefaultCorsOptions: CorsOptions = {
    // Allow requests from any origin
    origin: '*',

    // Headers that browsers are allowed to send in cross-origin requests
    allowedHeaders: [
        'Accept',           // What response formats the client accepts
        'Authorization',    // Credentials for authentication
        'Content-Type',     // The media type of the request body
        'If-None-Match'     // ETag caching
    ],

    // Do not allow cookies or HTTP credentials in cross-origin requests
    credentials: false,

    // Cache preflight response for 10 minutes
    maxAge: 600
};
