import {startStandaloneServer} from '@apollo/server/standalone';
import {initializeGraphQLServer, getDataSource} from './graphql-server';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

const PORT = Number(process.env.PORT) || 3000;
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

if (isProduction && existsSync(WEB_DIST_PATH)) {
  console.error(
    '⚠️  Static file serving is not supported in this standalone server setup. Please use the server-with-static.ts version for production.',
  );
}
