// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { IncomingMessage, IncomingHttpHeaders } from 'http';

import * as Cookie from 'cookie';
import * as Querystring from 'querystring';
import * as RequestIp from 'request-ip';

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
    readonly isAuthenticated: boolean;  // Whether the request is authenticated
    strategy?: string;                  // The authentication strategy used
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
    public readonly server: RequestServerAccess;                    // Our server access

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
    public client: RequestClient;                                   // The client properties for the request

    // Body properties
    public readonly type?: string;                                  // The content type of the request
    private _body: string = '';                                     // Raw body
    private _payload: unknown;                                      // Parsed body

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

    // Method to begin parsing the request body into a payload
    parse() {
        // Dummy listener to ensure end can be handled later in the pipeline
        this.raw.once('data', () => { });

        // Does the request method accept a body...
        if (!['POST', 'PUT', 'PATCH'].includes(this.method)) return;

        // Accumulate incoming data chunks
        this.raw.on('data', (chunk) => {
            this._body += chunk.toString();
        });

        this.raw.on('end', () => {
            // Dose the request have a content type...
            if (!this.type) {
                if (this._body.length > 0) this.res.badRequest();   // Bad Request
                return;                                             // Nothing to validate
            }

            // Try and parse the payload
            try {
                switch (true) {
                    case this.type.includes('application/json'):
                        this._payload = JSON.parse(this._body);
                        break;
                    case this.type.includes('application/x-www-form-urlencoded'):
                        this._payload = Querystring.parse(this._body);
                        break;
                }
            } catch {
                return this.res.badRequest(); // Invalid or malformed data
            }

        });

    }

    // Method to retrieve the data provider instance from the server
    // The return type is generic but defaults to 'any' to allow flexibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDataProvider<T = any>(): T {
        return this.server.dataHandler.getDataProvider() as T;
    }

}
