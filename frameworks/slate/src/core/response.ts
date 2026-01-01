// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Fs from 'fs';

import { ServerResponse, STATUS_CODES } from 'http';
import { OutgoingHttpHeaders } from 'http2';

import Crypto from 'crypto';

import * as Cookie from 'cookie';
import * as Mime from 'mime-types';

import { Logger } from '../logger';
import { Request } from '../core/request';
import { ViewHandler } from '../view';

// Interface for defining a response error
export interface ResponseError {
    readonly raw?: Error;
    readonly details?: object | string;
}

// Interface for defining the response server access
interface ResponseServerAccess {
    readonly logger: Logger;
    readonly viewHandler: ViewHandler;
}

// Interface for defining the response cache-control header
export interface ResponseCacheOptions {
    readonly private?: boolean;                     // Whether the response is specific to the user
    readonly public?: boolean;                      // Whether the response can be cached by shared caches
    readonly noStore?: boolean;                     // Whether to prevent storing the response in caches
    readonly noCache?: boolean;                     // Whether to require validation before using cached response
    readonly maxAge?: number;                       // Max age in seconds for the Cache-Control header
}

// Interface for defining the response security options
export interface ResponseSecurityOptions {
    noSniff?: boolean;                              // Specifies whether to prevent MIME type sniffing by browsers
    xFrame?: 'DENY' | 'SAMEORIGIN';                 // Controls whether the response can be embedded in an iframe
    referrer?:
    | 'no-referrer'                                 // No referrer information will be sent
    | 'no-referrer-when-downgrade'                  // Referrer will not be sent when downgrading from HTTPS to HTTP
    | 'same-origin'                                 // Referrer will only be sent for same-origin requests
    | 'origin'                                      // Only the origin part of the URL is sent as the referrer
    | 'strict-origin'                               // Referrer will be sent for same-origin requests; for cross-origin, only the origin is sent
    | 'origin-when-cross-origin'                    // Referrer will be sent as origin for cross-origin requests
    | 'strict-origin-when-cross-origin'             // Referrer will be sent as origin for cross-origin requests, only for secure requests
    | 'unsafe-url';                                 // Referrer will always be sent
}

// Class for our server response wrapper
export class Response {
    public readonly raw: ServerResponse;            // Raw server response
    private req!: Request;                          // Our wrapped request for which this response is for
    private readonly server: ResponseServerAccess;  // Our server access

    private cacheOptions?: ResponseCacheOptions;    // The response cache-control options

    private _error?: ResponseError;                 // The error related to this response

    // Initializes the response object
    constructor(rawRes: ServerResponse, server: ResponseServerAccess) {
        this.raw = rawRes;
        this.server = server;
    }

