# Environment Setup Guide

This guide explains how to configure environment variables for the **Uncharted Lands** monorepo.

---

## 📁 Environment Files Overview

Each package has its own environment configuration:

```
uncharted-lands/
├── client/.env          # Client environment (SvelteKit)
├── server/.env          # Server environment (Node.js + Socket.IO)
└── shared/              # No environment needed (types only)
```

**Important**: There is **NO root `.env` file** - each package is configured independently.

---

## 🚀 Quick Start

### 1. Client Setup

```bash
cd client
cp .env.example .env
```

**Edit `client/.env`:**

```bash
# Development (local server)
SERVER_API_URL=http://localhost:3001/api
PUBLIC_CLIENT_API_URL=http://localhost:3001/api
PUBLIC_WS_URL=http://localhost:3001

# Environment
NODE_ENV=development
```

### 2. Server Setup

```bash
cd server
cp .env.example .env
```

**Edit `server/.env`:**

```bash
# Server
PORT=3001
HOST=0.0.0.0
NODE_ENV=development

# Database (local PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/uncharted-lands"

# CORS (must match client URL)
CORS_ORIGINS=http://localhost:5173

# Game Configuration
TICK_RATE=60
RESOURCE_INTERVAL_SEC=3600
SOCKET_EMIT_INTERVAL_SEC=1
```

### 3. Verify Setup

```bash
# From root directory
npm run check    # TypeScript validation
npm run dev      # Start both client + server
```

---

## 🔗 How Client & Server Connect

### Development (Local)

```
┌─────────────────────────────────────────────────┐
│ Browser (http://localhost:5173)                 │
│  - SvelteKit Dev Server                         │
│  - CLIENT env: PUBLIC_CLIENT_API_URL            │
│  - WebSocket: PUBLIC_WS_URL                     │
└──────────────────┬──────────────────────────────┘
                   │
                   │ HTTP/WebSocket
                   │
┌──────────────────▼──────────────────────────────┐
│ Node.js Server (http://localhost:3001)          │
│  - SERVER env: PORT=3001                        │
│  - CORS_ORIGINS=http://localhost:5173           │
└─────────────────────────────────────────────────┘
```

**Key Points:**

- Client's `PUBLIC_CLIENT_API_URL` → Server's `http://localhost:${PORT}`
- Server's `CORS_ORIGINS` → Client's dev URL (`http://localhost:5173`)
- WebSocket connects via `PUBLIC_WS_URL` → Server's base URL

### Production (Deployed)

```
┌─────────────────────────────────────────────────┐
│ Browser (https://uncharted-lands.vercel.app)    │
│  - SvelteKit SSR + Static                       │
│  - CLIENT env: PUBLIC_CLIENT_API_URL            │
│  - WebSocket: PUBLIC_WS_URL                     │
└──────────────────┬──────────────────────────────┘
                   │
                   │ HTTPS/WSS
                   │
┌──────────────────▼──────────────────────────────┐
│ Node Server (https://server.railway.app)        │
│  - SERVER env: PORT (set by Railway)            │
│  - CORS_ORIGINS=https://uncharted-lands.vercel.app │
└─────────────────────────────────────────────────┘
```

**Key Points:**

- Client's `PUBLIC_CLIENT_API_URL` = `https://server.railway.app/api`
- Client's `PUBLIC_WS_URL` = `https://server.railway.app` (Socket.IO upgrades to WSS)
- Server's `CORS_ORIGINS` = `https://uncharted-lands.vercel.app`
- Server's `PORT` is set automatically by hosting platform

---

## 📚 Environment Variable Reference

### Client Variables

| Variable | Scope | Description | Example (Dev) | Example (Prod) |
|----------|-------|-------------|---------------|----------------|
| `SERVER_API_URL` | **Server-only** | API URL for SSR (hooks.server.ts, +page.server.ts) | `http://localhost:3001/api` | `https://server.railway.app/api` |
| `PUBLIC_CLIENT_API_URL` | **Browser** | API URL for client components (.svelte) | `http://localhost:3001/api` | `https://server.railway.app/api` |
| `PUBLIC_WS_URL` | **Browser** | WebSocket server URL | `http://localhost:3001` | `https://server.railway.app` |
| `NODE_ENV` | Both | Environment mode | `development` | `production` |
| `SENTRY_DSN` | Both | Error tracking (optional) | `disabled` | `https://...@sentry.io/...` |

