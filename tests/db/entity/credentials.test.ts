import 'reflect-metadata';
import {describe, expect, test} from 'bun:test';
import {validate} from 'class-validator';
import {getMetadataArgsStorage} from 'typeorm';
import {Credentials} from '../../../src/db/entity/credentials';

const initBase = (c: Credentials) => {
  c.id = '550e8400-e29b-41d4-a716-446655440000';
  c.createdAt = new Date();
  c.updatedAt = new Date();
};

describe('Credentials Entity Tests', () => {
  test('entity columns are defined correctly', () => {
    const columns = getMetadataArgsStorage().columns.filter(c => c.target === Credentials);
    expect(columns.some(c => c.propertyName === 'email')).toBe(true);
    expect(columns.some(c => c.propertyName === 'password')).toBe(true);
    // test the user relation column
    const relations = getMetadataArgsStorage().relations.filter(r => r.target === Credentials);
    expect(relations.some(r => r.propertyName === 'user')).toBe(true);
  });

  test('valid entity passes validation', async () => {
    const creds = new Credentials();
    initBase(creds);
    creds.email = 'user@example.com';
    creds.password = 'Str0ngPassphrase2025!';
    expect(await validate(creds)).toHaveLength(0);
  });

  test('invalid email is rejected', async () => {
    const creds = new Credentials();
    initBase(creds);
    creds.email = 'bad-email';
    creds.password = 'Str0ngPassphrase2025!';
    const errors = await validate(creds);
    expect(errors.some(e => e.property === 'email')).toBe(true);
  });

  test('valid password is hashed on insert/update', async () => {
    const creds = new Credentials();
    initBase(creds);
    creds.email = 'user@test.com';
    creds.password = 'Str0ngPassphrase2025!';
    await creds.hashPassword();
    expect(creds.password.startsWith('$2')).toBe(true);
  });

  test('password hashing is idempotent', async () => {
    const creds = new Credentials();
    initBase(creds);
    creds.email = 'user@test.com';
    creds.password = 'Str0ngPassphrase2025!';
    await creds.hashPassword();
    const first = creds.password;
    await creds.hashPassword();
    expect(creds.password).toBe(first);
  });

  describe('password fuzzing rejects invalid input', () => {
    const cases = ['', ' ', '   ', '\n', '\t', '🔥🔥🔥', 'A'.repeat(512)];
    for (const pwd of cases) {
      test(`rejects ${JSON.stringify(pwd)}`, async () => {
        const creds = new Credentials();
        initBase(creds);
        creds.email = 'user@test.com';
        creds.password = pwd;
        await expect(creds.hashPassword()).rejects.toThrow();
      });
    }
  });
});
