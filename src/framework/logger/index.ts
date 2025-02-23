// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { ConsoleLogger } from './consoleLogger';

// Logger interface defining the methods for each log level
export interface Logger {
    error(message: any, ...meta: any[]): void;
    warn(message: any, ...meta: any[]): void;
    info(message: any, ...meta: any[]): void;
    http(message: any, ...meta: any[]): void;
    debug(message: any, ...meta: any[]): void;
}

// Class to handle logging
export class LoggerHandler implements Logger {
    // The logger instance that handles the actual logging
    private logger: Logger;

    // Default to using our console logger
    constructor() {
        this.logger = new ConsoleLogger();
    }

    // Method to set a custom logger instance
    use(logger: Logger): void {
        this.logger = logger;
    }

    // Method to log an information message
    info(message: any, ...meta: any[]): void {
        this.logger.info(message, meta);
    }

    // Method to log an warning message
    warn(message: any, ...meta: any[]): void {
        this.logger.warn(message, meta);
    }

    // Method to log an error message
    error(message: any, ...meta: any[]): void {
        this.logger.error(message, meta);
    }

    // Method to log a HTTP message
    http(message: any, ...meta: any[]): void {
        this.logger.http(message, meta);
    }

    // Method to log a debug message
    debug(message: any, ...meta: any[]): void {
        this.logger.debug(message, meta);
    }


}
