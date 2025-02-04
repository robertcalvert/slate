// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Fs from 'fs';

import { ServerResponse } from 'http';
import { OutgoingHttpHeaders } from 'http2';

import * as Cookie from 'cookie';
import * as Mime from 'mime-types';

import { Request } from '../core/request';

// Interface for defining a response error
export interface ResponseError {
    raw?: Error;
    message: string;
}

// Class for our server response wrapper
export class Response {
    public readonly raw: ServerResponse;    // Raw server response
    readonly request: Request;              // Our wrapped request for which this response is for
    private _error?: ResponseError;         // The error related to this response

    // Initializes the response object
    constructor(rawRes: ServerResponse, req: Request) {
        this.raw = rawRes;
        this.request = req;
    }

    // Method to check if the response has been fully sent
    get finished(): boolean {
        return this.raw.writableEnded;
    }

    // Method to check if the response headers have been sent
    get headersSent(): boolean {
        return this.raw.headersSent;
    }

    // Method to get all headers
    get headers(): OutgoingHttpHeaders {
        return this.raw.getHeaders();
    }

    // Method to get the error related to the response
    get error(): ResponseError | undefined {
        return this._error;
    }

    // Method to check if the response status code indicates an error (4xx or 5xx range)
    get isError(): boolean {
        return this.raw.statusCode >= 400 && this.raw.statusCode < 600;
    }

    // Method to check if the response status code indicates a server error (5xx range)
    get isServerError(): boolean {
        return this.raw.statusCode >= 500 && this.raw.statusCode < 600;
    }

    // Method to set status code
    status(code: number): this {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error('Can not set status after the headers have been sent to the client');

        this.raw.statusCode = code;
        return this;
    }

    // Method to set a header
    header(key: string, value: number | string | readonly string[]): this {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error('Can not set headers after they have been sent to the client');

        this.raw.setHeader(key, value);
        return this;
    }

    // Method to set the content type
    type(contentType: string): this {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error('Can not set content type after the headers have been sent to the client');

        return this.header('content-type', contentType);
    }

    // Method to set a cookie
    cookie(name: string, value: string = '', options: Cookie.SerializeOptions = {}): this {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error('Can not set cookie after the headers have been sent to the client');

        // Massage the options based on conditions...
        options = {
            httpOnly: true,                     // Default to httpOnly for security
            secure: this.request.isSecure,      // Default secure based on the request
            ...options,                         // Merge provided options

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
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error('Can not redirect after the headers have been sent to the client');

        this.status(code)
            .header('location', url)
            .end();

        // Log the redirection for debugging
        console.log(`Request redirecting to ${url}`);
    }

    // Method to serve a file by streaming it to the response
    file(path: string) {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error('Can not stream file after the headers have been sent to the client');

        // Check if the file exists and is a regular file
        if (!Fs.existsSync(path) || !Fs.statSync(path).isFile()) {
            return this.notFound();
        }

        // Get the file's statistics
        const stats = Fs.statSync(path);

        // Set the headers
        this.type(Mime.contentType(path) || 'application/octet-stream')
            .header('content-length', stats.size);

        // Stream the file to the response
        Fs.createReadStream(path).pipe(this.raw);
    }

    // Method to end the response
    end(body?: string | object): void {
        // Check that the response has not already fished
        if (this.finished) throw new Error('Can not end when the response has already finished');

        // Set the default body if the response is an error and no body is provided
        if (this.isError && !body) {
            body = {
                error: {
                    status: this.raw.statusCode,
                    message: this.error?.message
                }
            };

        }

        // Convert objects to a JSON string
        if (typeof body === 'object') {
            this.type('application/json');
            body = JSON.stringify(body);
        }

        this.raw.end(body);
    }

    // Method to set a 404 Not Found error response
    notFound(message: string = 'Not Found'): this {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error('Can not raise 404 after the headers have been sent to the client');

        this._error = { message: message };
        return this.status(404);
    }

    // Method to set a 500 Internal Server Error response
    serverError(error: unknown, message: string = 'Internal Server Error'): this {
        // Check that the headers have not already been sent
        if (this.headersSent) throw error;

        // We can not assume the error type, try and handle as best we can
        if (error instanceof Error) {
            this._error = { raw: error, message: message };
        } else {
            this._error = { raw: new Error(String(error)), message: message };
        }

        return this.status(500);
    }

}
