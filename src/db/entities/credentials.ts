import type {User} from './user';
import {IsEmail} from 'class-validator';
import {TimestampedEntity} from './helpers';
import {hashPassword} from '../../utils/hashing';
import {validatePassword} from '../../utils/password-check';
import {Entity, Column, OneToOne, BeforeInsert, BeforeUpdate} from 'typeorm';

// email and password for user authentication
@Entity()
export class Credentials extends TimestampedEntity {
  @Column('tinytext', {unique: true})
  @IsEmail({}, {message: 'Invalid email address'})
  email!: string;

  @Column('tinytext')
  password!: string;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (!this.password.startsWith('$argon2id$')) {
      await validatePassword(this.password);
      this.password = await hashPassword(this.password);
    }
  }

  @OneToOne(() => require('./user').User, (user: User) => user.credentials, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  user!: User;
}
