// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

import * as Marko from '@slate/marko';

// Options for the Marko view provider
const options: Marko.ViewProviderOptions = {
    path: Path.join(__dirname, '../views'),     // The path to the views files

    // Method to get the global context
    context: (req) => {
        return {
            $global: {
                auth: req.auth                  // Include the request authentication
            }
        };
    }
};

export default options;
