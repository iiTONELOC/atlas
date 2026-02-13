import {Repository} from 'typeorm';
import {ListItem} from '../entities';
import {validateEntity} from './validation';
import {populateBaseEntityFields} from '../entities/helpers';

export type CreateListItemRepoProps = {
  userProductId: string;
  listId: string;
  quantity?: number;
  notes?: string;
  isComplete?: boolean;
};

export type UpdateListItemRepoProps = {
  notes?: string;
  listId?: string;
  quantity?: number;
  isComplete?: boolean;
};

export class ListItemRepository {
  constructor(private readonly repo: Repository<ListItem>) {}

  async create({
    notes,
    listId,
    userProductId,
    quantity = 1,
    isComplete = false,
  }: CreateListItemRepoProps) {
    const listItem = this.repo.create({
      product: {id: userProductId},
      list: {id: listId},
      quantity,
      notes,
      isComplete,
    });

    await validateEntity(populateBaseEntityFields(listItem));
    return this.repo.save(listItem);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}, relations: ['product', 'list']});
  }

  findByListId(listId: string) {
    return this.repo.find({where: {list: {id: listId}}, relations: ['product', 'list']});
  }

  findByUserProductId(userProductId: string) {
    return this.repo.find({where: {product: {id: userProductId}}, relations: ['product', 'list']});
  }

  async update(id: string, {notes, listId, quantity, isComplete}: UpdateListItemRepoProps) {
    const listItem = await this.repo.findOne({where: {id}});
    if (!listItem) {
      throw new Error('ListItem not found');
    }

    if (notes !== undefined) {
      listItem.notes = notes;
    }
    if (listId !== undefined) {
      listItem.list = {id: listId} as any; // TypeORM will handle this relation
    }
    if (quantity !== undefined) {
      listItem.quantity = quantity;
    }
    if (isComplete !== undefined) {
      listItem.isComplete = isComplete;
    }

    await validateEntity(listItem);
    return this.repo.save(listItem);
  }

  async delete(id: string) {
    const listItem = await this.repo.findOne({where: {id}});
    if (!listItem) {
      throw new Error('ListItem not found');
    }
    return this.repo.remove(listItem);
  }
}
