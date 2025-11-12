/**
 * Authentication Test Helpers
 *
 * Utilities for e2e authentication tests including:
 * - Test user management via REST API
 * - Authentication state helpers
 * - Common test data and assertions
 */

import type { Page, APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';

/**
 * Test user credentials
 */
export const TEST_USERS = {
	VALID: {
		email: 'test.user@example.com',
		password: 'TestPassword1234567890!', // Must be 16+ characters
		username: 'testuser'
	},
	ADMIN: {
		email: 'admin.test@example.com',
		password: 'AdminPassword123456!',
		username: 'adminuser'
	},
	SHORT_PASSWORD: {
		email: 'short.pass@example.com',
		password: 'Short123!', // Less than 16 characters - should fail
		username: 'shortpass'
	}
} as const;

/**
 * API endpoints for testing
 */
export const API_ENDPOINTS = {
	REGISTER: '/api/auth/register',
	LOGIN: '/api/auth/login',
	LOGOUT: '/api/auth/logout',
	ME: '/api/auth/me'
} as const;

/**
 * Clean up test user from database via API
 * @param request - Playwright API request context
 * @param email - Email of user to delete
 */
export async function cleanupTestUser(request: APIRequestContext, email: string): Promise<void> {
	try {
		// This would call a test-only API endpoint to delete users
		// For now, we'll skip this as it requires backend support
		// await request.delete(`/api/test/users/${email}`);
		console.log(`Note: Manual cleanup may be needed for user: ${email}`);
	} catch (error) {
		// Silently fail - user might not exist
		console.log(`Cleanup for ${email} skipped:`, error);
	}
}

/**
 * Register a new user via the UI
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 * @returns Promise that resolves when registration is complete
 */
export async function registerUser(page: Page, email: string, password: string): Promise<void> {
	await page.goto('/register');
	await page.waitForLoadState('networkidle');

	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', password);

	await page.click('button[type="submit"]');
}

/**
 * Login a user via the UI
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 * @param rememberMe - Whether to check "Remember me" checkbox
 */
export async function loginUser(
	page: Page,
	email: string,
	password: string,
	rememberMe: boolean = false
): Promise<void> {
	await page.goto('/sign-in');
	await page.waitForLoadState('networkidle');

	await page.fill('input[name="email"]', email);
	await page.fill('input[name="password"]', password);

	if (rememberMe) {
		await page.check('input[name="remember_me"]');
	}

	await page.click('button:has-text("Login")');
}

/**
 * Logout via UI navigation
 * @param page - Playwright page object
 */
export async function logoutUser(page: Page): Promise<void> {
	// Navigate to a logout endpoint or clear cookies
	// This depends on your logout implementation
	await page.context().clearCookies();
}

/**
 * Check if user is authenticated by checking for session cookie
 * @param page - Playwright page object
 * @returns true if session cookie exists
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
	const cookies = await page.context().cookies();
	return cookies.some((cookie) => cookie.name === 'session' && cookie.value !== '');
}

/**
 * Assert that user is redirected to home page after successful auth
 * @param page - Playwright page object
 */
export async function assertRedirectedToHome(page: Page): Promise<void> {
	await page.waitForURL('/', { timeout: 5000 });
	await expect(page).toHaveURL('/');
}

/**
 * Assert that user sees an error message
 * @param page - Playwright page object
 * @param errorText - Expected error message text (partial match)
 */
export async function assertErrorMessage(page: Page, errorText: string): Promise<void> {
	const alert = page.locator('.alert');
	await expect(alert).toBeVisible({ timeout: 5000 });
	await expect(alert).toContainText(errorText);
}

/**
 * Assert that form inputs have error styling
 * @param page - Playwright page object
 */
export async function assertInputErrors(page: Page): Promise<void> {
	const errorInputs = page.locator('input.input-error');
	await expect(errorInputs.first()).toBeVisible();
}

/**
 * Generate a unique email for testing
 * @param prefix - Email prefix
 * @returns Unique email address
 */
export function generateUniqueEmail(prefix: string = 'test'): string {
	const timestamp = Date.now();
	const random = Math.random().toString(36).substring(7);
	return `${prefix}.${timestamp}.${random}@test.local`;
}

/**
 * Wait for form submission to complete
 * @param page - Playwright page object
 */
export async function waitForFormSubmission(page: Page): Promise<void> {
	// Wait for network to be idle after form submission
	await page.waitForLoadState('networkidle');
}
