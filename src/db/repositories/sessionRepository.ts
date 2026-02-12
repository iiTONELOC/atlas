import {Repository} from 'typeorm';
import {Session} from '../entities';

export type CreateSessionRepoProps = {
  userId: string;
  expiresAt: Date;
  userAgent: string;
  ipAddress: string;
};

export type UpdateSessionRepoProps = {
  expiresAt?: Date;
  userAgent?: string;
  ipAddress?: string;
};

export class SessionRepository {
  constructor(private readonly repo: Repository<Session>) {}

  create(data: CreateSessionRepoProps) {
    const session = this.repo.create({
      user: {id: data.userId} as any, // TypeORM will handle this relation
      expiresAt: data.expiresAt,
      userAgent: data.userAgent,
      ipAddress: data.ipAddress,
    });
    return this.repo.save(session);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}, relations: ['user', 'token']});
  }

  async update(id: string, data: UpdateSessionRepoProps) {
    const session = await this.repo.findOne({where: {id}});
    if (!session) {
      throw new Error('Session not found');
    }

    if ((data as any).userId) {
      throw new Error('Cannot change user of a session');
    }

    Object.assign(session, data);
    return this.repo.save(session);
  }

  async revoke(id: string) {
    const session = await this.repo.findOne({where: {id}});
    if (!session) {
      throw new Error('Session not found');
    }
    session.isRevoked = true;
    return this.repo.save(session);
  }

  async delete(id: string) {
    const session = await this.repo.findOne({where: {id}});
    if (!session) {
      throw new Error('Session not found');
    }
    return this.repo.remove(session);
  }
}

export const getSessionRepository = (repo: Repository<Session>) => {
  return new SessionRepository(repo);
};
