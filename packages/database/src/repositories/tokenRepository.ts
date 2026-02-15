import {Repository} from 'typeorm';
import {validateEntity} from './validation';
import {Token, type TokenType} from '../entities';
import {populateBaseEntityFields} from '../entities/helpers';

export type CreateTokenRepoProps = {
  sessionId: string;
  jti: string;
  tokenHash: string;
  type: TokenType;
  expiresAt: Date;
};

export class TokenRepository {
  constructor(private readonly repo: Repository<Token>) {}

  async create({sessionId, jti, tokenHash, type, expiresAt}: CreateTokenRepoProps) {
    const token = this.repo.create({
      session: {id: sessionId},
      jti,
      tokenHash,
      type,
      expiresAt,
    });

    await validateEntity(populateBaseEntityFields(token));
    return this.repo.save(token);
  }

  findById(id: string, relations?: string[]) {
    return this.repo.findOne({where: {id}, relations});
  }

  findBySessionId(sessionId: string, relations?: string[]) {
    return this.repo.findOne({where: {session: {id: sessionId}}, relations});
  }

  async delete(id: string) {
    const token = await this.repo.findOne({where: {id}});
    if (!token) {
      throw new Error('Token not found');
    }
    return this.repo.remove(token);
  }
}

export const getTokenRepository = (repo: Repository<Token>) => {
  return new TokenRepository(repo);
};
