FROM oven/bun:latest AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock* ./
COPY packages/database/package.json ./packages/database/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN bun install

# Copy source code
COPY . .

# Build all packages
RUN bun run build

# Production stage
FROM oven/bun:latest

WORKDIR /app

# Copy only what's needed for production
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/package.json ./

# Heroku sets PORT dynamically
ENV NODE_ENV=production

CMD ["bun", "run", "start"]