**SvelteKit Rules:**

- `PUBLIC_` prefix = accessible in browser
- No `PUBLIC_` prefix = server-only (hooks, load functions)

### Server Variables

| Variable | Description | Example (Dev) | Example (Prod) |
|----------|-------------|---------------|----------------|
| `PORT` | Server port | `3001` | Auto-set by Railway/Render |
| `HOST` | Bind address | `0.0.0.0` | `0.0.0.0` |
| `NODE_ENV` | Environment mode | `development` | `production` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://postgres:password@localhost:5432/uncharted-lands` | Auto-set by Railway/Neon |
| `CORS_ORIGINS` | Allowed origins (comma-separated) | `http://localhost:5173` | `https://uncharted-lands.vercel.app` |
| `TICK_RATE` | Game loop frequency (ticks/sec) | `60` | `60` |
| `RESOURCE_INTERVAL_SEC` | Resource update interval | `3600` (1 hour) | `3600` |
| `SOCKET_EMIT_INTERVAL_SEC` | WebSocket emit frequency | `1` | `1` |
| `LOG_LEVEL` | Logging verbosity | `DEBUG` | `INFO` |
| `SENTRY_DSN` | Error tracking (optional) | `disabled` | `https://...@sentry.io/...` |

---

## 🐳 Docker / E2E Testing

For E2E tests, special environment configuration is used:

**`docker-compose.e2e.yml`:**

```yaml
server-test:
  environment:
    DATABASE_URL: postgresql://uncharted_user:uncharted_password@postgres-test:5432/uncharted_test
    CORS_ORIGINS: http://client-test:5173
    NODE_ENV: e2e

client-test:
  environment:
    SERVER_API_URL: http://server-test:3001/api          # Container-to-container
    PUBLIC_CLIENT_API_URL: http://localhost:3001/api      # Browser-to-host
    PUBLIC_WS_URL: http://localhost:3001                  # Browser-to-host
    NODE_ENV: e2e
```

**Key Differences:**

- **Container-to-container**: Uses service names (`server-test`, `postgres-test`)
- **Browser-to-host**: Uses `localhost` (port mapping exposes services)
- **Test database**: Separate PostgreSQL on port `5433` (avoids conflicts)

---

## 🌍 Deployment Checklist

### Vercel (Client)

1. **Environment Variables** (Vercel Dashboard):

   ```
   SERVER_API_URL=https://your-server.railway.app/api
   PUBLIC_CLIENT_API_URL=https://your-server.railway.app/api
   PUBLIC_WS_URL=https://your-server.railway.app
   NODE_ENV=production
   SENTRY_DSN=https://...@sentry.io/... (optional)
   ```

2. **Build Settings**:
   - Framework: SvelteKit
   - Build Command: `npm run build`
   - Output Directory: `.svelte-kit` (auto-detected)

### Railway / Render (Server)

1. **Environment Variables** (Railway/Render Dashboard):

   ```
   NODE_ENV=production
   CORS_ORIGINS=https://uncharted-lands.vercel.app
   LOG_LEVEL=INFO
   SENTRY_DSN=https://...@sentry.io/... (optional)
   
   # Auto-set by platform:
   PORT=<auto>
   DATABASE_URL=<auto> (if using Railway PostgreSQL)
   ```

2. **Database Setup**:
   - Railway: Add PostgreSQL plugin (sets `DATABASE_URL` automatically)
   - Render: Create PostgreSQL instance, copy connection string

3. **Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `npm start`

### Database Migration (Production)

After deploying server:

```bash
# Option 1: Railway CLI
railway run npm run db:migrate:run

# Option 2: Render Shell
npm run db:migrate:run

# Option 3: Manual (from local machine)
DATABASE_URL="<production-db-url>" npm run db:migrate:run
```

---

## 🐛 Troubleshooting

### Client Can't Connect to Server

**Symptoms:**

- WebSocket connection fails
- API requests return CORS errors

**Solutions:**

1. **Check CORS configuration**:

   ```bash
   # Server .env must include client URL
   CORS_ORIGINS=http://localhost:5173
   ```

2. **Verify URLs match**:

   ```bash
   # Client .env
   PUBLIC_CLIENT_API_URL=http://localhost:3001/api
   PUBLIC_WS_URL=http://localhost:3001
   
   # Server .env
   PORT=3001
   ```

3. **Check server is running**:

   ```bash
   curl http://localhost:3001/health
   # Should return: {"status":"ok","timestamp":...}
   ```

