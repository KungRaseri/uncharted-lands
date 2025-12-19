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
import crypto from 'node:crypto';

const API_BASE_URL = process.env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';

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
		const response = await request.delete(
			`${API_BASE_URL}/test/cleanup/user/${encodeURIComponent(email)}`
		);
		if (!response.ok()) {
			console.warn(`Failed to cleanup user ${email}: ${response.status()}`);
		}
	} catch (error) {
		// Silently fail - user might not exist or API might be unavailable
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

	// Click submit and wait for navigation to complete
	// SvelteKit form action will redirect to /game/getting-started
	await Promise.all([
		page.waitForURL('/game/getting-started', { timeout: 15000 }),
		page.locator('button[type="submit"]').click({ timeout: 5000 })
	]);
}

/**
 * Attempt to login (without waiting for redirect - for testing invalid logins)
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 * @param rememberMe - Whether to check "Remember me" checkbox
 */
export async function attemptLogin(
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

	// Click login button but don't wait for navigation (test will verify behavior)
	await page.click('button:has-text("Login")');
	// Wait for form submission to process
	await page.waitForLoadState('networkidle');
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
	await attemptLogin(page, email, password, rememberMe);
	// Wait for successful redirect to game area
	await page.waitForURL(/\/game/, { waitUntil: 'networkidle' });
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
 * Assert that user is redirected to game area after successful auth
 * @param page - Playwright page object
 */
export async function assertRedirectedToHome(page: Page): Promise<void> {
	// User should be redirected to /game or a subpath like /game/getting-started
	await page.waitForURL(/\/game/, { timeout: 5000 });
	await expect(page).toHaveURL(/\/game/);
}

/**
 * Assert that user is redirected to getting-started page after registration
 * @param page - Playwright page object
 */
export async function assertRedirectedToGettingStarted(page: Page): Promise<void> {
	await page.waitForURL('/game/getting-started', { timeout: 5000 });
	await expect(page).toHaveURL('/game/getting-started');
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
	// Use crypto.randomBytes for secure random generation (GHSA-finding fix)
	const random = crypto.randomBytes(4).toString('hex');
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
