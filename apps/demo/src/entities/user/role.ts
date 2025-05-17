// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Entity, Column,
    PrimaryColumn,
    CreateDateColumn, UpdateDateColumn,
    ManyToMany, JoinTable
} from 'typeorm';

import { Scope } from '../scope';

@Entity()
export class UserRole {
    @PrimaryColumn()
    id!: string;

    @Column({ length: 100 })
    label!: string;

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    // A user role can have many assigned scopes
    @ManyToMany(() => Scope)
    @JoinTable()
    scopes!: Scope[];
}
