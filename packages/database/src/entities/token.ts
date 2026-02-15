import type {Session} from './session';
import {TimestampedEntity} from './helpers';
import {IsString, IsEnum, IsDate, MinLength} from 'class-validator';
import {Entity, Column, OneToOne} from 'typeorm';

export enum TokenType {
  ACCESS = 'ACCESS',
  REFRESH = 'REFRESH',
}

@Entity()
export class Token extends TimestampedEntity {
  @OneToOne(() => require('./session').Session, (session: Session) => session.token)
  session!: Session;

  @Column('varchar', {unique: true})
  @IsString()
  @MinLength(1)
  jti!: string;

  @Column('varchar')
  @IsString()
  @MinLength(1)
  tokenHash!: string;

  @Column('enum', {enum: TokenType})
  @IsEnum(TokenType)
  type!: TokenType;

  @Column('datetime')
  @IsDate({message: 'expiresAt must be a valid Date'})
  expiresAt!: Date;

  // id, createdAt, updatedAt handled in TimestampedEntity
}
