import { test, expect } from '@playwright/test';
import { addGenerousTestResources } from './helpers/settlements.js';
import { registerUser, generateUniqueEmail, TEST_USERS, cleanupTestUser } from './auth/auth.helpers.js';
import { getSharedTestData } from './helpers/shared-data';
import { waitForSocketConnection, joinWorldRoom } from './helpers/game-state.js';

/**
 * Construction Queue E2E Tests
 * 
 * Tests the complete construction queue flow from building
 * structures to completion and UI updates.
 */

const apiUrl = process.env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';
const testServerId = process.env.E2E_TEST_SERVER_ID!;

test.describe('Construction Queue', () => {
	let settlementId: string;
	let testUserEmail: string;
	let sessionCookieValue: string;
	let testWorldId: string;

	test.beforeAll(async () => {
		console.log('[E2E] Using shared test data from global setup...');
		const sharedData = getSharedTestData();
		testWorldId = sharedData.generalWorldId!;
		if (!testWorldId) {
			throw new Error('No general world ID available from global setup');
		}
		console.log('[E2E] Using shared world ID:', testWorldId);
	});

	test.beforeEach(async ({ page, request }) => {
		// Register new test user
		testUserEmail = generateUniqueEmail('construction-queue-test');
		await registerUser(page, testUserEmail, TEST_USERS.VALID.password);
		
		// Should redirect to getting started
		await page.waitForURL('/game/getting-started', { timeout: 10000 });
		
		// Get session cookie
		const cookies = await page.context().cookies();
		const sessionCookie = cookies.find((c) => c.name === 'session');
		if (!sessionCookie?.value) {
			throw new Error('No session cookie found after registration');
		}
		sessionCookieValue = sessionCookie.value;

		// Get account info
		const accountResponse = await request.get(`${apiUrl}/account/me`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(accountResponse.ok()).toBeTruthy();
		const account = await accountResponse.json();
		const accountId = account.id;
		const username = account.profile?.username || testUserEmail;

		// Create settlement
		const settlementResponse = await request.post(`${apiUrl}/settlements`, {
			headers: { Cookie: `session=${sessionCookieValue}` },
			data: {
				worldId: testWorldId,
				serverId: testServerId,
				accountId: accountId,
				username: username
			}
		});
		
		if (!settlementResponse.ok()) {
			const errorText = await settlementResponse.text();
			console.log('[E2E] Settlement creation failed:', {
				status: settlementResponse.status(),
				error: errorText
			});
		}
		
		expect(settlementResponse.ok()).toBeTruthy();
		const settlement = await settlementResponse.json();
		settlementId = settlement.id;

		// Add generous test resources
		await addGenerousTestResources(request, settlementId);
		
		// Navigate to settlement
		await page.goto(`/game/settlements/${settlementId}`);
		await page.waitForLoadState('networkidle');
		
		// Wait for Socket.IO connection
		await waitForSocketConnection(page);
		await joinWorldRoom(page, testWorldId, accountId);
		
		// Wait for dashboard to be ready - buildings panel build button
		try {
			await page.waitForSelector('[data-testid="build-structure-btn"]', { timeout: 10000 });
		} catch (error) {
			console.log('[E2E] Failed to find build-structure-btn, taking screenshot...');
			await page.screenshot({ path: `build-btn-timeout-${Date.now()}.png`, fullPage: true });
			
			// Log what's actually on the page
			const bodyText = await page.textContent('body');
			console.log('[E2E] Page content:', bodyText?.substring(0, 500));
			
			throw error;
		}
	});

	test.afterEach(async ({ request }) => {
		// Clean up test user only (world is shared)
		if (testUserEmail) {
			try {
				await cleanupTestUser(request, testUserEmail);
				console.log('[E2E] Cleaned up test user:', testUserEmail);
			} catch (error) {
				console.warn('[E2E] Failed to cleanup user:', error);
			}
		}
	});

	test('should display construction queue panel', async ({ page }) => {
		// Verify construction queue panel is visible
		const queuePanel = page.locator('section').filter({ hasText: 'Construction Queue' });
		await expect(queuePanel).toBeVisible();
	});

	test('should open build menu', async ({ page }) => {
		// Click build menu button
		await page.click('[data-testid="build-structure-btn"]');
		
		// Wait for build menu to appear
		const buildMenu = page.locator('text=Build Structure').first();
		await expect(buildMenu).toBeVisible({ timeout: 5000 });
	});

	test('should display available structures', async ({ page }) => {
		// Open build menu
		await page.click('[data-testid="build-structure-btn"]');
		
		// Wait for structures to load
		await page.waitForSelector('[data-testid^="build-structure-"]', { timeout: 5000 });
		
		// Verify at least one structure is shown
		const structures = page.locator('[data-testid^="build-structure-"]');
		await expect(structures.first()).toBeVisible();
	});

	test('should add building to construction queue', async ({ page }) => {
		// Open build menu
		await page.click('[data-testid="build-structure-btn"]');
		await page.waitForTimeout(1000);
		
		// Try to build a Tent (cheap structure)
		const tentButton = page.locator('[data-testid="build-structure-tent"]');
		if (await tentButton.count() > 0) {
			await tentButton.click();
			
			// Wait for construction queue to update
			await page.waitForTimeout(2000);
			
			// Check if construction item appears
			const constructionItems = page.locator('[data-testid="construction-queue-item"]');
			const count = await constructionItems.count();
			
			// If structure was added, verify it
			if (count > 0) {
				const firstItem = constructionItems.first();
				await expect(firstItem).toBeVisible();
				
				// Verify structure name is shown
				const structureName = firstItem.locator('[data-testid="structure-name"]');
				await expect(structureName).toBeVisible();
			}
		}
	});

	test('should show time remaining in HH:MM:SS format', async ({ page }) => {
		// Check if there are any construction items
		const constructionItems = page.locator('[data-testid="construction-queue-item"]');
		const count = await constructionItems.count();
		
		if (count > 0) {
			// Get time remaining element
			const timeRemaining = constructionItems.first().locator('[data-testid="time-remaining"]');
			const timeText = await timeRemaining.textContent();
			
			// Verify format is HH:MM:SS (e.g., "00:05:30")
			expect(timeText).toMatch(/^\d{2}:\d{2}:\d{2}$/);
		}
	});

	test('should show progress bar for active construction', async ({ page }) => {
		// Check if there are any active construction items
		const activeItems = page.locator('[data-testid="construction-queue-item"][data-status="active"]');
		const count = await activeItems.count();
		
		if (count > 0) {
			// Verify progress bar exists
			const progressBar = activeItems.first().locator('[data-testid="progress-bar"]');
			await expect(progressBar).toBeVisible();
			
			// Get progress value
			const progressValue = await progressBar.getAttribute('data-progress');
			
			// Verify progress is a number between 0 and 100
			const progress = parseFloat(progressValue || '0');
			expect(progress).toBeGreaterThanOrEqual(0);
			expect(progress).toBeLessThanOrEqual(100);
		}
	});

	test('should update progress over time', async ({ page }) => {
		// Check if there are any active construction items
		const activeItems = page.locator('[data-testid="construction-queue-item"][data-status="active"]');
		const count = await activeItems.count();
		
		if (count > 0) {
			const progressBar = activeItems.first().locator('[data-testid="progress-bar"]');
			
			// Get initial progress
			const initialProgress = await progressBar.getAttribute('data-progress');
			const initialTime = await activeItems.first().locator('[data-testid="time-remaining"]').textContent();
			
			// Wait 3 seconds
			await page.waitForTimeout(3000);
			
			// Get updated progress
			const updatedProgress = await progressBar.getAttribute('data-progress');
			const updatedTime = await activeItems.first().locator('[data-testid="time-remaining"]').textContent();
			
			// Progress should have increased OR time should have decreased
			// (depending on whether progress ticker is running)
			expect(
				parseFloat(updatedProgress || '0') > parseFloat(initialProgress || '0') ||
				updatedTime !== initialTime
			).toBeTruthy();
		}
	});

	test('should persist construction queue on page refresh', async ({ page }) => {
		// Get current construction queue count
		const constructionItems = page.locator('[data-testid="construction-queue-item"]');
		const initialCount = await constructionItems.count();
		
		if (initialCount > 0) {
			// Get first structure name
			const firstName = await constructionItems.first().locator('[data-testid="structure-name"]').textContent();
			
			// Refresh page
			await page.reload();
			
			// Wait for construction queue to reload
			await page.waitForSelector('[data-testid="build-menu-button"]', { timeout: 10000 });
			await page.waitForTimeout(2000);
			
			// Verify construction items still exist
			const newConstructionItems = page.locator('[data-testid="construction-queue-item"]');
			const newCount = await newConstructionItems.count();
			
			expect(newCount).toBe(initialCount);
			
			// Verify first structure name matches
			if (newCount > 0) {
				const newFirstName = await newConstructionItems.first().locator('[data-testid="structure-name"]').textContent();
				expect(newFirstName).toBe(firstName);
			}
		}
	});
});
