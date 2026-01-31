# Atlas

This repository provides a **portable development-first environment** using **Bun**, **TypeScript**, **Docker**, and a **real MariaDB server**, designed to support local and remote development today while forming the foundation for the rest of the build, without installing Bun or MariaDB on the host.

## Requirements

- Docker Engine or Docker Desktop (Windows/macOS)
- Docker Compose

## Configuration

All runtime configuration is controlled via environment variables:

- `NODE_ENV` - Environment mode (`development`, `test`)
- `APP_PORT` - Application port (dev: `5000`, test: `5005`)
- `DB_HOST` - Database host (matches compose service name: `dev_db` or `test_db`)
- `DB_PORT` - Database port (default: `3306`)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `DB_ROOT_PASSWORD` - Database root password

Environment files:

- `.env.test` - Test environment configuration (used automatically with test commands)
- Create `.env.dev` for dev environment if needed

## Docker Setup

The project uses:

- **One Dockerfile** - flexible, no hardcoded commands or environments
- **Separate compose files** - `docker-compose.dev.yml` and `docker-compose.test.yml` with different service names and defaults

## Docker Commands

### Development

```bash
# Start dev server with hot reload
bun run docker:dev

# Stop dev containers
bun run docker:dev-down

# Stop and remove dev volumes (deletes database data)
bun run docker:dev-clean

# Get a shell in a new dev container
bun run docker:dev-shell
```

### Testing

```bash
# Run tests once
bun run docker:test

# Run tests in watch mode
bun run docker:test-watch

# Stop and remove test volumes
bun run docker:test-clean

# Get a shell in a new test container
bun run docker:test-shell
```

### Custom Commands

Run any command you want in a container:

```bash
# Dev environment
docker compose -f docker-compose.dev.yml run --rm dev_app bun <any-command>
docker compose -f docker-compose.dev.yml exec dev_app /bin/sh

# Test environment
docker compose -f docker-compose.test.yml run --rm test_app bun test
docker compose -f docker-compose.test.yml run --rm test_app /bin/sh

# Override with different env files
docker compose --env-file .env.custom -f docker-compose.dev.yml up
```

## Database Persistence

Database data is stored in separate Docker volumes:

- Dev: `atlas_db-dev-data`
- Test: `atlas_db-test-data`

```bash
# List all volumes
docker volume ls

# Inspect a specific volume
docker volume inspect atlas_db-dev-data
```

## Formatting

Prettier is installed as a dev dependency and configured via `.prettierrc.ts`.

## Notes

- This setup is **development-focused**, optimized for iteration, hot reload, and local testing
- The Docker structure is intentionally compatible with a future **production build** (separate prod Dockerfile / compose)
- No runtime dependencies have to be installed on the host beyond Docker / Docker Compose
- Bun provides a faster than Node.js runtime with native TypeScript support and runs in the app container
- TypeScript is used for type safety and developer experience
- The MariaDB server is initialized with a provided SQL script on first run
- MariaDB runs as a real database server in its own container
