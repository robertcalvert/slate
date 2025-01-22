// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { ServerResponse } from 'http';
import { OutgoingHttpHeaders } from 'http2';
import * as Cookie from 'cookie'

// Class for our server response wrapper
export class Response {
    public readonly raw: ServerResponse; // Raw server response

    // Initializes the response object
    constructor(rawRes: ServerResponse) {
        this.raw = rawRes;
    }

    // Method to get all headers
    get headers(): OutgoingHttpHeaders {
        return this.raw.getHeaders();
    }

    // Method to set status code
    status(code: number): this {
        this.raw.statusCode = code;
        return this;
    }

    // Method to set a header
    header(key: string, value: number | string | readonly string[]): this {
        this.raw.setHeader(key, value);
        return this;
    }

    // Method to set the content type
    type(contentType: string): this {
        return this.header('content-type', contentType);
    }

    // Method to set a cookie
    cookie(name: string, value: string = '', options: Cookie.SerializeOptions = {}): this {
        // Massage the options based on conditions...
        options = {
            ...options,
            // Set httpOnly to true by default
            httpOnly: options.httpOnly !== undefined ? options.httpOnly : true,
            // Delete the cookie when we have no value
            maxAge: value ? options.maxAge : 0,
            expires: value ? options.expires : new Date(0)
        };

        // Create the new cookie
        const cookie = Cookie.serialize(name, value, options);

        // Try and get the existing cookies
        let cookies: string[] = [];
        const existingCookies = this.raw.getHeader('set-cookie');
        if (existingCookies) {
            cookies = Array.isArray(existingCookies) ? existingCookies : [existingCookies as string];
        }

        // Add the new cookie
        cookies.push(cookie);
        return this.header('set-cookie', cookies);
    }

    // Method to redirect the client to a specific URL
    // We use a 302 so that it is temporary
    redirect(url: string, code: number = 302): void {
        this.status(code)
            .header('location', url)
            .end();

        // Log the redirection for debugging
        console.log(`Request redirecting to ${url}`)
    }

    // Method to end the response
    end(body?: string | object): void {
        // Convert objects to a JSON string
        if (typeof body === 'object') {
            this.type('application/json')
            body = JSON.stringify(body);
        }

        this.raw.end(body)
    }

}
