# Atlas API

GraphQL API server using Apollo Server and Bun.

## Development

```bash
bun run dev
```

Running the dev server with `dev-server.ts`.

## Build

```bash
bun run build
```

## Production

```bash
bun run start
```

Runs the production server with `prod-server.ts`.

## GraphQL Endpoint

- Development: http://localhost:${APP_PORT:-3000}/graphql
- Production: Configured by APP_PORT environment variable
