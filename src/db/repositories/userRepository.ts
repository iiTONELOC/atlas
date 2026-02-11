// repositories/UserRepository.ts
import {Repository} from 'typeorm';
import {User} from '../entities';

export type CreateUserRepoProps = {
  credentials: {
    email: string;
    password: string;
  };
  displayName?: string | null;
};

export type UpdateUserRepoProps = {
  accountStatus?: User['accountStatus'];
  displayName?: string | null;
};

export class UserRepository {
  constructor(private readonly repo: Repository<User>) {}

  create(data: CreateUserRepoProps) {
    return this.repo.save(this.repo.create(data));
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

  async update(id: string, data: UpdateUserRepoProps) {
    const user = await this.findById(id);
    if (!user) {
      throw new Error('User not found');
    }

    Object.assign(user, data);
    return this.repo.save(user);
  }
}

export const getUserRepository = (repo: Repository<User>) => new UserRepository(repo);
