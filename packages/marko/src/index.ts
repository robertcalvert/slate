// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Disables ESLint rule for require imports
/* eslint-disable @typescript-eslint/no-require-imports */

// Register the compiler to enable require for templates
require('@marko/compiler/register');

import Path from 'path';

import merge from 'deepmerge';

import { Request, ViewProvider } from '@slate/slate';

// Interface defining the options
export interface MarkoViewProviderOptions {
    path: string;                                               // The path to the view files
    context?: (req: Request) => Marko.TemplateInput<object>;    // The global context
}

// View provider implementation for the Marko templating engine
export const MarkoViewProvider: ViewProvider<MarkoViewProviderOptions> = {
    // Method to render a view template
    render: (req, res, options, path, input?) => {
        // Construct the full path to the template file
        path = Path.join(options.path, path);

        // Dynamically require the template
        const template = require(path).default;

        // Apply the global context when needed
        if (options.context) {
            const context = options.context(req);
            input = input ? merge(context, input) : context;
        }

        // Create the stream
        const stream = template.stream(input);

        // Stream the template to the response
        res.stream(stream);
    }

};
