/**
 * E2E Tests for Resource Production & Game State
 * Validates that helper utilities work correctly
 */

import { test, expect } from '@playwright/test';
import {
	TEST_SETTLEMENTS,
	assertSettlementExists,
	assertStartingResources,
	getCurrentResources
} from './helpers/settlements';
import {
	waitForResourceProduction,
	getResourceAmount,
	assertProductionRate,
	getPopulation,
	getPopulationCapacity,
	getHappiness,
	countStructures,
	assertStructureExists,
	assertGameLoopRunning
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
	generateUniqueEmail
} from './auth/auth.helpers';

// ============================================================================
// TEST SETUP & TEARDOWN
// ============================================================================

let testWorldId: string;
let testSettlementId: string;
let testUserEmail: string;
let sessionCookieValue: string; // Store session cookie for cleanup

test.beforeEach(async ({ page, request }) => {
	// 1. Register and login test user
	testUserEmail = generateUniqueEmail('resources-test');
	await registerUser(page, testUserEmail, TEST_USERS.VALID.password);
	await page.waitForURL('/', { timeout: 10000 });

	// 2. Get session cookies from page context and add to request context
	const cookies = await page.context().cookies();
	const sessionCookie = cookies.find((c) => c.name === 'session');
	if (!sessionCookie) {
		throw new Error('No session cookie found after registration');
	}

	// Store cookie value for cleanup in afterEach
	sessionCookieValue = sessionCookie.value;

	// API base URL
	const apiUrl = 'http://localhost:3001/api';

	// 3. Get account information
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

	// 4. Get or create test world (with session cookie)
	const worldResponse = await request.get(`${apiUrl}/worlds`, {
		headers: {
			Cookie: `session=${sessionCookie.value}`
		}
	});

	if (!worldResponse.ok()) {
		throw new Error(
			`Failed to get worlds: ${worldResponse.status()} ${await worldResponse.text()}`
		);
	}

	const worlds = await worldResponse.json();

	let world;
	if (worlds.length === 0) {
		// Create a test world
		const createResponse = await request.post(`${apiUrl}/worlds`, {
			headers: {
				Cookie: `session=${sessionCookie.value}`
			},
			data: {
				name: 'E2E Test World',
				size: 'SMALL',
				seed: 'test-seed-123'
			}
		});

		if (!createResponse.ok()) {
			throw new Error(
				`Failed to create world: ${createResponse.status()} ${await createResponse.text()}`
			);
		}

		world = await createResponse.json();
		testWorldId = world.id;
	} else {
		world = worlds[0];
		testWorldId = world.id;
	}

	// 5. Create test settlement via API (with session cookie and required fields)
	const settlementResponse = await request.post(`${apiUrl}/settlements`, {
		headers: {
			Cookie: `session=${sessionCookie.value}`
		},
		data: {
			worldId: testWorldId,
			serverId: world.server.id,
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

	// Navigate to settlement
	await page.goto(`/game/settlements/${testSettlementId}`);
});

test.afterEach(async ({ request }) => {
	const apiUrl = 'http://localhost:3001/api';

	// Clean up test settlements
	if (testSettlementId && sessionCookieValue) {
		await request.delete(`${apiUrl}/settlements/${testSettlementId}`, {
			headers: {
				Cookie: `session=${sessionCookieValue}`
			}
		});
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

	// Clean up test user (this endpoint might not need auth since it's for test cleanup)
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
		// Build a farm to produce food
		await page.click('[data-testid="build-structure-btn"]');
		await page.click('[data-structure-type="FARM"]');
		await page.click('[data-testid="confirm-build-btn"]');

		// Wait for farm to be built
		await assertStructureExists(page, 'Farm');

		// Wait for food production to increase
		const productionOccurred = await waitForResourceProduction(page, 'food', 10000);
		expect(productionOccurred).toBeTruthy();
	});

	test('should calculate correct production rate', async ({ page }) => {
		// Build a farm
		await page.click('[data-testid="build-structure-btn"]');
		await page.click('[data-structure-type="FARM"]');
		await page.click('[data-testid="confirm-build-btn"]');

		await assertStructureExists(page, 'Farm');

		// Verify production rate is at least 0.5 food/second (30/minute)
		await assertProductionRate(page, 'food', 0.5, 5);
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
		const initialCapacity = await getPopulationCapacity(page);

		// Build a house
		await page.click('[data-testid="build-structure-btn"]');
		await page.click('[data-structure-type="HOUSE"]');
		await page.click('[data-testid="confirm-build-btn"]');

		await assertStructureExists(page, 'House');

		const newCapacity = await getPopulationCapacity(page);
		expect(newCapacity).toBeGreaterThan(initialCapacity);
	});
});

// ============================================================================
// GAME LOOP TESTS
// ============================================================================

test.describe('Real-Time Game Loop', () => {
	test('should verify game loop is running', async ({ page }) => {
		// This should not throw if resource-tick events are firing
		await assertGameLoopRunning(page, 5000);
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

		// Build a farm
		await page.click('[data-testid="build-structure-btn"]');
		await page.click('[data-structure-type="FARM"]');
		await page.click('[data-testid="confirm-build-btn"]');

		await assertStructureExists(page, 'Farm');

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
		const disasterId = await triggerDisaster(request, testWorldId, TEST_DISASTERS.EARTHQUAKE_MINOR);

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

		// 4. Build a structure
		await page.click('[data-testid="build-structure-btn"]');
		await page.click('[data-structure-type="FARM"]');
		await page.click('[data-testid="confirm-build-btn"]');

		// 5. Verify structure exists
		await assertStructureExists(page, 'Farm');

		// 6. Verify game loop is running
		await assertGameLoopRunning(page, 5000);

		// 7. Verify resource production occurs
		const productionOccurred = await waitForResourceProduction(page, 'food', 10000);
		expect(productionOccurred).toBeTruthy();
	});
});
