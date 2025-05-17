// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Entity,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    ManyToOne, JoinColumn,
    ManyToMany, JoinTable
} from 'typeorm';

import { User } from '../user';
import { Scope } from '../scope';
import { ApiRole } from './role';

@Entity()
export class ApiKey {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @CreateDateColumn()
    createdAt!: Date;

    // An API key can have many assigned scopes
    @ManyToMany(() => Scope)
    @JoinTable()
    scopes!: Scope[];

    // An API key can have many assigned roles
    @ManyToMany(() => ApiRole)
    @JoinTable()
    roles!: ApiRole[];

}
