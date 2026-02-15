import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {RateLimitBucket, RateLimitScope} from '../../../src/db/entities/rateLimitBucket';

const initBase = (b: RateLimitBucket) => {
  b.id = '550e8400-e29b-41d4-a716-446655440000';
  b.createdAt = new Date();
  b.updatedAt = new Date();
};

describe('RateLimitBucket Entity Tests', () => {
  test('columns and indexes are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === RateLimitBucket);
    const scopeColumn = columns.find(c => c.propertyName === 'scope');
    expect(scopeColumn).toBeDefined();
    expect(scopeColumn?.options.type).toBe('enum');
    expect(scopeColumn?.options.enum).toBe(RateLimitScope);

    const keyColumn = columns.find(c => c.propertyName === 'key');
    expect(keyColumn).toBeDefined();
    expect(keyColumn?.options.type).toBe('varchar');
    expect(keyColumn?.options.length).toBe(128);

    const windowStartColumn = columns.find(c => c.propertyName === 'windowStart');
    expect(windowStartColumn).toBeDefined();
    expect(windowStartColumn?.options.type).toBe('datetime');

    const windowSecondsColumn = columns.find(c => c.propertyName === 'windowSeconds');
    expect(windowSecondsColumn).toBeDefined();
    expect(windowSecondsColumn?.options.type).toBe('int');

    const countColumn = columns.find(c => c.propertyName === 'count');
    expect(countColumn).toBeDefined();
    expect(countColumn?.options.type).toBe('int');
    expect(countColumn?.options.default).toBe(0);

    const blockedUntilColumn = columns.find(c => c.propertyName === 'blockedUntil');
    expect(blockedUntilColumn).toBeDefined();
    expect(blockedUntilColumn?.options.type).toBe('datetime');
    expect(blockedUntilColumn?.options.nullable).toBe(true);

    const indexes = getMetadataArgsStorage().indices.filter(i => i.target === RateLimitBucket);
    const uniqueIndex = indexes.find(i => i.unique);
    expect(uniqueIndex).toBeDefined();
    expect(uniqueIndex?.columns).toEqual(['scope', 'key', 'windowStart', 'windowSeconds']);
  });

  test('validator enforces constraints', async () => {
    const bucket = new RateLimitBucket();
    initBase(bucket);
    bucket.scope = RateLimitScope.LOGIN_IP;
    bucket.key = 'hashed-key';
    bucket.windowStart = new Date();
    bucket.windowSeconds = 60;
    bucket.count = 1;
    bucket.blockedUntil = null;
    expect(await validate(bucket)).toHaveLength(0);

    // missing required fields
    const invalid = new RateLimitBucket();
    initBase(invalid);
    let errors = await validate(invalid);
    expect(errors.some(e => e.property === 'scope')).toBe(true);
    expect(errors.some(e => e.property === 'key')).toBe(true);
    expect(errors.some(e => e.property === 'windowStart')).toBe(true);
    expect(errors.some(e => e.property === 'windowSeconds')).toBe(true);
    expect(errors.some(e => e.property === 'count')).toBe(true);

    // invalid scope
    (bucket as any).scope = 'INVALID_SCOPE';
    errors = await validate(bucket);
    expect(errors.some(e => e.property === 'scope')).toBe(true);

    // invalid key
    bucket.scope = RateLimitScope.LOGIN_IP;
    (bucket as any).key = 123;
    errors = await validate(bucket);
    expect(errors.some(e => e.property === 'key')).toBe(true);

    // invalid windowSeconds
    bucket.key = 'hashed-key';
    (bucket as any).windowSeconds = 0;
    errors = await validate(bucket);
    expect(errors.some(e => e.property === 'windowSeconds')).toBe(true);

    // invalid count
    bucket.windowSeconds = 60;
    (bucket as any).count = -1;
    errors = await validate(bucket);
    expect(errors.some(e => e.property === 'count')).toBe(true);
  });

  describe('RateLimitBucket fuzzing', () => {
    test('scope fuzzing rejects invalid values', async () => {
      const bucket = new RateLimitBucket();
      initBase(bucket);
      bucket.key = 'hashed-key';
      bucket.windowStart = new Date();
      bucket.windowSeconds = 60;
      bucket.count = 1;
      const cases = [null, undefined, 123, {}, [], true, 'INVALID_SCOPE'];
      for (const value of cases) {
        (bucket as any).scope = value;
        const errors = await validate(bucket);
        expect(errors.some(e => e.property === 'scope')).toBe(true);
      }
    });

    test('key fuzzing rejects invalid values', async () => {
      const bucket = new RateLimitBucket();
      initBase(bucket);
      bucket.scope = RateLimitScope.LOGIN_IP;
      bucket.windowStart = new Date();
      bucket.windowSeconds = 60;
      bucket.count = 1;
      const cases = [null, undefined, 123, {}, [], true, 'a'.repeat(129)];
      for (const value of cases) {
        (bucket as any).key = value;
        const errors = await validate(bucket);
        expect(errors.some(e => e.property === 'key')).toBe(true);
      }
    });

    test('windowStart fuzzing rejects invalid values', async () => {
      const bucket = new RateLimitBucket();
      initBase(bucket);
      bucket.scope = RateLimitScope.LOGIN_IP;
      bucket.key = 'hashed-key';
      bucket.windowSeconds = 60;
      bucket.count = 1;
      const cases = [null, undefined, 123, {}, [], true, 'notadate'];
      for (const value of cases) {
        (bucket as any).windowStart = value;
        const errors = await validate(bucket);
        expect(errors.some(e => e.property === 'windowStart')).toBe(true);
      }
    });

    test('windowSeconds fuzzing rejects invalid values', async () => {
      const bucket = new RateLimitBucket();
      initBase(bucket);
      bucket.scope = RateLimitScope.LOGIN_IP;
      bucket.key = 'hashed-key';
      bucket.windowStart = new Date();
      bucket.count = 1;
      const cases = [null, undefined, 0, -1, 1.5, {}, [], true, 'notanint'];
      for (const value of cases) {
        (bucket as any).windowSeconds = value;
        const errors = await validate(bucket);
        expect(errors.some(e => e.property === 'windowSeconds')).toBe(true);
      }
    });

    test('count fuzzing rejects invalid values', async () => {
      const bucket = new RateLimitBucket();
      initBase(bucket);
      bucket.scope = RateLimitScope.LOGIN_IP;
      bucket.key = 'hashed-key';
      bucket.windowStart = new Date();
      bucket.windowSeconds = 60;
      const cases = [null, undefined, -1, 1.5, {}, [], true, 'notanint'];
      for (const value of cases) {
        (bucket as any).count = value;
        const errors = await validate(bucket);
        expect(errors.some(e => e.property === 'count')).toBe(true);
      }
    });

    test('blockedUntil fuzzing rejects invalid values', async () => {
      const bucket = new RateLimitBucket();
      initBase(bucket);
      bucket.scope = RateLimitScope.LOGIN_IP;
      bucket.key = 'hashed-key';
      bucket.windowStart = new Date();
      bucket.windowSeconds = 60;
      bucket.count = 1;
      const cases = [123, {}, [], true, 'notadate'];
      for (const value of cases) {
        (bucket as any).blockedUntil = value;
        const errors = await validate(bucket);
        expect(errors.some(e => e.property === 'blockedUntil')).toBe(true);
      }
    });
  });
});
