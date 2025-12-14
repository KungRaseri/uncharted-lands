/**
 * Settlement Helper Utilities for E2E Tests
 * Provides functions for creating, managing, and validating settlements
 * Similar to auth.helpers.ts pattern
 */

import type { Page, APIRequestContext } from '@playwright/test';
import type { Settlement } from '../../../src/lib/types/api.js';

// ============================================================================
// TEST DATA CONSTANTS
// ============================================================================

export const TEST_SETTLEMENTS = {
	BASIC: {
		name: 'Test Settlement Alpha',
		expectedStartingResources: {
			food: 50,
			water: 100,
			wood: 50,
			stone: 30,
			ore: 10 // Updated to match server config (per GDD spec)
		}
	},
	COASTAL: {
		name: 'Coastal Settlement Beta',
		biome: 'COASTAL',
		expectedStartingResources: {
			food: 50,
			water: 100,
			wood: 50,
			stone: 30,
			ore: 10 // Updated to match server config (per GDD spec)
		}
	},
	DESERT: {
		name: 'Desert Settlement Gamma',
		biome: 'DESERT',
		expectedStartingResources: {
			food: 50,
			water: 100,
			wood: 50,
			stone: 30,
			ore: 10 // Updated to match server config (per GDD spec)
		}
	}
} as const;

// ============================================================================
// SETTLEMENT CREATION
// ============================================================================

/**
 * Create a new settlement via UI
 * @param page - Playwright page object
 * @param settlementName - Name for the settlement
 * @param tileId - Optional specific tile to settle on
 * @returns Settlement ID from response
 */
export async function createSettlement(
	page: Page,
	settlementName: string,
	tileId?: string
): Promise<string> {
	// Navigate to world/settlement creation page
	await page.goto('/game/worlds');

	// If tileId provided, click specific tile
	// Otherwise, find first available tile
	if (tileId) {
		await page.click(`[data-tile-id="${tileId}"]`);
	} else {
		// Click first available unclaimed tile
		const firstTile = page.locator('[data-tile-available="true"]').first();
		await firstTile.click();
	}

	// Fill settlement name
	await page.fill('input[name="settlementName"]', settlementName);

	// Submit form
	await page.click('button[type="submit"]');

	// Wait for settlement creation success
	await page.waitForURL(/\/game\/settlements\/[a-z0-9-]+/);

	// Extract settlement ID from URL
	const url = page.url();
	const settlementId = url.split('/settlements/')[1];

	return settlementId;
}

/**
 * Create settlement via API (faster for setup)
 * @param api - Playwright APIRequestContext
 * @param worldId - World to create settlement in
 * @param settlementData - Settlement configuration
 * @returns Settlement object from API
 */
export async function createSettlementViaAPI(
	api: APIRequestContext,
	worldId: string,
	settlementData: {
		name: string;
		tileId?: string;
	}
): Promise<Settlement> {
	const response = await api.post('/api/settlements', {
		data: {
			worldId,
			name: settlementData.name,
			tileId: settlementData.tileId
		}
	});

	if (!response.ok()) {
		throw new Error(`Failed to create settlement: ${response.status()}`);
	}

	return response.json();
}

// ============================================================================
// SETTLEMENT NAVIGATION
// ============================================================================

/**
 * Navigate to settlement page
 * @param page - Playwright page object
 * @param settlementId - Settlement ID to navigate to
 */
export async function navigateToSettlement(page: Page, settlementId: string): Promise<void> {
	await page.goto(`/game/settlements/${settlementId}`);
	await page.waitForLoadState('networkidle');
}

/**
 * Navigate to settlement list
 * @param page - Playwright page object
 */
export async function navigateToSettlementList(page: Page): Promise<void> {
	await page.goto('/game/settlements');
	await page.waitForLoadState('networkidle');
}

// ============================================================================
// SETTLEMENT VERIFICATION
// ============================================================================

/**
 * Verify settlement exists in UI
 * @param page - Playwright page object
 * @param settlementName - Expected settlement name
 */
export async function assertSettlementExists(page: Page, settlementName: string): Promise<void> {
	// Try multiple selectors since the UI structure may vary
	const selectors = [
		`h1:has-text("${settlementName}")`,
		`h2:has-text("${settlementName}")`,
		`h3:has-text("${settlementName}")`,
		`[data-testid="settlement-name"]:has-text("${settlementName}")`,
		`:text("${settlementName}")`
	];

	let found = false;
	for (const selector of selectors) {
		try {
			await page.waitForSelector(selector, { state: 'visible', timeout: 1000 });
			found = true;
			break;
		} catch {
			// Try next selector
		}
	}

	if (!found) {
		throw new Error(`Settlement name "${settlementName}" not found in UI with any known selector`);
	}
}

/**
 * Verify settlement has expected starting resources
 * @param page - Playwright page object
 * @param expectedResources - Expected resource amounts
 */
export async function assertStartingResources(
	page: Page,
	expectedResources: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	}
): Promise<void> {
	// Wait for resource panel to load
	await page.waitForSelector('[data-testid="resource-panel"]', { timeout: 5000 });

	// Check each resource (allow ±10 tolerance for game loop production that may have occurred)
	for (const [resource, amount] of Object.entries(expectedResources)) {
		const resourceDisplay = page.locator(`[data-resource="${resource}"]`);
		const text = await resourceDisplay.textContent();

		// Extract the actual amount from text (e.g., "🌾 Food 59 / 1,000 +3,600/hr")
		const match = text?.match(/(\d+)\s*\/\s*\d+/);
		if (!match) {
			throw new Error(`Could not parse ${resource} amount from: ${text}`);
		}

		const actualAmount = Number.parseInt(match[1], 10);
		// Allow ±50 tolerance for game loop production (resources tick every second)
		// E2E tests have ~10-15s setup time, so production can accumulate
		const tolerance = 50;
		const min = amount - tolerance;
		const max = amount + tolerance;

		if (actualAmount < min || actualAmount > max) {
			throw new Error(
				`Expected ${resource} to be ${amount} (±${tolerance}), but got ${actualAmount}`
			);
		}
	}
}

