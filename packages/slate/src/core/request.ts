// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { IncomingMessage, IncomingHttpHeaders } from 'http';

import * as Cookie from 'cookie';
import * as Querystring from 'querystring';
import * as RequestIp from 'request-ip';

import Busboy from 'busboy';

import { Timer } from '../utils/timer';
import { Url, parseRequestUrl } from '../utils/urlUtils';

import { Logger } from '../logger';
import { Response } from '../core/response';
import { AuthHandler } from '../auth';
import { DataHandler } from '../data';
import { Route, Router } from '../router';

// Interface for defining the request server access
interface RequestServerAccess {
    readonly logger: Logger;
    readonly authHandler: AuthHandler;
    readonly dataHandler: DataHandler;
}

// Interface for defining the request auth properties
export interface RequestAuth {
    strategy?: string;                  // The authentication strategy used
    readonly isAuthenticated: boolean;  // Whether the request is authenticated
    scopes?: string[];                  // List of scopes granted for the request
    [key: string]: unknown;             // Allow custom properties
}

// Interface for defining the request client
interface RequestClient {
    readonly ip?: string;               // The IP address of the client making the request
    readonly userAgent?: string;        // The user-agent string of the client's browser or application
}

// Class for our incoming request wrapper
export class Request {
    public readonly raw: IncomingMessage;                           // Raw incoming request
    private res!: Response;                                         // Our wrapped response to this request
    private readonly server: RequestServerAccess;                   // Our server access

    // Basic properties from the raw request
    public readonly method: string;
    public readonly httpVersion: string;

    // Framework properties
    public readonly timer: Timer;                                   // Timer to track request duration
    public readonly url: Url;                                       // Parsed URL
    public readonly isSecure: boolean;                              // Indicates if the request was made over HTTPS
    public readonly headers: IncomingHttpHeaders;                   // Header parameters
    public readonly params: { [key: string]: string } = {};         // Dynamic route parameters
    public readonly query: { [key: string]: string | string[] };    // Query string parameters
    public readonly cookies: Record<string, string | undefined>;    // Cookies, nom nom!

    public router?: Router;                                         // The router that is handling the request
    public route?: Route;                                           // The route that is handling the request
    public auth: RequestAuth = { isAuthenticated: false };          // The auth properties for the request
    public readonly client: RequestClient;                          // The client properties for the request

    public readonly referer?: string;                               // The URL of the referring page

    // Payload properties
    public readonly type?: string;                                  // The content type of the request
    private _payload: unknown;                                      // The parsed request body

    // Initializes the request object
    constructor(rawReq: IncomingMessage, server: RequestServerAccess) {
        this.timer = new Timer();

        this.raw = rawReq;
        this.server = server;

        this.method = rawReq.method || 'GET';
        this.httpVersion = rawReq.httpVersion;

        this.url = parseRequestUrl(rawReq);
        this.isSecure = this.url.protocol === 'https';

        this.headers = rawReq.headers;
        this.query = this.url.queryParams;
        this.cookies = rawReq.headers.cookie ? Cookie.parse(rawReq.headers.cookie) : {};

        this.client = {
            ip: RequestIp.getClientIp(rawReq) || undefined,
            userAgent: this.headers['user-agent']
        };

        this.referer = this.headers['referer'];
        this.type = this.headers['content-type'];

    }

    // Method to retrieve the logger instance from the server
    get logger(): Logger {
        return this.server.logger;
    }

