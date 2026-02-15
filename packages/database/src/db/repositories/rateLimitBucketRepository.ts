import {Repository} from 'typeorm';
import {randomUUID} from 'crypto';

import {validateEntity} from './validation';
import {RateLimitBucket, RateLimitScope, RATE_LIMIT_RULES} from '../entities';
import {populateBaseEntityFields} from '../entities/helpers';
import {RateLimitExceededError} from './errors';

export type ConsumeRateLimitProps = {
  scope: RateLimitScope;
  key: string;
  windowStart: Date;
  windowSeconds: number;
  increment?: number;
};

export class RateLimitBucketRepository {
  constructor(private readonly repo: Repository<RateLimitBucket>) {}

  async consume({scope, key, windowStart, windowSeconds, increment = 1}: ConsumeRateLimitProps) {
    const rule = RATE_LIMIT_RULES[scope];
    const {limit, blockLength} = rule;

    const now = new Date();

    // Single atomic upsert
    await this.repo.query(
      `INSERT INTO rate_limit_bucket
        (id, scope, \`key\`, windowStart, windowSeconds, count, blockedUntil, createdAt, updatedAt)
       VALUES
        (?, ?, ?, ?, ?, ?, NULL, NOW(), NOW())
       ON DUPLICATE KEY UPDATE
        count = count + VALUES(count),
        updatedAt = NOW()`,
      [randomUUID(), scope, key, windowStart, windowSeconds, increment],
    );

    const bucket = await this.findOneByScopeKeyWindow(scope, key, windowStart, windowSeconds);

    if (!bucket) return null;

    // Already blocked
    if (bucket.blockedUntil && bucket.blockedUntil > now) {
      throw new RateLimitExceededError(scope, key, bucket.blockedUntil);
    }

    // Exceeded after increment
    if (bucket.count > limit) {
      const blockedUntil = new Date(now.getTime() + blockLength);
      bucket.blockedUntil = blockedUntil;
      await validateEntity(populateBaseEntityFields(bucket));
      await this.repo.save(bucket);
      throw new RateLimitExceededError(scope, key, blockedUntil);
    }

    return bucket;
  }

  async findOneByScopeKeyWindow(
    scope: RateLimitScope,
    key: string,
    windowStart: Date,
    windowSeconds: number,
  ) {
    return this.repo.findOne({where: {scope, key, windowStart, windowSeconds}});
  }

  async reset(scope: RateLimitScope, key: string, windowStart: Date, windowSeconds: number) {
    return this.repo.delete({scope, key, windowStart, windowSeconds});
  }

  async createBucket(props: Partial<RateLimitBucket>) {
    const bucket = this.repo.create(props as RateLimitBucket);
    await validateEntity(populateBaseEntityFields(bucket));
    return this.repo.save(bucket);
  }

  async updateBucket(id: string, updates: Partial<RateLimitBucket>) {
    const bucket = await this.repo.findOne({where: {id}});
    if (!bucket) return null;
    Object.assign(bucket, updates);
    await validateEntity(populateBaseEntityFields(bucket));
    return this.repo.save(bucket);
  }

  async deleteBucket(id: string) {
    return this.repo.delete(id);
  }

  isBlocked(bucket: RateLimitBucket): boolean {
    return !!bucket.blockedUntil && bucket.blockedUntil > new Date();
  }
}
