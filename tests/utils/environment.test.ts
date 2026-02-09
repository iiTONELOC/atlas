import {describe, expect, test, beforeEach, afterEach} from 'bun:test';

const loadEnv = async () => await import(`../../src/utils/environment?${Math.random()}`);

let originalEnv: NodeJS.ProcessEnv;

const setAllRequiredEnvs = () => {
  process.env.NODE_ENV = 'test';
  process.env.APP_PORT = '5005';
  process.env.DB_HOST = 'test_db';
  process.env.DB_PORT = '3306';
  process.env.DB_NAME = 'atlas_db_test';
  process.env.DB_USER = 'test_user';
  process.env.DB_PASSWORD = 'test_password';
  process.env.DB_ROOT_PASSWORD = 'rootp@ssword';
  process.env.PWD_PEPPER = 'pepper';
  process.env.ARGON2ID_MEMORY = '65536';
  process.env.ARGON2ID_TIME = '3';
};

beforeEach(() => {
  originalEnv = {...process.env};
});

afterEach(() => {
  process.env = {...originalEnv};
});

describe('Environment Utils Tests', () => {
  test('requireEnv retrieves existing variable', async () => {
    setAllRequiredEnvs();
    process.env.TEST_VAR = 'test_value';

    const {requireEnv} = await loadEnv();
    expect(requireEnv('TEST_VAR')).toBe('test_value');
  });

  test('requireEnv throws error for missing variable', async () => {
    setAllRequiredEnvs();

    const {requireEnv} = await loadEnv();
    expect(() => requireEnv('MISSING_VAR')).toThrow(
      'Missing required environment variable: MISSING_VAR',
    );
  });

  describe('requireEnv fuzzing', () => {
    test('throws on invalid names', async () => {
      setAllRequiredEnvs();
      const {requireEnv} = await loadEnv();

      expect(() => requireEnv('')).toThrow();
      expect(() => requireEnv('   ')).toThrow();
      expect(() => requireEnv(null as any)).toThrow();
      expect(() => requireEnv(undefined as any)).toThrow();
    });
  });

  test('PWD_PEPPER is defined', async () => {
    setAllRequiredEnvs();
    process.env.PWD_PEPPER = 'some_pepper_value';

    const {PWD_PEPPER} = await loadEnv();
    expect(PWD_PEPPER).toBe('some_pepper_value');
  });

  describe('PWD_PEPPER fuzzing', () => {
    const cases = ['', ' ', '   ', '\n', '\t'];

    for (const value of cases) {
      test(`throws for value ${JSON.stringify(value)}`, async () => {
        setAllRequiredEnvs();
        process.env.PWD_PEPPER = value;

        await expect(loadEnv()).rejects.toThrow();
      });
    }
  });

  test('ARGON2ID_MEMORY is valid integer within range', async () => {
    setAllRequiredEnvs();
    process.env.ARGON2ID_MEMORY = '65536';

    const {ARGON2ID_MEMORY} = await loadEnv();
    expect(ARGON2ID_MEMORY).toBe(65536);
  });

  describe('ARGON2ID_MEMORY fuzzing', () => {
    const cases = ['not_a_number', '-5', '0', '65534', '1048577', '12.5', '', ' ', '[]', '{}'];

    for (const value of cases) {
      test(`throws for value "${value}"`, async () => {
        setAllRequiredEnvs();
        process.env.ARGON2ID_MEMORY = value;

        await expect(loadEnv()).rejects.toThrow();
      });
    }
  });

  test('ARGON2ID_TIME is valid integer within range', async () => {
    setAllRequiredEnvs();
    process.env.ARGON2ID_TIME = '3';

    const {ARGON2ID_TIME} = await loadEnv();
    expect(ARGON2ID_TIME).toBe(3);
  });

  describe('ARGON2ID_TIME fuzzing', () => {
    const cases = ['not_a_number', '-1', '0', '11', '12.5', '', ' ', '[]', '{}'];

    for (const value of cases) {
      test(`throws for value "${value}"`, async () => {
        setAllRequiredEnvs();
        process.env.ARGON2ID_TIME = value;

        await expect(loadEnv()).rejects.toThrow();
      });
    }
  });

  describe('requireIntEnv tests', () => {
    test('returns integer value', async () => {
      setAllRequiredEnvs();

      const {requireIntEnv} = await loadEnv();
      expect(requireIntEnv('APP_PORT')).toBe(5005);
      expect(requireIntEnv('DB_PORT')).toBe(3306);
    });

    test('throws for missing variable', async () => {
      setAllRequiredEnvs();

      const {requireIntEnv} = await loadEnv();
      expect(() => requireIntEnv('MISSING_INT')).toThrow();
    });

    describe('requireIntEnv fuzzing', () => {
      const cases = ['abc', '12.5', '', ' ', '{}', '[]', '-1'];

      for (const value of cases) {
        test(`throws for value "${value}"`, async () => {
          setAllRequiredEnvs();
          process.env.APP_PORT = value;

          await expect(loadEnv()).rejects.toThrow();
        });
      }
    });
  });
});
