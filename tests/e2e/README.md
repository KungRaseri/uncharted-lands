# E2E Testing Guide

## Overview

End-to-end tests use Playwright to test the full application stack, including user registration, authentication, and navigation flows.

## Prerequisites

### 1. Database Setup

E2E tests require a PostgreSQL database. You can use:

- Your local development database
- A dedicated test database (recommended)

**Recommended: Create a test database**

```bash
# Connect to PostgreSQL
psql -U postgres

# Create test database
CREATE DATABASE uncharted_lands_test;

# Exit psql
\q
```

### 2. Server Configuration

The backend server must be configured with:

- `DATABASE_URL` pointing to your test database
- `CORS_ORIGINS` including `http://localhost:4173` (Playwright preview server)

**Update server/.env** (or create a `.env.test` file):

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/uncharted_lands_test"
CORS_ORIGINS=http://localhost:5173,http://localhost:4173
PORT=3001
NODE_ENV=test
```

### 3. Run Database Migrations

Before running tests, ensure the test database schema is up to date:

```bash
cd server
npm run db:migrate:run
```

## Running Tests

### Run All E2E Tests

```bash
cd client
npm run test:e2e
```

This command will:

1. Start the backend API server on port 3001
2. Build the client application
3. Start the client preview server on port 4173
4. Run all Playwright tests
5. Shut down servers after tests complete

### Run Specific Test Suites

```bash
# Authentication tests only
npm run test:e2e:auth

# Run with headed browser (see what's happening)
npm run test:e2e:headed

# Debug mode (interactive)
npm run test:e2e:debug

# UI mode (Playwright test runner UI)
npm run test:e2e:ui
```

## Test Structure

### Test Organization

```
tests/e2e/
├── auth/
│   ├── auth-flow.spec.ts      # User registration, login, logout
│   └── auth.helpers.ts        # Shared authentication utilities
└── README.md                  # This file
```

### Writing New Tests

1. Create a new `.spec.ts` file in the appropriate directory
2. Use the helpers from `auth.helpers.ts` for common operations
3. Follow the existing test patterns for consistency

Example:

```typescript
import { test, expect } from '@playwright/test';
import { registerUser, loginUser } from './auth/auth.helpers';

test.describe('My Feature', () => {
	test('should do something', async ({ page }) => {
		// Your test code here
	});
});
```

## Troubleshooting

### Tests Timeout on Registration/Login

**Problem**: Tests fail with "Test timeout of 30000ms exceeded" when trying to register or login.

**Solution**:

- Ensure the backend server is running (Playwright should start it automatically)
- Check that `DATABASE_URL` in `server/.env` is correct
- Verify database is running and accessible
- Check server logs for connection errors

### "Cannot read properties of null" Errors

**Problem**: Server errors about reading properties of null.

**Solution**:

- Rebuild the client: `npm run build`
- Clear `.svelte-kit` cache: `rm -rf .svelte-kit`
- Restart the test suite

### Port Already in Use

**Problem**: Tests fail because port 3001 or 4173 is already in use.

**Solution**:

- Stop any running dev servers
- Kill processes on those ports:

  ```bash
  # Windows
  netstat -ano | findstr :3001
  taskkill /PID <PID> /F

  # Mac/Linux
  lsof -ti:3001 | xargs kill -9
  ```

### Database Connection Issues

**Problem**: Server can't connect to the database.

**Solution**:

- Verify PostgreSQL is running
- Check `DATABASE_URL` format is correct
- Ensure database exists: `psql -U postgres -l`
- Check database permissions

## CI/CD Considerations

When running tests in CI (GitHub Actions, etc.):

1. Use environment variables for database connection
2. Set up a test database in the CI environment
3. Run migrations before tests
4. Use `CI=true` environment variable (automatically retries failed tests)

Example GitHub Actions setup:

```yaml
- name: Setup test database
  run: |
    psql -U postgres -c "CREATE DATABASE uncharted_lands_test;"
    cd server && npm run db:migrate:run

- name: Run e2e tests
  run: |
    cd client && npm run test:e2e
  env:
    DATABASE_URL: postgresql://postgres:postgres@localhost:5432/uncharted_lands_test
    CI: true
```

## Test Data Cleanup

E2E tests create test users in the database. To clean up:

```sql
-- Delete test users
DELETE FROM accounts WHERE email LIKE '%@example.com';
DELETE FROM accounts WHERE email LIKE 'test%';
```

Or create a cleanup script in `server/scripts/cleanup-test-data.ts`.

## Best Practices

1. **Use unique test data** - Generate unique emails per test run to avoid conflicts
2. **Clean up after tests** - Remove test data to keep database clean
3. **Test in isolation** - Each test should be independent
4. **Use helpers** - Reuse common operations from helper files
5. **Meaningful assertions** - Test meaningful user interactions, not implementation details
6. **Handle async properly** - Always await page interactions
7. **Use waitFor helpers** - Wait for elements/network/state changes

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [SvelteKit Testing Guide](https://kit.svelte.dev/docs/testing)
- [Testing Best Practices](https://playwright.dev/docs/best-practices)
