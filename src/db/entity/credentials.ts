import {Entity, Column, BeforeInsert, BeforeUpdate, OneToOne, JoinColumn} from 'typeorm';
import {IsEmail} from 'class-validator';
import {TimestampedEntity} from './helpers';
import {hashPassword} from '../../utils/hashing';
import {validatePassword} from '../../utils/password-check';
import {User} from './user';

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
    if (!this.password.startsWith('$2b$')) {
      await validatePassword(this.password);
      this.password = await hashPassword(this.password);
    }
  }

  @OneToOne(() => User, user => user.credentials, {onDelete: 'CASCADE'})
  @JoinColumn({name: 'userId', referencedColumnName: 'id'})
  user!: User;
}
