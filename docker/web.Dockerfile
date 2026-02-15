FROM oven/bun:latest

WORKDIR /app

# Copy entire monorepo so workspaces resolve
COPY . .

# Install after everything is present
RUN bun install

EXPOSE ${VITE_PORT:-5173}

CMD ["bun", "--cwd", "apps/web", "dev"]
