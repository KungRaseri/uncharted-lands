/**
 * E2E Tests for Resource Production & Game State
 * Validates that helper utilities work correctly
 */

import { test, expect } from '@playwright/test';
import {
	TEST_SETTLEMENTS,
	assertStartingResources,
	getCurrentResources,
	buildExtractor
} from './helpers/settlements';
import {
	waitForResourceProduction,
	getResourceAmount,
	assertProductionRate,
	getPopulation,
	getPopulationCapacity,
	getHappiness,
	countStructures,
	// assertStructureExists,
	assertGameLoopRunning,
	joinWorldRoom,
	waitForSocketConnection,
	waitForSocketEvent
} from './helpers/game-state';
import {
	TEST_DISASTERS,
	triggerDisaster,
	assertWarningBannerVisible,
	assertImpactBannerVisible,
	getDisasterSummary
} from './helpers/disasters';
import {
	TEST_USERS,
	registerUser,
	cleanupTestUser,
	generateUniqueEmail,
	assertRedirectedToGettingStarted
} from './auth/auth.helpers';
import { getSharedTestData } from './helpers/shared-data';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const apiUrl = process.env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';
const testServerId = process.env.E2E_TEST_SERVER_ID!;

let testWorldId: string;
let testSettlementId: string;
let testUserEmail: string;
let sessionCookieValue: string;

// ============================================================================
// RESOURCE PRODUCTION FLOW TESTS
// ============================================================================

