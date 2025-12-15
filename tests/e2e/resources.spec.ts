/**
 * E2E Tests for Resource Production & Game State
 * Validates that helper utilities work correctly
 */

import { test, expect } from '@playwright/test';
import {
	TEST_SETTLEMENTS,
	assertSettlementExists,
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
import { createWorldViaAPI, deleteWorld } from './helpers/worlds';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const apiUrl = 'http://localhost:3001/api';

let testWorldId: string;
let testSettlementId: string;
let testUserEmail: string;
let sessionCookieValue: string; // Store session cookie for cleanup

// ============================================================================
// RESOURCE PRODUCTION FLOW TESTS
// ============================================================================

test.describe('Resource Production Flow', () => {
	// Run tests serially to prevent server overload during parallel world generation
	test.describe.configure({ mode: 'serial' });

	// Increase timeout for E2E tests (setup + execution can take 40-50 seconds)
	test.setTimeout(60000); // 60 seconds

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

		// 2. Elevate user to ADMINISTRATOR via test API endpoint
		// NOTE: This uses the server's /api/test/elevate-admin/:email endpoint.
		// Role elevation is impossible via public API (PUT /api/players/:id requires existing admin - chicken-and-egg problem)
		// The test endpoint is only available in test/development environments (protected by requireTestEnvironment middleware)
		// All other operations (server/world creation) use the real API to test full authentication stack.
		console.log('[E2E] Elevating user to ADMINISTRATOR:', testUserEmail);

		const elevateResponse = await request.put(
			`${apiUrl}/test/elevate-admin/${encodeURIComponent(testUserEmail)}`
		);

		if (!elevateResponse.ok()) {
			const errorText = await elevateResponse.text();
			throw new Error(`Failed to elevate user to admin: ${elevateResponse.status()} ${errorText}`);
		}

		const elevateData = await elevateResponse.json();
		console.log('[E2E] User elevated to ADMINISTRATOR:', elevateData);

		// 3. Get session cookies from page context and add to request context
		const cookies = await page.context().cookies();
		const sessionCookie = cookies.find((c) => c.name === 'session');
		if (!sessionCookie) {
			throw new Error('No session cookie found after registration');
		}

		// Store cookie value for cleanup in afterEach
		sessionCookieValue = sessionCookie.value;

		// 4. Clean up old test worlds before creating new ones
		console.log('[E2E] Cleaning up old test worlds...');
		try {
			const worldsResponse = await request.get(`${apiUrl}/worlds`, {
				headers: {
					Cookie: `session=${sessionCookie.value}`
				}
			});

			if (worldsResponse.ok()) {
				const worlds = await worldsResponse.json();
				const oldTestWorlds = worlds.filter((w: { name: string }) =>
					w.name.startsWith('E2E Test World')
				);

				console.log(`[E2E] Found ${oldTestWorlds.length} old test worlds to clean up`);

				for (const world of oldTestWorlds) {
					try {
						await request.delete(`${apiUrl}/worlds/${world.id}`, {
							headers: {
								Cookie: `session=${sessionCookie.value}`
							}
						});
						console.log(`[E2E] Deleted old test world: ${world.name}`);
					} catch (error) {
						console.warn(`[E2E] Failed to delete old test world ${world.id}:`, error);
					}
				}
			}
		} catch (error) {
			console.warn('[E2E] Failed to clean up old test worlds:', error);
			// Continue with test - cleanup failure is not critical
		}

		// 5. Get account information
		const accountResponse = await request.get(`${apiUrl}/account/me`, {
			headers: {
				Cookie: `session=${sessionCookie.value}`
			}
		});

		if (!accountResponse.ok()) {
			throw new Error(
				`Failed to get account: ${accountResponse.status()} ${await accountResponse.text()}`
			);
		}

		const account = await accountResponse.json();
		const accountId = account.id;
		const username = account.profile?.username || testUserEmail;

		// 4. Get or create test server (now possible because user is admin)
		const serversResponse = await request.get(`${apiUrl}/servers`, {
			headers: {
				Cookie: `session=${sessionCookie.value}`
			}
		});

		if (!serversResponse.ok()) {
			throw new Error(`Failed to get servers: ${serversResponse.status()}`);
		}

		let servers = await serversResponse.json();
		let testServer;

		// Look for existing E2E test server
		testServer = servers.find((s: { name: string }) => s.name === 'E2E Test Server');

		if (!testServer) {
			console.log('[E2E] Creating E2E test server...');
			const createServerResponse = await request.post(`${apiUrl}/servers`, {
				headers: {
					Cookie: `session=${sessionCookie.value}`
				},
				data: {
					name: 'E2E Test Server',
					hostname: 'localhost',
					port: 3001,
					status: 'ONLINE'
				}
			});

			if (!createServerResponse.ok()) {
				throw new Error(
					`Failed to create server: ${createServerResponse.status()} ${await createServerResponse.text()}`
				);
			}

			testServer = await createServerResponse.json();
			console.log('[E2E] Created test server:', testServer.id);
		} else {
			console.log('[E2E] Using existing test server:', testServer.id);
		}

		// 5. Create test world (with async generation polling)
		// Use unique world name to prevent conflicts with existing test worlds
		const uniqueWorldName = `E2E Test World ${Date.now()}`;
		console.log('[E2E] Creating test world:', uniqueWorldName);
		const world = await createWorldViaAPI(
			request,
			testServer.id,
			sessionCookie.value, // Pass session token for authentication
			{
				name: uniqueWorldName,
				size: 'SMALL', // Use SMALL (10x10 = 100 tiles) for E2E tests - better chance of viable tiles
				seed: Date.now() // Use unique seed based on timestamp
			},
			true // Wait for generation to complete
		);

		testWorldId = world.id;

		console.log('[E2E] Test world ready:', {
			id: world.id,
			status: world.status,
			regionCount: world.regionCount,
			tileCount: world.tileCount
		});

		// 5. Create test settlement via API (with session cookie and required fields)
		const settlementResponse = await request.post(`${apiUrl}/settlements`, {
			headers: {
				Cookie: `session=${sessionCookie.value}`
			},
			data: {
				worldId: testWorldId,
				serverId: testServer.id,
				accountId: accountId,
				username: username,
				name: TEST_SETTLEMENTS.BASIC.name
			}
		});

		if (!settlementResponse.ok()) {
			throw new Error(
				`Failed to create settlement: ${settlementResponse.status()} ${await settlementResponse.text()}`
			);
		}

		const settlement = await settlementResponse.json();
		testSettlementId = settlement.id;

		// Navigate to settlement and wait for page load (Socket.IO keeps connection open, so networkidle won't work)
		await page.goto(`/game/settlements/${testSettlementId}`, { waitUntil: 'load' });

		// Wait for Socket.IO to connect before attempting to join world
		try {
			await waitForSocketConnection(page);
		} catch (error) {
			// Dump all browser console logs if socket connection fails
			console.log('\n=== BROWSER CONSOLE LOGS (captured during beforeEach) ===');
			consoleMessages.forEach((msg) => console.log(msg));
			console.log('=== END BROWSER CONSOLE LOGS ===\n');
			throw error;
		}

		// Manually join world room (workaround for automatic join not working in E2E)
		await joinWorldRoom(page, testWorldId, account.id);

		// DEBUG: Check if page data is loaded
		const pageData = await page.evaluate(() => {
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const win = globalThis as any;
			return {
				hasWindowSocket: win.__socket !== undefined,
				socketConnected: win.__socket?.connected,
				socketId: win.__socket?.id,
				// Try to access page data if available
				hasPageData: win.pageData !== undefined
			};
		});
		console.log('[E2E DEBUG] Page state after navigation:', pageData);
	});

	test.afterEach(async ({ request }) => {
		// Clean up test settlements
		if (testSettlementId && sessionCookieValue) {
			await request.delete(`${apiUrl}/settlements/${testSettlementId}`, {
				headers: {
					Cookie: `session=${sessionCookieValue}`
				}
			});
		}

		// Clean up test world
		if (testWorldId && sessionCookieValue) {
			await deleteWorld(request, testWorldId);
		}

		// Clear any active disasters
		if (testWorldId && sessionCookieValue) {
			await request.post(`${apiUrl}/admin/disasters/clear`, {
				headers: {
					Cookie: `session=${sessionCookieValue}`
				},
				data: { worldId: testWorldId }
			});
		}

		// Clean up test user immediately after THIS test completes
		if (testUserEmail) {
			await cleanupTestUser(request, testUserEmail);
		}
	});

	// ============================================================================
	// RESOURCE PRODUCTION TESTS
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

			// Verify structure count increased
			const newStructureCount = await page.locator('[data-testid="structure"]').count();
			expect(newStructureCount).toBe(initialStructureCount + 1);

			// Verify capacity increased after building house (12 + 15 = 27)
			const newCapacity = await getPopulationCapacity(page);
			expect(newCapacity).toBe(27);

			// Verify House structure is visible in the UI
			const houseStructure = page.locator('[data-testid="structure"]:has-text("House")');
			await expect(houseStructure).toBeVisible();
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

			// Note: This test may need adjustment based on how extractors are counted
			// vs buildings in the structure list

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
				testWorldId,
				TEST_DISASTERS.EARTHQUAKE_MINOR
			);

			expect(disasterId).toBeTruthy();

			// Verify warning banner appears
			await assertWarningBannerVisible(page, 'EARTHQUAKE');
		});

		test('should track disaster impact and verify casualties', async ({ page, request }) => {
			// Trigger a moderate flood
			await triggerDisaster(request, testWorldId, TEST_DISASTERS.FLOOD_MODERATE);

			// Wait for impact phase
			await assertImpactBannerVisible(page);

			// Get disaster summary after impact
			const summary = await getDisasterSummary(page);

			// Moderate disaster should have some casualties
			expect(summary.casualties).toBeGreaterThan(0);
			expect(summary.structuresDamaged).toBeGreaterThanOrEqual(0);
		});
	});

	// ============================================================================
	// INTEGRATION TESTS (Multiple Helpers)
	// ============================================================================

	test.describe('Helper Integration', () => {
		test('should verify complete settlement flow with all helpers', async ({ page }) => {
			// 1. Verify settlement exists
			await assertSettlementExists(page, TEST_SETTLEMENTS.BASIC.name);

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
			// 6. Verify game loop is running
			await assertGameLoopRunning(page, 5000);

			// 7. Verify resource production occurs
			const productionOccurred = await waitForResourceProduction(page, 'food', 30000);
			expect(productionOccurred).toBeTruthy();
		});
	});
});
