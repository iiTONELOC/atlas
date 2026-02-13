import {Repository} from 'typeorm';
import {validateEntity} from './validation';
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

    await validateEntity(populateBaseEntityFields(product));

    return this.repo.save(product);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}, relations: ['source']});
  }

  findByBarcode(barcode: string) {
    return this.repo.findOne({where: {barcode}, relations: ['source']});
  }

  findBySourceId(sourceId: string) {
    return this.repo.find({where: {source: {id: sourceId}}, relations: ['source']});
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

    await validateEntity(product);

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
