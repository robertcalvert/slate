// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Path from 'path';

// Define the extension name constant,
// determining the extension name based on the file extension of the current file
export const extname: string = Path.extname(__filename).toLowerCase();

// Define the srcpath constant,
// determining the path based on the file extension of the current file
export const srcpath: string = extname === '.ts' ? Path.resolve('src') : Path.resolve('dist');

// Function to remove the extension from a given path
export const stripExtension = (path: string): string => {
    return Path.join(Path.dirname(path), Path.basename(path, Path.extname(path)));
};
