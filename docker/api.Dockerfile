FROM oven/bun:latest

WORKDIR /app

# Copy entire monorepo so workspaces resolve
COPY . .

# Install after everything is present (workspace linking)
RUN bun install

EXPOSE ${APP_PORT:-3000}

CMD ["bun", "--cwd", "apps/api", "start"]
