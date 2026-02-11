import type {User} from './user';
import {Product} from './product';
import {SoftDeleteEntity} from './helpers';
import {IsOptional, IsString} from 'class-validator';
import {Entity, Column, ManyToOne} from 'typeorm';

@Entity()
export class UserProduct extends SoftDeleteEntity {
  @ManyToOne(() => require('./user').User, (user: User) => user.userProducts, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @ManyToOne(() => Product, {onDelete: 'RESTRICT', onUpdate: 'CASCADE'})
  productData!: Product;

  @Column('tinytext', {nullable: true, default: null})
  @IsOptional()
  @IsString()
  productAlias: string | null = null;

  // id, createdAt, UpdatedAt, DeletedAt handled in SoftDeleteEntity
}
