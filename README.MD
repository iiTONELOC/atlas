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

# Start dev stack (API + Web + DB in Docker)
bun run dev
```

- API: http://localhost:3000/graphql
- Web: http://localhost:5173

## Development

### Root Commands

```bash
bun run dev          # Start API + Web + DB (Docker)
bun run dev:web      # Start Web (also brings API + DB via compose)
bun run build        # Build all packages
bun run tests        # Run database tests
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

```env
# Dev (Docker)
NODE_ENV=development
APP_PORT=3000

# Database
DB_HOST=dev_db
DB_PORT=3306
DB_USER=atlas_user
DB_PASSWORD=p@$$w0rd
DB_ROOT_PASSWORD=rootp@ssw0rd
DB_NAME=atlas_db
ARGON2ID_MEMORY=65536
ARGON2ID_TIME=3
PWD_PEPPER=zwjDTxT5YxdWrcBnemVd1g==
```
