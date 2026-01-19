import {Entity, Column, OneToOne} from 'typeorm';
import {IsEnum, IsAlphanumeric, IsOptional} from 'class-validator';
import {SoftDeleteEntity} from './helpers';
import type {Credentials} from './credentials';

export enum AccountStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISABLED = 'DISABLED',
  PENDING = 'PENDING',
  DELETED = 'DELETED',
}

@Entity()
export class User extends SoftDeleteEntity {
  @Column('enum', {enum: AccountStatus, default: AccountStatus.PENDING})
  @IsEnum(AccountStatus)
  accountStatus: AccountStatus = AccountStatus.PENDING;

  @Column('tinytext', {nullable: true, default: null})
  @IsOptional()
  @IsAlphanumeric()
  displayName: string | null = null;

  @OneToOne(
    () => require('./credentials').Credentials,
    (credentials: Credentials) => credentials.user,
    {cascade: true},
  )
  credentials!: Credentials;
}
