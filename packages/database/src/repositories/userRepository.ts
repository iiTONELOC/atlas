import {Repository} from 'typeorm';
import {User} from '../entities';
import {validateEntity} from './validation';
import {populateBaseEntityFields} from '../entities/helpers';
import type {CreateCredentialsRepoProps} from './credentialsRepository';

export type CreateUserRepoProps = {
  credentials: CreateCredentialsRepoProps;
  displayName?: string | null;
};

export type UpdateUserRepoProps = {
  accountStatus?: User['accountStatus'];
  displayName?: string | null;
};

export class UserRepository {
  constructor(private readonly repo: Repository<User>) {}

  async create({credentials, displayName}: CreateUserRepoProps) {
    const user = this.repo.create({credentials, displayName});

    await validateEntity(populateBaseEntityFields(user));
    return this.repo.save(user);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}});
  }

  findByIdWithSessions(id: string) {
    return this.repo.findOne({
      where: {id},
      relations: ['sessions'],
    });
  }

  findByIdWithLists(id: string) {
    return this.repo.findOne({
      where: {id},
      relations: ['lists'],
    });
  }

  findByEmail(email: string) {
    return this.repo.findOne({
      where: {
        credentials: {
          email,
        },
      },
    });
  }

  async update(id: string, {accountStatus, displayName}: UpdateUserRepoProps) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    if (accountStatus !== undefined) {
      user.accountStatus = accountStatus;
    }
    if (displayName !== undefined) {
      user.displayName = displayName;
    }

    await validateEntity(user);
    return this.repo.save(user);
  }

  async delete(id: string) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }
    return this.repo.softRemove(user);
  }
}

export const getUserRepository = (repo: Repository<User>) => {
  return new UserRepository(repo);
};
