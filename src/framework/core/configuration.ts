// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

//Interface for defining the configuration
export interface Configuration {
    server: {
        host: string;   // The hostname for the server
        port: number;   // The port number on which the server will run
    }
}
