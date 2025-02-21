// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import https from 'https';

//Interface for defining the configuration
export interface Configuration {
    server: ServerConfiguration             // The server configuration
    [key: string]: unknown;                 // Allow custom properties
}

interface ServerConfiguration {
    host: string;                           // The hostname for the server
    port: number;                           // The port number on which the server will run
    ssl?: https.ServerOptions               // SSL options including certificates and keys etc.
}
