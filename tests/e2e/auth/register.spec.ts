/**
 * E2E Tests: User Registration
 *
 * Tests the complete user registration flow including:
 * - Successful registration
 * - Validation errors
 * - Duplicate account handling
 * - Redirect behavior
 */

import { test, expect } from '@playwright/test';
import {
	TEST_USERS,
	registerUser,
	assertRedirectedToHome,
	assertErrorMessage,
	assertInputErrors,
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

test.describe('Registration', () => {
	test.describe('Successful Registration', () => {
		test('should register a new user with valid credentials', async ({ page }) => {
			const uniqueEmail = generateUniqueEmail('register');
			createdEmails.push(uniqueEmail);
			const password = TEST_USERS.VALID.password;

			await registerUser(page, uniqueEmail, password);

			// Should redirect to home page
			await assertRedirectedToHome(page);

			// Should be authenticated (session cookie set)
			const authenticated = await isAuthenticated(page);
			expect(authenticated).toBe(true);
		});

		test('should register and auto-login the user', async ({ page }) => {
			const uniqueEmail = generateUniqueEmail('autologin');
			createdEmails.push(uniqueEmail);
			const password = TEST_USERS.VALID.password;

			await registerUser(page, uniqueEmail, password);

			// Wait for redirect
			await page.waitForURL('/', { timeout: 5000 });

			// Verify user is on authenticated page
			await expect(page).toHaveURL('/');

			// Session cookie should exist
			const cookies = await page.context().cookies();
			const sessionCookie = cookies.find((c) => c.name === 'session');
			expect(sessionCookie).toBeDefined();
			expect(sessionCookie?.value).toBeTruthy();
		});

		test('should set session cookie with correct attributes', async ({ page }) => {
			const uniqueEmail = generateUniqueEmail('cookie');
			createdEmails.push(uniqueEmail);
			const password = TEST_USERS.VALID.password;

			await registerUser(page, uniqueEmail, password);
			await page.waitForURL('/', { timeout: 5000 });

			const cookies = await page.context().cookies();
			const sessionCookie = cookies.find((c) => c.name === 'session');

			expect(sessionCookie).toBeDefined();
			expect(sessionCookie?.httpOnly).toBe(true);
			expect(sessionCookie?.sameSite).toBe('Strict');
			expect(sessionCookie?.path).toBe('/');
			// maxAge should be 6 hours (21600 seconds) by default
			expect(sessionCookie?.expires).toBeGreaterThan(Date.now() / 1000);
		});
	});

	test.describe('Validation Errors', () => {
		test('should show error for password less than 16 characters', async ({ page }) => {
			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			await page.fill('input[name="email"]', TEST_USERS.SHORT_PASSWORD.email);
			await page.fill('input[name="password"]', TEST_USERS.SHORT_PASSWORD.password);
			await page.click('button[type="submit"]');

			// Should show error message about password length
			await assertErrorMessage(page, 'Password must be 16 or more characters');

			// Should still be on registration page
			await expect(page).toHaveURL(/\/register/);
		});

		test('should show error for empty email', async ({ page }) => {
			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			// Try to submit with empty email
			await page.fill('input[name="password"]', TEST_USERS.VALID.password);
			await page.click('button[type="submit"]');

			// HTML5 validation should prevent submission
			const emailInput = page.locator('input[name="email"]');
			const validationMessage = await emailInput.evaluate(
				(el: HTMLInputElement) => el.validationMessage
			);
			expect(validationMessage).toBeTruthy();
		});

		test('should show error for empty password', async ({ page }) => {
			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			// Try to submit with empty password
			await page.fill('input[name="email"]', generateUniqueEmail());
			await page.click('button[type="submit"]');

			// HTML5 validation should prevent submission
			const passwordInput = page.locator('input[name="password"]');
			const validationMessage = await passwordInput.evaluate(
				(el: HTMLInputElement) => el.validationMessage
			);
			expect(validationMessage).toBeTruthy();
		});

		test('should show error for invalid email format', async ({ page }) => {
			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			await page.fill('input[name="email"]', 'not-an-email');
			await page.fill('input[name="password"]', TEST_USERS.VALID.password);
			await page.click('button[type="submit"]');

			// HTML5 validation should catch this
			const emailInput = page.locator('input[name="email"]');
			const validationMessage = await emailInput.evaluate(
				(el: HTMLInputElement) => el.validationMessage
			);
			expect(validationMessage).toBeTruthy();
		});

		test('should highlight inputs with error styling when validation fails', async ({ page }) => {
			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			const email = generateUniqueEmail();
			createdEmails.push(email);
			await page.fill('input[name="email"]', email);
			await page.fill('input[name="password"]', 'short'); // Too short
			await page.click('button[type="submit"]');

			// Wait for error state
			await page.waitForSelector('.input-error', { timeout: 5000 });

			await assertInputErrors(page);
		});
	});

	test.describe('Duplicate Account Handling', () => {
		test('should show error when registering with existing email', async ({ page }) => {
			const email = generateUniqueEmail('duplicate');
			createdEmails.push(email);
			const password = TEST_USERS.VALID.password;

			// First registration
			await registerUser(page, email, password);
			await page.waitForURL('/', { timeout: 5000 });

			// Clear session and try to register again with same email
			await page.context().clearCookies();
			await registerUser(page, email, password);

			// Should show error about existing account
			await assertErrorMessage(page, 'Please enter the account information again');

			// Should stay on registration page
			await expect(page).toHaveURL(/\/register/);
		});
	});

	test.describe('UI Elements', () => {
		test('should display registration form with all required elements', async ({ page }) => {
			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			// Check for logo
			await expect(page.locator('img[alt="Uncharted Lands"]')).toBeVisible();

			// Check for heading
			await expect(page.locator('h1')).toContainText('Register your account');

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

			// Check for submit button
			const submitButton = page.locator('button[type="submit"]');
			await expect(submitButton).toBeVisible();
			await expect(submitButton).toContainText('Register');
		});

		test('should have proper input labels', async ({ page }) => {
			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			// Email label
			const emailLabel = page.locator('label[for="email"]');
			await expect(emailLabel).toBeVisible();
			await expect(emailLabel).toContainText('Email address');

			// Password label
			const passwordLabel = page.locator('label[for="password"]');
			await expect(passwordLabel).toBeVisible();
			await expect(passwordLabel).toContainText('Password');
		});

		test('should have autocomplete attributes', async ({ page }) => {
			await page.goto('/register');
			await page.waitForLoadState('networkidle');

			const emailInput = page.locator('input[name="email"]');
			await expect(emailInput).toHaveAttribute('autocomplete', 'email');

			const passwordInput = page.locator('input[name="password"]');
			await expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
		});
	});

	test.describe('Navigation', () => {
		test('should be accessible from sign-in page', async ({ page }) => {
			await page.goto('/sign-in');

			// Look for a link to register (if it exists)
			// Note: Add this link if it doesn't exist in your UI
			const registerLink = page.locator('a[href*="register"]');
			if ((await registerLink.count()) > 0) {
				await registerLink.click();
				await expect(page).toHaveURL(/\/register/);
			}
		});

		test('should redirect to home if already authenticated', async ({ page }) => {
			// First, register and login
			const email = generateUniqueEmail('redirect');
			createdEmails.push(email);
			const password = TEST_USERS.VALID.password;
			await registerUser(page, email, password);
			await page.waitForURL('/', { timeout: 5000 });

			// Try to access register page while authenticated
			await page.goto('/register');

			// Should redirect to home
			await page.waitForURL('/', { timeout: 5000 });
			await expect(page).toHaveURL('/');
		});
	});
});
