import {ApolloServer} from '@apollo/server';
import {startStandaloneServer} from '@apollo/server/standalone';
import {AppDataSource} from 'atlas-database';
import {typeDefs} from './schema';
import {resolvers} from './resolvers';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

const PORT = Number(process.env.PORT) || 3000;
const WEB_DIST_PATH = join(import.meta.dirname, '../../web/dist');

// Initialize database
await AppDataSource.initialize()
  .then(() => {
    console.log('✓ Database initialized');
  })
  .catch((error: Error) => {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  });

// Initialize Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const {url} = await startStandaloneServer(server, {
  listen: {port: PORT},
  context: async () => ({
    dataSource: AppDataSource,
  }),
});

console.log(`✓ GraphQL API ready at ${url}`);

// Serve static files for production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && existsSync(WEB_DIST_PATH)) {
  console.error(
    '⚠️  Static file serving is not supported in this standalone server setup. Please use the server-with-static.ts version for production.',
  );
}
