import {Repository} from 'typeorm';
import {validate} from 'class-validator';
import {Credentials} from '../entities';
import {populateBaseEntityFields} from '../entities/helpers';

export type CreateCredentialsRepoProps = {
  email: string;
  password: string;
};

export class CredentialsRepository {
  constructor(private readonly repo: Repository<Credentials>) {}

  async create({email, password}: CreateCredentialsRepoProps) {
    const credentials = this.repo.create({email, password});
    populateBaseEntityFields(credentials);

    const errors = await validate(credentials);
    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors
          .map(e => Object.values(e.constraints || {}))
          .flat()
          .join(', ')}`,
      );
    }

    return this.repo.save(credentials);
  }

  findByEmail(email: string) {
    return this.repo.findOne({where: {email}});
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

    const errors = await validate(credentials);
    if (errors.length > 0) {
      throw new Error(
        `Validation failed: ${errors
          .map(e => Object.values(e.constraints || {}))
          .flat()
          .join(', ')}`,
      );
    }

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
