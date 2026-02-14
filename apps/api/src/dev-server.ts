import {join} from 'node:path';
import {APP_PORT} from 'atlas-database';
import {startStandaloneServer} from '@apollo/server/standalone';
import {initializeGraphQLServer, getDataSource} from './graphql-server';

const PORT = APP_PORT;
const WEB_DIST_PATH = join(import.meta.dirname, '../../web/dist');

// Initialize GraphQL server (includes database initialization)
const server = await initializeGraphQLServer();

const {url} = await startStandaloneServer(server, {
  listen: {port: PORT},
  context: async () => ({
    dataSource: getDataSource(),
  }),
});

console.log(`✓ GraphQL API ready at ${url}`);

// Serve static files for production
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  const distExists = await Bun.file(WEB_DIST_PATH).exists();
  if (distExists) {
    console.error(
      '⚠️  Static file serving is not supported in this standalone server setup. Please use prod-server.ts for production.',
    );
  }
}
