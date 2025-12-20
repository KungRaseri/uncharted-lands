/**
 * E2E Tests for Settlement UI Real-Time Updates
 * Tests for fixes applied on December 16, 2024
 * 
 * Verifies:
 * 1. Resource production/consumption rates display immediately on page load
 * 2. Population capacity calculated correctly from housing structures
 * 3. Population capacity updates immediately when building housing
 * 4. Population capacity updates immediately when upgrading housing
 */

import { test, expect } from '@playwright/test';
import {
	TEST_USERS,
	registerUser,
	cleanupTestUser,
	generateUniqueEmail,
	assertRedirectedToGettingStarted
} from './auth/auth.helpers';
import { createWorldViaAPI, deleteWorld } from './helpers/worlds';
import { TEST_SETTLEMENTS } from './helpers/settlements';
import {
	waitForSocketConnection,
	joinWorldRoom,
	getResourceAmount,
	getPopulation,
	getPopulationCapacity
} from './helpers/game-state';

// ============================================================================
// TEST CONFIGURATION
// ============================================================================

const apiUrl = process.env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';

let testWorldId: string;
let testSettlementId: string;
let testUserEmail: string;
let sessionCookieValue: string;

// ============================================================================
// SETTLEMENT UI REAL-TIME UPDATE TESTS
// ============================================================================

