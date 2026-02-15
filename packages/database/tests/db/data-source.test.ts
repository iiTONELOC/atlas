import {describe, expect, test} from 'bun:test';
import {AppDataSource} from '../../src/data-source';
import {DB_HOST, DB_NAME, DB_PORT, DB_USER, DB_PASSWORD} from '../../src/utils/environment';

describe('Data Source Tests', () => {
  test('App Data Source Returns Correct Values', () => {
    const options = AppDataSource.options as any;
    expect(options.type).toBe('mariadb');
    expect(options.host).toBe(DB_HOST);
    expect(options.port).toBe(Number(DB_PORT));
    expect(options.username).toBe(DB_USER);
    expect(options.password).toBe(DB_PASSWORD);
    expect(options.database).toBe(DB_NAME);
    expect(options.database).toInclude('test');
  });

  test('App Data Source Can Initialize', async () => {
    await AppDataSource.initialize();
    expect(AppDataSource.isInitialized).toBe(true);
    await AppDataSource.destroy();
  });
});
