// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Disables ESLint rule for require imports
/* eslint-disable @typescript-eslint/no-require-imports */

// Register the compiler to enable require for templates
require('@marko/compiler/register');

import Path from 'path';

import merge from 'deepmerge';

import { Request, ViewProvider } from '@slate/slate';

// Interface defining the view provider options
export interface ViewProviderOptions {
    templates: string | string[];                               // Single path or array of paths to the the template files
    context?: (req: Request) => Marko.TemplateInput<object>;    // The global context
}

// Creates a view provider for the Marko templating engine
export function provider(options: ViewProviderOptions): ViewProvider {
    // Ensure the template paths are always an array
    const templates = Array.isArray(options.templates) ? options.templates : [options.templates];

    // Cache of loaded templates
    const cache: Record<string, Marko.Template<object>> = {};

    return {
        // The file extension of the template files
        ext: 'marko',

        // Method to render a view template
        render: (req, res, path, input?) => {
            let template: Marko.Template<object> | undefined;   // The loaded template

            // Check the cache first
            template = cache[path];

            if (!template) {
                // Try loading from the provided template paths
                for (let basePath of templates) {
                    basePath = Path.resolve(basePath);
                    const fullPath = Path.join(basePath, path);

                    try {
                        template = require(fullPath).default;   // Require the template
                        cache[path] = template!;                // Add to the cache
                        break;

                    } catch (error) {
                        const e = error as NodeJS.ErrnoException;
                        if (e.code === 'MODULE_NOT_FOUND') {
                            continue;       // Try the next templates path
                        } else {
                            throw error;    // Rethrow other errors
                        }

                    }
                }
            }

            // Check that we have loaded the template
            if (!template) throw new Error(`No Marko template found for path "${path}".`);

            // Apply the global context when needed
            if (options.context) {
                const context = options.context(req);
                input = input ? merge(context, input) : context;
            }

            // Stream the template to the response
            const stream = template.stream(input || {});
            res.stream(stream);
        }

    };
}
