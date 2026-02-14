FROM oven/bun:latest

WORKDIR /app

# Copy dependency files
COPY package.json bun.lockb* tsconfig.json ./

# Install dependencies
RUN bun install

# Default command (can be overridden)
CMD ["bun", "run", "dev"]
