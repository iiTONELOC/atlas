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

  create({userId, expiresAt, userAgent, ipAddress}: CreateSessionRepoProps) {
    const session = this.repo.create({
      user: {id: userId},
      expiresAt,
      userAgent,
      ipAddress,
    });
    return this.repo.save(session);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}, relations: ['user', 'token']});
  }

  async update(id: string, data: UpdateSessionRepoProps) {
    // Defensive check: prevent changing userId
    if ('userId' in data) {
      throw new Error('Cannot change user of a session');
    }

    const {expiresAt, userAgent, ipAddress} = data;

    const session = await this.repo.findOne({where: {id}});
    if (!session) {
      throw new Error('Session not found');
    }

    if (expiresAt !== undefined) {
      session.expiresAt = expiresAt;
    }
    if (userAgent !== undefined) {
      session.userAgent = userAgent;
    }
    if (ipAddress !== undefined) {
      session.ipAddress = ipAddress;
    }

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
