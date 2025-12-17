# Multi-stage build for Node.js TypeScript server

# Stage 1: Build shared package
FROM node:22-alpine AS shared-builder
WORKDIR /app/shared

# Copy shared package files
COPY shared/package*.json ./
RUN npm ci

# Copy shared source and build
COPY shared/ ./
RUN npm run build

# Stage 2: Server dependencies
FROM node:22-alpine AS deps
WORKDIR /app/server

# Copy server package files
COPY server/package*.json ./

# Copy built shared package for installation
COPY --from=shared-builder /app/shared /app/shared

# Install dependencies (including dev dependencies for build stage)
RUN npm ci

# Stage 3: Builder
FROM node:22-alpine AS builder
WORKDIR /app/server

# Copy dependencies from deps stage
COPY --from=deps /app/server/node_modules ./node_modules
COPY --from=shared-builder /app/shared /app/shared

# Copy source code and config files
COPY server/ ./

# Build TypeScript to JavaScript
RUN npm run build

# Stage 4: Production dependencies
FROM node:22-alpine AS prod-deps
WORKDIR /app/server

# Copy package files
COPY server/package*.json ./

# Copy built shared package for production installation
COPY --from=shared-builder /app/shared /app/shared

# Install only production dependencies
RUN npm ci --only=production

# Stage 5: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 serveruser

# Copy production dependencies
COPY --from=prod-deps /app/server/node_modules ./node_modules

# Copy built shared package for runtime
COPY --from=shared-builder /app/shared/dist ./node_modules/@uncharted-lands/shared/dist
COPY --from=shared-builder /app/shared/package.json ./node_modules/@uncharted-lands/shared/

# Copy built application
COPY --from=builder /app/server/dist ./dist

# Copy package.json for metadata
COPY server/package.json ./

# Set ownership to non-root user
RUN chown -R serveruser:nodejs /app

# Switch to non-root user
USER serveruser

# Expose server port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the server
CMD ["node", "dist/index.js"]
