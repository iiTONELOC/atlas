import type {List} from './list';
import {SoftDeleteEntity} from './helpers';
import type {Credentials} from './credentials';
import type {UserProduct} from './userProduct';
import {Entity, Column, OneToOne, OneToMany} from 'typeorm';
import {IsEnum, IsAlphanumeric, IsOptional, IsString} from 'class-validator';

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
  @IsString()
  @IsAlphanumeric()
  displayName: string | null = null;

  @OneToOne(
    () => require('./credentials').Credentials,
    (credentials: Credentials) => credentials.user,
    {cascade: true},
  )
  credentials!: Credentials;

  @OneToMany(() => require('./list').List, (list: List) => list.user)
  lists!: List[];

  @OneToMany(
    () => require('./userProduct').UserProduct,
    (userProduct: UserProduct) => userProduct.user,
  )
  userProducts!: UserProduct[];

  // id, createdAt, UpdatedAt, DeletedAt handled in SoftDeleteEntity
}
