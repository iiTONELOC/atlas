import {Product} from './product';
import {SoftDeleteEntity} from './helpers';
import {IsString, IsUrl} from 'class-validator';
import {Entity, Column, OneToMany} from 'typeorm';

export enum SourceName {
  BARCODE_INDEX = 'BARCODE_INDEX',
  UPC_ITEM_DB = 'UPC_ITEM_DB',
  BARCODE_SPIDER = 'BARCODE_SPIDER',
  USER_ENTERED = 'USER_ENTERED',
}

@Entity()
export class Source extends SoftDeleteEntity {
  @Column('enum', {enum: SourceName})
  name!: SourceName;

  @Column('tinytext')
  @IsString()
  @IsUrl()
  url!: string;

  @OneToMany(() => Product, product => product.source)
  products!: Product[];

  // id, createdAt, UpdatedAt, DeletedAt handled in SoftDeleteEntity
}
