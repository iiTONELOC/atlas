import {describe, expect, test} from 'bun:test';
import {
  validatePassword,
  isBreachedPassword,
  validatePasswordStrength,
} from '../../src/utils/password-check';

describe('Password Check Utils Tests', () => {
  describe('isBreachedPassword', () => {
    test('detects known breached password', async () => {
      await expect(isBreachedPassword('password123')).resolves.toBe(true);
    });

    test('returns boolean for arbitrary input', async () => {
      const cases = ['', ' ', '   ', '\n', '\t', '🔥🔥🔥', 'A'.repeat(512)];
      for (const pwd of cases) {
        const result = await isBreachedPassword(pwd);
        expect(typeof result).toBe('boolean');
      }
    });

    test('throws on HIBP failure', async () => {
      const originalFetch = globalThis.fetch;
      globalThis.fetch = (async () => new Response(null, {status: 500})) as any;

      await expect(isBreachedPassword('anything')).rejects.toThrow('HIBP lookup failed');

      globalThis.fetch = originalFetch;
    });
  });

  describe('validatePasswordStrength', () => {
    test('accepts strong diverse password', async () => {
      await expect(validatePasswordStrength('Str0ngPassphrase2025!')).resolves.toBeUndefined();
    });

    test('accepts long passphrase with sufficient diversity', async () => {
      await expect(
        validatePasswordStrength('correct horse battery staple 2025!'),
      ).resolves.toBeUndefined();
    });

    test('rejects passwords shorter than minimum length', async () => {
      await expect(validatePasswordStrength('short')).rejects.toThrow();
    });

    test('rejects low-diversity passwords', async () => {
      const cases = [
        'aaaaaaaaaaaaaaaa',
        'AAAAAAAAAAAAAAAA',
        '1111111111111111',
        '!!!!!!!!!!!!!!!!',
      ];

      for (const pwd of cases) {
        await expect(validatePasswordStrength(pwd)).rejects.toThrow();
      }
    });

    test('rejects excessive repeated characters', async () => {
      await expect(validatePasswordStrength('AAAAAAAAbbbbbbbb!!!!')).rejects.toThrow();
    });
  });

  describe('validatePassword', () => {
    test('rejects weak password before breach check', async () => {
      await expect(validatePassword('password123')).rejects.toThrow();
    });

    test('rejects breached password when strength passes', async () => {
      await expect(validatePassword('Password123!Password123!')).rejects.toThrow(
        'Password has been found in data breaches; choose a different password',
      );
    });

    test('accepts strong non-breached password', async () => {
      await expect(validatePassword('Un1queStrongPassphrase2026!')).resolves.toBeUndefined();
    });
  });
});
