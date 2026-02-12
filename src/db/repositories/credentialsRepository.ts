import {Repository} from 'typeorm';
import {Credentials} from '../entities';

export type CreateCredentialsRepoProps = {
  email: string;
  password: string;
};

export class CredentialsRepository {
  constructor(private readonly repo: Repository<Credentials>) {}

  create(data: CreateCredentialsRepoProps) {
    return this.repo.save(this.repo.create(data));
  }

  findByEmail(email: string) {
    return this.repo.findOne({where: {email}});
  }

  async update(id: string, data: Partial<CreateCredentialsRepoProps>) {
    const credentials = await this.repo.findOne({where: {id}});
    if (!credentials) {
      throw new Error('Credentials not found');
    }

    Object.assign(credentials, data);
    return this.repo.save(credentials);
  }

  async delete(id: string) {
    const credentials = await this.repo.findOne({where: {id}});
    if (!credentials) {
      throw new Error('Credentials not found');
    }

    return this.repo.remove(credentials);
  }
}

export const getCredentialsRepository = (repo: Repository<Credentials>) => {
  return new CredentialsRepository(repo);
};
