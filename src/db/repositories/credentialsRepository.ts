import {Repository} from 'typeorm';
import {Credentials} from '../entities';

export type CreateCredentialsRepoProps = {
  email: string;
  password: string;
};

export class CredentialsRepository {
  constructor(private readonly repo: Repository<Credentials>) {}

  create({email, password}: CreateCredentialsRepoProps) {
    return this.repo.save(this.repo.create({email, password}));
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
