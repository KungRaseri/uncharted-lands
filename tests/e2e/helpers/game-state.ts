/**
 * Game State Helper Utilities for E2E Tests
 * Provides functions for verifying game state and resource changes
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// ============================================================================
// RESOURCE VERIFICATION
// ============================================================================

/**
 * Wait for resource production to increase
 * @param page - Playwright page object
 * @param resource - Resource type to monitor
 * @param timeoutMs - How long to wait (default 10 seconds)
 * @returns true if production occurred
 */
export async function waitForResourceProduction(
	page: Page,
	resource: 'food' | 'water' | 'wood' | 'stone' | 'ore',
	timeoutMs: number = 10000
): Promise<boolean> {
	const initialAmount = await getResourceAmount(page, resource);

	// Poll every 500ms until resource increases or timeout
	const startTime = Date.now();
	while (Date.now() - startTime < timeoutMs) {
		await page.waitForTimeout(500);
		const currentAmount = await getResourceAmount(page, resource);

		if (currentAmount > initialAmount) {
			return true;
		}
	}

	return false;
}

/**
 * Get current amount of a specific resource
 * @param page - Playwright page object
 * @param resource - Resource type
 * @returns Current resource amount
 */
export async function getResourceAmount(
	page: Page,
	resource: 'food' | 'water' | 'wood' | 'stone' | 'ore'
): Promise<number> {
	const element = page.locator(`[data-resource="${resource}"]`);
	const text = await element.textContent();

	// Extract number from "Resource: 150 / 1000"
	const match = text?.match(/(\d+)\s*\/\s*\d+/);
	return match ? parseInt(match[1], 10) : 0;
}

/**
 * Verify resource production rate
 * @param page - Playwright page object
 * @param resource - Resource type
 * @param expectedMinRate - Minimum production per second
 * @param durationSeconds - How long to measure
 */
export async function assertProductionRate(
	page: Page,
	resource: 'food' | 'water' | 'wood' | 'stone' | 'ore',
	expectedMinRate: number,
	durationSeconds: number = 5
): Promise<void> {
	const startAmount = await getResourceAmount(page, resource);
	await page.waitForTimeout(durationSeconds * 1000);
	const endAmount = await getResourceAmount(page, resource);

	const actualRate = (endAmount - startAmount) / durationSeconds;

	expect(actualRate).toBeGreaterThanOrEqual(expectedMinRate);
}

// ============================================================================
// POPULATION VERIFICATION
// ============================================================================

/**
 * Get current population
 * @param page - Playwright page object
 * @returns Current population count
 */
export async function getPopulation(page: Page): Promise<number> {
	const element = page.locator('[data-testid="current-population"]');
	const text = await element.textContent();

	// Extract number from "150 / 200"
	const match = text?.match(/(\d+)\s*\/\s*\d+/);
	return match ? parseInt(match[1], 10) : 0;
}

/**
 * Get population capacity
 * @param page - Playwright page object
 * @returns Population capacity
 */
export async function getPopulationCapacity(page: Page): Promise<number> {
	const element = page.locator('[data-testid="current-population"]');
	const text = await element.textContent();

	// Extract number from "150 / 200"
	const match = text?.match(/\d+\s*\/\s*(\d+)/);
	return match ? parseInt(match[1], 10) : 0;
}

/**
 * Get population happiness
 * @param page - Playwright page object
 * @returns Happiness percentage (0-100)
 */
export async function getHappiness(page: Page): Promise<number> {
	const element = page.locator('[data-testid="happiness"]');
	const text = await element.textContent();

	// Extract number from "75%"
	const match = text?.match(/(\d+)%/);
	return match ? parseInt(match[1], 10) : 0;
}

// ============================================================================
// STRUCTURE VERIFICATION
// ============================================================================

/**
 * Count structures of a specific type
 * @param page - Playwright page object
 * @param structureType - Type of structure (e.g., 'FARM', 'HOUSE')
 * @returns Number of structures
 */
export async function countStructures(page: Page, structureType: string): Promise<number> {
	const structures = page.locator(`[data-structure-type="${structureType}"]`);
	return structures.count();
}

/**
 * Verify structure exists in UI
 * @param page - Playwright page object
 * @param structureName - Expected structure name
 */
export async function assertStructureExists(page: Page, structureName: string): Promise<void> {
	const structure = page.locator('[data-testid="structure"]', { hasText: structureName });
	await structure.waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Get structure health percentage
 * @param page - Playwright page object
 * @param structureId - Structure ID
 * @returns Health percentage (0-100)
 */
export async function getStructureHealth(page: Page, structureId: string): Promise<number> {
	const element = page.locator(`[data-structure-id="${structureId}"] [data-testid="health"]`);
	const text = await element.textContent();

	// Extract number from "85%"
	const match = text?.match(/(\d+)%/);
	return match ? parseInt(match[1], 10) : 100;
}

// ============================================================================
// REAL-TIME EVENT VERIFICATION
// ============================================================================

/**
 * Wait for Socket.IO event to fire
 * @param page - Playwright page object
 * @param eventName - Socket event name (e.g., 'resource-tick')
 * @param timeoutMs - How long to wait
 * @returns Event data payload
 */
export async function waitForSocketEvent(
	page: Page,
	eventName: string,
	timeoutMs: number = 10000
): Promise<unknown> {
	return page.evaluate(
		({ event, timeout }) => {
			return new Promise((resolve, reject) => {
				const timer = setTimeout(() => {
					reject(new Error(`Socket event '${event}' did not fire within ${timeout}ms`));
				}, timeout);

				// Assuming socket is available globally as window.socket
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				(window as any).socket?.once(event, (data: unknown) => {
					clearTimeout(timer);
					resolve(data);
				});
			});
		},
		{ event: eventName, timeout: timeoutMs }
	);
}

/**
 * Verify game loop is running (resource ticks occurring)
 * @param page - Playwright page object
 * @param timeoutMs - How long to wait for tick
 */
export async function assertGameLoopRunning(page: Page, timeoutMs: number = 5000): Promise<void> {
	try {
		await waitForSocketEvent(page, 'resource-tick', timeoutMs);
	} catch {
		throw new Error('Game loop not running - no resource-tick events received');
	}
}
