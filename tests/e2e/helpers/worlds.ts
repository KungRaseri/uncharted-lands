/**
 * World Helper Utilities for E2E Tests
 * Provides functions for creating worlds and waiting for generation to complete
 */

import type { APIRequestContext } from '@playwright/test';

/**
 * Wait for world generation to complete
 * Polls the world status until it changes from 'GENERATING' to 'READY'
 *
 * @param api - Playwright APIRequestContext
 * @param worldId - World ID to poll
 * @param sessionToken - Session cookie value for authentication
 * @param timeoutMs - How long to wait (default 30 seconds)
 * @returns World object when ready
 */
export async function waitForWorldGeneration(
	api: APIRequestContext,
	worldId: string,
	sessionToken: string,
	timeoutMs: number = 30000
): Promise<any> {
	console.log('[E2E] Waiting for world generation to complete...', { worldId });

	const startTime = Date.now();
	const pollInterval = 500; // Check every 500ms

	while (Date.now() - startTime < timeoutMs) {
		// Fetch current world status with authentication
		const response = await api.get(`http://localhost:3001/api/worlds/${worldId}`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok()) {
			throw new Error(`Failed to fetch world status: ${response.status()}`);
		}

		const world = await response.json();

		// Check if generation is complete
		if (world.status === 'ready') {
			console.log('[E2E] World generation complete!', {
				worldId,
				status: world.status,
				duration: Date.now() - startTime
			});
			return world;
		}

		// Check for failure
		if (world.status === 'failed') {
			throw new Error(`World generation failed: ${world.id}`);
		}

		// Still generating, wait and try again
		await new Promise((resolve) => setTimeout(resolve, pollInterval));
	}

	// Timeout
	throw new Error(`World generation timed out after ${timeoutMs}ms`);
}

/**
 * Create world via API and wait for generation to complete
 *
 * @param api - Playwright APIRequestContext
 * @param serverId - Server ID
 * @param sessionToken - Session cookie value for authentication
 * @param worldData - World configuration
 * @param waitForGeneration - Whether to wait for generation (default true)
 * @returns World object
 */
export async function createWorldViaAPI(
	api: APIRequestContext,
	serverId: string,
	sessionToken: string,
	worldData: {
		name: string;
		size?: 'TINY' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'MASSIVE'; // Added TINY for E2E tests
		seed?: number;
	},
	waitForGeneration: boolean = true
): Promise<any> {
	console.log('[E2E] Creating world via API...', worldData);

	// Map size to dimensions for server-side generation
	// Use TINY worlds for E2E tests to speed up generation (5x5 = 25 tiles)
	const sizeMap = {
		TINY: { width: 5, height: 5 }, // E2E test size - fast generation
		SMALL: { width: 100, height: 100 },
		MEDIUM: { width: 250, height: 250 },
		LARGE: { width: 500, height: 500 },
		MASSIVE: { width: 1000, height: 1000 }
	};
	const dimensions = sizeMap[worldData.size || 'TINY'] || sizeMap.TINY; // Default to TINY for tests

	// Build request payload for server-side generation
	const requestPayload = {
		serverId,
		name: worldData.name,
		generate: true, // Enable server-side world generation
		width: dimensions.width,
		height: dimensions.height,
		elevationSeed: worldData.seed || Math.floor(Math.random() * 1000000),
		worldTemplateType: 'STANDARD' // Use standard game template
	};

	console.log('[E2E] World creation request payload:', requestPayload);

	// Create world (returns immediately with GENERATING status)
	const response = await api.post('http://localhost:3001/api/worlds', {
		headers: {
			Cookie: `session=${sessionToken}`
		},
		data: requestPayload
	});

	if (!response.ok()) {
		const errorText = await response.text();
		throw new Error(`Failed to create world: ${response.status()} - ${errorText}`);
	}

	const world = await response.json();
	console.log('[E2E] World created with status:', world.status);

	// If requested, wait for generation to complete
	if (waitForGeneration) {
		// Check if world is already ready (synchronous generation for tiny worlds)
		if (world.status === 'ready') {
			console.log('[E2E] World generation completed synchronously');
			return world;
		}

		// Otherwise poll for completion
		return await waitForWorldGeneration(api, world.id, sessionToken);
	}

	return world;
}

/**
 * Delete world via API (cleanup after tests)
 *
 * @param api - Playwright APIRequestContext
 * @param worldId - World ID to delete
 */
export async function deleteWorld(api: APIRequestContext, worldId: string): Promise<void> {
	const response = await api.delete(`/api/worlds/${worldId}`);

	if (!response.ok()) {
		console.warn('[E2E] Failed to delete world:', worldId, response.status());
	}
}

/**
 * Get world by ID
 *
 * @param api - Playwright APIRequestContext
 * @param worldId - World ID
 * @returns World object
 */
export async function getWorld(api: APIRequestContext, worldId: string): Promise<any> {
	const response = await api.get(`/api/worlds/${worldId}`);

	if (!response.ok()) {
		throw new Error(`Failed to fetch world: ${response.status()}`);
	}

	return response.json();
}
