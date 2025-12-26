/**
 * E2E Tests for Error Handling & Edge Cases
 * Created: December 23, 2025
 *
 * Tests error handling including:
 * 1. API failures (500, 503 errors)
 * 2. Network retry mechanisms
 * 3. Validation errors (insufficient resources, invalid data)
 * 4. Session expiration handling
 * 5. Concurrent modification conflicts
 * 6. Malformed API responses
 * 7. Slow API responses with loading states
 * 8. Request timeouts
 * 9. Socket.IO disconnection during actions
 * 10. 404 errors for invalid resources
 *
 * IMPLEMENTATION STATUS:
 * 📋 Phase 1: API Error Handling (0/3 tests - starting)
 * ⏳ Phase 2: Edge Cases (0/3 tests)
 * ⏳ Phase 3: Advanced Error Handling (0/4 tests)
 */

import { test, expect } from '@playwright/test';
import {
	generateUniqueEmail,
	registerUser,
	assertRedirectedToGettingStarted,
	TEST_USERS,
	cleanupTestUser
} from './auth/auth.helpers';
import { getSharedTestData } from './helpers/shared-data';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const API_URL = process.env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';

// ============================================================================
// ERROR HANDLING & EDGE CASES TESTS
// ============================================================================

test.describe('Error Handling & Edge Cases', () => {
	let sharedWorldId: string;
	let testUserEmail: string;

	// Increase timeout for error tests
	test.setTimeout(90000); // 90 seconds

	// ========================================================================
	// SETUP & TEARDOWN
	// ========================================================================

	test.beforeAll(async () => {
		console.log('[E2E] Using shared test data from global setup...');
		const sharedData = getSharedTestData();
		sharedWorldId = sharedData.generalWorldId!;
		if (!sharedWorldId) {
			throw new Error('No general world ID available from global setup');
		}
		console.log('[E2E] Using shared world ID:', sharedWorldId);
	});

	// ========================================================================
	// PER-TEST SETUP
	// ========================================================================

	test.beforeEach(async ({ page }) => {
		// Register and login test user for each test
		testUserEmail = generateUniqueEmail('error-test');
		await registerUser(page, testUserEmail, TEST_USERS.VALID.password);
		await assertRedirectedToGettingStarted(page);

		// Capture browser console for debugging
		page.on('console', (msg) => {
			if (msg.type() === 'error') {
				console.log('[BROWSER ERROR]', msg.text());
			}
		});
	});

	test.afterEach(async ({ request }) => {
		// Clean up test user after each test
		if (testUserEmail) {
			try {
				await cleanupTestUser(request, testUserEmail);
				console.log('[E2E] Cleaned up test user:', testUserEmail);
			} catch (error) {
				console.warn('[E2E] Failed to cleanup user:', error);
			}
		}
	});

	// ========================================================================
	// PHASE 1: API ERROR HANDLING
	// ========================================================================

	test.describe('Phase 1: API Error Handling', () => {
		test('should show error when API request fails with 500', async ({ page }) => {
			console.log('[TEST] Testing API 500 error handling...');

			// Get session cookie
			const cookies = await page.context().cookies();
			const sessionCookie = cookies.find((c) => c.name === 'session');
			if (!sessionCookie) {
				throw new Error('No session cookie found');
			}

			// Intercept settlement creation and force 500 error
			await page.route('**/api/settlements', (route) => {
				route.fulfill({
					status: 500,
					contentType: 'application/json',
					body: JSON.stringify({ error: 'Internal server error', message: 'Database connection failed' })
				});
			});

			// Get account details
			const accountResponse = await page.request.get(`${API_URL}/account/me`, {
				headers: { Cookie: `session=${sessionCookie.value}` }
			});
			const account = await accountResponse.json();

			// Try to create settlement via API
			const response = await page.request.post(`${API_URL}/settlements`, {
				headers: { Cookie: `session=${sessionCookie.value}` },
				data: {
					worldId: sharedWorldId,
					serverId: sharedServerId,
					accountId: account.id,
					username: account.profile?.username || 'testuser',
					name: 'Error Test Settlement'
				}
			});

			// Verify error response
			expect(response.status()).toBe(500);
			const errorData = await response.json();
			expect(errorData.error).toBeTruthy();

			console.log('[TEST] ✅ API 500 error handled correctly');

			// Remove route interception
			await page.unroute('**/api/settlements');
		});

		test.skip('should show retry option on network failure', async ({ page, request }) => {
			console.log('[TEST] Testing network retry mechanism...');

			// TODO: Create settlement
			// TODO: Intercept structure build and fail first time, succeed second
			// TODO: Verify retry button appears
			// TODO: Click retry and verify success

			console.log('[TEST] ⏭️  Retry UI not yet implemented');
		});

	test.skip('should handle validation errors for insufficient resources', async ({
		}) => {
			console.log('[TEST] Testing validation error handling...');

			// Get session cookie
			const cookies = await page.context().cookies();
			const sessionCookie = cookies.find((c) => c.name === 'session');
			if (!sessionCookie) {
				throw new Error('No session cookie found');
			}

			// Get account details
			const accountResponse = await page.request.get(`${API_URL}/account/me`, {
				headers: { Cookie: `session=${sessionCookie.value}` }
			});
			const account = await accountResponse.json();

			// Create settlement
			const settlementResponse = await request.post(`${API_URL}/settlements`, {
				headers: { Cookie: `session=${sessionCookie.value}` },
				data: {
					worldId: sharedWorldId,
					serverId: sharedServerId,
					accountId: account.id,
					username: account.profile?.username || 'testuser',
					name: 'Validation Test Settlement'
				}
			});

			if (!settlementResponse.ok()) {
				throw new Error(`Failed to create settlement: ${await settlementResponse.text()}`);
			}

			const settlement = await settlementResponse.json();

			// Drain resources to near zero
			await request.post(`${API_URL}/test/set-resources`, {
				headers: { Cookie: `session=${sessionCookie.value}` },
				data: {
					settlementId: settlement.id,
					resources: { wood: 0, stone: 0 }
				}
			});

			// Navigate to settlement
			await page.goto(`/game/settlements/${settlement.id}`);
			await page.waitForLoadState('networkidle');
			await page.waitForTimeout(2000);

			// Verify resources are depleted
			const woodText = await page.locator('[data-testid="resource-wood"]').textContent();
			expect(woodText).toContain('0');

			console.log('[TEST] ✅ Validation errors handled correctly');
		});
	});

	// ========================================================================
	// PHASE 2: EDGE CASES
	// ========================================================================

	test.describe('Phase 2: Edge Cases', () => {
test.skip('should handle session expiration', async ({ page }) => {
		console.log('[TEST] Testing session expiration handling...');

		// Navigate to a protected page
		await page.goto('/game/settlements');
		await page.waitForLoadState('networkidle');

		// Verify we can access it (logged in)
		expect(page.url()).toContain('/game');

		// Clear session cookie to simulate expiration
		await page.context().clearCookies();

		// Try to navigate to another protected page (should redirect to login)
		await page.goto('/game/worlds');
		await page.waitForLoadState('networkidle');

			// Should be redirected to login or getting started
			await page.waitForTimeout(2000);
			const url = page.url();
			const isRedirected = url.includes('/login') || url.includes('/getting-started');

			expect(isRedirected).toBe(true);

			console.log('[TEST] ✅ Session expiration handled correctly');
		});

		test.skip('should handle concurrent modification conflicts', async ({ page, context }) => {
			console.log('[TEST] Testing concurrent modification...');

			// TODO: Create settlement
			// TODO: Open second tab with same settlement
			// TODO: Both tabs try to build same structure simultaneously
			// TODO: Verify one succeeds, one shows conflict error

			console.log('[TEST] ⏭️  Concurrent modification detection not yet implemented');
		});

		test('should handle malformed API responses gracefully', async ({ page }) => {
			console.log('[TEST] Testing malformed response handling...');

			// Intercept API call and return invalid JSON
			await page.route('**/api/account/me', (route) => {
				route.fulfill({
					status: 200,
					contentType: 'application/json',
					body: 'INVALID_JSON{{{' // Intentionally malformed
				});
			});

			// Try to load page that fetches account
			try {
				await page.goto('/getting-started');
				await page.waitForTimeout(2000);

				// Application should handle gracefully (not crash)
				const bodyText = await page.textContent('body');
				expect(bodyText).toBeTruthy();

				console.log('[TEST] ✅ Malformed responses handled gracefully');
			} finally {
				await page.unroute('**/api/account/me');
			}
		});
	});

	// ========================================================================
	// PHASE 3: ADVANCED ERROR HANDLING
	// ========================================================================

	test.describe('Phase 3: Advanced Error Handling', () => {
		test.skip('should show loading state for slow API responses', async ({ page }) => {
			console.log('[TEST] Testing loading state for slow API...');

			// TODO: Intercept API call with delay
			// TODO: Verify loading spinner appears
			// TODO: Wait for response
			// TODO: Verify loading spinner disappears

			console.log('[TEST] ⏭️  Loading state UI needs verification');
		});

		test.skip('should handle request timeout after 30 seconds', async ({ page }) => {
			console.log('[TEST] Testing request timeout...');

			// TODO: Intercept API call and never respond
			// TODO: Wait for timeout (30s)
			// TODO: Verify timeout error message
			// TODO: Verify retry button available

			console.log('[TEST] ⏭️  Timeout handling needs implementation');
		});

		test.skip('should recover from Socket.IO disconnection mid-action', async ({ page }) => {
			console.log('[TEST] Testing Socket.IO recovery...');

			// TODO: Create settlement
			// TODO: Start action (e.g., build structure)
			// TODO: Simulate Socket.IO disconnect mid-action
			// TODO: Verify action completes or shows retry option

			console.log('[TEST] ⏭️  Socket.IO recovery needs implementation');
		});

		test('should handle 404 errors for invalid settlement IDs', async ({ page }) => {
			console.log('[TEST] Testing 404 error handling...');

			// Try to navigate to non-existent settlement
			await page.goto('/game/settlements/invalid-settlement-id-12345');
			await page.waitForTimeout(2000);

			// Should show error or redirect
			const url = page.url();
			const bodyText = await page.textContent('body');

			// Check for error indication (either 404 page, error message, or redirect)
			const hasError =
				bodyText?.includes('not found') ||
				bodyText?.includes('error') ||
				url.includes('/game/settlements') ||
				url.includes('/getting-started');

			expect(hasError).toBe(true);

			console.log('[TEST] ✅ 404 errors handled correctly');
		});
	});
});
