import type {List} from './list';
import {SoftDeleteEntity} from './helpers';
import {UserProduct} from './userProduct';
import {Entity, Column, ManyToOne} from 'typeorm';
import {IsString, IsNumber, IsOptional, IsBoolean} from 'class-validator';

@Entity()
export class ListItem extends SoftDeleteEntity {
  @ManyToOne(() => require('./list').List, (list: List) => list.items, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  list!: List;

  @ManyToOne(() => UserProduct, {
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  })
  product!: UserProduct;

  @Column('int', {default: 1})
  @IsNumber()
  quantity: number = 1;

  @Column('text', {nullable: true, default: null})
  @IsOptional()
  @IsString()
  notes: string | null = null;

  @Column('boolean', {default: false})
  @IsBoolean()
  isComplete: boolean = false;

  // id, createdAt, UpdatedAt, DeletedAt handled in SoftDeleteEntity
}
