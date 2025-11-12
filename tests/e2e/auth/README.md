# Authentication E2E Tests

Comprehensive end-to-end tests for the Uncharted Lands authentication system using Playwright.

## Overview

This test suite covers the complete authentication flow including:

- User registration
- User login
- Session management
- Protected route access
- Remember me functionality
- Error handling and validation

## Test Files

### `auth.helpers.ts`

Shared utilities and helper functions for authentication tests:

- Test user data constants
- API endpoint definitions
- Helper functions for common operations (register, login, logout)
- Assertion helpers for common checks
- Utilities for generating unique test data

### `register.spec.ts`

Tests for user registration functionality:

- ✅ Successful registration with valid credentials
- ✅ Password length validation (16+ characters required)
- ✅ Email format validation
- ✅ Duplicate account handling
- ✅ Auto-login after registration
- ✅ Session cookie creation
- ✅ UI element validation
- ✅ Form input validation
- ✅ Redirect behavior for authenticated users

### `login.spec.ts`

Tests for user login functionality:

- ✅ Successful login with valid credentials
- ✅ Invalid credentials error handling
- ✅ Remember me functionality (30 days vs 6 hours session)
- ✅ Session cookie attributes (httpOnly, sameSite, secure)
- ✅ Session persistence across page reloads
- ✅ UI element validation
- ✅ Redirect behavior (to home or requested page)
- ✅ Security checks (password masking, no password in source)

### `auth-flow.spec.ts`

Tests for complete authentication user journeys:

- ✅ Complete registration → login → logout flow
- ✅ Protected route access control
- ✅ Session persistence across navigation
- ✅ Concurrent session handling
- ✅ Network error recovery
- ✅ Server error handling
- ✅ Form validation and double-submission prevention

## Running the Tests

### Run all authentication tests

```powershell
npm run test:e2e -- tests/e2e/auth
```

### Run specific test file

```powershell
# Registration tests only
npm run test:e2e -- tests/e2e/auth/register.spec.ts

# Login tests only
npm run test:e2e -- tests/e2e/auth/login.spec.ts

# Auth flow tests only
npm run test:e2e -- tests/e2e/auth/auth-flow.spec.ts
```

### Run with UI mode (debugging)

```powershell
npx playwright test tests/e2e/auth --ui
```

### Run in headed mode (see browser)

```powershell
npx playwright test tests/e2e/auth --headed
```

### Run specific browser

```powershell
# Chromium only
npx playwright test tests/e2e/auth --project=chromium

# Firefox only
npx playwright test tests/e2e/auth --project=firefox

# WebKit (Safari) only
npx playwright test tests/e2e/auth --project=webkit
```

### Debug a specific test

```powershell
npx playwright test tests/e2e/auth/login.spec.ts --debug
```

## Test Data Management

### Unique Email Generation

Tests use `generateUniqueEmail()` to create unique email addresses for each test run:

```typescript
const email = generateUniqueEmail('test');
// Generates: test.1234567890.abc123@test.local
```

This prevents test conflicts and allows parallel execution.

### Test User Credentials

Predefined test users are available in `auth.helpers.ts`:

- `TEST_USERS.VALID`: Valid credentials (16+ char password)
- `TEST_USERS.ADMIN`: Admin user credentials
- `TEST_USERS.SHORT_PASSWORD`: Invalid short password for testing validation

### Database Cleanup

⚠️ **Note**: Tests currently create users but don't automatically clean them up. You may need to:

1. Manually delete test users from the database
2. Implement a test cleanup API endpoint
3. Use a separate test database that can be reset

Consider adding to your server:

```typescript
// DELETE /api/test/users/:email (only in test environment)
if (process.env.NODE_ENV === 'test') {
	app.delete('/api/test/users/:email', async (req, res) => {
		// Delete user logic
	});
}
```

## Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:4173` (preview server)
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries on CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit
- **Web Server**: Automatically starts preview server before tests

### Environment Variables

Create a `.env` file for test-specific configuration:

