// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Entity, Column,
    PrimaryColumn,
    UpdateDateColumn,
    ManyToOne, JoinColumn
} from 'typeorm';

import { User } from '../user';

@Entity()
export class UserLogin {
    @PrimaryColumn()
    userId!: number;

    @ManyToOne(() => User, user => user.id)
    @JoinColumn({ name: 'userId' })
    user!: User;

    @Column({ length: 255 })
    password!: string;

    @UpdateDateColumn()
    updatedAt!: Date;
}
