/**
 * Game State Helper Utilities for E2E Tests
 * Provides functions for verifying game state and resource changes
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';

// ============================================================================
// SOCKET.IO HELPERS
// ============================================================================

/**
 * Wait for Socket.IO to connect to the server
 * Polls window.socket.connected until true or timeout
 *
 * @param page - Playwright page object
 * @param timeoutMs - Maximum time to wait in milliseconds (default: 10000)
 * @param required - If false, returns false instead of throwing on timeout (default: true)
 * @returns Promise<boolean> - True if connected, false if timeout (when required=false)
 *
 * @example
 * await page.goto('/game/settlements/abc123');
 * const connected = await waitForSocketConnection(page, 5000, false);
 * if (connected) {
 *   await joinWorldRoom(page, worldId, playerId);
 * }
 */
export async function waitForSocketConnection(
	page: Page,
	timeoutMs: number = 10000,
	required: boolean = true
): Promise<boolean> {
	console.log('[E2E] Waiting for Socket.IO connection...', { timeoutMs, required });

	const startTime = Date.now();
	const pollInterval = 100; // Check every 100ms

	while (Date.now() - startTime < timeoutMs) {
		const debugInfo = await page.evaluate(() => {
			try {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const w = globalThis as any;
				const socket = w.socket || w.__socket || w.io?.sockets?.[0];

				return {
					hasSocket: !!socket,
					hasWindow: typeof w !== 'undefined',
					socketKeys: socket ? Object.keys(socket).slice(0, 10) : [],
					connected: socket?.connected || false,
					socketId: socket?.id || null,
					env: {
						dev: (w as any).import?.meta?.env?.DEV,
						mode: (w as any).import?.meta?.env?.MODE
					}
				};
			} catch (error) {
				return {
					error: error instanceof Error ? error.message : String(error),
					hasSocket: false,
					hasWindow: false,
					socketKeys: [],
					connected: false,
					socketId: null
				};
			}
		});

		console.log('[E2E] Socket check:', debugInfo);

		if (debugInfo.connected) {
			const duration = Date.now() - startTime;
			console.log('[E2E] Socket.IO connection established', {
				duration,
				socketId: debugInfo.socketId
			});
			return true;
		}

		// Wait before next poll
		await page.waitForTimeout(pollInterval);
	}

	// Timeout
	const duration = Date.now() - startTime;
	if (required) {
		throw new Error(`Socket.IO connection timeout after ${duration}ms`);
	}

	console.warn(`[E2E] Socket.IO connection timeout after ${duration}ms (not required, continuing)`);
	return false;
}

/**
 * Manually join a world room via Socket.IO
 * This is a workaround if the game layout's automatic join doesn't trigger
 *
 * NOTE: Call waitForSocketConnection() BEFORE this function
 */
