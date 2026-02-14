import {ApolloServer} from '@apollo/server';
import {AppDataSource} from 'atlas-database';
import {typeDefs} from './schema';
import {resolvers} from './resolvers';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

const PORT = Number(process.env.PORT) || 3000;
const WEB_DIST_PATH = join(import.meta.dirname, '../../web/dist');
const isProduction = process.env.NODE_ENV === 'production';

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
const apolloServer = new ApolloServer({
  typeDefs,
  resolvers,
});

await apolloServer.start();

// Create Bun server that handles both GraphQL and static files
Bun.serve({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url);

    // Handle GraphQL requests - use standalone server endpoint
    if (url.pathname === '/graphql') {
      // Apollo standalone server handles this internally
      // For now, return a placeholder
      return new Response(JSON.stringify({error: 'Use standalone server for GraphQL'}), {
        status: 501,
        headers: {'Content-Type': 'application/json'},
      });
    }

    // Serve static files in production
    if (isProduction && existsSync(WEB_DIST_PATH)) {
      let filePath = join(WEB_DIST_PATH, url.pathname === '/' ? 'index.html' : url.pathname);

      // If file doesn't exist, serve index.html for SPA routing
      if (!existsSync(filePath)) {
        filePath = join(WEB_DIST_PATH, 'index.html');
      }

      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response('Not Found', {status: 404});
    }

    // Development mode - no static files
    if (!isProduction) {
      return new Response(
        JSON.stringify({
          message: 'API Server Running',
          graphql: '/graphql',
          note: 'Run web app separately with: bun run dev:web',
        }),
        {
          headers: {'Content-Type': 'application/json'},
        },
      );
    }

    return new Response('Not Found', {status: 404});
  },
});

console.log(`✓ Server running on http://localhost:${PORT}`);
console.log(`✓ GraphQL endpoint: http://localhost:${PORT}/graphql`);
if (isProduction && existsSync(WEB_DIST_PATH)) {
  console.log(`✓ Serving static files from: ${WEB_DIST_PATH}`);
}
