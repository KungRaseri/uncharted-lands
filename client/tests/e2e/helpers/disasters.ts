/**
 * Disaster Helper Utilities for E2E Tests
 * Provides functions for triggering and verifying disaster events
 */

import type { Page, APIRequestContext } from '@playwright/test';
import { expect } from '@playwright/test';

// Type for disaster warning event data
type DisasterWarningData = {
	disasterId: string;
	type: string;
	severity: string;
	warningTime: number;
	[key: string]: unknown;
};

// Extended window type for test helpers
interface WindowWithSocket extends Window {
	socket?: {
		once: (event: string, callback: (data: unknown) => void) => void;
	};
	__disasterWarningPromise?: Promise<DisasterWarningData>;
}

// ============================================================================
// TEST DISASTER CONFIGURATIONS
// ============================================================================

export const TEST_DISASTERS = {
	EARTHQUAKE_MINOR: {
		type: 'EARTHQUAKE',
		severity: 25,
		duration: 30, // 30 seconds (fast E2E testing)
		expectedCasualties: 0, // Minor should have 0-5% casualties
		expectedStructureDamage: 15 // 5-15% health loss
	},
	FLOOD_MODERATE: {
		type: 'FLOOD',
		severity: 50,
		duration: 60, // 60 seconds (fast E2E testing)
		expectedCasualties: 10, // 5-15% casualties
		expectedStructureDamage: 35 // 15-35% health loss
	},
	DROUGHT_MAJOR: {
		type: 'DROUGHT',
		severity: 70,
		duration: 120, // 120 seconds (fast E2E testing)
		expectedCasualties: 25, // 15-30% casualties
		expectedStructureDamage: 50 // 35-60% health loss
	}
} as const;

// ============================================================================
// DISASTER TRIGGERING
// ============================================================================

/**
 * Trigger a disaster via API (for testing)
 * @param request - Playwright API request context
 * @param sessionCookie - Session cookie value for authentication
 * @param worldId - World ID to trigger disaster in
 * @param disasterConfig - Disaster configuration
 * @param apiUrl - Base API URL (optional, defaults to http://localhost:3001/api)
 * @returns Disaster event ID
 */
export async function triggerDisaster(
	request: APIRequestContext,
	sessionCookie: string,
	worldId: string,
	disasterConfig: (typeof TEST_DISASTERS)[keyof typeof TEST_DISASTERS],
	apiUrl: string = 'http://localhost:3001/api'
): Promise<string> {
	const response = await request.post(`${apiUrl}/admin/disasters/trigger`, {
		headers: {
			Cookie: `session=${sessionCookie}`
		},
		data: {
			worldId,
			type: disasterConfig.type,
			severity: disasterConfig.severity,
			duration: disasterConfig.duration
		}
	});

	if (!response.ok()) {
		const errorText = await response.text();
		throw new Error(
			`Failed to trigger disaster: ${response.status()} ${response.statusText()} - ${errorText}`
		);
	}

	const data = await response.json();
	return data.disasterId;
}

/**
 * Trigger disaster warning phase
 * @param request - Playwright API request context
 * @param worldId - World ID
 * @param disasterType - Type of disaster
 * @param warningTimeSeconds - Warning time in seconds
 * @returns Disaster event ID
 */
export async function triggerDisasterWarning(
	request: APIRequestContext,
	worldId: string,
	disasterType: string,
	warningTimeSeconds: number = 3600
): Promise<string> {
	const response = await request.post(`/api/admin/disasters/trigger-warning`, {
		data: {
			worldId,
			type: disasterType,
			warningTime: warningTimeSeconds
		}
	});

	expect(response.ok()).toBeTruthy();

	const data = await response.json();
	return data.disasterId;
}

// ============================================================================
// WARNING PHASE VERIFICATION
// ============================================================================

/**
 * Wait for disaster-warning Socket.IO event
 * @param page - Playwright page object
 * @param timeoutMs - Maximum time to wait
 * @returns Warning data from event
 */
