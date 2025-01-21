// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { IncomingMessage, IncomingHttpHeaders } from 'http';
import * as Cookie from 'cookie'

import { Timer } from '../utils/timer';
import { Url, parseRequestUrl } from '../utils/urlUtils';

// Class for our incoming request wrapper
export class Request {
    // Basic properties from the raw request
    public readonly method: string | undefined;
    public readonly httpVersion: string;

    // Framework properties
    public readonly timer: Timer;                                   // Timer to track request duration
    public readonly raw: IncomingMessage;                           // Raw HTTP request
    public readonly url: Url;                                       // Parsed URL
    public readonly headers: IncomingHttpHeaders;                   // Header parameters
    public readonly params: { [key: string]: string } = {};         // Dynamic route parameters
    public readonly query: { [key: string]: string | string[] };    // Query string parameters
    public readonly cookies: Record<string, string | undefined>;    // Cookies, nom nom!

    // Initializes the request object
    constructor(rawReq: IncomingMessage) {
        this.timer = new Timer();

        this.method = rawReq.method;
        this.httpVersion = rawReq.httpVersion;

        this.raw = rawReq;
        this.url = parseRequestUrl(rawReq);
        this.headers = rawReq.headers;
        this.query = this.url.queryParams;
        this.cookies = rawReq.headers.cookie ? Cookie.parse(rawReq.headers.cookie) : {};

    }

}
