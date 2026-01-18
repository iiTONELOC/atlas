import {Entity, Column} from 'typeorm';
import {IsEnum, IsAlphanumeric, IsOptional} from 'class-validator';
import {SoftDeleteEntity} from './helpers';

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
  @IsEnum(AccountStatus, {message: 'Invalid account status'})
  accountStatus: AccountStatus = AccountStatus.PENDING;

  @Column('tinytext', {nullable: true, default: null})
  @IsOptional()
  @IsAlphanumeric(undefined, {message: 'Display name must be alphanumeric'})
  displayName: string | null = null;

  // id, CreatedAt, UpdatedAt, and DeletedAt are inherited from SoftDeleteEntity
}
