// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Fs from 'fs';

import { ServerResponse, STATUS_CODES } from 'http';
import { OutgoingHttpHeaders } from 'http2';

import * as Cookie from 'cookie';
import * as Mime from 'mime-types';

import { ServerOptions } from '../server';
import { Logger } from '../logger';
import { Request } from '../core/request';
import { ViewHandler } from '../view';
import { CorsOptions } from '../core/cors';

// Interface for defining a response error
export interface ResponseError {
    readonly raw?: Error;
    readonly details?: object | string;
}

// Interface for defining the response server access
interface ResponseServerAccess {
    readonly options?: ServerOptions;
    readonly logger: Logger;
    readonly viewHandler: ViewHandler;
}

// Interface for defining the response cache-control header
export interface ResponseCacheOptions {
    readonly noStore?: boolean;                     // Prevent storing the response in any caches (client or shared)
    readonly visibility?: 'private' | 'public';     // Whether the response is specific to a single user or can be cached by shared caches
    readonly noCache?: boolean;                     // Require caches to revalidate the response before using it
    readonly maxAge?: number;                       // Maximum age in seconds for the cache
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

    private corsOptions?: CorsOptions;              // The response Cross-Origin Resource Sharing (CORS) options
    private isCorsAllowed: boolean = false;         // True if the request origin passed the CORS policy checks

    private _error?: ResponseError;                 // The error related to this response

    // Initializes the response object
    constructor(rawRes: ServerResponse, server: ResponseServerAccess) {
        this.raw = rawRes;
        this.server = server;

        // Set CORS headers for the response based on the server configuration
        // These will only be applied once the response begins, and can be overridden
        if (server.options?.cors) this.cors(server.options.cors as CorsOptions);
    }

    // Method to retrieve the logger instance from the server
    get logger(): Logger {
        return this.server.logger;
    }

    // Method to check if the response has started
    get started(): boolean {
        return this.headersSent || this.finished;
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
            return this;
        }

        // Get the stored options
        options = this.cacheOptions;

        // No options stored, fallback to no-store
        if (!options) {
            if (!this.headers['cache-control']) this.header('cache-control', 'no-store');
            return this;
        }

        // Build up the directives for the header
        const directives: string[] = [];

        // Only apply caching for successful responses
        if (this.raw.statusCode === 200 || this.raw.statusCode === 304) {
            if (options.noStore) {
                directives.push('no-store');
            } else {
                if (options.visibility) directives.push(options.visibility);
                if (options.noCache) directives.push('no-cache');
                if (options.maxAge !== undefined) directives.push(`max-age=${options.maxAge}`);
            }
        }

        // Set the header, fallback to no-store if no directives
        this.header('cache-control', directives.length > 0 ? directives.join(', ') : 'no-store');

        // Prevent the options from being applied again
        this.cacheOptions = undefined;

