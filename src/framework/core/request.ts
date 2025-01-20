// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { IncomingMessage } from 'http';

import { Timer } from '../utils/timer';

// Class for our incoming request wrapper
export class Request {
    public readonly raw: IncomingMessage; // Raw HTTP request

    public readonly timer: Timer; // Timer to track request duration

    public readonly method: string | undefined;
    public readonly url: string | undefined;
    public readonly httpVersion: string;

    // Initializes the request object
    constructor(rawReq: IncomingMessage) {
        this.timer = new Timer();

        this.raw = rawReq;
        this.method = rawReq.method;
        this.url = rawReq.url;
        this.httpVersion = rawReq.httpVersion

    }

}
