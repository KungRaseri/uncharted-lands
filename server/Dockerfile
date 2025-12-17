# Multi-stage build for Node.js TypeScript server

# Stage 1: Build shared package
FROM node:22-alpine AS shared-builder
WORKDIR /app

# Copy root package files for workspace setup
COPY package.json package-lock.json ./

# Copy base TypeScript config (shared tsconfig extends this)
COPY tsconfig.base.json ./

# Copy shared package files
COPY shared/package.json ./shared/

# Install all workspace dependencies
RUN npm ci

# Copy shared source and build
COPY shared/ ./shared/
RUN npm run build:shared

# Stage 2: Server dependencies
FROM node:22-alpine AS deps
WORKDIR /app

# Copy root package files for workspace setup
COPY package.json package-lock.json ./
COPY tsconfig.base.json ./

# Copy server and shared package files
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY --from=shared-builder /app/shared/dist ./shared/dist/

# Install all workspace dependencies (including dev dependencies for build stage)
RUN npm ci

# Stage 3: Builder
FROM node:22-alpine AS builder
WORKDIR /app

# Copy root package.json for workspace scripts
COPY package.json ./

# Copy base TypeScript config (server tsconfig extends this)
COPY tsconfig.base.json ./

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/shared ./shared

# Copy server source code and config files
COPY server/ ./server/

# Build TypeScript to JavaScript (run from workspace root)
RUN npm run build:server
# Stage 4: Production dependencies
FROM node:22-alpine AS prod-deps
WORKDIR /app

# Copy root package files for workspace setup
COPY package.json package-lock.json ./

# Copy server and shared package files
COPY server/package.json ./server/
COPY shared/package.json ./shared/
COPY --from=shared-builder /app/shared/dist ./shared/dist/

# Install only production dependencies
RUN npm ci --omit=dev

# Stage 5: Runner
FROM node:22-alpine AS runner
WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
  adduser --system --uid 1001 serveruser

# Copy production dependencies (entire node_modules with workspace structure)
COPY --from=prod-deps /app/node_modules ./node_modules

# Copy built shared package
COPY --from=shared-builder /app/shared/dist ./node_modules/@uncharted-lands/shared/dist
COPY --from=shared-builder /app/shared/package.json ./node_modules/@uncharted-lands/shared/

# Copy built server application
COPY --from=builder /app/server/dist ./dist

# Copy server package.json for metadata
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
