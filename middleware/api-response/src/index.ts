// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import { Request, Response, Middleware } from '@slate/slate';

// Type defining the options for the middleware
export type ApiResponseOptions = {
    meta?: Record<string, unknown>;                                                 // Static metadata that will be merged into every response
    onSend?: (req: Request, res: Response, payload: ApiResponsePayload) => void;    // Hook that runs before the JSON is sent
}

// Defines a base response shape
interface ApiBasePayload {
    meta?: Record<string, unknown>;                             // Miscellaneous metadata
}

// Defines a success response shape
export interface ApiPayload extends ApiBasePayload {
    message?: string;                                           // Human readable message
    data?: unknown;                                             // The actual payload
}

// Defines a error response shape
interface ApiErrorPayload extends ApiBasePayload {
    error: {
        message: string;                                        // Human readable error message
        details?: unknown;                                      // Optional error details
    };
}

// Defines a payload that is either success or error
type ApiResponsePayload = ApiPayload | ApiErrorPayload;

// Extend the existing Response with an API helper
declare module '@slate/slate' {
    interface Response {
        api: (payload: ApiPayload) => Response;                 // Note that we only allow success payloads
    }
}

// Middleware to add a helper to the response and ensures that an error payload is handled automatically
export function mw(options?: ApiResponseOptions): Middleware {
    return (req, res: Response, next) => {
        // Attach the helper
        res.api = (payload): Response => {
            if (options?.onSend) options.onSend(req, res, payload);
            const body = buildBody(payload, options);
            return res.json(body);
        };

        // Preserve original end method
        const originalEnd = res.end.bind(res);

        // Wrap end to handle empty error responses
        res.end = (chunk: unknown): void => {
            // Use a default error response when in error and the response is empty
            if (!chunk && res.isError && !res.started) {
                const defaultError: ApiErrorPayload = {
                    error: {
                        message: res.statusMessage ?? 'Unknown Error',
                        details: res.error?.details
                    }
                };
                res.api(defaultError);
                return;
            }

            // Else, hand back to the original response handler
            return originalEnd(chunk);
        };

        return next(); // Pass to the next middleware

    };

}

// Helper function to format the response payload
function buildBody(payload: ApiResponsePayload, options?: ApiResponseOptions) {
    // Determine the status
    const status = 'error' in payload ? 'error' : 'success';

    // Build the response body
    return {
        status,
        message: 'message' in payload ? payload.message : undefined,
        data: 'data' in payload ? payload.data : undefined,
        error: 'error' in payload ? payload.error : undefined,
        meta: {
            ...(payload.meta ?? {}),
            ...options?.meta
        }
    };
}
