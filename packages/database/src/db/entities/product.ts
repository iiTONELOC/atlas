import {Source} from './source';
import {Column, Entity, ManyToOne} from 'typeorm';
import {SoftDeleteEntity} from './helpers';
import {IsString, Length} from 'class-validator';

@Entity()
export class Product extends SoftDeleteEntity {
  // id, name, barcode, source, createdAt, updatedAt to be implemented

  @Column('tinytext')
  @IsString()
  @Length(3)
  name!: string;

  @Column('varchar', {length: 13, unique: true})
  @IsString()
  barcode!: string;

  @ManyToOne(() => Source, (source: Source) => source.products, {
    onDelete: 'SET NULL',
    onUpdate: 'CASCADE',
  })
  source!: Source | null;

  // id, createdAt, UpdatedAt, DeletedAt handled in SoftDeleteEntity
}