        return this;
    }

    // Method to set the security headers
    security(options: ResponseSecurityOptions): this {
        if (options.noSniff) this.header('x-content-type-options', 'nosniff');
        if (options.xFrame) this.header('x-frame-options', options.xFrame);
        if (options.referrer) this.header('referrer-policy', options.referrer);

        return this;
    }

    // Method to set the CORS options for the response
    cors(options: CorsOptions): this {
        // Store the options, we do not want to set the headers
        // until just before we begin writing the response
        this.corsOptions = options;

        return this;
    }

    // Method to set the CORS headers based on the options
    private applyCors() {
        // No options means CORS not enabled
        const options = this.corsOptions;
        if (!options) return this;

        // CORS is not allowed by default
        this.isCorsAllowed = false;

        // If we have no origin header then this is not a CORS request
        const origin = this.req.cors?.origin;
        if (!origin) return this;

        // Normalize for comparison
        const normalizedOrigin = origin.toLowerCase();

        // Determine allowed origin
        let allowOrigin: string | undefined;

        if (options.origin === '*') {
            allowOrigin = options.credentials ? origin : '*';
        }
        else if (typeof options.origin === 'string') {
            if (options.origin.toLowerCase() === normalizedOrigin) {
                allowOrigin = origin;
            }
        }
        else if (Array.isArray(options.origin)) {
            const origins = options.origin.map(o => o.toLowerCase());
            const wildcard = origins.includes('*');

            if (wildcard) {
                allowOrigin = options.credentials ? origin : '*';
            } else if (origins.includes(normalizedOrigin)) {
                allowOrigin = origin;
            }
        }

        // Origin not allowed
        if (!allowOrigin) return this;

        this.header('access-control-allow-origin', allowOrigin);

        // Dynamic origins must vary on origin to avoid cache poisoning
        if (allowOrigin !== '*') this.header('vary', 'origin');

        // Credentials
        if (options.credentials) this.header('access-control-allow-credentials', 'true');

        // Exposed headers are only relevant on actual responses, not preflight
        if (!this.req.cors?.isPreflight && options.exposedHeaders?.length) {
            this.header('access-control-expose-headers', options.exposedHeaders.join(', '));
        }

        // Flag the request as allowed
        this.isCorsAllowed = true;

        // Prevent the options from being applied again
        this.corsOptions = undefined;
    }

    // Method to set an OPTIONS response
    options(allowedMethods: string[]): this {
        if (this.req.method !== 'OPTIONS') return this;

        // Get the CORS options
        const options = this.corsOptions;

        // Apply CORS headers and determine whether the request origin is allowed
        this.applyCors();

        // Determine whether this is a CORS preflight or a standard OPTIONS request
        const isPreflight =
            options &&
            this.isCorsAllowed &&
            this.req.cors?.isPreflight;

        // Handle standard OPTIONS
        if (!isPreflight) {
            this.allow(allowedMethods);
            return this.status(204);
        }

        // Set the allowed methods
        this.allow(allowedMethods, 'access-control-allow-methods');

        // Use configured headers, otherwise reflect those requested by the client
        const allowHeaders =
            options.allowedHeaders?.join(', ') ??
            this.req.cors?.requestHeaders;

        if (allowHeaders) this.header('access-control-allow-headers', allowHeaders);

        // Allow the preflight result to be cached by the browser
        if (options.maxAge) this.header('access-control-max-age', options.maxAge);

        return this.status(200);
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
    // We default to 302 so that it is a temporary GET
    redirect(url: string, code: number = 302): this {
        // Set the status and header
        this.status(code)
            .header('location', url);

        // Log the redirection for debugging
        this.logger.http(`Request redirecting to ${url}`);

        return this;
    }

    // Method to set the allow header
    private allow(methods: string[], name: string = 'allow') {
        // Check that we have allowed methods
        if (methods.length === 0) throw new Error(`${name} header requires at least one method.`);

        let allow = new Set(methods);

        // Resolve wildcard into framework supported methods
        if (allow.has('*')) allow = new Set(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']);

        // If GET is allowed, HEAD is implicitly allowed
        if (allow.has('GET')) allow.add('HEAD');

        // OPTIONS is always allowed
        allow.add('OPTIONS');

        // Sort the methods alphabetically for consistency
        const sorted = [...allow].sort().join(', ');

        return this.header(name, sorted);
    }

    // Method to write to the response
    async write(chunk: unknown): Promise<this> {
        // Check that the response has not already finished
        if (this.finished) throw new Error('Cannot write after the response has finished.');

        // Ensure the cache control header is set when needed
        this.cache();

        // Ensure the CORS headers are set when needed
        this.applyCors();

        // Return a promise that settles when the write completes
        return new Promise<this>((resolve, reject) => {
            // Helper that cleans up listeners and either resolves or rejects
            const finish = (error?: Error) => {
                this.raw.off('error', onError);
                this.raw.off('close', onClose);
                this.raw.off('aborted', onAborted);
                this.raw.off('drain', onDrain);

                if (error) reject(error);
                else resolve(this);
            };

            // Ensure that errors during the write are handled
            const onError = (error: Error) => finish(error);
            this.raw.once('error', onError);

            // Handle the socket closing before the write finishes
            const onClose = () => finish(new Error('Response closed before write could complete.'));
            this.raw.once('close', onClose);

            // Handle the client aborting the request
            const onAborted = () => finish(new Error('Response aborted by client.'));
            this.raw.once('aborted', onAborted);

            // Handle the buffer being full
            const onDrain = () => finish();

            // Do the actual write
            const flushed = this.raw.write(chunk, (error) => error && finish(error));

            // Wait for drain when not flushed
            if (!flushed) this.raw.once('drain', onDrain);
            else finish();
        });
    }

    // Method to pipe a stream to the response
    async stream(stream: NodeJS.ReadableStream): Promise<this> {
        // Check that the response has not already finished
        if (this.finished) throw new Error('Can not stream after the response has finished.');

        // Return a promise that settles when the pipe completes
        return new Promise<this>((resolve, reject) => {
            // Ensure that errors during the stream are handled
            stream.on('error', (error) => {
                this.serverError(error);
                reject(error);
            });

            // Ensure any pending headers are set when needed
            stream.once('data', () => {
                this.cache();
                this.applyCors();
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
        // Check that the response has not already finished
        if (this.finished) throw new Error('Can not stream file after the response has finished.');

        // Check that the headers have not already been sent
        if (this.headersSent) throw new Error('Can not stream file after the headers have been sent to the client.');

        // Check if the file exists and is a regular file
        if (!Fs.existsSync(path) || !Fs.statSync(path).isFile()) {
            return this.notFound();
        }

        // Get the file's statistics
        const stats = Fs.statSync(path);

        // Generate a strong ETag based on the file size and last modified time
        const etag = `"${stats.size}-${Math.floor(stats.mtimeMs)}"`;

        // Check if the client ETag matches the generated ETag
        const ifNoneMatch = this.req.headers['if-none-match'];
        if (ifNoneMatch) {
            // Wildcard means any current representation matches
            if (ifNoneMatch.trim() === '*') return this.status(304); // Not Modified

            // Normalize ETags for comparison
            const normalize = (tag: string) =>
                tag.trim()
                    .replace(/^W\//, '')      // Remove weak prefix
                    .replace(/^"|"$/g, '');   // Remove surrounding quotes

            const currentETag = normalize(etag);

            // Compare against list of client ETags (simplified weak comparison)
            const requestETags = ifNoneMatch
                .split(',')
                .map(normalize)
                .filter(Boolean);

            // Check for a match
            if (requestETags.includes(currentETag)) return this.status(304); // Not Modified
        }

        // Set the headers
        this.type(Mime.contentType(path) || 'application/octet-stream')
            .header('content-length', stats.size)
            .header('last-modified', stats.mtime.toUTCString())
            .header('etag', etag);

        // Create the stream
        const stream = Fs.createReadStream(path);

        // Stream the file to the response
        return this.stream(stream);
    }

    // Method to render a view to the response
    async view(path: string, input?: object): Promise<this> {
        this.type('text/html');
        await this.server.viewHandler.render(this.req, this, path, input);

        return this;
    }

    // Method to render JSON to the response
    json(payload: object): this {
        this.end(payload);
        return this;
    }

    // Method to end the response
    end(chunk?: unknown): void {
        // Check that the response has not already finished
        if (this.finished) throw new Error('Can not end after the response has finished.');

        // Use a default error response when in error and the response is empty
        if (!chunk && this.isError && !this.started) {
            // Intentionally minimal and intended as a fallback only
            // Applications should override as needed...
            const defaultError = {
                status: this.raw.statusCode,        // HTTP status code
                error: {
                    message: this.statusMessage,    // Human readable error message
                    details: this.error?.details    // Optional error details
                }
            };
            this.json(defaultError);
            return;
        }

        // Convert objects to a JSON string
        if (typeof chunk === 'object') {
            this.type('application/json');
            chunk = JSON.stringify(chunk);
        }

        // Ensure the cache control header is set when needed
        this.cache();

        // Ensure the CORS headers are set when needed
        this.applyCors();

        this.raw.end(chunk);
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
    methodNotAllowed(allowedMethods: string[]): this {
        return this.status(405).allow(allowedMethods);
    }

    // Method to set a 415 Unsupported Media Type error response
    unsupportedMediaType(supportedMediaTypes: string[]): this {
        // Set the status
        this.status(415);

        // Set the header if supported media types are provided
        if (supportedMediaTypes.length > 0) {
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