/**
 * Get current settlement resources from UI
 * @param page - Playwright page object
 * @returns Object with current resource amounts
 */
export async function getCurrentResources(page: Page): Promise<{
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}> {
	const resources = {
		food: 0,
		water: 0,
		wood: 0,
		stone: 0,
		ore: 0
	};

	for (const resource of ['food', 'water', 'wood', 'stone', 'ore']) {
		const element = page.locator(`[data-resource="${resource}"]`);
		const text = await element.textContent();

		// Extract number from text like "Food: 150 / 1000"
		const match = text?.match(/(\d+)\s*\/\s*\d+/);
		if (match) {
			resources[resource as keyof typeof resources] = Number.parseInt(match[1], 10);
		}
	}

	return resources;
}

// ============================================================================
// STRUCTURE BUILDING
// ============================================================================

/**
 * Build a BUILDING structure via MobileBuildMenu UI
 * NOTE: Extractors are built via ExtractorBuildModal (clicking plot squares), not this menu
 * @param page - Playwright Page
 * @param structureName - Name of structure to build (e.g., 'House', 'Warehouse')
 * @param category - Optional category to select first (defaults to 'BUILDING')
 */
export async function buildStructure(
	page: Page,
	structureName: string,
	category: string = 'BUILDING'
): Promise<void> {
	console.log(`[E2E Helper] Building structure: ${structureName} in category: ${category}`);
	console.log(
		'[E2E Helper] NOTE: This only builds BUILDING category (extractors use ExtractorBuildModal)'
	);

	// Step 1: Click the build button to open the menu
	await page.click('[data-testid="build-structure-btn"]');

	// Step 2: Wait for the build menu to open (use a BUILDING structure as indicator)
	await page.waitForSelector('[data-testid="build-structure-house"]', {
		state: 'visible',
		timeout: 5000
	});

	// Step 3: Select the category tab if needed (BUILDING is default now)
	if (category !== 'BUILDING') {
		const categoryButton = page.locator(`button[role="tab"]:has-text("${category}")`);
		await categoryButton.click();
		await page.waitForTimeout(200); // Wait for tab switch animation
	}

	// Step 4: Click the structure button using data-testid
	const structureButton = page.locator(
		`[data-testid="build-structure-${structureName.toLowerCase()}"]`
	);

	// Wait for the button to be visible and enabled
	await structureButton.waitFor({ state: 'visible', timeout: 5000 });

	// Click the structure
	await structureButton.click();

	// Step 5: Wait for the build menu to close (indicates structure was built)
	await page.waitForSelector(`[data-testid="build-structure-${structureName.toLowerCase()}"]`, {
		state: 'hidden',
		timeout: 5000
	});

	console.log(`[E2E Helper] Structure built successfully: ${structureName}`);
}

/**
 * Build an EXTRACTOR via ExtractorBuildModal (clicking on a plot square)
 * @param page - Playwright Page
 * @param extractorType - Type of extractor (e.g., 'BASIC_FARM', 'BASIC_WELL')
 * @param tileIndex - Which tile to click (defaults to 0 for first available tile)
 */
export async function buildExtractor(
	page: Page,
	extractorType: string,
	tileIndex: number = 0
): Promise<void> {
	console.log(`[E2E Helper] Building extractor: ${extractorType} on tile index: ${tileIndex}`);

	// Step 1: Find and click a plot square to open ExtractorBuildModal
	// Look for tiles with available slots (not fully built)
	const plotSquares = page.locator('[data-testid^="plot-square-"]');
	const plotSquare = plotSquares.nth(tileIndex);

	await plotSquare.waitFor({ state: 'visible', timeout: 5000 });
	await plotSquare.click();

	// Step 2: Wait for the ExtractorBuildModal to open
	await page.waitForSelector('text=Build Extractor', { state: 'visible', timeout: 5000 });

	// Step 3: Click the extractor option button
	// The modal uses extractorType as part of button identification
	const extractorButton = page
		.locator(`button:has-text("${extractorType.replace('BASIC_', '').replace('_', ' ')}"):visible`)
		.first();
	await extractorButton.waitFor({ state: 'visible', timeout: 5000 });
	await extractorButton.click();

	// Step 4: Click the "Build Extractor" button to confirm
	const buildButton = page.locator('button:has-text("Build Extractor")');
	await buildButton.click();

	// Step 5: Wait for modal to close
	await page.waitForSelector('text=Build Extractor', { state: 'hidden', timeout: 5000 });

	console.log(`[E2E Helper] Extractor built successfully: ${extractorType}`);
}

// ============================================================================
// SETTLEMENT CLEANUP
// ============================================================================

/**
 * Delete settlement via API (cleanup after tests)
 * @param api - Playwright APIRequestContext
 * @param settlementId - Settlement ID to delete
 */
export async function deleteSettlement(
	api: APIRequestContext,
	settlementId: string
): Promise<void> {
	await api.delete(`/api/settlements/${settlementId}`);
}

/**
 * Delete all test settlements (cleanup)
 * @param api - Playwright APIRequestContext
 * @param settlementIds - Array of settlement IDs to delete
 */
export async function cleanupTestSettlements(
	api: APIRequestContext,
	settlementIds: string[]
): Promise<void> {
	await Promise.all(settlementIds.map((id) => deleteSettlement(api, id)));
}
