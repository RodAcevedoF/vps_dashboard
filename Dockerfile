# Multi-stage Dockerfile for VPS Dashboard

# Stage 1: Build frontend and backend
FROM node:24-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig*.json ./
RUN npm ci

# Copy all source code
COPY server ./server
COPY src ./src
COPY public ./public
COPY rsbuild.config.ts ./rsbuild.config.ts
COPY postcss.config.mjs ./postcss.config.mjs

# Build both frontend (Rsbuild) and backend (TypeScript)
RUN npm run build

# Stage 2: Production
FROM node:20-alpine

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy compiled backend from builder stage
COPY --from=builder /app/dist-server ./dist-server

# Expose port
EXPOSE 3010

# Set environment
ENV NODE_ENV=production

# Start server (compiled JavaScript)
CMD ["node", "dist-server/index.js"]
