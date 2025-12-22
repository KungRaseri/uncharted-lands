/**
 * Population Helper Utilities for E2E Tests
 * Provides functions for triggering and verifying population events
 */

import type { Page } from '@playwright/test';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get current population count from the UI
 * Uses data-testid="current-population" which contains "10 / 20" format
 */
export async function getPopulationCount(page: Page): Promise<number> {
	const populationText = await page.locator('[data-testid="current-population"]').textContent();
	// Extract first number from "10 / 20" format
	const match = populationText?.match(/^(\d+(?:,\d{3})*)/);
	return match ? Number.parseInt(match[1].replaceAll(',', ''), 10) : 0;
}

/**
 * Get population capacity from the UI
 * Uses data-testid="current-population" which contains "10 / 20" format
 */
export async function getPopulationCapacity(page: Page): Promise<number> {
	const populationText = await page.locator('[data-testid="current-population"]').textContent();
	// Extract second number from "10 / 20" format
	const match = populationText?.match(/\/\s*(\d+(?:,\d{3})*)/);
	return match ? Number.parseInt(match[1].replaceAll(',', ''), 10) : 0;
}

/**
 * Get happiness value from the UI (as percentage)
 * Uses data-testid="happiness" which contains the percentage
 */
export async function getHappiness(page: Page): Promise<number> {
	const happinessText = await page.locator('[data-testid="happiness"]').textContent();
	// Extract number from the text (could be just "50" or "50%")
	const match = happinessText?.match(/(\d+)/);
	return match ? Number.parseInt(match[1], 10) : 0;
}

/**
 * Get growth rate from the UI (as percentage)
 * Look for text containing "Growth Rate" or growth rate display
 */
export async function getGrowthRate(page: Page): Promise<number> {
	// Try to find growth rate in the population details section
	const growthElement = page.locator('text=/Growth Rate|population.*rate/i').first();
	const isVisible = await growthElement.isVisible().catch(() => false);

	if (!isVisible) {
		// Growth rate might not be displayed yet, return 0
		return 0;
	}

	const growthText = await growthElement.textContent();
	// Extract number from "+2.1%" or "-1.5%" format
	const match = growthText?.match(/([+-]?\d+\.?\d*)\s*%/);
	return match ? Number.parseFloat(match[1]) : 0;
}

/**
 * Get resource amount from the UI
 * Uses data-resource attribute to identify resource type
 */
export async function getResourceAmount(page: Page, resourceType: string): Promise<number> {
	const resourceElement = page.locator(`[data-resource="${resourceType}"]`);
	const resourceText = await resourceElement.textContent();
	// Extract first number from "50 / 1000" format
	const match = resourceText?.match(/(\d+(?:,\d{3})*)/);
	return match ? Number.parseInt(match[1].replaceAll(',', ''), 10) : 0;
}