export async function waitForDisasterWarning(
	page: Page,
	timeoutMs: number = 65000
): Promise<DisasterWarningData> {
	// Poll the disaster store state to check if warning was received
	const result = await page.evaluate(async (timeout) => {
		const win = window as any;
		const startTime = Date.now();

		// Poll disasterStore.warningActive every 100ms
		return new Promise((resolve, reject) => {
			const pollInterval = setInterval(() => {
				const elapsed = Date.now() - startTime;

				// Check if timeout exceeded
				if (elapsed > timeout) {
					clearInterval(pollInterval);
					reject(new Error(`Timeout waiting for disaster-warning after ${timeout}ms`));
					return;
				}

				// Check if disaster store has received warning
				const disasterStore = win.disasterStore;
				if (disasterStore && disasterStore.warningActive && disasterStore.activeDisaster) {
					clearInterval(pollInterval);
					console.log('[E2E] Disaster warning detected from store:', disasterStore.activeDisaster);
					resolve({
						disasterId: disasterStore.activeDisaster.id,
						type: disasterStore.activeDisaster.type,
						severity: disasterStore.activeDisaster.severity,
						severityLevel: disasterStore.activeDisaster.severityLevel,
						timeRemaining: disasterStore.timeUntilImpact,
						affectedRegion: disasterStore.activeDisaster.affectedRegion,
						affectedBiomes: disasterStore.activeDisaster.affectedBiomes
					});
				}
			}, 100);
		});
	}, timeoutMs);

	return result as DisasterWarningData;
}

/**
 * Verify disaster warning banner is visible
 * @param page - Playwright page object
 * @param disasterType - Expected disaster type
 */
export async function assertWarningBannerVisible(page: Page, disasterType: string): Promise<void> {
	const banner = page.locator('[data-testid="disaster-warning-banner"]');
	await banner.waitFor({ state: 'visible', timeout: 5000 });

	const bannerText = await banner.textContent();
	expect(bannerText?.toLowerCase()).toContain(disasterType.toLowerCase());
}

/**
 * Get countdown time remaining from warning banner
 * @param page - Playwright page object
 * @returns Seconds remaining
 */
export async function getWarningTimeRemaining(page: Page): Promise<number> {
	const countdown = page.locator('[data-testid="disaster-countdown"]');
	
	// Wait for countdown to be visible and have content
	await countdown.waitFor({ state: 'visible', timeout: 5000 });
	
	const text = await countdown.textContent();

	// Parse different formats:
	// - "30s" (seconds only, for times < 60s)
	// - "5m" (minutes only, for times < 1h)
	// - "2h 15m" (hours and minutes, for times >= 1h)
	
	// Check for seconds-only format first
	const secondsMatch = text?.match(/^(\d+)s$/);
	if (secondsMatch) {
		return Number.parseInt(secondsMatch[1], 10);
	}
	
	// Parse hours and minutes
	const hours = text?.match(/(\d+)h/)?.[1] || '0';
	const minutes = text?.match(/(\d+)m/)?.[1] || '0';

	return Number.parseInt(hours, 10) * 3600 + Number.parseInt(minutes, 10) * 60;
}

/**
 * Activate emergency shelter during warning phase
 * @param page - Playwright page object
 */
export async function activateEmergencyShelter(page: Page): Promise<void> {
	const button = page.locator('[data-testid="activate-shelter-btn"]');
	await button.click();

	// Verify activation confirmation
	const confirmation = page.locator('[data-testid="shelter-activated"]');
	await confirmation.waitFor({ state: 'visible', timeout: 3000 });
}

// ============================================================================
// IMPACT PHASE VERIFICATION
// ============================================================================

/**
 * Verify disaster impact banner is visible
 * @param page - Playwright page object
 * @param timeoutMs - Maximum time to wait (default: 20000ms = 20 seconds, accounting for 10-second warning time + buffer)
 */
export async function assertImpactBannerVisible(
	page: Page,
	timeoutMs: number = 20000
): Promise<void> {
	const banner = page.locator('[data-testid="disaster-impact-banner"]');
	await banner.waitFor({ state: 'visible', timeout: timeoutMs });
}

/**
 * Open the damage feed during impact phase
 * @param page - Playwright page object
 */
export async function openDamageFeed(page: Page): Promise<void> {
	const toggleButton = page.locator('[data-testid="toggle-damage-feed-btn"]');
	await toggleButton.click();
	
	// Wait for damage feed to appear
	const damageFeed = page.locator('[data-testid="damage-feed"]');
	await damageFeed.waitFor({ state: 'visible', timeout: 2000 });
}

/**
 * Wait for structure damage event
 * @param page - Playwright page object
 * @param structureId - Structure ID to monitor
 * @param timeoutMs - How long to wait
 * @returns Updated health percentage
 */
