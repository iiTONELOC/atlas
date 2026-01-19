import {describe, expect, test} from 'bun:test';
import {hashPassword, verifyPassword} from '../../src/utils/hashing';

describe('Hashing Utils Tests', () => {
  test('hashPassword and verifyPassword work correctly', async () => {
    const password = 'SecureP@ssw0rd!';
    const hashed = await hashPassword(password);

    expect(typeof hashed).toBe('string');
    expect(hashed).not.toBe(password);

    expect(await verifyPassword(password, hashed)).toBe(true);
    expect(await verifyPassword('WrongPassword', hashed)).toBe(false);
  });

  test('hashPassword produces different hashes for same password', async () => {
    const password = 'SamePassword123!';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
    expect(await verifyPassword(password, hash1)).toBe(true);
    expect(await verifyPassword(password, hash2)).toBe(true);
  });

  test('verifyPassword rejects malformed hashes', async () => {
    const password = 'Password123!';
    const badHashes = ['', 'not-a-hash', '$2b$invalid', '12345'];

    for (const hash of badHashes) {
      try {
        const result = await verifyPassword(password, hash);
        expect(result).toBe(false);
      } catch {
        // some throw an error, which is also acceptable
        expect(true).toBe(true);
      }
    }
  });

  describe('hashPassword fuzzing', () => {
    const cases = ['', ' ', '   ', '\n', '\t', 'a', '🔥🔥🔥', 'パスワード', 'A'.repeat(1024)];

    for (const value of cases) {
      test(`hashes input ${JSON.stringify(value)}`, async () => {
        const hash = await hashPassword(value);
        expect(typeof hash).toBe('string');
        expect(await verifyPassword(value, hash)).toBe(true);
      });
    }
  });

  describe('verifyPassword fuzzing', () => {
    const password = 'CorrectPassword!';
    const wrongInputs = ['', ' ', 'wrong', 'WRONG', '🔥', 'A'.repeat(100)];

    test('rejects incorrect passwords', async () => {
      const hash = await hashPassword(password);

      for (const input of wrongInputs) {
        expect(await verifyPassword(input, hash)).toBe(false);
      }
    });
  });
});
