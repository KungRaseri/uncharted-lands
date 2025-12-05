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
			ore: 0
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
			ore: 0
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
			ore: 0
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
	const heading = page.locator('h1', { hasText: settlementName });
	await heading.waitFor({ state: 'visible', timeout: 5000 });
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

	// Check each resource
	for (const [resource, amount] of Object.entries(expectedResources)) {
		const resourceDisplay = page.locator(`[data-resource="${resource}"]`);
		const text = await resourceDisplay.textContent();

		// Text should contain the amount (e.g., "Food: 50 / 1000")
		if (!text?.includes(amount.toString())) {
			throw new Error(`Expected ${resource} to be ${amount}, but got: ${text}`);
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
			resources[resource as keyof typeof resources] = parseInt(match[1], 10);
		}
	}

	return resources;
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