export async function waitForStructureDamage(
	page: Page,
	structureId: string,
	timeoutMs: number = 15000
): Promise<number> {
	// Wait for 'structure-damaged' Socket.IO event
	const eventData = await page.evaluate(
		({ id, timeout }) => {
			return new Promise<{ health: number }>((resolve, reject) => {
				const timer = setTimeout(() => {
					reject(new Error(`Structure ${id} was not damaged within ${timeout}ms`));
				}, timeout);

				const win = window as unknown as WindowWithSocket;
				win.socket?.once('structure-damaged', (data: unknown) => {
					const damageData = data as { structureId: string; health: number };
					if (damageData.structureId === id) {
						clearTimeout(timer);
						resolve({ health: damageData.health });
					}
				});
			});
		},
		{ id: structureId, timeout: timeoutMs }
	);

	return eventData.health;
}

/**
 * Verify casualties occurred
 * @param page - Playwright page object
 * @param expectedMinCasualties - Minimum expected casualties
 */
export async function assertCasualtiesOccurred(
	page: Page,
	expectedMinCasualties: number
): Promise<void> {
	const casualties = page.locator('[data-testid="casualty-count"]');
	await casualties.waitFor({ state: 'visible', timeout: 5000 });

	const text = await casualties.textContent();
	const count = parseInt(text?.match(/\d+/)?.[0] || '0', 10);

	expect(count).toBeGreaterThanOrEqual(expectedMinCasualties);
}

// ============================================================================
// AFTERMATH PHASE VERIFICATION
// ============================================================================

/**
 * Verify aftermath modal is visible
 * @param page - Playwright page object
 */
export async function assertAftermathModalVisible(page: Page): Promise<void> {
	const modal = page.locator('[data-testid="disaster-aftermath-modal"]');
	await modal.waitFor({ state: 'visible', timeout: 5000 });
}

/**
 * Get disaster summary from aftermath modal
 * @param page - Playwright page object
 * @returns Disaster summary data
 */
export async function getDisasterSummary(page: Page): Promise<{
	casualties: number;
	structuresDamaged: number;
	resourcesLost: number;
}> {
	const modal = page.locator('[data-testid="disaster-aftermath-modal"]');

	const casualtiesText = await modal.locator('[data-testid="total-casualties"]').textContent();
	const damagedText = await modal.locator('[data-testid="structures-damaged"]').textContent();
	const resourcesText = await modal.locator('[data-testid="resources-lost"]').textContent();

	return {
		casualties: parseInt(casualtiesText?.match(/\d+/)?.[0] || '0', 10),
		structuresDamaged: parseInt(damagedText?.match(/\d+/)?.[0] || '0', 10),
		resourcesLost: parseInt(resourcesText?.match(/\d+/)?.[0] || '0', 10)
	};
}

/**
 * Verify emergency repair discount is active
 * @param page - Playwright page object
 */
export async function assertEmergencyRepairActive(page: Page): Promise<void> {
	const discount = page.locator('[data-testid="emergency-repair-discount"]');
	await discount.waitFor({ state: 'visible', timeout: 3000 });

	const text = await discount.textContent();
	expect(text?.toLowerCase()).toContain('50%'); // Emergency discount is 50%
}

/**
 * Initiate structure repair
 * @param page - Playwright page object
 * @param structureId - Structure to repair
 * @param emergency - Whether to use emergency repair
 */
export async function repairStructure(
	page: Page,
	structureId: string,
	emergency: boolean = false
): Promise<void> {
	// Find structure in repair list
	const structure = page.locator(`[data-structure-id="${structureId}"]`);

	// Click appropriate repair button
	const button = emergency
		? structure.locator('[data-testid="emergency-repair-btn"]')
		: structure.locator('[data-testid="repair-btn"]');

	await button.click();

	// Wait for repair confirmation
	const confirmation = page.locator('[data-testid="repair-success"]');
	await confirmation.waitFor({ state: 'visible', timeout: 3000 });
}

// ============================================================================
// CLEANUP
// ============================================================================

/**
 * Clear all active disasters in a world (for test cleanup)
 * @param request - Playwright API request context
 * @param worldId - World ID
 */
export async function clearActiveDisasters(
	request: APIRequestContext,
	worldId: string
): Promise<void> {
	await request.post(`/api/admin/disasters/clear`, {
		data: { worldId }
	});
}
