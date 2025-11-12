/**
 * E2E Tests: User Login
 *
 * Tests the complete user login flow including:
 * - Successful login
 * - Invalid credentials handling
 * - Remember me functionality
 * - Session management
 * - Redirect behavior
 */

import { test, expect } from '@playwright/test';
import {
	TEST_USERS,
	loginUser,
	registerUser,
	assertRedirectedToHome,
	assertErrorMessage,
	assertInputErrors,
	generateUniqueEmail,
	isAuthenticated,
	logoutUser
} from './auth.helpers';

test.describe('Login', () => {
	// Setup: Create a test user before login tests
	let testUserEmail: string;
	let testUserPassword: string;

	test.beforeAll(async ({ browser }) => {
		// Create a persistent test user for login tests
		testUserEmail = generateUniqueEmail('login-test');
		testUserPassword = TEST_USERS.VALID.password;

		const page = await browser.newPage();
		await registerUser(page, testUserEmail, testUserPassword);
		await page.waitForURL('/', { timeout: 5000 });
		await page.close();
	});

	test.describe('Successful Login', () => {
		test('should login with valid credentials', async ({ page }) => {
			await loginUser(page, testUserEmail, testUserPassword);

			// Should redirect to home page
			await assertRedirectedToHome(page);

			// Should be authenticated
			const authenticated = await isAuthenticated(page);
			expect(authenticated).toBe(true);
		});

		test('should set session cookie after successful login', async ({ page }) => {
			await loginUser(page, testUserEmail, testUserPassword);
			await page.waitForURL('/', { timeout: 5000 });

			const cookies = await page.context().cookies();
			const sessionCookie = cookies.find((c) => c.name === 'session');

			expect(sessionCookie).toBeDefined();
			expect(sessionCookie?.value).toBeTruthy();
			expect(sessionCookie?.httpOnly).toBe(true);
			expect(sessionCookie?.sameSite).toBe('Strict');
		});

		test('should persist session across page reloads', async ({ page }) => {
			await loginUser(page, testUserEmail, testUserPassword);
			await page.waitForURL('/', { timeout: 5000 });

			// Reload the page
			await page.reload();

			// Session should still be valid
			const authenticated = await isAuthenticated(page);
			expect(authenticated).toBe(true);
		});
	});

	test.describe('Invalid Credentials', () => {
		test('should show error for non-existent user', async ({ page }) => {
			const fakeEmail = generateUniqueEmail('nonexistent');

			await loginUser(page, fakeEmail, TEST_USERS.VALID.password);

			// Should show incorrect credentials error
			await assertErrorMessage(page, 'Information is incorrect');

			// Should remain on login page
			await expect(page).toHaveURL(/\/sign-in/);

			// Should not be authenticated
			const authenticated = await isAuthenticated(page);
			expect(authenticated).toBe(false);
		});

		test('should show error for incorrect password', async ({ page }) => {
			await loginUser(page, testUserEmail, 'WrongPassword123456789!');

			// Should show incorrect credentials error
			await assertErrorMessage(page, 'Information is incorrect');

			// Should remain on login page
			await expect(page).toHaveURL(/\/sign-in/);

			// Should not be authenticated
			const authenticated = await isAuthenticated(page);
			expect(authenticated).toBe(false);
		});

		test('should show error for empty email', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			await page.fill('input[name="password"]', testUserPassword);
			await page.click('button:has-text("Login")');

			// HTML5 validation should prevent submission
			const emailInput = page.locator('input[name="email"]');
			const validationMessage = await emailInput.evaluate(
				(el: HTMLInputElement) => el.validationMessage
			);
			expect(validationMessage).toBeTruthy();
		});

		test('should show error for empty password', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			await page.fill('input[name="email"]', testUserEmail);
			await page.click('button:has-text("Login")');

			// HTML5 validation should prevent submission
			const passwordInput = page.locator('input[name="password"]');
			const validationMessage = await passwordInput.evaluate(
				(el: HTMLInputElement) => el.validationMessage
			);
			expect(validationMessage).toBeTruthy();
		});

		test('should highlight inputs with error styling after failed login', async ({ page }) => {
			await loginUser(page, testUserEmail, 'WrongPassword123456789!');

			// Wait for error state
			await page.waitForSelector('.input-error', { timeout: 5000 });

			await assertInputErrors(page);
		});
	});

	test.describe('Remember Me Functionality', () => {
		test('should set longer session with remember me checked', async ({ page }) => {
			await loginUser(page, testUserEmail, testUserPassword, true);
			await page.waitForURL('/', { timeout: 5000 });

			const cookies = await page.context().cookies();
			const sessionCookie = cookies.find((c) => c.name === 'session');

			expect(sessionCookie).toBeDefined();

			// With remember me: 30 days (2592000 seconds)
			// Without: 6 hours (21600 seconds)
			// Check that expiry is more than 1 day from now
			const oneDayFromNow = Date.now() / 1000 + 24 * 60 * 60;
			expect(sessionCookie?.expires).toBeGreaterThan(oneDayFromNow);
		});

		test('should set shorter session without remember me', async ({ page }) => {
			await loginUser(page, testUserEmail, testUserPassword, false);
			await page.waitForURL('/', { timeout: 5000 });

			const cookies = await page.context().cookies();
			const sessionCookie = cookies.find((c) => c.name === 'session');

			expect(sessionCookie).toBeDefined();

			// Without remember me: 6 hours (21600 seconds)
			// Check that expiry is less than 1 day from now
			const oneDayFromNow = Date.now() / 1000 + 24 * 60 * 60;
			expect(sessionCookie?.expires).toBeLessThan(oneDayFromNow);
		});

		test('remember me checkbox should be unchecked by default', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			const rememberMeCheckbox = page.locator('input[name="remember_me"]');
			await expect(rememberMeCheckbox).not.toBeChecked();
		});

		test('should be able to toggle remember me checkbox', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			const rememberMeCheckbox = page.locator('input[name="remember_me"]');

			// Check it
			await rememberMeCheckbox.check();
			await expect(rememberMeCheckbox).toBeChecked();

			// Uncheck it
			await rememberMeCheckbox.uncheck();
			await expect(rememberMeCheckbox).not.toBeChecked();
		});
	});

	test.describe('UI Elements', () => {
		test('should display login form with all required elements', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			// Check for logo
			await expect(page.locator('img[alt="Uncharted Lands"]')).toBeVisible();

			// Check for heading
			await expect(page.locator('h1')).toContainText('Sign into your account');

			// Check for email input
			const emailInput = page.locator('input[name="email"]');
			await expect(emailInput).toBeVisible();
			await expect(emailInput).toHaveAttribute('type', 'email');
			await expect(emailInput).toHaveAttribute('required');

			// Check for password input
			const passwordInput = page.locator('input[name="password"]');
			await expect(passwordInput).toBeVisible();
			await expect(passwordInput).toHaveAttribute('type', 'password');
			await expect(passwordInput).toHaveAttribute('required');

			// Check for remember me checkbox
			const rememberMe = page.locator('input[name="remember_me"]');
			await expect(rememberMe).toBeVisible();
			await expect(rememberMe).toHaveAttribute('type', 'checkbox');

			// Check for forgot password link
			const forgotPasswordLink = page.locator('a[href*="forgot-password"]');
			await expect(forgotPasswordLink).toBeVisible();
			await expect(forgotPasswordLink).toContainText('Forgot your password?');

			// Check for submit button
			const submitButton = page.locator('button:has-text("Login")');
			await expect(submitButton).toBeVisible();
		});

		test('should have proper input labels', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			// Email label
			const emailLabel = page.locator('label[for="email"]');
			await expect(emailLabel).toBeVisible();
			await expect(emailLabel).toContainText('Email address');

			// Password label
			const passwordLabel = page.locator('label[for="password"]');
			await expect(passwordLabel).toBeVisible();
			await expect(passwordLabel).toContainText('Password');

			// Remember me label
			const rememberMeLabel = page.locator('label[for="remember_me"]');
			await expect(rememberMeLabel).toBeVisible();
			await expect(rememberMeLabel).toContainText('Remember me');
		});

		test('should have autocomplete attributes', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			const emailInput = page.locator('input[name="email"]');
			await expect(emailInput).toHaveAttribute('autocomplete', 'email');

			const passwordInput = page.locator('input[name="password"]');
			await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
		});
	});

	test.describe('Navigation and Redirects', () => {
		test('should redirect to home after successful login', async ({ page }) => {
			await loginUser(page, testUserEmail, testUserPassword);

			await page.waitForURL('/', { timeout: 5000 });
			await expect(page).toHaveURL('/');
		});

		test('should redirect to requested page after login', async ({ page }) => {
			// Try to access protected route (should redirect to sign-in with redirectTo param)
			await page.goto('/game/world');

			// Should be redirected to sign-in with redirectTo parameter
			await page.waitForURL(/sign-in\?redirectTo=/);

			// Login
			await page.fill('input[name="email"]', testUserEmail);
			await page.fill('input[name="password"]', testUserPassword);
			await page.click('button:has-text("Login")');

			// Should redirect back to originally requested page
			await page.waitForURL(/\/game/, { timeout: 5000 });
		});

		test('should redirect to home if already authenticated', async ({ page }) => {
			// First login
			await loginUser(page, testUserEmail, testUserPassword);
			await page.waitForURL('/', { timeout: 5000 });

			// Try to access login page while authenticated
			await page.goto('/sign-in');

			// Should redirect to home
			await page.waitForURL('/', { timeout: 5000 });
			await expect(page).toHaveURL('/');
		});

		test('forgot password link should navigate correctly', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			const forgotPasswordLink = page.locator('a[href*="forgot-password"]');
			await forgotPasswordLink.click();

			await expect(page).toHaveURL(/\/forgot-password/);
		});
	});

	test.describe('Security', () => {
		test('should not expose password in page source', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			await page.fill('input[name="password"]', testUserPassword);

			const pageContent = await page.content();
			expect(pageContent).not.toContain(testUserPassword);
		});

		test('password input should mask characters', async ({ page }) => {
			await page.goto('/sign-in');
			await page.waitForLoadState('networkidle');

			const passwordInput = page.locator('input[name="password"]');
			await expect(passwordInput).toHaveAttribute('type', 'password');
		});

		test('should clear sensitive data after logout', async ({ page }) => {
			await loginUser(page, testUserEmail, testUserPassword);
			await page.waitForURL('/', { timeout: 5000 });

			// Logout
			await logoutUser(page);

			// Session cookie should be gone
			const authenticated = await isAuthenticated(page);
			expect(authenticated).toBe(false);
		});
	});
});
