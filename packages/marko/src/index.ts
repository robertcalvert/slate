// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Disables ESLint rule for require imports
/* eslint-disable @typescript-eslint/no-require-imports */

// Register the compiler to enable require for templates
require('@marko/compiler/register');

import Path from 'path';

import { ViewProvider, PathUtils } from '@slate/slate';

// View provider implementation for the Marko templating engine
export const MarkoViewProvider: ViewProvider = {
    // Method to render a view template
    render: (res, path, input?) => {
        // Construct the full path to the template file
        path = Path.join(PathUtils.srcpath, 'view', path);

        // Dynamically require the template
        const template = require(path).default;

        // Create the stream
        const stream = template.stream(input);

        // Stream the template to the response
        res.stream(stream);
    }

};
