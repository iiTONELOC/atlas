import {initializeGraphQLServer, getDataSource} from './graphql-server';
import {handleGraphQLRequest} from './graphql-handler';
import {existsSync} from 'node:fs';
import {join} from 'node:path';

const PORT = Number(process.env.PORT) || 3000;
const WEB_DIST_PATH = join(import.meta.dirname, '../../web/dist');
const isProduction = process.env.NODE_ENV === 'production';

const productionCSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self'",
  "manifest-src 'self'",
].join('; ');

const securityHeaders = {
  'Content-Security-Policy': productionCSP,
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=()',
};

// Initialize GraphQL server (includes database initialization)
const apolloServer = await initializeGraphQLServer();
await apolloServer.start();

// Create Bun server that handles both GraphQL and static files
Bun.serve({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url);

    // Handle GraphQL requests
    if (url.pathname === '/graphql') {
      return handleGraphQLRequest(req, apolloServer, getDataSource());
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
        const headers = new Headers(securityHeaders);
        if (file.type) {
          headers.set('Content-Type', file.type);
        }
        return new Response(file, {headers});
      }
      return new Response('Not Found', {
        status: 404,
        headers: securityHeaders,
      });
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
