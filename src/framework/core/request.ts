// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { IncomingMessage, IncomingHttpHeaders } from 'http';

import * as Cookie from 'cookie';

import { Timer } from '../utils/timer';
import { Url, parseRequestUrl } from '../utils/urlUtils';

import { Response } from '../core/response';
import { AuthHandler } from '../auth';
import { DataHandler } from '../data';


// Interface for defining the request server access
interface RequestServerAccess {
    authHandler: AuthHandler;
    dataHandler: DataHandler;
}

// Class for our incoming request wrapper
export class Request {
    public readonly raw: IncomingMessage;                           // Raw incoming request
    private res!: Response;                                         // Our wrapped response to this request
    public readonly server: RequestServerAccess;                    // Our server access

    // Basic properties from the raw request
    public readonly method: string | undefined;
    public readonly httpVersion: string;

    // Framework properties
    public readonly timer: Timer;                                   // Timer to track request duration
    public readonly url: Url;                                       // Parsed URL
    public readonly isSecure: boolean;                              // Indicates if the request was made over HTTPS
    public readonly headers: IncomingHttpHeaders;                   // Header parameters
    public readonly params: { [key: string]: string } = {};         // Dynamic route parameters
    public readonly query: { [key: string]: string | string[] };    // Query string parameters
    public readonly cookies: Record<string, string | undefined>;    // Cookies, nom nom!

    // Initializes the request object
    constructor(rawReq: IncomingMessage, server: RequestServerAccess) {
        this.timer = new Timer();

        this.raw = rawReq;
        this.server = server;

        this.method = rawReq.method;
        this.httpVersion = rawReq.httpVersion;

        this.url = parseRequestUrl(rawReq);
        this.isSecure = this.url.protocol === 'https';
        this.headers = rawReq.headers;
        this.query = this.url.queryParams;
        this.cookies = rawReq.headers.cookie ? Cookie.parse(rawReq.headers.cookie) : {};

    }

    // Method to set the response reference for this request
    response(res: Response): void {
        this.res = res;
    }

    // Method to authenticate the request
    authenticate(strategy: string): boolean {
        return this.server.authHandler.authenticate(this, this.res, strategy);
    }

    // Get the data provider
    // The return type is generic but defaults to 'any' to allow flexibility
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    getDataProvider<T = any>(): T {
        return this.server.dataHandler.getDataProvider() as T;
    }

}
