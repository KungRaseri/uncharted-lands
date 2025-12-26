/**
 * Example: Updated Building Area System Test
 * 
 * Shows how to use shared test data from global-setup.ts instead of
 * creating new servers and worlds for each test suite.
 * 
 * KEY CHANGES:
 * 1. Import getSharedTestData() instead of createWorldViaAPI
 * 2. Use shared server/world IDs from global setup
 * 3. Only create user-specific data (settlements, players)
 * 4. Tests run MUCH faster (~30s vs 2+ minutes for beforeAll)
 */

import { test, expect } from '@playwright/test';
import {
	TEST_USERS,
	registerUser,
	cleanupTestUser,
	generateUniqueEmail
} from './auth/auth.helpers';
import { getSharedTestData } from './helpers/shared-data';
import { createSettlementViaAPI, deleteSettlement } from './helpers/settlements';
import { waitForSocketConnection, joinWorldRoom } from './helpers/game-state';

const apiUrl = process.env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';

let testSettlementId: string;
let testUserEmail: string;
let sessionCookieValue: string;

test.describe('Building Area System (Using Shared Data)', () => {
	test.describe.configure({ mode: 'serial' });
	test.setTimeout(90000);

	// ========================================================================
	// SIMPLIFIED SETUP: Use shared server/world from global-setup.ts
	// No need to create server or world - just register user and create settlement
	// ========================================================================
	test.beforeAll(async ({ browser }) => {
		console.log('[E2E] Setting up test user and settlement...');

		// Get shared test data created by global-setup.ts
		const sharedData = getSharedTestData();
		console.log('[E2E] Using shared server:', sharedData.testServerId);
		console.log('[E2E] Using shared world:', sharedData.generalWorldId);

		const context = await browser.newContext();
		const page = await context.newPage();

		// Register test user
		testUserEmail = generateUniqueEmail('area-test-user');
		await registerUser(page, testUserEmail, TEST_USERS.VALID.password);

		// Get session token
		const cookies = await context.cookies();
		const sessionCookie = cookies.find((c) => c.name === 'session');
		if (!sessionCookie) {
			throw new Error('No session cookie found');
		}
		sessionCookieValue = sessionCookie.value;

		// Create settlement in shared world
		const settlement = await createSettlementViaAPI(
			page.request,
			sessionCookieValue,
			sharedData.generalWorldId!,
			'Test Settlement',
			{ x: 2, y: 2 }
		);
		testSettlementId = settlement.id;

		console.log('[E2E] Test settlement created:', testSettlementId);

		await page.close();
		await context.close();
	});

	test.afterAll(async ({ browser }) => {
		// Clean up user-specific data
		const context = await browser.newContext();
		const page = await context.newPage();

		if (testSettlementId && sessionCookieValue) {
			try {
				await deleteSettlement(page.request, testSettlementId);
				console.log('[E2E] Settlement cleaned up');
			} catch (error) {
				console.log('[E2E] Settlement cleanup skipped');
			}
		}

		if (testUserEmail) {
			await cleanupTestUser(page.request, testUserEmail);
		}

		await page.close();
		await context.close();
	});

	// Tests remain the same - they just run much faster now!
	test('should display initial area capacity (500 base, TH level 0)', async ({ page }) => {
		await page.goto(`/game/settlement/${testSettlementId}`);
		
		// Wait for Socket.IO connection
		await waitForSocketConnection(page, 10000, true);

		// Check area capacity display
		const areaDisplay = page.locator('[data-testid="area-capacity-display"]');
		await expect(areaDisplay).toBeVisible({ timeout: 10000 });
		
		const areaText = await areaDisplay.textContent();
		expect(areaText).toContain('0'); // Initial area used
		expect(areaText).toContain('500'); // Base capacity
	});

	// ... rest of tests ...
});
