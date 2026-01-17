import {describe, expect, test} from 'bun:test';
import {AppDataSource} from '../../src/db/data-source';

describe('Data Source Tests', () => {
  test('App Data Source Returns Correct Values', () => {
    const options = AppDataSource.options as any;
    expect(options.type).toBe('mariadb');
    expect(options.host).toBe(process.env.DB_HOST);
    expect(options.port).toBe(Number(process.env.DB_PORT));
    expect(options.username).toBe(process.env.DB_USER);
    expect(options.password).toBe(process.env.DB_PASSWORD);
    expect(options.database).toBe(process.env.DB_NAME);
    expect(options.database).toInclude('test');
  });

  test('App Data Source Can Initialize', async () => {
    await AppDataSource.initialize();
    expect(AppDataSource.isInitialized).toBe(true);
    await AppDataSource.destroy();
  });
});
