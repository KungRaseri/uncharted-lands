# Uncharted Lands - Scripts Directory

This directory contains utility scripts for the Uncharted Lands monorepo, organized by purpose.

## 📁 Directory Structure

```
scripts/
├── client/          # Client-specific scripts (SvelteKit, UI fixes)
├── server/          # Server-specific scripts (database, migrations)
├── e2e/             # End-to-end testing scripts (Docker, test setup)
└── README.md        # This file
```

---

## 🎨 Client Scripts (`client/`)

### `fix-a11y-issues.ps1`
Fixes accessibility issues in Svelte components.

**What it does:**
- Converts display labels to divs (labels should only be for form inputs)
- Adds proper ARIA attributes to modals
- Fixes click event handlers on non-interactive elements

**Usage:**
```powershell
.\scripts\client\fix-a11y-issues.ps1
```

**When to use:**
- After adding new modals or interactive UI components
- When accessibility warnings appear in `svelte-check`

---

### `patch-skeleton.js`
Patches Skeleton UI library files for compatibility.

**What it does:**
- Applies necessary patches to Skeleton UI components
- Ensures compatibility with Svelte 5 runes

**Usage:**
```bash
node scripts/client/patch-skeleton.js
```

**When to use:**
- After `npm install` in the client package
- After updating Skeleton UI version

---

### `switch-to-node-adapter.ps1`
Switches SvelteKit adapter from Vercel to Node.

**What it does:**
- Updates `svelte.config.js` to use `@sveltejs/adapter-node`
- Useful for self-hosted deployments

**Usage:**
```powershell
.\scripts\client\switch-to-node-adapter.ps1
```

**When to use:**
- When deploying to Railway, Render, or other Node.js hosts
- When switching from Vercel deployment

---

## 🗄️ Server Scripts (`server/`)

### `migrate.ts`
Runs database migrations programmatically (non-interactive).

**What it does:**
- Executes all pending Drizzle ORM migrations
- Automatically runs migrations from `server/drizzle/` folder
- Provides clear success/error messages
- Properly closes database connections

**Usage:**
```bash
# From server directory
npm run db:migrate:run

# Or directly
cd server
tsx ../scripts/server/migrate.ts
```

**Environment Variables:**
- `DATABASE_URL` - PostgreSQL connection string (required)

**When to use:**
- ✅ In CI/CD pipelines (GitHub Actions)
- ✅ In automated deployment scripts
- ✅ In production deployments
- ❌ **NOT** for local development (use `npm run db:push` instead)

**Related Commands:**
- `npm run db:generate` - Generate new migration files from schema changes
- `npm run db:push` - Push schema changes directly (interactive, for development)
- `npm run db:migrate` - Run drizzle-kit migrate (interactive)
- `npm run db:studio` - Open Drizzle Studio GUI
- `npm run db:seed` - Seed the database with initial data

See [`server/README.md`](server/README.md) for full migration documentation.

---

### `fix-modifier-types.ps1`
Fixes TypeScript type issues with modifier types in database schema.

**What it does:**
- Updates modifier type definitions
- Ensures type safety in settlement/structure modifiers

**Usage:**
```powershell
.\scripts\server\fix-modifier-types.ps1
```

**When to use:**
- After schema changes involving modifiers
- When TypeScript errors appear related to modifier types

---

## 🧪 E2E Testing Scripts (`e2e/`)

### `e2e-docker.ps1`
Manages Docker-based E2E testing environment.

**What it does:**
- Starts PostgreSQL, server, and client containers
- Runs Playwright E2E tests in isolated environment
- Cleans up containers after tests

**Usage:**
```powershell
.\scripts\e2e\e2e-docker.ps1
```

**When to use:**
- Running full E2E test suite in CI/CD
- Testing deployment configurations locally
- Validating Docker setup

**Environment:**
Uses `docker-compose.e2e.yml` configuration.

---

### `start-server-for-e2e.ps1`
Starts the server in E2E testing mode.

**What it does:**
- Configures server for E2E testing
- Sets up test database connection
- Ensures server is ready for Playwright tests

**Usage:**
```powershell
.\scripts\e2e\start-server-for-e2e.ps1
```

**When to use:**
- Running E2E tests locally without Docker
- Debugging E2E test failures
- Manual E2E test setup

---

## 🔧 Common Tasks

### Running Database Migrations
```bash
cd server
npm run db:migrate:run
```

### Fixing Accessibility Issues
```powershell
.\scripts\client\fix-a11y-issues.ps1
cd client
npm run check  # Verify fixes worked
```

### Running E2E Tests
```powershell
# With Docker (recommended)
.\scripts\e2e\e2e-docker.ps1

# Or from root
npm run test:e2e:docker
```

### Switching Deployment Adapters
```powershell
# For Node.js deployment (Railway, Render, etc.)
.\scripts\client\switch-to-node-adapter.ps1

# For Vercel (default in svelte.config.js)
# No script needed - just use @sveltejs/adapter-vercel
```

---

## 📝 Adding New Scripts

When adding new scripts, follow this organization:

1. **Client-specific** (UI, components, build) → `scripts/client/`
2. **Server-specific** (database, API, migrations) → `scripts/server/`
3. **E2E/Testing** (Docker, test setup) → `scripts/e2e/`
4. **Cross-cutting** (affects both client + server) → `scripts/` (root level)

**Naming conventions:**
- PowerShell: `kebab-case.ps1`
- Node.js: `kebab-case.js` or `kebab-case.ts`
- Shell: `kebab-case.sh`

**Documentation:**
- Add description in this README
- Include usage examples
- Specify when to use/not use

---

## 🔗 Related Documentation

- **Server README**: [`../server/README.md`](../server/README.md) - Database migrations, API setup
- **Client README**: [`../client/README.md`](../client/README.md) - SvelteKit, build, deployment
- **E2E Testing**: [`../client/tests/e2e/README.md`](../client/tests/e2e/README.md) - Playwright test docs
- **Docker Setup**: [`../docker-compose.e2e.yml`](../docker-compose.e2e.yml) - E2E Docker configuration

---

## 🐛 Troubleshooting

**Script not found:**
```powershell
# Make sure you're in the root directory
cd c:\code\uncharted-lands
.\scripts\client\fix-a11y-issues.ps1
```

**Permission denied:**
```powershell
# PowerShell: Set execution policy
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

**Database migration fails:**
```bash
# Check DATABASE_URL is set
echo $env:DATABASE_URL  # PowerShell
echo $DATABASE_URL      # Bash

# Verify database is running
psql $DATABASE_URL -c "SELECT 1"
```

**TypeScript errors in migrate.ts:**
```bash
# Make sure you're running from correct directory
cd server
tsx ../scripts/server/migrate.ts
```
