import {Repository} from 'typeorm';
import {UserProduct} from '../entities';

export type CreateUserProductRepoProps = {
  userId: string;
  productId: string;
  productAlias?: string;
};

export class UserProductRepository {
  constructor(private readonly repo: Repository<UserProduct>) {}

  create({userId, productId, productAlias}: CreateUserProductRepoProps) {
    const userProduct = this.repo.create({
      user: {id: userId},
      productData: {id: productId},
      productAlias,
    });
    return this.repo.save(userProduct);
  }

  findByUserId(userId: string) {
    return this.repo.find({where: {user: {id: userId}}, relations: ['productData']});
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
