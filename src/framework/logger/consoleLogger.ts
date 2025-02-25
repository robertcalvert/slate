// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Logger } from '.';

// The default console logger
export class ConsoleLogger implements Logger {
    // Color codes for different log levels
    private colors: Record<string, string> = {
        info: '\x1b[32m',   // Green
        warn: '\x1b[33m',   // Yellow
        error: '\x1b[31m',  // Red
        http: '\x1b[35m',   // Magenta
        debug: '\x1b[34m',  // Blue

        gray: '\x1b[90m',   // Gray (for timestamps)
        reset: '\x1b[0m'    // Reset color
    };

    // Get the current time in HH:MM:SS format
    private getTime(): string {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
    }

    // Internal log method that formats the log message with color and timestamp
    private log(level: string, message: any, ...meta: any[]): void {
        // Get the color associated with the log level
        const color = this.colors[level] || this.colors.reset;

        // Stringify object messages
        if (message && typeof message === 'object') {
            message = JSON.stringify(message);
        }

        // Format the log message with the level and timestamp
        const timestamp = `${this.colors.gray}${this.getTime()}${this.colors.reset}`;
        const formattedMessage = `[${color}${level.toUpperCase()}${this.colors.reset}] ${timestamp} ${message}`;

        // Conditionally log the message based on the log level
        switch (level) {
            case 'error':
                console.error(formattedMessage, ...meta.flat(Infinity));
                break;
            case 'warn':
                console.warn(formattedMessage, ...meta.flat(Infinity));
                break;
            case 'debug':
                console.debug(formattedMessage, ...meta.flat(Infinity));
                break;
            default:
                console.log(formattedMessage, ...meta.flat(Infinity));
                break;
        }
    }

    // Method to log an information message
    info(message: any, ...meta: any[]): void {
        this.log('info', message, meta);
    }

    // Method to log an warning message
    warn(message: any, ...meta: any[]): void {
        this.log('warn', message, meta);
    }

    // Method to log an error message
    error(message: any, ...meta: any[]): void {
        // If message is an error, then remove the stack prefix for a cleaner output
        if (message instanceof Error) {
            message = (message.stack || message.message).replace(/^Error:\s*/, '');
        }

        this.log('error', message, meta);
    }

    // Method to log a HTTP message
    http(message: any, ...meta: any[]): void {
        this.log('http', message, meta);
    }

    // Method to log a debug message
    debug(message: any, ...meta: any[]): void {
        this.log('debug', message, meta);
    }

}
