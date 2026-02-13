import {Repository} from 'typeorm';
import {List} from '../entities';

export type CreateListRepoProps = {
  name: string;
  userId: string;
  isDefault?: boolean;
};

export type UpdateListRepoProps = {
  name?: string;
  isDefault?: boolean;
};

export class ListRepository {
  constructor(private readonly repo: Repository<List>) {}

  create({name, userId, isDefault = false}: CreateListRepoProps) {
    const list = this.repo.create({
      name,
      isDefault,
      user: {id: userId},
    });
    return this.repo.save(list);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}, relations: ['user', 'items']});
  }

  findByUserId(userId: string) {
    return this.repo.find({where: {user: {id: userId}}, relations: ['items']});
  }

  async update(id: string, {name, isDefault}: UpdateListRepoProps) {
    const list = await this.repo.findOne({where: {id}});
    if (!list) {
      throw new Error('List not found');
    }

    if (name !== undefined) {
      list.name = name;
    }
    if (isDefault !== undefined) {
      list.isDefault = isDefault;
    }

    return this.repo.save(list);
  }

  async delete(id: string) {
    const list = await this.repo.findOne({where: {id}});
    if (!list) {
      throw new Error('List not found');
    }
    return this.repo.remove(list);
  }
}

export const getListRepository = (repo: Repository<List>) => {
  return new ListRepository(repo);
};
