import type {User} from './user';
import type {Token} from './token';
import {TimestampedEntity} from './helpers';
import {IsString, IsBoolean, IsDate, IsIP, Length} from 'class-validator';
import {Entity, Column, ManyToOne, OneToOne} from 'typeorm';

@Entity()
export class Session extends TimestampedEntity {
  @ManyToOne(() => require('./user').User, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user!: User;

  @OneToOne(() => require('./token').Token, (token: Token) => token.session, {
    cascade: true,
  })
  token!: Token;

  @Column('datetime')
  @IsDate({message: 'expiresAt must be a valid Date'})
  expiresAt!: Date;

  @Column('boolean', {default: false})
  @IsBoolean()
  isRevoked: boolean = false;

  @Column('tinytext')
  @IsString()
  @Length(1, 255)
  userAgent!: string;

  @Column('varchar', {length: 45})
  @IsIP()
  ipAddress!: string;

  // id, createdAt, updatedAt handled in TimestampedEntity
}
