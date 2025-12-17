# Server Scripts

This directory contains utility scripts for the Uncharted Lands server.

## Migration Script

### `migrate.ts`

Runs database migrations programmatically using Drizzle ORM's migrate function. This script is used in CI/CD environments where interactive prompts are not possible.

**Usage:**

```bash
npm run db:migrate:run
```

**Environment Variables:**

- `DATABASE_URL` - PostgreSQL connection string (required)

**Features:**

- Non-interactive (suitable for CI/CD)
- Automatically runs all pending migrations from the `./drizzle` folder
- Provides clear success/error messages
- Properly closes database connections on completion

**When to use:**

- In CI/CD pipelines (already configured in `.github/workflows/CI.yml`)
- In automated deployment scripts
- When you need to run migrations programmatically

**When NOT to use:**

- For local development - use `npm run db:push` instead (interactive, shows changes)
- For generating new migrations - use `npm run db:generate`

## Related Commands

- `npm run db:generate` - Generate new migration files from schema changes
- `npm run db:push` - Push schema changes directly (interactive, for development)
- `npm run db:migrate` - Run drizzle-kit migrate (interactive)
- `npm run db:migrate:run` - Run migrations programmatically (non-interactive, for CI)
- `npm run db:studio` - Open Drizzle Studio GUI
- `npm run db:seed` - Seed the database with initial data
