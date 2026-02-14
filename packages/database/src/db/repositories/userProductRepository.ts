import {Repository} from 'typeorm';
import {UserProduct} from '../entities';
import {validateEntity} from './validation';
import {populateBaseEntityFields} from '../entities/helpers';

export type CreateUserProductRepoProps = {
  userId: string;
  productId: string;
  productAlias?: string;
};

export class UserProductRepository {
  constructor(private readonly repo: Repository<UserProduct>) {}

  async create({userId, productId, productAlias}: CreateUserProductRepoProps) {
    const userProduct = this.repo.create({
      user: {id: userId},
      productData: {id: productId},
      productAlias,
    });

    await validateEntity(populateBaseEntityFields(userProduct));
    return this.repo.save(userProduct);
  }

  async findByUserId(userId: string) {
    return this.repo.find({where: {user: {id: userId}}, relations: ['productData']});
  }

  async findById(id: string) {
    return this.repo.findOne({where: {id}, relations: ['user', 'productData']});
  }

  async update(id: string, {productAlias}: {productAlias?: string | null}) {
    const userProduct = await this.repo.findOne({where: {id}, relations: ['user', 'productData']});
    if (!userProduct) {
      throw new Error('UserProduct not found');
    }

    if (productAlias !== undefined) {
      userProduct.productAlias = productAlias;
    }

    await validateEntity(userProduct);
    return this.repo.save(userProduct);
  }

  async delete(id: string) {
    const userProduct = await this.repo.findOne({where: {id}});
    if (!userProduct) {
      throw new Error('UserProduct not found');
    }
    return this.repo.remove(userProduct);
  }
}

export const getUserProductRepository = (repo: Repository<UserProduct>) => {
  return new UserProductRepository(repo);
};
