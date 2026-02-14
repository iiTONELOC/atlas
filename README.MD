# Atlas Monorepo

TrashScanner™ Platform - GraphQL API and Web Application

## Overview

This monorepo contains the core components of the TrashScanner™ platform:

- **API Server**: GraphQL API built with Apollo Server and Bun
- **Web App**: Frontend built with Vite, React, and TypeScript
- **Database Package**: Shared TypeORM layer for database interactions
- **Docker Compose**: For local development with API, Web, and MariaDB
- **Bun Workspaces**: For seamless development across packages

## Structure

- **`apps/api`** - GraphQL API server (Bun + Apollo Server)
- **`apps/web`** - Web application (Vite + React + PWA)
- **`packages/database`** - Shared database layer (TypeORM)

## Quick Start

```bash
# Install dependencies for all workspaces
bun install

# Create your .env.local file (copy from example)
cp .env.test .env.local

# Start dev stack (API + Web + DB in Docker)
bun run docker
```

- API: http://localhost:${APP_PORT:-3000}/graphql (default: 3000)
- Web: http://localhost:${VITE_PORT:-5173} (default: 5173)

## Development

### Root Commands

```bash
 bun run docker       # Start API + Web + DB (Docker)
 bun run build        # Build all packages
 bun run tests        # Run database tests
 bun run docker:prod  # Docker production stack
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

## Tech Stack

- **Runtime**: Bun
- **API**: Apollo Server + GraphQL
- **Frontend**: Vite + React + TypeScript
- **Database**: TypeORM + MariaDB
- **PWA**: vite-plugin-pwa
- **Monorepo**: Bun Workspaces

## Environment Variables

Environment files are located at the root:

- `.env.local` - Development environment (Docker)
- `.env.test` - Test environment

Create `.env.local` from the example:

```bash
cp .env.test .env.local

# change values as needed for your local development environment
```

Example configuration:

```env
# Dev (Docker)
NODE_ENV=development
APP_PORT=3000
VITE_PORT=5173

# Database
DB_HOST=dev_db
DB_PORT=3306
DB_USER=atlas_user
DB_PASSWORD=p@$$w0rd
DB_ROOT_PASSWORD=rootp@ssw0rd
DB_NAME=atlas_db
# Argon2id settings (range: 65536-1048576). The minimum is a validation floor, not a recommendation.
ARGON2ID_MEMORY=65536
# Argon2id settings (range: 1-10). The minimum is a validation floor, not a recommendation.
ARGON2ID_TIME=3
PWD_PEPPER=zwjDTxT5YxdWrcBnemVd1g==
```

## Deployment

### Heroku with Docker

```bash
# Login and create app
heroku login
heroku create your-app-name

# Add MySQL database
heroku addons:create jawsdb:kitefin -a your-app-name

# Set environment variables - do not use the default ARGON values!
heroku config:set NODE_ENV=production -a your-app-name
heroku config:set PWD_PEPPER=$(openssl rand -base64 16) -a your-app-name
heroku config:set ARGON2ID_MEMORY=65536 -a your-app-name
heroku config:set ARGON2ID_TIME=3 -a your-app-name

# Deploy with Docker
bun run heroku:deploy

# Or manually:
heroku container:login
heroku container:push web -a your-app-name
heroku container:release web -a your-app-name

# Open app
heroku open -a your-app-name
```

The app will automatically parse the `JAWSDB_URL` environment variable for database connection.

### Test Production Build Locally

```bash
# Run production build with Docker
bun run docker:prod

# Access at http://localhost:3000
```

This simulates the production environment locally with MariaDB.
