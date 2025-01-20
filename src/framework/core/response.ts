// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { ServerResponse } from 'http';
import { OutgoingHttpHeaders } from 'http2';

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
    header(key: string, value: string): this {
        this.raw.setHeader(key, value);
        return this;
    }

    // Method to set the content type
    type(contentType: string): this {
        return this.header('content-type', contentType);
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
    end(body?: string): void {
        this.raw.end(body);
    }

}
