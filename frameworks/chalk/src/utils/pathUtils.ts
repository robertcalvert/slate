// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

// Application base directory, the folder that contains the entry script that started the process
export const appBaseDir: string = Path.dirname(require.main!.filename);

// Chalk base directory, the folder that contains the current module
export const chalkBaseDir: string = Path.join(__dirname, '..');
