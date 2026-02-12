import {Repository} from 'typeorm';
import {Source, type SourceName} from '../entities';

export type CreateSourceRepoProps = {
  name: SourceName;
  url: string;
};

export class SourceRepository {
  constructor(private readonly repo: Repository<Source>) {}

  create(data: CreateSourceRepoProps) {
    const source = this.repo.create({
      name: data.name,
      url: data.url,
    });
    return this.repo.save(source);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}});
  }

  async update(id: string, data: Partial<CreateSourceRepoProps>) {
    const source = await this.repo.findOne({where: {id}});
    if (!source) {
      throw new Error('Source not found');
    }
    Object.assign(source, data);
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
