import {Entity, Column, Index} from 'typeorm';
import {TimestampedEntity} from './helpers';
import {IsEnum, IsString, IsInt, IsDate, IsOptional, Min, MaxLength} from 'class-validator';

export enum RateLimitScope {
  LOGIN_IP = 'LOGIN_IP',
  LOGIN_EMAIL = 'LOGIN_EMAIL',
  EMAIL_SEND_IP = 'EMAIL_SEND_IP',
  EMAIL_SEND_EMAIL = 'EMAIL_SEND_EMAIL',
  PASSWORD_RESET_IP = 'PASSWORD_RESET_IP',
  PASSWORD_RESET_EMAIL = 'PASSWORD_RESET_EMAIL',
}

export type RateLimitRule = {
  limit: number;
  blockLength: number; // ms
};

export const RATE_LIMIT_RULES: Record<RateLimitScope, RateLimitRule> = {
  LOGIN_IP: {limit: 5, blockLength: 60_000},
  LOGIN_EMAIL: {limit: 3, blockLength: 300_000},
  EMAIL_SEND_IP: {limit: 10, blockLength: 3_600_000},
  EMAIL_SEND_EMAIL: {limit: 5, blockLength: 600_000},
  PASSWORD_RESET_IP: {limit: 3, blockLength: 900_000},
  PASSWORD_RESET_EMAIL: {limit: 2, blockLength: 900_000},
};

@Entity()
@Index(['scope', 'key', 'windowStart', 'windowSeconds'], {unique: true})
export class RateLimitBucket extends TimestampedEntity {
  @Column('enum', {enum: RateLimitScope})
  @IsEnum(RateLimitScope)
  scope!: RateLimitScope;

  @Column('varchar', {length: 128})
  @IsString()
  @MaxLength(128)
  key!: string;

  @Column('datetime')
  @IsDate()
  windowStart!: Date;

  @Column('int')
  @IsInt()
  @Min(1)
  windowSeconds!: number;

  @Column('int', {default: 0})
  @IsInt()
  @Min(0)
  count!: number;

  @Column('datetime', {nullable: true})
  @IsOptional()
  @IsDate()
  blockedUntil?: Date | null;
}