test.describe('Settlement UI Real-Time Updates', () => {
	test.describe.configure({ mode: 'serial' });
	test.setTimeout(60000); // 60 seconds

	test.beforeEach(async ({ page, request }) => {
		// Capture console logs
		page.on('console', (msg) => {
			console.log('[BROWSER]', msg.text());
		});

		// 1. Register and login test user
		testUserEmail = generateUniqueEmail('settlement-ui-test');
		await registerUser(page, testUserEmail, TEST_USERS.VALID.password);
		await assertRedirectedToGettingStarted(page);

		// 2. Elevate to admin
		console.log('[E2E] Elevating user to ADMINISTRATOR:', testUserEmail);
		const elevateResponse = await request.put(
			`${apiUrl}/test/elevate-admin/${encodeURIComponent(testUserEmail)}`
		);
		expect(elevateResponse.ok()).toBeTruthy();

		// 3. Get session cookies
		const cookies = await page.context().cookies();
		const sessionCookie = cookies.find((c) => c.name === 'session');
		if (!sessionCookie?.value) {
			throw new Error('No session cookie found after registration');
		}
		sessionCookieValue = sessionCookie.value;

		// 4. Get account information
		const accountResponse = await request.get(`${apiUrl}/account/me`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(accountResponse.ok()).toBeTruthy();
		const account = await accountResponse.json();
		const accountId = account.id;
		const username = account.profile?.username || testUserEmail;

		// 5. Get or create test server
		const serversResponse = await request.get(`${apiUrl}/servers`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(serversResponse.ok()).toBeTruthy();
		let servers = await serversResponse.json();
		let testServer = servers.find((s: { name: string }) => s.name === 'E2E Test Server');

		if (!testServer) {
			console.log('[E2E] Creating E2E test server...');
			const createServerResponse = await request.post(`${apiUrl}/servers`, {
				headers: { Cookie: `session=${sessionCookieValue}` },
				data: {
					name: 'E2E Test Server',
					hostname: 'localhost',
					port: 3001,
					status: 'ONLINE'
				}
			});
			expect(createServerResponse.ok()).toBeTruthy();
			testServer = await createServerResponse.json();
		}

		// 6. Create test world
		console.log('[E2E] Creating test world...');
		const world = await createWorldViaAPI(
			request,
			testServer.id,
			sessionCookieValue,
			{
				name: `E2E UI Test ${Date.now()}`,
				size: 'TINY',
				seed: Date.now()
			},
			true
		);
		testWorldId = world.id;

		// 7. Create settlement
		console.log('[E2E] Creating settlement...');
		const settlementResponse = await request.post(`${apiUrl}/settlements`, {
			headers: { Cookie: `session=${sessionCookieValue}` },
			data: {
				worldId: testWorldId,
				serverId: testServer.id,
				accountId: accountId,
				username: username,
				name: TEST_SETTLEMENTS.BASIC.name
			}
		});
		expect(settlementResponse.ok()).toBeTruthy();
		const settlement = await settlementResponse.json();
		testSettlementId = settlement.id;

		console.log('[E2E] Test setup complete:', {
			worldId: testWorldId,
			settlementId: testSettlementId,
			email: testUserEmail
		});
	});

	test.afterEach(async ({ request }) => {
		// Cleanup
		if (testWorldId && sessionCookieValue) {
			try {
				const deleteResponse = await request.delete(`${apiUrl}/worlds/${testWorldId}`, {
					headers: { Cookie: `session=${sessionCookieValue}` }
				});
				if (deleteResponse.ok()) {
					console.log('[E2E] Cleaned up test world:', testWorldId);
				} else {
					console.warn('[E2E] Failed to cleanup world:', testWorldId, deleteResponse.status());
				}
			} catch (error) {
				console.warn('[E2E] Failed to cleanup world:', error);
			}
		}

		if (testUserEmail && sessionCookieValue) {
			try {
				await cleanupTestUser(request, testUserEmail, sessionCookieValue);
				console.log('[E2E] Cleaned up test user:', testUserEmail);
			} catch (error) {
				console.warn('[E2E] Failed to cleanup user:', error);
			}
		}
	});

	// ========================================================================
	// TEST 1: Resource Rates Display Immediately on Page Load
	// ========================================================================
	test('should display resource production/consumption rates immediately on page load', async ({
		page,
		request
	}) => {
		console.log('[E2E] TEST 1: Resource rates display on page load');

		// Navigate to settlement page
		await page.goto(`/game/settlements/${testSettlementId}`);
		await page.waitForLoadState('networkidle');

		// Wait for Socket.IO connection
		const connected = await waitForSocketConnection(page, 10000);
		expect(connected).toBeTruthy();

		// Get account info to get profile ID for joining world room
		const accountResponse = await request.get(`${apiUrl}/account/me`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(accountResponse.ok()).toBeTruthy();
		const accountData = await accountResponse.json();
		const profileId = accountData.profile?.id;
		expect(profileId).toBeTruthy();

		// Join world room
		await joinWorldRoom(page, testWorldId, profileId);

		// Wait a moment for initial resource-update event to be received
		await page.waitForTimeout(2000);

		// Check that resource panel exists
		const resourcePanel = page.locator('[data-testid="resource-panel"]');
		await expect(resourcePanel).toBeVisible({ timeout: 5000 });

		// Get production rates for each resource
		// The fix ensures rates are NOT 0/hr on initial page load
		const foodRate = await page.locator('[data-testid="food-production-rate"]').textContent();
		const waterRate = await page.locator('[data-testid="water-production-rate"]').textContent();
		const woodRate = await page.locator('[data-testid="wood-production-rate"]').textContent();
		const stoneRate = await page.locator('[data-testid="stone-production-rate"]').textContent();
		const oreRate = await page.locator('[data-testid="ore-production-rate"]').textContent();

		console.log('[E2E] Resource production rates:', {
			food: foodRate,
			water: waterRate,
			wood: woodRate,
			stone: stoneRate,
			ore: oreRate
		});

		// ✅ ASSERTION: At least one resource should have non-zero production rate
		// New settlements should produce food and water from base tile resources
		// This verifies the sendInitialResourceData() fix is working
		const hasNonZeroRate =
			(foodRate && foodRate !== '+0/hr' && foodRate !== '0/hr') ||
			(waterRate && waterRate !== '+0/hr' && waterRate !== '0/hr');

		expect(hasNonZeroRate).toBeTruthy();
		console.log('[E2E] ✅ Resource rates are displaying (not 0/hr)');
	});

	// ========================================================================
	// TEST 2: Population Capacity Calculated Correctly from Housing
	// ========================================================================
	test('should calculate population capacity correctly from housing structures', async ({
		page,
		request
	}) => {
		console.log('[E2E] TEST 2: Population capacity calculated from housing');

		// Navigate to settlement page
		await page.goto(`/game/settlements/${testSettlementId}`);
		await page.waitForLoadState('networkidle');

		// Wait for Socket.IO connection
		const connected = await waitForSocketConnection(page, 10000);
		expect(connected).toBeTruthy();

		// Get account with profile ID
		const accountResponse = await request.get(`${apiUrl}/account/me`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(accountResponse.ok()).toBeTruthy();
		const accountData = await accountResponse.json();
		const profileId = accountData.profile?.id;
		expect(profileId).toBeTruthy();

		// Join world room
		await joinWorldRoom(page, testWorldId, profileId);

		// Wait for initial data
		await page.waitForTimeout(2000);

		// Get initial population capacity (should be base 10 with no houses)
		const initialCapacity = await getPopulationCapacity(page);
		console.log('[E2E] Initial population capacity:', initialCapacity);

		// ✅ ASSERTION: New settlement should have base capacity of 10
		// This verifies the page initialization calculates capacity correctly
		expect(initialCapacity).toBe(10);
		console.log('[E2E] ✅ Base population capacity is 10 (correct)');
	});

	// ========================================================================
	// TEST 3: Population Capacity Updates When Building Housing
	// ========================================================================
	test('should update population capacity immediately when building housing structure', async ({
		page,
		request
	}) => {
		console.log('[E2E] TEST 3: Population capacity updates when building housing');

		// Navigate to settlement page
		await page.goto(`/game/settlements/${testSettlementId}`);
		await page.waitForLoadState('networkidle');

		// Wait for Socket.IO connection
		const connected = await waitForSocketConnection(page, 10000);
		expect(connected).toBeTruthy();

		// Get account info to get profile ID
		const accountResponse = await request.get(`${apiUrl}/account/me`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(accountResponse.ok()).toBeTruthy();
		const accountData = await accountResponse.json();
		const profileId = accountData.profile?.id;
		expect(profileId).toBeTruthy();

		// Join world room
		await joinWorldRoom(page, testWorldId, profileId);
		await page.waitForTimeout(2000);

		// Get initial capacity
		const initialCapacity = await getPopulationCapacity(page);
		console.log('[E2E] Initial capacity:', initialCapacity);
		expect(initialCapacity).toBe(10); // Base capacity

		// Get structure metadata to find housing structure ID
		const structuresResponse = await request.get(`${apiUrl}/structures/metadata`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(structuresResponse.ok()).toBeTruthy();
		const structuresData = await structuresResponse.json();
		const structures = structuresData.data; // Extract data array from response

		// Find a housing structure (e.g., Basic House)
		const housingStructure = structures.find(
			(s: any) => s.category === 'BUILDING' && s.buildingType === 'HOUSING'
		);
		if (!housingStructure) {
			throw new Error('No housing structure found in structure metadata');
		}
		console.log('[E2E] Found housing structure:', housingStructure.name, housingStructure.id);

		// Build housing structure via API
		console.log('[E2E] Building housing structure...');
		const buildResponse = await request.post(`${apiUrl}/structures/create`, {
			headers: {
				Cookie: `session=${sessionCookieValue}`,
				'Content-Type': 'application/json'
			},
			data: {
				settlementId: testSettlementId,
				structureId: housingStructure.id
			}
		});

		if (!buildResponse.ok()) {
			const errorText = await buildResponse.text();
			console.error('[E2E] Build failed:', errorText);
			throw new Error(`Failed to build housing structure: ${buildResponse.status()}`);
		}

		const buildData = await buildResponse.json();
		console.log('[E2E] Housing structure built:', buildData);

		// Wait for Socket.IO event to propagate and UI to update
		await page.waitForTimeout(2000);

		// Get updated capacity
		const newCapacity = await getPopulationCapacity(page);
		console.log('[E2E] Updated capacity after building house:', newCapacity);

		// ✅ ASSERTION: Capacity should increase by housing structure's population_capacity modifier
		// According to GDD, basic housing adds +7 capacity
		// This verifies the immediate population-state emission after structure build
		expect(newCapacity).toBeGreaterThan(initialCapacity);
		expect(newCapacity).toBe(17); // 10 base + 7 from house
		console.log('[E2E] ✅ Population capacity updated immediately after building housing');
	});

	// ========================================================================
	// TEST 4: Population Capacity Updates When Upgrading Housing
	// ========================================================================
	test('should update population capacity immediately when upgrading housing structure', async ({
		page,
		request
	}) => {
		console.log('[E2E] TEST 4: Population capacity updates when upgrading housing');

		// Navigate to settlement page
		await page.goto(`/game/settlements/${testSettlementId}`);
		await page.waitForLoadState('networkidle');

		// Wait for Socket.IO connection
		const connected = await waitForSocketConnection(page, 10000);
		expect(connected).toBeTruthy();

		// Get account info to get profile ID
		const accountResponse = await request.get(`${apiUrl}/account/me`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(accountResponse.ok()).toBeTruthy();
		const accountData = await accountResponse.json();
		const profileId = accountData.profile?.id;
		expect(profileId).toBeTruthy();

		// Join world room
		await joinWorldRoom(page, testWorldId, profileId);
		await page.waitForTimeout(2000);

		// Step 1: Build a housing structure first
		const structuresResponse = await request.get(`${apiUrl}/structures/metadata`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(structuresResponse.ok()).toBeTruthy();
		const structuresData = await structuresResponse.json();
		const structures = structuresData.data; // Extract data array from response

		const housingStructure = structures.find(
			(s: any) => s.category === 'BUILDING' && s.buildingType === 'HOUSING'
		);
		if (!housingStructure) {
			throw new Error('No housing structure found');
		}

		console.log('[E2E] Building housing structure...');
		const buildResponse = await request.post(`${apiUrl}/structures/create`, {
			headers: {
				Cookie: `session=${sessionCookieValue}`,
				'Content-Type': 'application/json'
			},
			data: {
				settlementId: testSettlementId,
				structureId: housingStructure.id
			}
		});
		expect(buildResponse.ok()).toBeTruthy();
		const buildData = await buildResponse.json();
		const settlementStructureId = buildData.structure.id;

		await page.waitForTimeout(2000);

		// Get capacity after building house
		const capacityAfterBuild = await getPopulationCapacity(page);
		console.log('[E2E] Capacity after building house:', capacityAfterBuild);
		expect(capacityAfterBuild).toBe(17); // 10 base + 7 from level 1 house

		// Step 2: Upgrade the housing structure
		console.log('[E2E] Upgrading housing structure to level 2...');
		const upgradeResponse = await request.put(
			`${apiUrl}/structures/${settlementStructureId}/upgrade`,
			{
				headers: {
					Cookie: `session=${sessionCookieValue}`,
					'Content-Type': 'application/json'
				}
			}
		);

		if (!upgradeResponse.ok()) {
			const errorText = await upgradeResponse.text();
			console.error('[E2E] Upgrade failed:', errorText);
			throw new Error(`Failed to upgrade housing structure: ${upgradeResponse.status()}`);
		}

		const upgradeData = await upgradeResponse.json();
		console.log('[E2E] Housing structure upgraded:', upgradeData);

		// Wait for Socket.IO event to propagate
		await page.waitForTimeout(2000);

		// Get capacity after upgrade
		const capacityAfterUpgrade = await getPopulationCapacity(page);
		console.log('[E2E] Capacity after upgrading house:', capacityAfterUpgrade);

		// ✅ ASSERTION: Capacity should increase after upgrade
		// Level 2 housing should add more capacity than level 1
		// This verifies the immediate population-state emission after structure upgrade
		expect(capacityAfterUpgrade).toBeGreaterThan(capacityAfterBuild);
		console.log('[E2E] ✅ Population capacity updated immediately after upgrading housing');
	});

	// ========================================================================
	// TEST 5: Resource Rates Update After Building Extractors
	// ========================================================================
	test('should update resource production rates after building extractors', async ({
		page,
		request
	}) => {
		console.log('[E2E] TEST 5: Resource rates update after building extractors');

		// Navigate to settlement page
		await page.goto(`/game/settlements/${testSettlementId}`);
		await page.waitForLoadState('networkidle');

		// Wait for Socket.IO connection
		const connected = await waitForSocketConnection(page, 10000);
		expect(connected).toBeTruthy();

		// Get account info to get profile ID
		const accountResponse = await request.get(`${apiUrl}/account/me`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(accountResponse.ok()).toBeTruthy();
		const accountData = await accountResponse.json();
		const profileId = accountData.profile?.id;
		expect(profileId).toBeTruthy();

		// Join world room
		await joinWorldRoom(page, testWorldId, profileId);
		await page.waitForTimeout(2000);

		// Get initial food production rate
		const initialFoodRate = await page
			.locator('[data-testid="food-production-rate"]')
			.textContent();
		console.log('[E2E] Initial food production rate:', initialFoodRate);

		// Get structure metadata to find food extractor
		const structuresResponse = await request.get(`${apiUrl}/structures/metadata`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(structuresResponse.ok()).toBeTruthy();
		const structuresData = await structuresResponse.json();
		const structures = structuresData.data; // Extract data array from response

		// Find a food extractor (e.g., Farm)
		const foodExtractor = structures.find(
			(s: any) =>
				s.category === 'EXTRACTOR' &&
				(s.extractorType === 'FOOD' || s.extractorType === 'FOOD_WATER')
		);

		if (!foodExtractor) {
			console.warn('[E2E] No food extractor found - skipping test');
			test.skip();
			return;
		}

		console.log('[E2E] Found food extractor:', foodExtractor.name, foodExtractor.id);

		// Get tile ID from settlement
		const settlementResponse = await request.get(`${apiUrl}/settlements/${testSettlementId}`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(settlementResponse.ok()).toBeTruthy();
		const settlement = await settlementResponse.json();
		const tileId = settlement.tileId;

		// Build food extractor on tile (slot 0)
		console.log('[E2E] Building food extractor...');
		const buildResponse = await request.post(`${apiUrl}/structures/create`, {
			headers: {
				Cookie: `session=${sessionCookieValue}`,
				'Content-Type': 'application/json'
			},
			data: {
				settlementId: testSettlementId,
				structureId: foodExtractor.id,
				tileId: tileId,
				slotPosition: 0
			}
		});

		if (!buildResponse.ok()) {
			const errorText = await buildResponse.text();
			console.error('[E2E] Build failed:', errorText);
			throw new Error(`Failed to build food extractor: ${buildResponse.status()}`);
		}

		const buildData = await buildResponse.json();
		console.log('[E2E] Food extractor built:', buildData);

		// Wait for game loop to process and emit updated rates
		// The sendInitialResourceData doesn't automatically re-run after building
		// But the game loop should emit updated rates within 10 seconds
		await page.waitForTimeout(12000);

		// Get updated food production rate
		const newFoodRate = await page.locator('[data-testid="food-production-rate"]').textContent();
		console.log('[E2E] Updated food production rate:', newFoodRate);

		// ✅ ASSERTION: Food production rate should increase after building farm
		// This verifies the game loop continues to emit resource-update events
		expect(newFoodRate).not.toBe(initialFoodRate);
		console.log('[E2E] ✅ Resource production rate updated after building extractor');
	});
});
