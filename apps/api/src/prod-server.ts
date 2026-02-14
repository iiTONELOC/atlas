import {initializeGraphQLServer, getDataSource} from './graphql-server';
import {handleGraphQLRequest} from './graphql-handler';
import {join} from 'node:path';
import {APP_PORT} from 'atlas-database';

const PORT = APP_PORT;
// Use absolute path from the container root, not process.cwd()
const WEB_DIST_ROOT = '/app/apps/web/dist';
const WEB_DIST_PATH = join(WEB_DIST_ROOT, 'client');
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

async function staticFileHandler(requestUrl: URL): Promise<Response> {
  let requestPath = requestUrl.pathname;
  if (requestPath === '/' || requestPath === '') {
    requestPath = 'index.html';
  } else {
    requestPath = requestPath.slice(1);
  }
  let filePath = join(WEB_DIST_PATH, requestPath);
  let file = Bun.file(filePath);
  if (!(await file.exists())) {
    // Fallback to index.html for SPA routes
    filePath = join(WEB_DIST_PATH, 'index.html');
    file = Bun.file(filePath);
  }
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

// Create Bun server that handles both GraphQL and static files

Bun.serve({
  port: PORT,
  async fetch(req: Request) {
    const url = new URL(req.url);
    if (url.pathname === '/graphql') {
      return handleGraphQLRequest(req, apolloServer, getDataSource());
    }
    return staticFileHandler(url);
  },
});

console.log(`✓ Server running on http://localhost:${PORT}`);
console.log(`✓ GraphQL endpoint: http://localhost:${PORT}/graphql`);
