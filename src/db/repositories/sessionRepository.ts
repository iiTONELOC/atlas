import {Repository, MoreThan} from 'typeorm';
import {Session} from '../entities';
import {validateEntity} from './validation';
import {populateBaseEntityFields} from '../entities/helpers';

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

  async create({userId, expiresAt, userAgent, ipAddress}: CreateSessionRepoProps) {
    const session = this.repo.create({
      user: {id: userId},
      expiresAt,
      userAgent,
      ipAddress,
    });

    await validateEntity(populateBaseEntityFields(session));
    return this.repo.save(session);
  }

  findById(id: string) {
    return this.repo.findOne({where: {id}, relations: ['user', 'token']});
  }

  findByUserId(userId: string) {
    return this.repo.find({where: {user: {id: userId}}, relations: ['user', 'token']});
  }

  findActiveByUserId(userId: string) {
    return this.repo.find({
      where: {
        user: {id: userId},
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user', 'token'],
    });
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

    await validateEntity(session);
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

  async revokeAllByUserId(userId: string) {
    const sessions = await this.repo.find({where: {user: {id: userId}, isRevoked: false}});
    const revokedSessions = sessions.map(session => {
      session.isRevoked = true;
      return session;
    });
    return this.repo.save(revokedSessions);
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
