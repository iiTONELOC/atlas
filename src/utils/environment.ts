/**
 * Retrieves a required environment variable value.
 *
 * @param name - The name of the environment variable to retrieve
 * @returns The value of the environment variable as a string
 * @throws {Error} If the environment variable name is invalid (not a string or empty)
 * @throws {Error} If the environment variable is not set or is an empty string
 *
 * @example
 * ```typescript
 * const apiKey = requireEnv('API_KEY');
 * // Returns the value of API_KEY environment variable
 * ```
 */
export const requireEnv = (name: string): string => {
  if (typeof name !== 'string' || name.trim() === '') {
    throw new Error('Invalid environment variable name');
  }

  const value = process.env[name];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
};

/**
 * Retrieves a required environment variable value as a non-negative integer.
 *
 * @param name - The name of the environment variable to retrieve
 * @returns The value of the environment variable as a non-negative integer
 * @throws {Error} If the environment variable name is invalid (not a string or empty)
 * @throws {Error} If the environment variable is not set, is an empty string, or is not a valid non-negative integer
 *
 * @example
 * ```typescript
 * const port = requireIntEnv('APP_PORT');
 * // Returns the value of APP_PORT environment variable as a number
 * ```
 */
export const requireIntEnv = (name: string): number => {
  const raw = requireEnv(name);

  if (raw.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  const value = Number(raw);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${name} must be a non-negative integer`);
  }

  return value;
};

export const NODE_ENV = requireEnv('NODE_ENV');
export const DB_HOST = requireEnv('DB_HOST');
export const DB_NAME = requireEnv('DB_NAME');
export const DB_USER = requireEnv('DB_USER');
export const DB_PASSWORD = requireEnv('DB_PASSWORD');
export const DB_ROOT_PASSWORD = requireEnv('DB_ROOT_PASSWORD');
export const PWD_PEPPER = requireEnv('PWD_PEPPER');
export const APP_PORT = requireIntEnv('APP_PORT');
export const DB_PORT = requireIntEnv('DB_PORT');
export const ARGON2ID_MEMORY = (() => {
  const memory = requireIntEnv('ARGON2ID_MEMORY');
  if (memory < 65536 || memory > 1048576) {
    throw new Error('ARGON2ID_MEMORY must be between 65536 and 1048576');
  }
  return memory;
})();

export const ARGON2ID_TIME = (() => {
  const time = requireIntEnv('ARGON2ID_TIME');
  if (time < 1 || time > 10) {
    throw new Error('ARGON2ID_TIME must be between 1 and 10');
  }
  return time;
})();
