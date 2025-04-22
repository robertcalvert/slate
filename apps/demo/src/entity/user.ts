// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Entity, Column,
    PrimaryGeneratedColumn,
    CreateDateColumn, UpdateDateColumn,
    ManyToMany, JoinTable
} from 'typeorm';

import { Scope } from './scope';
import { UserRole } from './user/role';

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ length: 50 })
    firstName!: string;

    @Column({ length: 50 })
    lastName!: string;

    @Column({ length: 255, unique: true })
    email!: string;

    // A user can have many assigned scopes
    @ManyToMany(() => Scope)
    @JoinTable()
    scopes!: Scope[];

    // A user can have many assigned roles
    @ManyToMany(() => UserRole)
    @JoinTable()
    roles!: UserRole[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
