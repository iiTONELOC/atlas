import type {User} from './user';
import type {ListItem} from './listItem';
import {SoftDeleteEntity} from './helpers';
import {IsString, IsBoolean, Length} from 'class-validator';
import {Entity, Column, ManyToOne, OneToMany} from 'typeorm';

@Entity()
export class List extends SoftDeleteEntity {
  @ManyToOne(() => require('./user').User, (user: User) => user.lists, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @Column('tinytext')
  @IsString()
  @Length(1, 255)
  name!: string;

  @OneToMany(() => require('./listItem').ListItem, (item: ListItem) => item.list)
  items!: ListItem[];

  @Column('boolean', {default: false})
  @IsBoolean()
  isDefault: boolean = false;

  // id, createdAt, UpdatedAt, DeletedAt handled in SoftDeleteEntity
}
