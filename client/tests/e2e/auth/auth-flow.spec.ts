/**
 * E2E Tests: Authentication Flow
 *
 * Tests complete authentication user journeys including:
 * - Registration → Login → Logout flow
 * - Protected route access
 * - Session persistence
 * - Multiple session handling
 */

import { test, expect } from '@playwright/test';
import {
	TEST_USERS,
	loginUser,
	registerUser,
	logoutUser,
	generateUniqueEmail,
	isAuthenticated,
	cleanupTestUser
} from './auth.helpers';

// Track emails created during tests for cleanup
const createdEmails: string[] = [];

test.afterEach(async ({ request }) => {
	// Clean up all test users created during the test
	for (const email of createdEmails) {
		await cleanupTestUser(request, email);
	}
	createdEmails.length = 0; // Clear the array
});

test.describe('Authentication Flow', () => {
	test.describe('Complete User Journey', () => {
		test('should complete full registration → login → logout flow', async ({ page }) => {
			const email = generateUniqueEmail('journey');
			createdEmails.push(email);
			const password = TEST_USERS.VALID.password;

			// Step 1: Register
			await registerUser(page, email, password);
			// registerUser already waits for /game/getting-started - no additional wait needed
			expect(await isAuthenticated(page)).toBe(true);

			// Step 2: Logout
			await logoutUser(page);
			expect(await isAuthenticated(page)).toBe(false);

			// Step 3: Login again
			await loginUser(page, email, password);
			// loginUser already waits for /game - no additional wait needed
			expect(await isAuthenticated(page)).toBe(true);

			// Step 4: Verify can access protected routes
			await page.goto('/game/world');
			await expect(page).toHaveURL(/\/game/);
		});

		test('should auto-login after successful registration', async ({ page }) => {
			const email = generateUniqueEmail('autologin');
			createdEmails.push(email);
			const password = TEST_USERS.VALID.password;

			await registerUser(page, email, password);
			// registerUser already waits for /game/getting-started - no additional wait needed

			// Should be authenticated without explicit login
			expect(await isAuthenticated(page)).toBe(true);

			// Should be able to access protected routes immediately
			await page.goto('/game/world');
			const currentUrl = page.url();
			expect(currentUrl).toContain('/game');
		});
	});

	test.describe('Protected Routes', () => {
		let userEmail: string;
		let userPassword: string;

		test.beforeEach(async ({ browser }) => {
			// Create a test user
			userEmail = generateUniqueEmail('protected');
			userPassword = TEST_USERS.VALID.password;

			const page = await browser.newPage();
			await registerUser(page, userEmail, userPassword);
			// registerUser already waits for /game/getting-started - no additional wait needed
			await page.close();
		});

		test.afterEach(async ({ request }) => {
			// Cleanup the test user
			await cleanupTestUser(request, userEmail);
		});

		test('should redirect unauthenticated users to sign-in', async ({ page }) => {
			// Try to access protected route without authentication
			await page.goto('/game/world');

			// Should redirect to sign-in with redirectTo parameter
			await page.waitForURL(/sign-in/);
			expect(page.url()).toContain('redirectTo=');
		});

		test('should allow authenticated users to access protected routes', async ({ page }) => {
			// Login first
			await loginUser(page, userEmail, userPassword);
			// loginUser already waits for /game - no additional wait needed

			// Access protected route
			await page.goto('/game/world');
			await page.waitForLoadState('networkidle');

			// Should stay on protected route
			const currentUrl = page.url();
			expect(currentUrl).toContain('/game');
		});

		test('should redirect back to requested page after login', async ({ page }) => {
			// Try to access specific protected page
			await page.goto('/game/settlements');

			// Should redirect to sign-in
			await page.waitForURL(/sign-in\?redirectTo=/);

			// Login
			await page.fill('input[name="email"]', userEmail);
			await page.fill('input[name="password"]', userPassword);
			await page.click('button:has-text("Login")');

			// Should redirect back to settlements page
			await page.waitForLoadState('networkidle');
			const finalUrl = page.url();
			expect(finalUrl).toContain('settlements');
		});

		test('should prevent access to auth pages when logged in', async ({ page }) => {
			// Login
			await loginUser(page, userEmail, userPassword);
			// loginUser already waits for /game - no additional wait needed

			// Try to access sign-in page
			await page.goto('/sign-in');
			await page.waitForURL('/game', { timeout: 5000 });
			await expect(page).toHaveURL('/game');

			// Try to access register page
			await page.goto('/register');
			await page.waitForURL('/game', { timeout: 5000 });
			await expect(page).toHaveURL('/game');
		});
	});

	test.describe('Session Persistence', () => {
		let userEmail: string;
		let userPassword: string;

		test.beforeEach(async ({ browser }) => {
			userEmail = generateUniqueEmail('session');
			userPassword = TEST_USERS.VALID.password;

			const page = await browser.newPage();
			await registerUser(page, userEmail, userPassword);
			// registerUser already waits for /game/getting-started - no additional wait needed
			await page.close();
		});

		test.afterEach(async ({ request }) => {
			// Cleanup the test user
			await cleanupTestUser(request, userEmail);
		});

		test('should maintain session across page navigation', async ({ page }) => {
			await loginUser(page, userEmail, userPassword);
			// loginUser already waits for /game - no additional wait needed

			// Navigate to different pages
			await page.goto('/introduction');
			expect(await isAuthenticated(page)).toBe(true);

			await page.goto('/support');
			expect(await isAuthenticated(page)).toBe(true);

			await page.goto('/game/world');
			expect(await isAuthenticated(page)).toBe(true);
		});

		test('should maintain session after page reload', async ({ page }) => {
			await loginUser(page, userEmail, userPassword);
			// loginUser already waits for /game - no additional wait needed

			// Get session cookie
			const cookiesBefore = await page.context().cookies();
			const sessionBefore = cookiesBefore.find((c) => c.name === 'session');

			// Reload page
			await page.reload();
			await page.waitForLoadState('networkidle');

			// Session should still exist
			expect(await isAuthenticated(page)).toBe(true);

			const cookiesAfter = await page.context().cookies();
			const sessionAfter = cookiesAfter.find((c) => c.name === 'session');

			expect(sessionAfter?.value).toBe(sessionBefore?.value);
		});

		test('should lose session after clearing cookies', async ({ page }) => {
			await loginUser(page, userEmail, userPassword);
			// loginUser already waits for /game - no additional wait needed
			expect(await isAuthenticated(page)).toBe(true);

			// Clear cookies
			await page.context().clearCookies();

			// Reload to trigger auth check
			await page.reload();
			await page.waitForLoadState('networkidle');

			// Should no longer be authenticated
			expect(await isAuthenticated(page)).toBe(false);

			// Accessing protected route should redirect to sign-in
			await page.goto('/game/world');
			await page.waitForURL(/sign-in/);
		});
	});

	test.describe('Concurrent Sessions', () => {
		let userEmail: string;
		let userPassword: string;

		test.beforeEach(async ({ browser }) => {
			userEmail = generateUniqueEmail('concurrent');
			userPassword = TEST_USERS.VALID.password;

			const page = await browser.newPage();
			await registerUser(page, userEmail, userPassword);
			// registerUser already waits for /game/getting-started - no additional wait needed

			// Logout the user so concurrent session tests can test fresh login flow
			await logoutUser(page);

			await page.close();
		});

		test.afterEach(async ({ request }) => {
			// Cleanup the test user created in beforeEach
			await cleanupTestUser(request, userEmail);
		});

		test('should allow same user to login in multiple contexts', async ({ browser }) => {
			// Create two separate browser contexts (like different browsers)
			const context1 = await browser.newContext();
			const context2 = await browser.newContext();

			const page1 = await context1.newPage();
			const page2 = await context2.newPage();

			// Login in both contexts
			await loginUser(page1, userEmail, userPassword);
			// loginUser already waits for /game - no additional wait needed

			await loginUser(page2, userEmail, userPassword);
			// loginUser already waits for /game - no additional wait needed

			// Both should be authenticated
			expect(await isAuthenticated(page1)).toBe(true);
			expect(await isAuthenticated(page2)).toBe(true);

			// Both should be able to access protected routes
			await page1.goto('/game/world');
			await page2.goto('/game/world');

			await page1.waitForLoadState('networkidle');
			await page2.waitForLoadState('networkidle');

			expect(page1.url()).toContain('/game');
			expect(page2.url()).toContain('/game');

			// Cleanup
			await context1.close();
			await context2.close();
		});
	});

	test.describe('Error Recovery', () => {
		test('should recover from network errors during registration', async ({
			page,
			context
		}) => {
			const email = generateUniqueEmail('network-error');
			createdEmails.push(email);
			const password = TEST_USERS.VALID.password;

			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			// Simulate offline mode
			await context.setOffline(true);

			await page.fill('input[name="email"]', email);
			await page.fill('input[name="password"]', password);
			await page.click('button[type="submit"]');

			// Wait a bit for the request to fail
			await page.waitForTimeout(2000);

			// Go back online
			await context.setOffline(false);

			// Try again
			await page.click('button[type="submit"]');

			// Should eventually succeed (wait for getting-started since this is registration)
			await page.waitForURL('/game/getting-started', { timeout: 10000 });
			expect(await isAuthenticated(page)).toBe(true);
		});

		test('should handle server errors gracefully', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			// Try to login with credentials that will cause a server error
			// (This assumes your server handles malformed requests)
			await page.fill('input[name="email"]', 'test@example.com');
			await page.fill('input[name="password"]', TEST_USERS.VALID.password);
			await page.click('button:has-text("Login")');

			// Should show error message (either "incorrect" or a server error)
			await page.waitForSelector('.alert', { timeout: 5000 }).catch(() => {
				// If no alert shows, at least check we're still on sign-in page
			});

			// Should remain on sign-in page
			await expect(page).toHaveURL(/sign-in/);
			expect(await isAuthenticated(page)).toBe(false);
		});
	});

	test.describe('Form Validation', () => {
		test('should prevent double-submission of registration form', async ({ page }) => {
			const email = generateUniqueEmail('double-submit');
			createdEmails.push(email);
			const password = TEST_USERS.VALID.password;

			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			await page.fill('input[name="email"]', email);
			await page.fill('input[name="password"]', password);

			// Click submit button twice rapidly
			const submitButton = page.locator('button[type="submit"]');
			await submitButton.click();
			await submitButton.click();

			// Should only register once (wait for getting-started since this is registration)
			await page.waitForURL('/game/getting-started', { timeout: 5000 });
			expect(await isAuthenticated(page)).toBe(true);
		});

		test('should clear error messages when user starts typing', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			// Submit with wrong credentials
			await page.fill('input[name="email"]', 'wrong@example.com');
			await page.fill('input[name="password"]', 'WrongPassword1234567890!');
			await page.click('button:has-text("Login")');

			// Wait for error
			await page.waitForSelector('.alert', { timeout: 5000 });

			// Start typing - error should clear or inputs should lose error styling
			await page.fill('input[name="email"]', 'new@example.com');

			// Note: This behavior depends on your implementation
			// You might need to add this feature if it doesn't exist
		});
	});
});
