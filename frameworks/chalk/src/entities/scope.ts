// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Entity,
    PrimaryColumn,
} from 'typeorm';

@Entity()
export class Scope {
    @PrimaryColumn()
    id!: string;
}
