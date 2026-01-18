import {IsDate, IsOptional, IsUUID} from 'class-validator';
import {
  BaseEntity,
  DeleteDateColumn,
  CreateDateColumn,
  UpdateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

export abstract class UUIDv4Entity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  @IsUUID(4, {message: 'ID must be a valid UUID v4'})
  id!: string;
}

export abstract class TimestampedEntity extends UUIDv4Entity {
  @CreateDateColumn()
  @IsDate({message: 'CreatedAt must be a valid Date'})
  createdAt!: Date;

  @UpdateDateColumn()
  @IsDate({message: 'UpdatedAt must be a valid Date'})
  updatedAt!: Date;
}

export abstract class SoftDeleteEntity extends TimestampedEntity {
  @DeleteDateColumn({nullable: true})
  @IsOptional()
  @IsDate({message: 'DeletedAt must be a valid Date'})
  deletedAt!: Date | null;
}
