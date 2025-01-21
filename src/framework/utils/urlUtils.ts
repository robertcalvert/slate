// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { IncomingMessage } from 'http';
import { TLSSocket } from 'tls';

// Interface for breaking down a URL
export interface Url {
    readonly raw: URL;                                              // Raw URL
    readonly href: string;                                          // URL as a string (including protocol, host, etc.)
    readonly origin: string;                                        // Origin (protocol, host, and port)
    readonly protocol: string;                                      // Protocol (e.g., 'http' or 'https')
    readonly host: string | undefined;                              // Host including domain and port (if specified)
    readonly hostname: string;                                      // Hostname (e.g., 'example.com')
    readonly port: string;                                          // Port number (e.g., '80' or '443')
    readonly pathname: string | undefined;                          // Path section of the URL (e.g., '/path/to/resource')
    readonly queryString: string;                                   // Query string, including the '?' (e.g., '?id=123')
    readonly queryParams: { [key: string]: string | string[] };     // Query parameters as an object (key-value pairs)
    readonly hash: string;                                          // Fragment identifier (e.g., '#section1')
}

// Function to parse a URL string into a detailed breakdown
export function parseUrl(url: string): Url {
    // Create a new URL object by parsing the provided URL string
    const rawUrl = new URL(url);

    // Convert the search params into an object
    const queryParams: { [key: string]: string | string[] } = {};
    for (const [key, value] of rawUrl.searchParams.entries()) {
        // Normalize the key to lowercase to make it case insensitive
        // Although non-standard, this approach is more intuitive
        const normalizedKey = key.toLowerCase();

        // If the key already exists, push the new value to the array
        if (queryParams[normalizedKey]) {
            // Ensure the value is an array, otherwise convert it
            if (Array.isArray(queryParams[normalizedKey])) {
                (queryParams[normalizedKey] as string[]).push(value);
            } else {
                queryParams[normalizedKey] = [queryParams[normalizedKey] as string, value];
            }
        } else {
            // If the key does not exist, simply add it
            queryParams[normalizedKey] = value;
        }
    }

    // Return the detailed breakdown
    return {
        raw: rawUrl,
        href: rawUrl.href,
        origin: rawUrl.origin,
        protocol: rawUrl.protocol,
        host: rawUrl.host,
        hostname: rawUrl.hostname,
        port: rawUrl.port,
        pathname: rawUrl.pathname,
        queryString: rawUrl.search,
        queryParams: queryParams,
        hash: rawUrl.hash
    }

}

// Function to parse a request URL into a detailed breakdown
export function parseRequestUrl(rawReq: IncomingMessage): Url {
    // Build up the full URL and get the raw parsed URL
    const protocol = (rawReq.socket as TLSSocket).encrypted ? 'https' : 'http';
    const url = `${protocol}://${rawReq.headers.host}${rawReq.url}`;

    return parseUrl(url); // Return the parsed Url

}
