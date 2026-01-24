// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import * as Bcrypt from 'bcryptjs';

// Password compare function
export const compare = (password: string, hash: string): Promise<boolean> => {
    return Bcrypt.compare(password, hash);
};

// Password hash function
export const hash = (password: string): Promise<string> => {
    return Bcrypt.hash(password, Bcrypt.genSaltSync());
};