export async function joinWorldRoom(page: Page, worldId: string, playerId: string): Promise<void> {
	console.log('[E2E] joinWorldRoom called with:', { worldId, playerId });

	const result = await page.evaluate(
		({ worldId, playerId }) => {
			return new Promise((resolve) => {
				try {
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					const w = globalThis as any;
					const socket = w.socket || w.__socket || w.io?.sockets?.[0];

					if (!socket) {
						console.error('[E2E] Socket.IO not found on window - cannot join world');
						resolve({ success: false, error: 'Socket.IO not found on window' });
						return;
					}

					if (!socket.connected) {
						console.error('[E2E] Socket not connected - cannot join world');
						resolve({ success: false, error: 'Socket not connected' });
						return;
					}

					console.log('[E2E] Manually calling join-world...', {
						worldId,
						playerId,
						socketId: socket.id
					});

					// Listen for world-joined response
					const timeout = setTimeout(() => {
						console.error('[E2E] Timeout waiting for world-joined event');
						resolve({
							success: false,
							error: 'Timeout waiting for world-joined event',
							socketId: socket.id
						});
					}, 5000);

					socket.once('world-joined', (data: any) => {
						clearTimeout(timeout);
						console.log('[E2E] Received world-joined event:', data);
						resolve({ success: true, socketId: socket.id, worldJoined: data });
					});

					socket.emit('join-world', { worldId, playerId });
				} catch (error) {
					console.error('[E2E] Error in joinWorldRoom:', error);
					resolve({ success: false, error: String(error) });
				}
			});
		},
		{ worldId, playerId }
	);

	console.log('[E2E] joinWorldRoom result:', result);

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const typedResult = result as any;
	if (!typedResult.success) {
		throw new Error(`Failed to join world room: ${typedResult.error}`);
	}

	// Additional wait for settlement registration to complete server-side
	await page.waitForTimeout(1000);
}

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

	console.log(`[E2E] getResourceAmount for ${resource}:`, { text });

	// Extract first number (should be current amount)
	// Format can be "Food 150 / 1000 +2.5/s" or similar
	const match = text?.match(/(\d+(?:,\d{3})*)/);
	if (!match) {
		console.warn(`[E2E] No number found in resource text for ${resource}:`, text);
		return 0;
	}

	const amount = parseInt(match[1].replace(/,/g, ''), 10);
	console.log(`[E2E] Extracted ${resource} amount:`, amount);
	return amount;
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
	// Alternative approach: Wait for network activity instead of direct socket access
	// This works because Playwright can't easily access the Socket.IO client

	// Wait for any XHR/fetch that indicates the event occurred
	// For resource-tick, we can check if resources changed in the UI
	if (eventName === 'resource-tick') {
		// Check all resources, not just food (food might be balanced with consumption)
		const resourceTypes: Array<'food' | 'water' | 'wood' | 'stone' | 'ore'> = [
			'food',
			'water',
			'wood',
			'stone',
			'ore'
		];
		const initialResources: Record<string, number> = {};

		// Get initial values for all resources
		for (const type of resourceTypes) {
			initialResources[type] = await getResourceAmount(page, type);
		}

		console.log('[E2E] Initial resources:', initialResources);

		const startTime = Date.now();
		let checkCount = 0;

		while (Date.now() - startTime < timeoutMs) {
			await page.waitForTimeout(500);
			checkCount++;

			// Check if ANY resource changed
			for (const type of resourceTypes) {
				const currentValue = await getResourceAmount(page, type);
				if (currentValue !== initialResources[type]) {
					console.log(
						`[E2E] Resource change detected after ${checkCount * 500}ms: ${type} ${initialResources[type]} -> ${currentValue}`
					);
					return { event: 'resource-tick', detected: true, changedResource: type };
				}
			}

			// Log every 5 seconds
			if (checkCount % 10 === 0) {
				const currentResources: Record<string, number> = {};
				for (const type of resourceTypes) {
					currentResources[type] = await getResourceAmount(page, type);
				}
				console.log(`[E2E] After ${checkCount * 500}ms, resources:`, currentResources);
			}
		}
		throw new Error(`No resource updates detected within ${timeoutMs}ms`);
	}

	// For other events, use the original approach with better error handling
	return page.evaluate(
		({ event, timeout }) => {
			return new Promise((resolve, reject) => {
				const timer = setTimeout(() => {
					reject(new Error(`Socket event '${event}' did not fire within ${timeout}ms`));
				}, timeout);

				// Try to find socket in various locations
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const w = globalThis as any;
				const socket = w.socket || w.__socket || w.io?.sockets?.[0];

				if (!socket) {
					clearTimeout(timer);
					reject(new Error(`Socket not found on window object`));
					return;
				}

				// DEBUG: Log socket state and listen for ALL events
				console.log('[E2E DEBUG] Waiting for event:', event);
				console.log('[E2E DEBUG] Socket connected:', socket.connected);
				console.log('[E2E DEBUG] Socket ID:', socket.id);

				// Listen for ALL events for 5 seconds to see what's actually being received
				const allEventsReceived: string[] = [];
				const debugListener = (eventName: string) => {
					allEventsReceived.push(eventName);
					console.log('[E2E DEBUG] Event received:', eventName);
				};

				// Capture all events (Socket.IO internal method)
				const originalOnevent = socket.onevent;
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				socket.onevent = function (packet: any) {
					const eventName = packet.data?.[0];
					if (eventName) {
						debugListener(eventName);
					}
					return originalOnevent.apply(this, arguments);
				};

				// Restore after 5 seconds and log summary
				setTimeout(() => {
					socket.onevent = originalOnevent;
					console.log('[E2E DEBUG] All events received in 5s:', allEventsReceived);
				}, 5000);

				socket.once(event, (data: unknown) => {
					clearTimeout(timer);
					console.log('[E2E DEBUG] Target event received:', event, 'Data:', data);
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
 * @param timeoutMs - How long to wait for tick (default 30s for slow resource changes)
 */
export async function assertGameLoopRunning(page: Page, timeoutMs: number = 30000): Promise<void> {
	try {
		await waitForSocketEvent(page, 'resource-update', timeoutMs);
	} catch {
		throw new Error('Game loop not running - no resource-update events received');
	}
}