    // Method to retrieve the logger instance from the server
    get logger(): Logger {
        return this.server.logger;
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

    // Method to get the HTTP status message based on the status code
    get statusMessage(): string | undefined {
        return STATUS_CODES[this.raw.statusCode];
    }

    // Method to set the request for this response
    request(req: Request): void {
        this.req = req;
    }

    // Method to set status code
    status(code: number): this {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error(`Can not set status ${code} (${STATUS_CODES[code]}) after the headers have been sent to the client.`);

        this.raw.statusCode = code;
        return this;
    }

    // Method to set a header
    header(key: string, value: number | string | readonly string[]): this {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error(`Can not set header (${key}) after the headers have been sent to the client.`);

        this.raw.setHeader(key, value);
        return this;
    }

    // Method to set the content type
    type(contentType: string): this {
        return this.header('content-type', contentType);
    }

    // Method to set the cache control
    cache(options?: ResponseCacheOptions): this {
        // If we have options then we store them, as we do not want to set the
        // header until just before we begin writing the response
        if (options) {
            this.cacheOptions = options;        // Store the options for use later in the response

        } else if (this.cacheOptions) {
            const directives: string[] = [];    // Build up the directives for the header
            options = this.cacheOptions;        // Get the stored options

            // Only use the cache options when we have a successful response
            if (this.raw.statusCode === 200) {
                if (options.noStore) {
                    directives.push('no-store');
                } else {
                    if (options.public) directives.push('public');
                    if (options.private) directives.push('private');
                    if (options.noCache) directives.push('no-cache');
                    if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`);
                }
            } else {
                directives.push('no-store');    // Unsuccessful response, we do not want to cache
            }

            // Set the header when needed...
            if (directives.length) this.header('cache-control', directives.join(', '));

            this.cacheOptions = undefined;      // Clear the applied cache options
        }

        return this;
    }

    // Method to set the security headers
    security(options: ResponseSecurityOptions): this {
        if (options.noSniff) this.header('x-content-type-options', 'nosniff');
        if (options.xFrame) this.header('x-frame-options', options.xFrame);
        if (options.referrer) this.header('referrer-policy', options.referrer);

        return this;
    }

    // Method to set a cookie
    cookie(name: string, value: string = '', options: Cookie.SerializeOptions = {}): this {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error(`Can not set cookie (${name}) after the headers have been sent to the client.`);

        // Massage the options based on conditions...
        options = {
            httpOnly: true,                     // Default to httpOnly for security
            sameSite: 'lax',                    // Default to lax for CSRF protection
            secure: this.req.isSecure,          // Default secure based on the request
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
    // We use a 302 so that it is a temporary GET
    redirect(url: string, code: number = 302): this {
        // Set the status and header
        this.status(code)
            .header('location', url);

        // Log the redirection for debugging
        this.logger.http(`Request redirecting to ${url}`);

        return this;
    }

    // Method to pipe a stream to the response
    async stream(stream: NodeJS.ReadableStream): Promise<this> {
        // Check that the response has not already fished
        if (this.finished) throw new Error('Can not stream when the response has already finished.');

        // Return a promise that settles when the pipe completes
        return new Promise<this>((resolve, reject) => {
            // Ensure that errors during the stream are handled
            stream.on('error', (error) => {
                this.serverError(error);
                reject(error);
            });

            // Ensure the cache control header is set when needed
            stream.once('data', () => {
                this.cache();
            });

            // Resolve when streaming finishes
            stream.on('end', () => {
                resolve(this);
            });

            // Pipe the stream to the response
            stream.pipe(this.raw);
        });
    }

    // Method to serve a file by streaming it to the response
    async file(path: string): Promise<this> {
        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error('Can not stream file after the headers have been sent to the client.');

        // Check if the file exists and is a regular file
        if (!Fs.existsSync(path) || !Fs.statSync(path).isFile()) {
            return this.notFound();
        }

        // Get the file's statistics
        const stats = Fs.statSync(path);

        // Generate a strong ETag based on the file size and last modified time
        const etag = Crypto.createHash('md5')
            .update(`${stats.size}-${stats.mtimeMs}`)
            .digest('hex');

        // Check if the client ETag matches the generated ETag
        const ifNoneMatch = this.req.headers['if-none-match'];
        if (ifNoneMatch && ifNoneMatch === etag) return this.status(304); // Not Modified

        // Create the stream
        const stream = Fs.createReadStream(path);

        // Set the headers
        this.type(Mime.contentType(path) || 'application/octet-stream')
            .header('content-length', stats.size)
            .header('last-modified', stats.mtime.toUTCString())
            .header('etag', etag);

        // Stream the file to the response
        return this.stream(stream);
    }

    // Method to render a view to the response
    async view(path: string, input?: object): Promise<this> {
        this.type('text/html');
        await this.server.viewHandler.render(this.req, this, path, input);

        return this;
    }

    // Method to render an API to the response
    api(data: object): this {
        this.end({ data: data });
        return this;
    }

    // Method to end the response
    end(body?: string | object): void {
        // Check that the response has not already fished
        if (this.finished) throw new Error('Can not end when the response has already finished.');

        // Set the default body if the response is an error and no body is provided
        if (this.isError && !body) {
            body = {
                error: {
                    status: this.raw.statusCode,
                    message: this.statusMessage,
                    details: this.error?.details
                }
            };

        }

        // Convert objects to a JSON string
        if (typeof body === 'object') {
            this.type('application/json');
            body = JSON.stringify(body);
        }

        // Ensure the cache control header is set when needed
        this.cache();

        this.raw.end(body);
    }

    // Method to set a 400 Bad Request error response
    badRequest(details?: object | string): this {
        // Set the error details when needed
        if (details) this._error = { details: details };

        return this.status(400);
    }

    // Method to set a 401 Unauthorized error response
    unauthorized(): this {
        return this.status(401);
    }

    // Method to set a 403 Forbidden error response
    forbidden(): this {
        return this.status(403);
    }

    // Method to set a 404 Not Found error response
    notFound(): this {
        return this.status(404);
    }

    // Method to set a 405 Method Not Allowed error response
    methodNotAllowed(supportedMethods?: string[]): this {
        // Set the status
        this.status(405);

        // Set the header if supported methods are provided
        if (supportedMethods && supportedMethods.length > 0) {
            // Sort the methods alphabetically for consistency
            const sortedMethods = supportedMethods.sort().join(', ');
            this.header('allow', sortedMethods);
        }

        return this;
    }

    // Method to set a 415 Unsupported Media Type error response
    unsupportedMediaType(supportedMediaTypes?: string[]): this {
        // Set the status
        this.status(415);

        // Set the header if supported media types are provided
        if (supportedMediaTypes && supportedMediaTypes.length > 0) {
            // Determine the appropriate header based on the request method
            let name: string | null = null;
            if (this.req.method === 'POST') {
                name = 'accept-post';
            } else if (this.req.method === 'PATCH') {
                name = 'accept-patch';
            }

            // Set the header with the supported media types
            if (name) this.header(name, supportedMediaTypes.join(', '));
        }

        return this;
    }

    // Method to set a 413 Payload Too Large error response
    payloadTooLarge(): this {
        return this.status(413);
    }

    // Method to set a 503 Service Unavailable error response
    serviceUnavailable(): this {
        return this.status(503);
    }

    // Method to set a 500 Internal Server Error response
    serverError(error: unknown, details?: string): this {
        // We can not assume the error type, try and handle as best we can
        if (error instanceof Error) {
            this._error = { raw: error, details: details };
        } else {
            this._error = { raw: new Error(String(error)), details: details };
        }

        // Set the status only if headers have not been sent
        return (this.headersSent) ? this : this.status(500);
    }

}
