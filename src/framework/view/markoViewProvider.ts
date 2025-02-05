// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

// Disables ESLint rule for require imports
/* eslint-disable @typescript-eslint/no-require-imports */

// Register the compiler to enable rendering of templates
require('@marko/compiler/register');

import * as Path from 'path';

import { Response } from '../core/response';
import { ViewProvider } from '.';

import * as PathUtils from '../utils/pathUtils';

// View provider implementation for the Marko templating engine
export const MarkoViewProvider: ViewProvider = {
    // Method to render a view template
    render: (res: Response, path: string, input?: object) => {
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