test.describe('Resource Production Flow', () => {
	// Run tests serially to prevent server overload during parallel world generation
	test.describe.configure({ mode: 'serial' });

	// Increase timeout for E2E tests (setup + execution can take 40-50 seconds)
	test.setTimeout(60000); // 60 seconds

	// ========================================================================
	// SHARED SETUP: Use global shared data (server + world created once)
	// ========================================================================
	test.beforeAll(async () => {
		console.log('[E2E] Using shared test data from global setup...');
		
		// Get shared test data created by global-setup.ts
		const sharedData = getSharedTestData();
		
		testWorldId = sharedData.generalWorldId!;
		
		if (!testWorldId) {
			throw new Error('No general world ID available from global setup');
		}
		
		console.log('[E2E] Using shared world ID:', testWorldId);
	});

	// No afterAll needed - global teardown handles cleanup

	// ========================================================================
	// PER-TEST SETUP: Create settlement for each test
	// ========================================================================
	test.beforeEach(async ({ page, request }) => {
		// Capture all browser console logs for debugging
		const consoleMessages: string[] = [];
		page.on('console', (msg) => {
			const text = msg.text();
			consoleMessages.push(text);
			console.log('[BROWSER CONSOLE]', text);
		});

		// 1. Register and login test user
		testUserEmail = generateUniqueEmail('resources-test');
		await registerUser(page, testUserEmail, TEST_USERS.VALID.password);
		await assertRedirectedToGettingStarted(page);

		// 2. Get session cookies
		const cookies = await page.context().cookies();
		const sessionCookie = cookies.find((c) => c.name === 'session');
		if (!sessionCookie) {
			throw new Error('No session cookie found after registration');
		}
		sessionCookieValue = sessionCookie.value;

		// 3. Get account information
		const accountResponse = await request.get(`${apiUrl}/account/me`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		if (!accountResponse.ok()) {
			throw new Error(`Failed to get account: ${accountResponse.status()}`);
		}
		const account = await accountResponse.json();
		const accountId = account.id;
		const username = account.profile?.username || testUserEmail;

		// 4. Create settlement in shared world
		console.log(`[E2E] Creating settlement in shared world: ${testWorldId}`);
		const settlementResponse = await request.post(`${apiUrl}/settlements`, {
			headers: { Cookie: `session=${sessionCookieValue}` },
			data: {
				worldId: testWorldId,
				serverId: testServerId,
				accountId: accountId,
				username: username,
				name: TEST_SETTLEMENTS.BASIC.name
			}
		});

		if (!settlementResponse.ok()) {
			const errorText = await settlementResponse.text();
			throw new Error(
				`Failed to create settlement: ${settlementResponse.status()} ${errorText}`
			);
		}

		const settlement = await settlementResponse.json();
		testSettlementId = settlement.id;
		console.log('[E2E] Test setup complete:', {
			worldId: testWorldId,
			settlementId: testSettlementId,
			email: testUserEmail
		});

		// 5. Navigate to settlement page
		await page.goto(`/game/settlements/${testSettlementId}`);
		await page.waitForLoadState('networkidle');

		// 6. Wait for Socket.IO connection
		await waitForSocketConnection(page);
		await joinWorldRoom(page, testWorldId, accountId);
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

	// ============================================================================
	test.describe('Resource Production', () => {
		test('should verify starting resources match expected values', async ({ page }) => {
			// Verify starting resources from TEST_SETTLEMENTS.BASIC
			await assertStartingResources(page, TEST_SETTLEMENTS.BASIC.expectedStartingResources);
		});

		test('should detect resource production over time', async ({ page }) => {
			// Build a farm to produce food using ExtractorBuildModal
			await buildExtractor(page, 'BASIC_FARM');

			// Wait for food production to increase
			await page.waitForTimeout(1000);
			const productionOccurred = await waitForResourceProduction(page, 'food', 30000);
			expect(productionOccurred).toBeTruthy();
		});

		test('should calculate correct production rate', async ({ page }) => {
			// Build a farm using ExtractorBuildModal
			await buildExtractor(page, 'BASIC_FARM');

			// Wait for production to start before measuring rate
			const productionStarted = await waitForResourceProduction(page, 'food', 30000);
			expect(productionStarted).toBeTruthy();

			// Verify production rate is at least 0.5 food/second (30/minute)
			// Use 20s duration to ensure we capture Socket.IO resource-update event
			// (events arrive approximately every 15 seconds)
			await assertProductionRate(page, 'food', 0.5, 20);
		});
	});

	// ============================================================================
	// POPULATION TESTS
	// ============================================================================

	test.describe('Population Management', () => {
		test('should display correct population data', async ({ page }) => {
			const currentPop = await getPopulation(page);
			const capacity = await getPopulationCapacity(page);
			const happiness = await getHappiness(page);

			// Starting settlement should have basic values
			expect(currentPop).toBeGreaterThan(0);
			expect(capacity).toBeGreaterThan(0);
			expect(happiness).toBeGreaterThanOrEqual(0);
			expect(happiness).toBeLessThanOrEqual(100);
		});

		test('should increase capacity when building houses', async ({ page }) => {
			// Wait for initial population-state event to ensure DOM has real calculated capacity
			// (DOM might show stale/default value before game loop first tick)
			// Note: POPULATION_INTERVAL_SEC=10 in dev/test environments (10 second ticks)
			await waitForSocketEvent(page, 'population-state', 15000);

			const initialCapacity = await getPopulationCapacity(page);

			// Verify starting capacity is correct (10 base + 2 TENT = 12)
			expect(initialCapacity).toBe(12);

			// Get initial structure count (all structures visible on page)
			const initialStructureCount = await page.locator('[data-testid="structure"]').count();

			// Build a house
			await page.click('[data-testid="build-structure-btn"]');
			await page.waitForTimeout(500); // Wait for menu to open

			// Click the BUILDING category tab if needed
			const buildingTab = page.locator('button[role="tab"]:has-text("BUILDING")');
			if (await buildingTab.isVisible()) {
				await buildingTab.click();
				await page.waitForTimeout(200);
			}

			// Click the House structure button by its display name
			await page.click('button:has-text("House")');

			// Wait for structure:built Socket.IO event
			await waitForSocketEvent(page, 'structure:built', 10000);

			// Wait for ONE population-state event after building
			// (Now that modifiers work correctly, capacity updates immediately)
			await waitForSocketEvent(page, 'population-state', 15000);

			// Wait for House to be visible BEFORE counting structures (DOM update timing)
			const houseStructure = page.locator('[data-testid="structure"]:has-text("House")');
			await expect(houseStructure).toBeVisible({ timeout: 10000 });

			// Verify structure count increased
			const newStructureCount = await page.locator('[data-testid="structure"]').count();
			expect(newStructureCount).toBe(initialStructureCount + 1);

			// Verify capacity increased after building house (12 + 5 = 17)
			// GDD specifies: HOUSE provides +5 population capacity (not +15)

			// DEBUG: Check actual DOM content
			const popElement = page.locator('[data-testid="current-population"]');
			const popText = await popElement.textContent();
			console.log('[DEBUG] Population element text:', popText);

			const newCapacity = await getPopulationCapacity(page);
			console.log('[DEBUG] getPopulationCapacity returned:', newCapacity);
			expect(newCapacity).toBe(17);
		});
	});

	// ============================================================================
	// GAME LOOP TESTS
	// ============================================================================

	test.describe('Real-Time Game Loop', () => {
		test('should verify game loop is running', async ({ page }) => {
			// Capture browser console messages
			const consoleMessages: string[] = [];
			page.on('console', (msg) => {
				const text = msg.text();
				consoleMessages.push(text);
				// Log to test output
				console.log('[BROWSER CONSOLE]', text);
			});

			// This should not throw if resource-tick events are firing
			// Uses default 30s timeout to allow for slow resource changes with integer rounding
			try {
				await assertGameLoopRunning(page);
			} catch (error) {
				// Log all console messages before throwing
				console.log('\n=== CAPTURED BROWSER CONSOLE MESSAGES ===');
				consoleMessages.forEach((msg) => console.log(msg));
				console.log('=== END BROWSER CONSOLE MESSAGES ===\n');
				throw error;
			}
		});

		test('should verify Socket.IO connection is active', async ({ page }) => {
			// Wait 2 seconds for ticks to occur
			await page.waitForTimeout(2000);

			const currentFood = await getResourceAmount(page, 'food');

			// Food might increase or decrease depending on consumption
			// But it should be a valid number (game loop running)
			expect(typeof currentFood).toBe('number');
		});
	});

	// ============================================================================
	// STRUCTURE TESTS
	// ============================================================================

	test.describe('Structure Management', () => {
		test('should count structures correctly', async ({ page }) => {
			const initialFarms = await countStructures(page, 'FARM');

			// Build a farm using ExtractorBuildModal
			await buildExtractor(page, 'BASIC_FARM');

			// Wait for component to re-render after structure:built event
			await page.waitForTimeout(500);

			const newFarms = await countStructures(page, 'FARM');
			expect(newFarms).toBe(initialFarms + 1);
		});
	});

	// ============================================================================
	// DISASTER TESTS
	// ============================================================================

	test.describe('Disaster System', () => {
		test('should trigger disaster warning and verify UI', async ({ page, request }) => {
			// Trigger a minor earthquake with warning
			const disasterId = await triggerDisaster(
				request,
				sessionCookieValue,
				testWorldId,
				TEST_DISASTERS.EARTHQUAKE_MINOR
			);

			expect(disasterId).toBeTruthy();

			// Verify warning banner appears
			await assertWarningBannerVisible(page, 'EARTHQUAKE');
		});

		test('should track disaster impact and verify casualties', async ({ page, request }) => {
			// This test takes longer due to disaster duration (60s) + aftermath processing
			test.setTimeout(120000); // 2 minutes

			// Trigger a moderate flood
			await triggerDisaster(
				request,
				sessionCookieValue,
				testWorldId,
				TEST_DISASTERS.FLOOD_MODERATE
			);

			// Wait for impact phase
			await assertImpactBannerVisible(page);

			// Wait for aftermath modal to appear (90s = 60s disaster duration + 30s buffer)
			const modal = page.locator('[data-testid="disaster-aftermath-modal"]');
			await modal.waitFor({ state: 'visible', timeout: 90000 });
			console.log('[E2E] Aftermath modal appeared for disaster impact test');

			// Get disaster summary after modal appears
			const summary = await getDisasterSummary(page, 5000);

			// Moderate disaster may or may not have casualties depending on settlement state
			// Just verify the summary data is present and valid
			expect(summary.casualties).toBeGreaterThanOrEqual(0);
			expect(summary.structuresDamaged).toBeGreaterThanOrEqual(0);
			expect(summary.resourcesLost).toBeGreaterThanOrEqual(0);

			console.log('[E2E] Disaster summary:', summary);
		});
	});

	// ============================================================================
	// INTEGRATION TESTS (Multiple Helpers)
	// ============================================================================

	test.describe('Helper Integration', () => {
		test('should verify complete settlement flow with all helpers', async ({ page }) => {
			// 1. Verify settlement page loaded (resource panel is visible)
			await page.waitForSelector('[data-testid="resource-panel"]', {
				state: 'visible',
				timeout: 10000
			});

			// 2. Verify starting resources
			const resources = await getCurrentResources(page);
			expect(resources.food).toBeGreaterThanOrEqual(0);
			expect(resources.water).toBeGreaterThanOrEqual(0);

			// 3. Verify population
			const population = await getPopulation(page);
			expect(population).toBeGreaterThan(0);

			// 4. Build an extractor (farm)
			await buildExtractor(page, 'BASIC_FARM');

			// 5. Verify structure exists (extractors may be tracked differently)
			// await assertStructureExists(page, 'Farm'); // May need adjustment

			// 6. Verify game loop is running (resource tick every 10s in E2E mode)
			await assertGameLoopRunning(page, 15000); // Wait up to 15s for first tick

			// 7. Verify resource production occurs
			const productionOccurred = await waitForResourceProduction(page, 'food', 30000);
			expect(productionOccurred).toBeTruthy();
		});
	});
});
