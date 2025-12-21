/**
 * E2E Tests for Building Area System
 * Created: December 20, 2024
 *
 * Tests the complete Building Area System including:
 * 1. Area capacity calculation (base 500 + TH level × 100)
 * 2. Area cost enforcement when building structures
 * 3. Visual feedback (progress bar color coding)
 * 4. Town Hall level requirements
 * 5. Unique building constraints
 * 6. Real-time Socket.IO updates
 * 7. Build menu constraint validation
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
import {
	waitForSocketConnection,
	joinWorldRoom
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
// BUILDING AREA SYSTEM E2E TESTS
// ============================================================================

test.describe('Building Area System', () => {
	test.describe.configure({ mode: 'serial' });
	test.setTimeout(120000); // 120 seconds for complex multi-step tests

	test.beforeEach(async ({ page, request }) => {
		// Capture console logs
		page.on('console', (msg) => {
			console.log('[BROWSER]', msg.text());
		});

		// 1. Register and login test user
		testUserEmail = generateUniqueEmail('area-system-test');
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
		const world = await createWorldViaAPI(
			request,
			testServer.id,
			sessionCookieValue,
			{ name: `Building Area Test ${Date.now()}`, size: 'TINY', seed: Date.now() },
			true
		);
		testWorldId = world.id;
		console.log('[E2E] Test world created:', testWorldId);

		// 7. Create settlement in the world
		console.log('[E2E] Creating settlement...');
		const createSettlementResponse = await request.post(`${apiUrl}/settlements`, {
			headers: { Cookie: `session=${sessionCookieValue}` },
			data: {
				worldId: testWorldId,
				serverId: testServer.id,
				accountId: accountId,
				username: username,
				name: 'Area Test Settlement'
			}
		});
		if (!createSettlementResponse.ok()) {
			const errorText = await createSettlementResponse.text();
			console.error('[E2E] Settlement creation failed:', errorText);
		}
		expect(createSettlementResponse.ok()).toBeTruthy();
		const settlementData = await createSettlementResponse.json();
		testSettlementId = settlementData.id;
		console.log('[E2E] Settlement created:', testSettlementId);

		// 8. Navigate to settlement page
		await page.goto(`/game/settlements/${testSettlementId}`);
		await page.waitForLoadState('networkidle');

		// 9. Wait for Socket.IO connection
		await waitForSocketConnection(page);
		await joinWorldRoom(page, testWorldId);
	});

	test.afterEach(async ({ request }) => {
		// Cleanup
		if (testWorldId) {
			await deleteWorld(request, sessionCookieValue, testWorldId);
		}
		if (testUserEmail) {
			await cleanupTestUser(request, testUserEmail);
		}
	});

	// ========================================================================
	// TEST 1: Area Display Shows Initial Capacity
	// ========================================================================

	test('should display initial area capacity (500 base, TH level 0)', async ({ page }) => {
		console.log('[E2E] TEST: Initial area capacity display');

		// Wait for SettlementAreaDisplay component to load
		const areaDisplay = page.locator('text=Building Area').first();
		await expect(areaDisplay).toBeVisible({ timeout: 10000 });

		// Check initial capacity display
		const capacityText = page.locator(String.raw`text=/\d+\s*\/\s*500/`).first();
		await expect(capacityText).toBeVisible();

		// Town Hall level should be 0
		const thLevelBadge = page.locator(String.raw`text=/TH\s*Lv\.\s*0/`).first();
		await expect(thLevelBadge).toBeVisible();

		// Formula should show correct calculation
		const formula = page.locator(String.raw`text=/Base:\s*500.*TH Level.*100/`).first();
		await expect(formula).toBeVisible();

		console.log('[E2E] ✅ Initial area capacity displayed correctly');
	});

	// ========================================================================
	// TEST 2: Build Structures Until Near Capacity
	// ========================================================================

	test('should track area usage as buildings are constructed', async ({ page, request }) => {
		console.log('[E2E] TEST: Track area usage during building');

		// Give settlement resources to build multiple structures
		await request.post(`${apiUrl}/test/add-resources`, {
			headers: { Cookie: `session=${sessionCookieValue}` },
			data: {
				settlementId: testSettlementId,
				resources: {
					food: 10000,
					water: 10000,
					wood: 10000,
					stone: 10000,
					ore: 10000
				}
			}
		});

		// Open build menu
		await page.click('button:has-text("Build")');
		await page.waitForTimeout(500);

		// Get structure metadata to check area costs
		const structuresResponse = await request.get(`${apiUrl}/structures/metadata`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(structuresResponse.ok()).toBeTruthy();
		const structures = await structuresResponse.json();

		// Find a building with area cost > 0
		const buildingWithArea = structures.data.find(
			(s: any) => s.category === 'BUILDING' && s.areaCost && s.areaCost > 0
		);

		if (buildingWithArea) {
			console.log('[E2E] Building structure:', buildingWithArea.displayName, 'Area cost:', buildingWithArea.areaCost);

			// Build the structure
			const buildButton = page.locator(`button[data-structure-name="${buildingWithArea.name}"]`);
			await expect(buildButton).toBeVisible();
			await buildButton.click();

			// Wait for structure to be built
			await page.waitForTimeout(2000);

			// Check area display updated
			const areaUsedAfter = await page.locator(String.raw`text=/\d+\s*\/\s*500/`).first().textContent();
			console.log('[E2E] Area after building:', areaUsedAfter);

			// Area used should now include the structure's cost
			expect(areaUsedAfter).toContain('/');
			const usedMatch = areaUsedAfter?.match(/(\d+)\s*\/\s*500/);
			if (usedMatch) {
				const usedArea = Number.parseInt(usedMatch[1], 10);
				expect(usedArea).toBeGreaterThanOrEqual(buildingWithArea.areaCost);
				console.log('[E2E] ✅ Area usage tracked correctly');
			}
		}
	});

	// ========================================================================
	// TEST 3: Progress Bar Color Coding
	// ========================================================================

	test('should show green progress bar at low usage (<80%)', async ({ page }) => {
		console.log('[E2E] TEST: Progress bar color at low usage');

		// Wait for area display
		await page.waitForSelector('text=Building Area', { timeout: 10000 });

		// At initial state (0-50 area used), bar should be green
		const progressBar = page.locator('[role="progressbar"]').filter({ has: page.locator('text=Building Area') }).first();
		
		// Check for success/green color class
		const hasGreenClass = await progressBar.evaluate((el) => {
			const innerBar = el.querySelector('div[class*="bg-"]');
			return innerBar?.className.includes('bg-success') || innerBar?.className.includes('bg-green');
		});

		expect(hasGreenClass).toBeTruthy();
		console.log('[E2E] ✅ Progress bar shows green at low usage');
	});

	// ========================================================================
	// TEST 4: Build Menu Shows Area Costs and Constraints
	// ========================================================================

	test('should display area costs and constraints in build menu', async ({ page, request }) => {
		console.log('[E2E] TEST: Build menu area cost display');

		// Open build menu
		await page.click('button:has-text("Build")');
		await page.waitForTimeout(500);

		// Check for area cost badges
		const areaBadge = page.locator('span:has-text("area")').first();
		await expect(areaBadge).toBeVisible({ timeout: 5000 });

		// Get structure metadata
		const structuresResponse = await request.get(`${apiUrl}/structures/metadata`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		const structures = await structuresResponse.json();

		// Find a unique building
		const uniqueBuilding = structures.data.find((s: any) => s.unique === true);
		if (uniqueBuilding) {
			console.log('[E2E] Checking unique building:', uniqueBuilding.displayName);

			// Check for unique badge
			const uniqueBadge = page.locator('span:has-text("Unique")').first();
			await expect(uniqueBadge).toBeVisible();
			console.log('[E2E] ✅ Unique badge displayed');
		}

		// Find a building with TH requirement
		const thRequiredBuilding = structures.data.find(
			(s: any) => s.minTownHallLevel && s.minTownHallLevel > 0
		);
		if (thRequiredBuilding) {
			console.log('[E2E] Checking TH requirement:', thRequiredBuilding.displayName);

			// Check for TH level badge
			const thBadge = page.locator(`span:has-text("TH Lv.${thRequiredBuilding.minTownHallLevel}")`).first();
			await expect(thBadge).toBeVisible();
			console.log('[E2E] ✅ Town Hall requirement displayed');
		}
	});

	// ========================================================================
	// TEST 5: Cannot Build With Insufficient Area
	// ========================================================================

	test('should prevent building when area capacity is insufficient', async ({ page, request }) => {
		console.log('[E2E] TEST: Area constraint enforcement');

		// Get current area stats
		const areaStatsResponse = await request.get(`${apiUrl}/settlement-area/${testSettlementId}`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		expect(areaStatsResponse.ok()).toBeTruthy();
		const areaStats = await areaStatsResponse.json();
		const availableArea = areaStats.data.areaAvailable;

		console.log('[E2E] Available area:', availableArea);

		// Get structures with area cost > available
		const structuresResponse = await request.get(`${apiUrl}/structures/metadata`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		const structures = await structuresResponse.json();

		const tooLargeBuilding = structures.data.find(
			(s: any) => s.areaCost && s.areaCost > availableArea && s.category === 'BUILDING'
		);

		if (tooLargeBuilding) {
			console.log('[E2E] Structure too large:', tooLargeBuilding.displayName, 'requires', tooLargeBuilding.areaCost);

			// Add resources
			await request.post(`${apiUrl}/test/add-resources`, {
				headers: { Cookie: `session=${sessionCookieValue}` },
				data: {
					settlementId: testSettlementId,
					resources: {
						food: 10000,
						water: 10000,
						wood: 10000,
						stone: 10000,
						ore: 10000
					}
				}
			});

			// Open build menu
			await page.click('button:has-text("Build")');
			await page.waitForTimeout(500);

			// Find the building button
			const buildButton = page.locator(`button[data-structure-name="${tooLargeBuilding.name}"]`);
			await expect(buildButton).toBeVisible();

			// Button should be disabled or show constraint message
			const isDisabled = await buildButton.isDisabled();
			const hasConstraintMessage = await page.locator('text=/Insufficient area/i').isVisible();

			expect(isDisabled || hasConstraintMessage).toBeTruthy();
			console.log('[E2E] ✅ Building prevented due to insufficient area');
		} else {
			console.log('[E2E] ⚠️ No structure found that exceeds available area, skipping test');
		}
	});

	// ========================================================================
	// TEST 6: Unique Building Constraint
	// ========================================================================

	test('should prevent building second unique structure', async ({ page, request }) => {
		console.log('[E2E] TEST: Unique building constraint');

		// Get structures
		const structuresResponse = await request.get(`${apiUrl}/structures/metadata`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		const structures = await structuresResponse.json();

		// Find Town Hall (unique building)
		const townHall = structures.data.find((s: any) => s.name === 'TOWN_HALL' || s.unique === true);

		if (townHall) {
			console.log('[E2E] Testing unique constraint with:', townHall.displayName);

			// Town Hall should already exist in new settlement
			// Try to build another (should be disabled)

			// Open build menu
			await page.click('button:has-text("Build")');
			await page.waitForTimeout(500);

			// Find Town Hall button
			const thButton = page.locator(`button[data-structure-name="${townHall.name}"]`);
			
			if (await thButton.isVisible()) {
				// Check if disabled or shows "Already built" message
				const isDisabled = await thButton.isDisabled();
				const hasAlreadyBuilt = await page.locator('text=/Already built.*unique/i').isVisible();

				expect(isDisabled || hasAlreadyBuilt).toBeTruthy();
				console.log('[E2E] ✅ Unique building constraint enforced');
			} else {
				console.log('[E2E] ⚠️ Town Hall button not visible in build menu');
			}
		}
	});

	// ========================================================================
	// TEST 7: Real-Time Socket.IO Updates
	// ========================================================================

	test('should update area display via Socket.IO when structure built', async ({ page, request }) => {
		console.log('[E2E] TEST: Socket.IO real-time area updates');

		// Wait for area display
		await page.waitForSelector('text=Building Area', { timeout: 10000 });

		// Get initial area used
		const initialAreaText = await page.locator(String.raw`text=/\d+\s*\/\s*500/`).first().textContent();
		console.log('[E2E] Initial area:', initialAreaText);

		// Add resources
		await request.post(`${apiUrl}/test/add-resources`, {
			headers: { Cookie: `session=${sessionCookieValue}` },
			data: {
				settlementId: testSettlementId,
				resources: {
					food: 5000,
					water: 5000,
					wood: 5000,
					stone: 5000,
					ore: 5000
				}
			}
		});

		// Get a building to construct
		const structuresResponse = await request.get(`${apiUrl}/structures/metadata`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		const structures = await structuresResponse.json();
		const building = structures.data.find(
			(s: any) => s.category === 'BUILDING' && s.areaCost && s.areaCost > 0
		);

		if (building) {
			console.log('[E2E] Building:', building.displayName, 'with area cost:', building.areaCost);

			// Build via API to test Socket.IO emission
			const buildResponse = await request.post(`${apiUrl}/structures/create`, {
				headers: { Cookie: `session=${sessionCookieValue}` },
				data: {
					settlementId: testSettlementId,
					structureId: building.id
				}
			});
			expect(buildResponse.ok()).toBeTruthy();

			// Wait for Socket.IO update (should be near instant)
			await page.waitForTimeout(2000);

			// Check area display updated
			const updatedAreaText = await page.locator(String.raw`text=/\d+\s*\/\s*500/`).first().textContent();
			console.log('[E2E] Updated area:', updatedAreaText);

			// Area should have increased
			expect(updatedAreaText).not.toBe(initialAreaText);

			const updatedMatch = updatedAreaText?.match(/(\d+)\s*\/\s*500/);
			const initialMatch = initialAreaText?.match(/(\d+)\s*\/\s*500/);

			if (updatedMatch && initialMatch) {
				const updatedUsed = Number.parseInt(updatedMatch[1], 10);
				const initialUsed = Number.parseInt(initialMatch[1], 10);
				expect(updatedUsed).toBeGreaterThan(initialUsed);
				console.log('[E2E] ✅ Socket.IO real-time update working');
			}
		}
	});

	// ========================================================================
	// TEST 8: Area Display in Building Cards
	// ========================================================================

	test('should show area cost badges on existing buildings', async ({ page, request }) => {
		console.log('[E2E] TEST: Area cost badges on building cards');

		// Build a structure first
		await request.post(`${apiUrl}/test/add-resources`, {
			headers: { Cookie: `session=${sessionCookieValue}` },
			data: {
				settlementId: testSettlementId,
				resources: {
					food: 5000,
					water: 5000,
					wood: 5000,
					stone: 5000,
					ore: 5000
				}
			}
		});

		// Get structures
		const structuresResponse = await request.get(`${apiUrl}/structures/metadata`, {
			headers: { Cookie: `session=${sessionCookieValue}` }
		});
		const structures = await structuresResponse.json();
		const building = structures.data.find(
			(s: any) => s.category === 'BUILDING' && s.areaCost && s.areaCost > 0
		);

		if (building) {
			// Build the structure
			await request.post(`${apiUrl}/structures/create`, {
				headers: { Cookie: `session=${sessionCookieValue}` },
				data: {
					settlementId: testSettlementId,
					structureId: building.id
				}
			});

			// Reload page to see building list
			await page.reload();
			await page.waitForLoadState('networkidle');

			// Wait for buildings list
			await page.waitForSelector('text=Buildings', { timeout: 10000 });

			// Check for area badge in building card
			const areaBadge = page.locator('[data-testid="structure"]').locator('span:has-text("📐")').first();
			
			// Should be visible
			await expect(areaBadge).toBeVisible({ timeout: 5000 });
			console.log('[E2E] ✅ Area cost badge visible on building card');
		}
	});
});
