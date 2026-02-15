import 'reflect-metadata';
import {DataSource} from 'typeorm';
import {
  User,
  List,
  Token,
  Source,
  Product,
  Session,
  ListItem,
  UserProduct,
  Credentials,
  RateLimitBucket,
} from '../src/db/entities';
import {DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME} from '../src/utils/environment';

export async function createTestDataSource() {
  const dataSource = new DataSource({
    type: 'mariadb',
    host: DB_HOST,
    port: DB_PORT,
    username: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME, // Use the actual DB name from Docker
    synchronize: true,
    dropSchema: false,
    logging: false,
    entities: [
      User,
      List,
      Token,
      Source,
      Session,
      Product,
      ListItem,
      UserProduct,
      Credentials,
      RateLimitBucket,
    ],
  });

  await dataSource.initialize();

  // Clear all tables before tests
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 0');
  await dataSource.query('TRUNCATE TABLE user');
  await dataSource.query('TRUNCATE TABLE credentials');
  await dataSource.query('TRUNCATE TABLE session');
  await dataSource.query('TRUNCATE TABLE list');
  await dataSource.query('TRUNCATE TABLE list_item');
  await dataSource.query('TRUNCATE TABLE user_product');
  await dataSource.query('TRUNCATE TABLE product');
  await dataSource.query('TRUNCATE TABLE source');
  await dataSource.query('TRUNCATE TABLE token');
  await dataSource.query('TRUNCATE TABLE rate_limit_bucket');
  await dataSource.query('SET FOREIGN_KEY_CHECKS = 1');

  return dataSource;
}

export async function cleanupTestDataSource(dataSource: DataSource) {
  if (dataSource?.isInitialized) {
    await dataSource.destroy();
  }
}
