# Atlas

This repository provides a **portable development-first environment** using **Bun**, **TypeScript**, **Docker**, and a **real MariaDB server**, designed to support local and remote development today while forming the foundation for the rest of the build, without installing Bun or MariaDB on the host.

## Requirements

- Docker Engine or Docker Desktop (Windows/macOS)
- Docker Compose

## Configuration

All runtime configuration is controlled via environment variables defined in `.env`:

- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`
- `DB_ROOT_PASSWORD`
- `DB_HOST`
- `DB_PORT`
- `APP_PORT`

An `.env.test` file is provided as a template. Copy it to `.env` and adjust values as needed.

## Running the Dev Environment

```bash
bun dev-up
```

This command starts:

- A Bun + TypeScript development container with hot reload
- A MariaDB server container
- Automatic database initialization via `db/init.sql`

## Database Persistence

Database data is stored in a **named Docker volume** declared as `db-dev-data`, but **Compose will create it on the host with a project prefix**, typically:

- `<project>_db-dev-data` (example: `atlas_db-dev-data`)

To find the exact volume name and location:

```bash
docker volume ls | grep db-dev-data
# then
docker volume inspect <project>_db-dev-data
```

## Formatting

Prettier is installed as a dev dependency and configured via `.prettierrc.ts`.

## Stopping and Cleanup

Stop containers:

```bash
bun dev-down
```

Remove containers **and** database data:

```bash
bun dev-delete
```

## Testing

For local, dependency-free testing, use the following command(s) to run the tests inside a Docker container:

```bash
# runs tests, stops containers after completion
bun test-up

# to run tests & watch for changes
bun test-dev # use ctrl+c to stop

# To remove any test container data
bun test-delete
```

## Notes

- This setup is **development-focused**, optimized for iteration, hot reload, and local testing
- The Docker structure is intentionally compatible with a future **production build** (separate prod Dockerfile / compose)
- No runtime dependencies have to be installed on the host beyond Docker / Docker Compose
- Bun provides a faster than Node.js runtime with native TypeScript support and runs in the app container
- TypeScript is used for type safety and developer experience
- The MariaDB server is initialized with a provided SQL script on first run
- MariaDB runs as a real database server in its own container
