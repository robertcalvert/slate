// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Entity, Column,
    PrimaryGeneratedColumn,
    CreateDateColumn, UpdateDateColumn,
    ManyToOne, JoinColumn,
} from 'typeorm';

import { User } from '../user';

@Entity()
export class UserSession {
    @PrimaryGeneratedColumn('uuid')
    id!: string;

    @ManyToOne(() => User, (user) => user.id)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ nullable: true, length: 45 })
    ipAddress!: string;

    @Column({ nullable: true, length: 255 })
    userAgent!: string;

    @Column('json')
    scopes!: string[];

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;

    @Column({ nullable: true })
    closedAt!: Date;
}
