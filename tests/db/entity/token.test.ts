import 'reflect-metadata';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {describe, expect, test} from 'bun:test';
import {Token, TokenType} from '../../../src/db/entity/token';

const initBase = (t: Token) => {
  t.id = '550e8400-e29b-41d4-a716-446655440000';
  t.createdAt = new Date();
  t.updatedAt = new Date();
};

describe('Token Entity Tests', () => {
  test('Token entity columns are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === Token);

    const jtiColumn = columns.find(c => c.propertyName === 'jti');
    expect(jtiColumn).toBeDefined();
    expect(jtiColumn?.options.type).toBe('varchar');
    expect(jtiColumn?.options.unique).toBe(true);

    const tokenHashColumn = columns.find(c => c.propertyName === 'tokenHash');
    expect(tokenHashColumn).toBeDefined();
    expect(tokenHashColumn?.options.type).toBe('varchar');

    const typeColumn = columns.find(c => c.propertyName === 'type');
    expect(typeColumn).toBeDefined();
    expect(typeColumn?.options.type).toBe('enum');
    expect(typeColumn?.options.enum).toBe(TokenType);

    const expiresAtColumn = columns.find(c => c.propertyName === 'expiresAt');
    expect(expiresAtColumn).toBeDefined();
    expect(expiresAtColumn?.options.type).toBe('datetime');

    const relations = getMetadataArgsStorage().relations.filter(r => r.target === Token);
    const sessionRelation = relations.find(r => r.propertyName === 'session');
    expect(sessionRelation).toBeDefined();
    expect(sessionRelation?.relationType).toBe('one-to-one');
  });

  test('Token entity validator enforces constraints', async () => {
    const token = new Token();
    initBase(token);

    // valid
    token.jti = 'unique-jwt-id-12345';
    token.tokenHash = '$2b$10$abcdefghijklmnopqrstuv';
    token.type = TokenType.ACCESS;
    token.expiresAt = new Date(Date.now() + 3600000);
    expect(await validate(token)).toHaveLength(0);

    // valid with REFRESH type
    token.type = TokenType.REFRESH;
    expect(await validate(token)).toHaveLength(0);
  });

  test('Invalid jti is rejected', async () => {
    const token = new Token();
    initBase(token);
    token.tokenHash = 'hash';
    token.type = TokenType.ACCESS;
    token.expiresAt = new Date();

    // non-string jti
    for (const bad of [null, undefined, 123, {}, [], true]) {
      (token as any).jti = bad;
      const errors = await validate(token);
      expect(errors.some(e => e.property === 'jti')).toBe(true);
    }

    token.jti = 'valid-jti';
    expect(await validate(token)).toHaveLength(0);
  });

  test('Invalid tokenHash is rejected', async () => {
    const token = new Token();
    initBase(token);
    token.jti = 'jti-12345';
    token.type = TokenType.ACCESS;
    token.expiresAt = new Date();

    // non-string tokenHash
    for (const bad of [null, undefined, 123, {}, [], true]) {
      (token as any).tokenHash = bad;
      const errors = await validate(token);
      expect(errors.some(e => e.property === 'tokenHash')).toBe(true);
    }

    token.tokenHash = 'valid-hash';
    expect(await validate(token)).toHaveLength(0);
  });

  test('TokenType enum validation', async () => {
    const token = new Token();
    initBase(token);
    token.jti = 'jti-12345';
    token.tokenHash = 'hash-12345';
    token.expiresAt = new Date();

    // valid types
    token.type = TokenType.ACCESS;
    expect(await validate(token)).toHaveLength(0);

    token.type = TokenType.REFRESH;
    expect(await validate(token)).toHaveLength(0);

    // invalid types
    for (const bad of [null, undefined, 'access', 'refresh', 'INVALID', 'TOKEN', '', 123, {}, []]) {
      (token as any).type = bad;
      const errors = await validate(token);
      expect(errors.some(e => e.property === 'type')).toBe(true);
    }
  });

  test('Invalid expiresAt is rejected', async () => {
    const token = new Token();
    initBase(token);
    token.jti = 'jti-12345';
    token.tokenHash = 'hash-12345';
    token.type = TokenType.ACCESS;

    (token as any).expiresAt = 'not-a-date';
    let errors = await validate(token);
    expect(errors.some(e => e.property === 'expiresAt')).toBe(true);

    (token as any).expiresAt = 123;
    errors = await validate(token);
    expect(errors.some(e => e.property === 'expiresAt')).toBe(true);

    (token as any).expiresAt = null;
    errors = await validate(token);
    expect(errors.some(e => e.property === 'expiresAt')).toBe(true);

    token.expiresAt = new Date();
    expect(await validate(token)).toHaveLength(0);
  });

  test('Inherited validators from TimestampedEntity are enforced', async () => {
    const token = new Token();
    token.jti = 'jti-12345';
    token.tokenHash = 'hash-12345';
    token.type = TokenType.ACCESS;
    token.expiresAt = new Date();

    (token as any).id = 'not-a-uuid';
    token.createdAt = new Date();
    token.updatedAt = new Date();
    let errors = await validate(token);
    expect(errors.some(e => e.property === 'id')).toBe(true);

    token.id = '550e8400-e29b-41d4-a716-446655440000';
    (token as any).createdAt = 'not-a-date';
    errors = await validate(token);
    expect(errors.some(e => e.property === 'createdAt')).toBe(true);

    token.createdAt = new Date();
    (token as any).updatedAt = 123;
    errors = await validate(token);
    expect(errors.some(e => e.property === 'updatedAt')).toBe(true);

    token.updatedAt = new Date();
    expect(await validate(token)).toHaveLength(0);
  });

  test('Token fuzzing with various invalid values', async () => {
    const token = new Token();
    initBase(token);

    // fuzz jti with various types
    token.tokenHash = 'hash';
    token.type = TokenType.ACCESS;
    token.expiresAt = new Date();

    for (const bad of [null, undefined, '', 123, {}, [], true, false]) {
      (token as any).jti = bad;
      const errors = await validate(token);
      expect(errors.some(e => e.property === 'jti')).toBe(true);
    }

    // fuzz tokenHash
    token.jti = 'valid-jti';
    for (const bad of [null, undefined, '', 123, {}, [], true, false]) {
      (token as any).tokenHash = bad;
      const errors = await validate(token);
      expect(errors.some(e => e.property === 'tokenHash')).toBe(true);
    }

    // fuzz type
    token.tokenHash = 'valid-hash';
    for (const bad of [null, undefined, '', 'access', 'INVALID', 123, {}, [], true, 'Bearer']) {
      (token as any).type = bad;
      const errors = await validate(token);
      expect(errors.some(e => e.property === 'type')).toBe(true);
    }

    // fuzz expiresAt
    token.type = TokenType.ACCESS;
    for (const bad of [null, undefined, '', 'date', 123, {}, [], true]) {
      (token as any).expiresAt = bad;
      const errors = await validate(token);
      expect(errors.some(e => e.property === 'expiresAt')).toBe(true);
    }
  });

  test('TokenType enum contains expected values', () => {
    //@ts-ignore
    expect(TokenType.ACCESS).toBe('ACCESS'); // @ts-ignore
    expect(TokenType.REFRESH).toBe('REFRESH');
    expect(Object.keys(TokenType).length).toBe(2);
  });

  test('Long string values for jti and tokenHash', async () => {
    const token = new Token();
    initBase(token);
    token.type = TokenType.ACCESS;
    token.expiresAt = new Date();

    // very long but valid strings
    token.jti = 'a'.repeat(500);
    token.tokenHash = 'b'.repeat(500);
    expect(await validate(token)).toHaveLength(0);

    // empty strings should fail
    token.jti = '';
    token.tokenHash = 'hash';
    let errors = await validate(token);
    expect(errors.some(e => e.property === 'jti')).toBe(true);

    token.jti = 'jti';
    token.tokenHash = '';
    errors = await validate(token);
    expect(errors.some(e => e.property === 'tokenHash')).toBe(true);
  });
});
