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
} from './entities';
import {DB_HOST, DB_NAME, DB_PORT, DB_USER, DB_PASSWORD} from '../utils/environment';

export const AppDataSource = new DataSource({
  type: 'mariadb',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: true,
  logging: false,
  entities: [
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
  ],
});