```bash
# Test server URL (optional, defaults to localhost:4173)
BASE_URL=http://localhost:4173

# Test database (optional, for isolated test data)
DATABASE_URL="postgresql://postgres:password@localhost:5432/uncharted_lands_test"
```

## Test Coverage

### Registration Flow

- [x] Valid registration
- [x] Email validation
- [x] Password length validation (16+ chars)
- [x] Duplicate email handling
- [x] Auto-login after registration
- [x] Session cookie creation
- [x] Redirect to home after registration
- [x] Redirect authenticated users away from register page

### Login Flow

- [x] Valid login
- [x] Invalid email handling
- [x] Invalid password handling
- [x] Remember me (30-day session)
- [x] Standard login (6-hour session)
- [x] Session persistence
- [x] Redirect to home after login
- [x] Redirect to requested page after login
- [x] Redirect authenticated users away from login page

### Session Management

- [x] Session cookie attributes (httpOnly, sameSite, secure)
- [x] Session persistence across page reloads
- [x] Session persistence across navigation
- [x] Session clearing on logout
- [x] Multiple concurrent sessions

### Protected Routes

- [x] Unauthenticated redirect to sign-in
- [x] Authenticated access allowed
- [x] Redirect back to requested page after login
- [x] Preserve query parameters in redirects

### Error Handling

- [x] Network error recovery
- [x] Server error handling
- [x] Form validation errors
- [x] Double-submission prevention

### UI/UX

- [x] All form elements present
- [x] Proper labels and accessibility
- [x] Autocomplete attributes
- [x] Error message display
- [x] Input error styling
- [x] Password masking

## CI/CD Integration

Tests are configured to run in CI with:

- Retries enabled (2 retries)
- Single worker (no parallel execution)
- HTML reporter for results
- Fail on `test.only` to prevent accidental commits

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          CI: true

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## Best Practices

### 1. Use Unique Test Data

Always use `generateUniqueEmail()` to avoid conflicts:

```typescript
const email = generateUniqueEmail('test-case-name');
```

### 2. Use Helper Functions

Leverage the helper functions for common operations:

```typescript
await registerUser(page, email, password);
await loginUser(page, email, password, rememberMe);
expect(await isAuthenticated(page)).toBe(true);
```

### 3. Wait for Network Idle

Always wait for page loads:

```typescript
await page.goto('/sign-in');
await page.waitForLoadState('networkidle');
```

### 4. Use Descriptive Test Names

```typescript
test('should show error for password less than 16 characters', async ({ page }) => {
	// Test implementation
});
```

### 5. Group Related Tests

Use `test.describe()` blocks:

```typescript
test.describe('Password Validation', () => {
  test('should require 16+ characters', ...);
  test('should show error message', ...);
});
```

### 6. Clean Up After Tests

If possible, clean up test data:

```typescript
test.afterEach(async ({ request }) => {
	await cleanupTestUser(request, testEmail);
});
```

## Troubleshooting

### Tests Timing Out

- Increase timeout in test or config
- Check if server is running (`npm run preview`)
- Verify database is accessible

### Flaky Tests

- Add explicit waits: `await page.waitForSelector(...)`
- Use `waitForLoadState('networkidle')`
- Increase timeout for specific assertions

### Authentication State Issues

- Clear cookies between tests
- Use `test.beforeEach()` to reset state
- Check session cookie expiration

### Database State Issues

- Use unique emails for each test
- Implement cleanup endpoint
- Consider using a test database

## Future Improvements

- [ ] Add tests for forgot password flow
- [ ] Add tests for email verification (if implemented)
- [ ] Add tests for OAuth providers (if implemented)
- [ ] Add tests for account settings/profile updates
- [ ] Implement automatic test data cleanup
- [ ] Add visual regression testing
- [ ] Add performance testing (login speed, etc.)
- [ ] Add accessibility testing
- [ ] Add mobile viewport testing

## Contributing

When adding new authentication features:

1. Add corresponding tests
2. Update this README
3. Ensure all tests pass
4. Update test coverage list
5. Consider edge cases and error scenarios