### Database Connection Fails

**Symptoms:**

- Server crashes on startup
- "DATABASE_URL not set" error

**Solutions:**

1. **Verify DATABASE_URL format**:

   ```bash
   # Correct format:
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   
   # Example (local):
   DATABASE_URL="postgresql://postgres:password@localhost:5432/uncharted-lands"
   
   # Example (Neon):
   DATABASE_URL="postgresql://user:pass@ep-xxx.us-east-2.aws.neon.tech/db?sslmode=require"
   ```

2. **Test connection**:

   ```bash
   psql $DATABASE_URL -c "SELECT 1"
   ```

3. **Check PostgreSQL is running**:

   ```bash
   # Windows (PowerShell)
   Get-Service postgresql*
   
   # Mac/Linux
   sudo systemctl status postgresql
   ```

### Environment Variables Not Loading

**Symptoms:**

- Variables show as `undefined`
- "Cannot read env variable" errors

**Solutions:**

1. **Check file exists**:

   ```bash
   ls -la .env  # Should exist in client/ or server/ directory
   ```

2. **Verify file format** (no BOM, UTF-8):

   ```bash
   # No spaces around =
   PORT=3001  ✅
   PORT = 3001  ❌
   
   # No quotes needed (unless value has spaces)
   DATABASE_URL=postgresql://...  ✅
   DATABASE_URL="postgresql://..."  ✅ (also works)
   ```

3. **Restart dev server**:

   ```bash
   # Environment changes require restart
   npm run dev
   ```

### Docker E2E Tests Fail

**Symptoms:**

- Tests timeout waiting for server
- Database connection errors

**Solutions:**

1. **Check Docker containers**:

   ```bash
   docker-compose -f docker-compose.e2e.yml ps
   # All services should be "Up"
   ```

2. **View logs**:

   ```bash
   docker-compose -f docker-compose.e2e.yml logs server-test
   docker-compose -f docker-compose.e2e.yml logs postgres-test
   ```

3. **Clean restart**:

   ```bash
   docker-compose -f docker-compose.e2e.yml down -v
   docker-compose -f docker-compose.e2e.yml up -d
   ```

---

## 📖 Additional Resources

- **Client `.env.example`**: [`client/.env.example`](client/.env.example) - Full client configuration
- **Server `.env.example`**: [`server/.env.example`](server/.env.example) - Full server configuration
- **Docker Setup**: [`docker-compose.e2e.yml`](docker-compose.e2e.yml) - E2E testing configuration
- **SvelteKit Env Docs**: <https://kit.svelte.dev/docs/configuration#env>
- **Railway Docs**: <https://docs.railway.app/develop/variables>
- **Vercel Env Docs**: <https://vercel.com/docs/concepts/projects/environment-variables>

---

## 🔐 Security Best Practices

1. **Never commit `.env` files**:

   ```bash
   # Already in .gitignore
   client/.env
   server/.env
   ```

2. **Use strong database passwords**:

   ```bash
   # Bad:
   DATABASE_URL="postgresql://postgres:password@..."
   
   # Good:
   DATABASE_URL="postgresql://user:aB3$xR9#mK2@..."
   ```

3. **Rotate secrets regularly**:
   - Database passwords
   - Sentry auth tokens
   - Session secrets (when implemented)

4. **Use environment-specific values**:
   - Development: `DEBUG` logging, localhost URLs
   - Production: `INFO` logging, HTTPS URLs, Sentry enabled

5. **Validate required variables** (server does this automatically):

   ```typescript
   if (!process.env.DATABASE_URL) {
     throw new Error('DATABASE_URL not set');
   }
   ```

---

## 📝 Summary

**For Local Development:**

1. Copy `.env.example` → `.env` in both `client/` and `server/`
2. Set `CLIENT: PUBLIC_CLIENT_API_URL=http://localhost:3001/api`
3. Set `SERVER: PORT=3001` and `CORS_ORIGINS=http://localhost:5173`
4. Configure local PostgreSQL in `SERVER: DATABASE_URL`
5. Run `npm run dev` from root

**For Production:**

1. Set client env vars in Vercel dashboard
2. Set server env vars in Railway/Render dashboard
3. Point client to production server URL
4. Point server CORS to production client URL
5. Run database migrations after deployment

**No Shared Environment:**

- Each package is independent
- Client connects to server via URLs in env vars
- No need for root `.env` file
