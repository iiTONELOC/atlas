import {Repository} from 'typeorm';
import {validateEntity} from './validation';
import {Source, type SourceName} from '../entities';
import {populateBaseEntityFields} from '../entities/helpers';

export type CreateSourceRepoProps = {
  name: SourceName;
  url: string;
};

export class SourceRepository {
  constructor(private readonly repo: Repository<Source>) {}

  async create({name, url}: CreateSourceRepoProps) {
    const source = this.repo.create({
      name,
      url,
    });

    await validateEntity(populateBaseEntityFields(source));
    return this.repo.save(source);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}});
  }

  async update(id: string, {name, url}: Partial<CreateSourceRepoProps>) {
    const source = await this.repo.findOne({where: {id}});
    if (!source) {
      throw new Error('Source not found');
    }

    if (name !== undefined) {
      source.name = name;
    }
    if (url !== undefined) {
      source.url = url;
    }

    await validateEntity(source);
    return this.repo.save(source);
  }

  async delete(id: string) {
    const source = await this.repo.findOne({where: {id}});
    if (!source) {
      throw new Error('Source not found');
    }
    return this.repo.remove(source);
  }
}

export const getSourceRepository = (repo: Repository<Source>) => {
  return new SourceRepository(repo);
};