    // Method to get the payload of the request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get payload(): any {
        return this._payload;
    }

    // Method to set the response reference for this request
    response(res: Response): void {
        this.res = res;
    }

    // Method to authenticate the request
    async authenticate(strategy: string): Promise<boolean> {
        return this.server.authHandler.authenticate(this, strategy);
    }

    // Method to check if the request is authorized for a given scope
    isAuthorized(scope: string | string[]): boolean {
        // No need to validate if the request has no authorized scopes
        if (!this.auth.scopes || this.auth.scopes.length === 0) return false;

        // Ensure the scope is always an array
        const scopes = Array.isArray(scope) ? scope : [scope];

        // Store standard scopes to evaluate with 'OR' logic
        const orScopes: string[] = [];

        // Validate the scopes with prefix modifiers (+ or !)
        for (const s of scopes) {
            if (s.startsWith('+')) {
                if (!this.auth.scopes?.includes(s.slice(1))) return false;
            } else if (s.startsWith('!')) {
                if (this.auth.scopes?.includes(s.slice(1))) return false;
            } else {
                orScopes.push(s);
            }
        }

        // Validate the 'OR' scopes
        return orScopes.length === 0 || orScopes.some(s => this.auth.scopes?.includes(s));
    }

    // Method to parse the request body into a payload
    async parse(): Promise<void> {
        // Cannot parse if we do not have a route
        if (!this.route) return;

        // Check if the method allows a payload
        if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(this.method)) return;

        // Determine the content type
        // Default to JSON if no content type or default is provided
        const type = (this.type || this.route.payload?.defaultContentType || 'application/json').toLowerCase();

        // Determine the allowed content type(s)
        // Default to a set of common types if no allowed types are provided
        const allowed = Array.isArray(this.route.payload?.allowed)
            ? this.route.payload.allowed
            : this.route.payload?.allowed
                ? [this.route.payload.allowed]
                : [
                    'application/json',
                    'application/x-www-form-urlencoded',
                    'multipart/form-data'
                ];

        // Check that the content type is allowed
        if (!allowed.some(t => type.includes(t))) {
            this.res.unsupportedMediaType(allowed); // Unsupported Media Type
            return;                                 // Done
        }

        // Determine the maximum size (default: 1MB)
        const maxBytes = this.route.payload?.maxBytes || 1 * 1024 * 1024;

        // Track the total size of received data chunks
        let receivedBytes = 0;

        // Return a Promise to allow asynchronous processing
        return new Promise((resolve) => {
            if (type.includes('multipart/form-data')) {
                // Get the multipart limits from the route with sensible defaults
                const {
                    maxParts = Infinity,                    // Maximum total parts
                    maxFields = Infinity,                   // Maximum field parts
                    maxFiles = Infinity,                    // Maximum file parts
                    maxFieldNameBytes = 100,                // Maximum size of a single field name
                    maxFieldValueBytes = 1 * 1024 * 1024,   // Maximum size of a single field value (default: 1MB)
                    maxFileValueBytes = Infinity            // Maximum size of a single file (still limited by maxBytes)
                } = this.route?.payload?.multipart || {};

                // Try and initialize Busboy
                let busboy;
                try {
                    busboy = Busboy({
                        headers: this.headers,
                        limits: {
                            parts: maxParts,
                            fields: maxFields,
                            files: maxFiles,
                            fieldNameSize: maxFieldNameBytes,
                            fieldSize: maxFieldValueBytes,
                            fileSize: maxFileValueBytes
                        }
                    });

                } catch (error) {
                    this.logger.debug(error);   // Log the error
                    this.res.badRequest();      // Invalid or malformed data
                    resolve();                  // Done
                }

                // Payload object to store parsed fields and files
                const payload: Record<string, unknown> = {};

                // Helper function to set values on the payload object
                const setValue = (name: string, value: unknown) => {
                    // If the key already exists, push the new value as an array
                    if (payload[name]) {
                        payload[name] = Array.isArray(payload[name])
                            ? [...payload[name], value]
                            : [payload[name], value];
                    } else {
                        // If the key does not exist, simply add it
                        payload[name] = value;
                    }
                };

                // Event listener for regular form fields
                busboy!.on('field', (name, value, info) => {
                    // Validate the maximum size of the payload
                    receivedBytes += Buffer.byteLength(value);
                    if (receivedBytes > maxBytes) {
                        this.res.payloadTooLarge();     // Payload too large
                        resolve();                      // Done
                    }

                    // Validate the maximum size of the field
                    if (info.valueTruncated) {
                        this.res.payloadTooLarge();     // Payload too large
                        resolve();                      // Done
                    }

                    // Validate the maximum size of the field name
                    if (info.nameTruncated) {
                        this.res.badRequest();          // Invalid or malformed data
                        resolve();                      // Done
                    }

                    setValue(name, value);
                });

                // Event listener for file fields
                busboy!.on('file', (name, file, info) => {
                    const chunks: Buffer[] = [];

                    // Event listener for incoming data
                    file.on('data', (chunk: Buffer) => {
                        // Validate the maximum size of the payload
                        receivedBytes = chunk.length;
                        if (receivedBytes > maxBytes) {
                            this.res.payloadTooLarge();     // Payload too large
                            resolve();                      // Done
                        }

                        chunks.push(chunk);                 // Accumulate incoming chunks
                    });

                    // Event listener for when the file has been received
                    file.on('end', () => {
                        // Validate the maximum size of the file
                        if (file.truncated) {
                            this.res.payloadTooLarge();     // Payload too large
                            resolve();                      // Done
                        }

                        // Get the file value
                        const value = {
                            ...info,                        // Includes filename, encoding, mimeType
                            buffer: Buffer.concat(chunks)   // The raw data buffer
                        };

                        setValue(name, value);
                    });
                });

                // Event listener for the max parts limit being reached
                busboy!.on('partsLimit', () => {
                    this.res.payloadTooLarge();     // Payload too large
                    resolve();                      // Done
                });

                // Event listener for the max fields limit being reached
                busboy!.on('fieldsLimit', () => {
                    this.res.payloadTooLarge();     // Payload too large
                    resolve();                      // Done
                });

                // Event listener for the max files limit being reached
                busboy!.on('filesLimit', () => {
                    this.res.payloadTooLarge();     // Payload too large
                    resolve();                      // Done
                });

                // Ensure that errors during the parse are handled
                busboy!.on('error', () => {
                    this.res.badRequest();      // Invalid or malformed data
                    resolve();                  // Done
                });

                // When all fields and files are fully processed
                busboy!.on('finish', () => {
                    this._payload = payload;    // Set the payload
                    resolve();                  // Done
                });

                this.raw.pipe(busboy!);

            } else {
                const chunks: Buffer[] = [];

                // Event listener for incoming data
                this.raw.on('data', (chunk) => {
                    // Validate the maximum size of the payload
                    receivedBytes = chunk.length;
                    if (receivedBytes > maxBytes) {
                        this.res.payloadTooLarge();     // Payload too large
                        resolve();                      // Done
                    }

                    chunks.push(chunk);                 // Accumulate incoming chunks
                });

                // Event listener for when the request body has been received
                this.raw.on('end', () => {
                    // Try and parse the payload
                    if (chunks.length > 0) {
                        const data: string = Buffer.concat(chunks).toString();
                        try {
                            switch (true) {
                                case type.includes('application/json'):
                                    this._payload = JSON.parse(data);
                                    break;
                                case type.includes('application/x-www-form-urlencoded'):
                                    this._payload = Querystring.parse(data);
                                    break;

                                default:
                                    this._payload = data;
                                    break;

                            }

                        } catch (error) {
                            this.logger.debug(error);   // Log the error
                            this.res.badRequest();      // Invalid or malformed data
                        }

                    }

                    // Done
                    resolve();

                });
            }
        });
    }

    // Method to retrieve a data provider instance from the server
    // The return type is generic but defaults to 'any' to allow flexibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDataProvider<T = any>(name?: string): T {
        return this.server.dataHandler.getDataProvider(name) as T;
    }

}
