import {Repository} from 'typeorm';
import {validate} from 'class-validator';
import {Product, Source} from '../entities';
import {populateBaseEntityFields} from '../entities/helpers';

export type CreateProductRepoProps = {
  name: string;
  barcode: string;
  sourceId?: string;
};

export type UpdateProductRepoProps = {
  name?: string;
  barcode?: string;
  sourceId?: string | null;
};

export class ProductRepository {
  constructor(private readonly repo: Repository<Product>) {}

  async create({name, barcode, sourceId}: CreateProductRepoProps) {
    const product = this.repo.create({
      name,
      barcode,
      source: {id: sourceId},
    });
    populateBaseEntityFields(product);

    const errors = await validate(product);
    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors
          .map(e => Object.values(e.constraints || {}))
          .flat()
          .join(', ')}`,
      );
    }

    return this.repo.save(product);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}, relations: ['source']});
  }

  findByBarcode(barcode: string) {
    return this.repo.findOne({where: {barcode}, relations: ['source']});
  }

  async update(id: string, {name, barcode, sourceId}: UpdateProductRepoProps) {
    const product = await this.repo.findOne({where: {id}});
    if (!product) {
      throw new Error('Product not found');
    }

    if (sourceId !== undefined && sourceId !== null) {
      product.source = {id: sourceId} as Source;
    }
    if (name !== undefined) {
      product.name = name;
    }
    if (barcode !== undefined) {
      product.barcode = barcode;
    }

    const errors = await validate(product);
    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors
          .map(e => Object.values(e.constraints || {}))
          .flat()
          .join(', ')}`,
      );
    }

    return this.repo.save(product);
  }

  async delete(id: string) {
    const product = await this.repo.findOne({where: {id}});
    if (!product) {
      throw new Error('Product not found');
    }
    return this.repo.softDelete(id);
  }
}
