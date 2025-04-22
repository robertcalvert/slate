// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Entity, Column,
    PrimaryColumn,
    ManyToMany, JoinTable
} from 'typeorm';

import { Scope } from './scope';

@Entity()
export class Role {
    @PrimaryColumn()
    id!: string;

    @Column({ length: 100 })
    label!: string;

    // A role can have many assigned scopes
    @ManyToMany(() => Scope)
    @JoinTable()
    scopes!: Scope[];
}
