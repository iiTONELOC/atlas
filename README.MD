# Atlas Monorepo

TrashScanner™ Platform - GraphQL API and Web Application

## Structure

- **`apps/api`** - GraphQL API server (Bun + Apollo Server)
- **`apps/web`** - Web application (Vite + React + PWA)
- **`packages/database`** - Shared database layer (TypeORM)

## Quick Start

```bash
# Install dependencies for all workspaces
bun install

# Start API server (Terminal 1)
bun run dev

# Start web app (Terminal 2)
bun run dev:web
```

- API: http://localhost:3000/graphql
- Web: http://localhost:3000

## Development

### Root Commands

```bash
bun run dev          # Start API server
bun run dev:web      # Start web app
bun run build        # Build all packages
bun run test         # Run tests
```

### Individual Package Commands

```bash
# Database package
cd packages/database
bun test

# API server
cd apps/api
bun run dev

# Web app
cd apps/web
bun run dev
```

## Deployment (Heroku)

Single dyno deployment serving both API and static web files.

```bash
git push heroku main
```

The build process:

1. Installs all workspace dependencies
2. Builds database package (TypeScript)
3. Builds web app (static files → `apps/web/dist/`)
4. Builds API server (serves GraphQL + static files)

See [MIGRATION.md](MIGRATION.md) for detailed migration and setup instructions.

## Tech Stack

- **Runtime**: Bun
- **API**: Apollo Server + GraphQL
- **Frontend**: Vite + React + TypeScript
- **Database**: TypeORM + MariaDB
- **PWA**: vite-plugin-pwa
- **Monorepo**: Bun Workspaces

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=atlas

# API
PORT=3000
NODE_ENV=development
```

## License

See LICENSE file for details.
