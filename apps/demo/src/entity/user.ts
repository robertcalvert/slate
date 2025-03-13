// Copyright (c) Robert Calvert. All rights reserved.
// See LICENSE file in the project root for full license information.

import {
    Entity, Column,
    PrimaryGeneratedColumn,
    CreateDateColumn, UpdateDateColumn
} from 'typeorm';

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

    @CreateDateColumn()
    createdAt!: Date;

    @UpdateDateColumn()
    updatedAt!: Date;
}
