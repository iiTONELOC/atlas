import 'reflect-metadata';
import {DataSource} from 'typeorm';
import {describe, expect, test, beforeAll, afterAll, beforeEach} from 'bun:test';
import {
  RateLimitBucket,
  RateLimitScope,
  RATE_LIMIT_RULES,
} from '../../../src/entities/rateLimitBucket';
import {RateLimitBucketRepository} from '../../../src/repositories/rateLimitBucketRepository';
import {createTestDataSource, cleanupTestDataSource} from '../../setup';
import {EntityValidationError, RateLimitExceededError} from '../../../src';

const TEST_KEY = 'test-key';
const TEST_SCOPE = RateLimitScope.LOGIN_IP;
const TEST_WINDOW_SECONDS = 60;
const TEST_LIMIT = RATE_LIMIT_RULES[TEST_SCOPE].limit;
const TEST_BLOCK_LENGTH = RATE_LIMIT_RULES[TEST_SCOPE].blockLength;

function getWindowStart() {
  const now = new Date();
  now.setSeconds(0, 0);
  return now;
}

describe('RateLimitBucketRepository', () => {
  let dataSource: DataSource;
  let repo: RateLimitBucketRepository;

  beforeAll(async () => {
    dataSource = await createTestDataSource();
    repo = new RateLimitBucketRepository(dataSource.getRepository(RateLimitBucket));
  });

  afterAll(async () => {
    await cleanupTestDataSource(dataSource);
  });

  beforeEach(async () => {
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
    await dataSource.query('TRUNCATE TABLE rate_limit_bucket');
    await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');
  });

  test('create and find bucket', async () => {
    const windowStart = getWindowStart();
    const bucket = await repo.createBucket({
      scope: TEST_SCOPE,
      key: TEST_KEY,
      windowStart,
      windowSeconds: TEST_WINDOW_SECONDS,
      count: 1,
      blockedUntil: null,
    });

    expect(bucket).toBeDefined();

    const found = await repo.findOneByScopeKeyWindow(
      TEST_SCOPE,
      TEST_KEY,
      windowStart,
      TEST_WINDOW_SECONDS,
    );

    expect(found).not.toBeNull();
    expect(found?.count).toBe(1);
  });

  test('consume increments count atomically', async () => {
    const windowStart = getWindowStart();

    let bucket = await repo.consume({
      scope: TEST_SCOPE,
      key: TEST_KEY,
      windowStart,
      windowSeconds: TEST_WINDOW_SECONDS,
      increment: 1,
    });

    expect(bucket?.count).toBe(1);

    bucket = await repo.consume({
      scope: TEST_SCOPE,
      key: TEST_KEY,
      windowStart,
      windowSeconds: TEST_WINDOW_SECONDS,
      increment: 2,
    });

    expect(bucket?.count).toBe(3);
  });

  test('reset deletes the bucket', async () => {
    const windowStart = getWindowStart();

    await repo.createBucket({
      scope: TEST_SCOPE,
      key: TEST_KEY,
      windowStart,
      windowSeconds: TEST_WINDOW_SECONDS,
      count: 1,
      blockedUntil: null,
    });

    const result = await repo.reset(TEST_SCOPE, TEST_KEY, windowStart, TEST_WINDOW_SECONDS);

    expect(result.affected).toBe(1);

    const bucket = await repo.findOneByScopeKeyWindow(
      TEST_SCOPE,
      TEST_KEY,
      windowStart,
      TEST_WINDOW_SECONDS,
    );

    expect(bucket).toBeNull();
  });

  test('consume throws RateLimitExceededError when blocked', async () => {
    const windowStart = getWindowStart();
    const blockedUntil = new Date(Date.now() + TEST_BLOCK_LENGTH);

    await repo.createBucket({
      scope: TEST_SCOPE,
      key: TEST_KEY,
      windowStart,
      windowSeconds: TEST_WINDOW_SECONDS,
      count: TEST_LIMIT,
      blockedUntil,
    });

    await expect(
      repo.consume({
        scope: TEST_SCOPE,
        key: TEST_KEY,
        windowStart,
        windowSeconds: TEST_WINDOW_SECONDS,
        increment: 1,
      }),
    ).rejects.toThrow(RateLimitExceededError);
  });

  test('consume sets blockedUntil after max attempts and throws', async () => {
    const windowStart = getWindowStart();

    for (let i = 0; i < TEST_LIMIT; i++) {
      await repo.consume({
        scope: TEST_SCOPE,
        key: TEST_KEY,
        windowStart,
        windowSeconds: TEST_WINDOW_SECONDS,
        increment: 1,
      });
    }

    await expect(
      repo.consume({
        scope: TEST_SCOPE,
        key: TEST_KEY,
        windowStart,
        windowSeconds: TEST_WINDOW_SECONDS,
        increment: 1,
      }),
    ).rejects.toThrow(RateLimitExceededError);

    const blockedBucket = await repo.findOneByScopeKeyWindow(
      TEST_SCOPE,
      TEST_KEY,
      windowStart,
      TEST_WINDOW_SECONDS,
    );

    expect(blockedBucket?.blockedUntil).not.toBeNull();
    expect(blockedBucket?.blockedUntil?.getTime()).toBeGreaterThan(Date.now());
  });

  test('updateBucket updates fields', async () => {
    const windowStart = getWindowStart();

    const bucket = await repo.createBucket({
      scope: TEST_SCOPE,
      key: TEST_KEY,
      windowStart,
      windowSeconds: TEST_WINDOW_SECONDS,
      count: 1,
      blockedUntil: null,
    });

    const updated = await repo.updateBucket(bucket.id, {
      count: 5,
      blockedUntil: new Date(),
    });

    expect(updated?.count).toBe(5);
    expect(updated?.blockedUntil).not.toBeNull();
  });

  test('deleteBucket removes bucket', async () => {
    const windowStart = getWindowStart();

    const bucket = await repo.createBucket({
      scope: TEST_SCOPE,
      key: TEST_KEY,
      windowStart,
      windowSeconds: TEST_WINDOW_SECONDS,
      count: 1,
      blockedUntil: null,
    });

    const del = await repo.deleteBucket(bucket.id);

    expect(del.affected).toBe(1);

    const found = await repo.findOneByScopeKeyWindow(
      TEST_SCOPE,
      TEST_KEY,
      windowStart,
      TEST_WINDOW_SECONDS,
    );

    expect(found).toBeNull();
  });

  test('rate limiting resets on new window', async () => {
    const windowStart1 = getWindowStart();

    await repo.consume({
      scope: TEST_SCOPE,
      key: TEST_KEY,
      windowStart: windowStart1,
      windowSeconds: TEST_WINDOW_SECONDS,
      increment: 3,
    });

    const windowStart2 = new Date(windowStart1.getTime() + TEST_WINDOW_SECONDS * 1000);

    const bucket2 = await repo.consume({
      scope: TEST_SCOPE,
      key: TEST_KEY,
      windowStart: windowStart2,
      windowSeconds: TEST_WINDOW_SECONDS,
      increment: 1,
    });

    expect(bucket2?.count).toBe(1);
  });

  test('rate limiting enforces max attempts', async () => {
    const windowStart = getWindowStart();

    let bucket;

    for (let i = 0; i < TEST_LIMIT; i++) {
      bucket = await repo.consume({
        scope: TEST_SCOPE,
        key: TEST_KEY,
        windowStart,
        windowSeconds: TEST_WINDOW_SECONDS,
        increment: 1,
      });
    }

    expect(bucket?.count).toBe(TEST_LIMIT);
  });

  describe('fuzzing and edge cases', () => {
    test('invalid scope is rejected', async () => {
      const windowStart = getWindowStart();

      const bad = {
        scope: 'BAD_SCOPE',
        key: TEST_KEY,
        windowStart,
        windowSeconds: TEST_WINDOW_SECONDS,
        count: 1,
        blockedUntil: null,
      };

      await expect(repo.createBucket(bad as any)).rejects.toThrow(EntityValidationError);
    });

    test('invalid key is rejected', async () => {
      const windowStart = getWindowStart();

      const bad = {
        scope: TEST_SCOPE,
        key: 123,
        windowStart,
        windowSeconds: TEST_WINDOW_SECONDS,
        count: 1,
        blockedUntil: null,
      };

      await expect(repo.createBucket(bad as any)).rejects.toThrow(EntityValidationError);
    });

    test('invalid windowSeconds is rejected', async () => {
      const windowStart = getWindowStart();

      const bad = {
        scope: TEST_SCOPE,
        key: TEST_KEY,
        windowStart,
        windowSeconds: 0,
        count: 1,
        blockedUntil: null,
      };

      await expect(repo.createBucket(bad as any)).rejects.toThrow(EntityValidationError);
    });

    test('invalid count is rejected', async () => {
      const windowStart = getWindowStart();

      const bad = {
        scope: TEST_SCOPE,
        key: TEST_KEY,
        windowStart,
        windowSeconds: TEST_WINDOW_SECONDS,
        count: -1,
        blockedUntil: null,
      };

      await expect(repo.createBucket(bad as any)).rejects.toThrow(EntityValidationError);
    });
  });
});
