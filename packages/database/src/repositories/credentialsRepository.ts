import {Repository} from 'typeorm';
import {Credentials} from '../entities';
import {validateEntity} from './validation';
import {populateBaseEntityFields} from '../entities/helpers';

export type CreateCredentialsRepoProps = {
  email: string;
  password: string;
};

export class CredentialsRepository {
  constructor(private readonly repo: Repository<Credentials>) {}

  async create({email, password}: CreateCredentialsRepoProps) {
    const credentials = this.repo.create({email, password});

    await validateEntity(populateBaseEntityFields(credentials));

    return this.repo.save(credentials);
  }

  async update(id: string, {email, password}: Partial<CreateCredentialsRepoProps>) {
    const credentials = await this.repo.findOne({where: {id}});
    if (!credentials) {
      throw new Error('Credentials not found');
    }

    if (email !== undefined) {
      credentials.email = email;
    }
    if (password !== undefined) {
      credentials.password = password;
    }

    await validateEntity(credentials);
    return this.repo.save(credentials);
  }

  async findByEmail(email: string) {
    return this.repo.findOne({where: {email}});
  }

  async findById(id: string) {
    return this.repo.findOne({where: {id}});
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
