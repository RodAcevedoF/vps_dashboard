# Multi-stage Dockerfile for VPS Dashboard

# Stage 1: Build frontend and backend
FROM oven/bun:1-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY tsconfig*.json ./
RUN bun install --frozen-lockfile

# Copy all source code
COPY server ./server
COPY src ./src
COPY public ./public
COPY rsbuild.config.ts ./rsbuild.config.ts
COPY postcss.config.mjs ./postcss.config.mjs

# Build both frontend (Rsbuild) and backend (TypeScript)
RUN bun run build

# Stage 2: Production
FROM oven/bun:1-alpine

WORKDIR /app

# Install production dependencies only
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy compiled backend from builder stage
COPY --from=builder /app/dist-server ./dist-server

# Expose port
EXPOSE 3010

# Set environment
ENV NODE_ENV=production

# Start server (compiled JavaScript)
CMD ["bun", "run", "dist-server/index.js"]
