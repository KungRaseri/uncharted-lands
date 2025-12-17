/**
 * Structure Metadata API Client
 *
 * Fetches structure definitions from the server API. The server is the
 * authoritative source for all structure costs, prerequisites, and modifiers.
 *
 * ARCHITECTURAL DECISIONS:
 * - Decision 1: Modifiers calculated dynamically by server (no caching)
 * - Decision 2: Area/solar/wind deprecated (removed)
 * - Server Authority: All game data fetched from database per request
 * - Types: Import from central $lib/types/structures (single source of truth)
 *
 * Endpoint: GET /api/structures/metadata (SvelteKit proxy)
 * Backend: server/src/api/routes/structures-metadata.ts
 */

import type { StructureMetadata } from '@uncharted-lands/shared';

// Re-export for backward compatibility with existing imports
export type { StructureMetadata, StructureModifier } from '@uncharted-lands/shared';

/**
 * API response format
 */
interface StructureMetadataResponse {
	success: boolean;
	data: StructureMetadata[];
	error?: string;
}

/**
 * Fetch all structure metadata from the API
 *
 * Server calculates modifiers dynamically (Decision 1), so no client-side caching.
 * This ensures modifiers are always current and match server state.
 *
 * @param fetchFn - Fetch function to use (event.fetch for server-side, global fetch for client-side)
 * @returns Array of structure metadata with dynamically calculated modifiers
 */
export async function fetchStructureMetadata(
	fetchFn: typeof fetch = fetch
): Promise<StructureMetadata[]> {
	// Use SvelteKit proxy route (avoids CORS, handles auth)
	const response = await fetchFn('/api/structures/metadata', {
		credentials: 'include' // Include session cookie
	});

	if (!response.ok) {
		throw new Error(`API request failed: ${response.status} ${response.statusText}`);
	}

	const result: StructureMetadataResponse = await response.json();

	if (!result.success) {
		throw new Error(result.error || 'Unknown error');
	}

	// Validate response structure
	if (!Array.isArray(result.data)) {
		throw new TypeError('Invalid structures response: expected array');
	}

	// Validate each structure has required fields
	for (const structure of result.data) {
		if (!structure.id || !structure.name || !structure.modifiers) {
			throw new Error(`Invalid structure data: missing required fields`);
		}

		// Validate modifiers have 'type' field (Decision 1)
		for (const modifier of structure.modifiers) {
			if (!modifier.type) {
				throw new Error(`Invalid modifier: missing 'type' field (required by Decision 1)`);
			}
		}

		// Validate no deprecated fields (Decision 2)
		type ResourceCosts = {
			food: number;
			water: number;
			wood: number;
			stone: number;
			ore: number;
			area?: number;
			solar?: number;
			wind?: number;
		};
		const costs = structure.costs as ResourceCosts;
		if (costs.area !== undefined || costs.solar !== undefined || costs.wind !== undefined) {
			throw new Error(`Invalid structure: contains deprecated area/solar/wind fields (Decision 2)`);
		}
	}

	return result.data;
}

/**
 * Get structure metadata by ID
 *
 * @param id - Structure ID (e.g., "FARM")
 * @param fetchFn - Fetch function to use (event.fetch for server-side, global fetch for client-side)
 * @returns Structure metadata or undefined if not found
 */
export async function getStructureMetadata(
	id: string,
	fetchFn: typeof fetch = fetch
): Promise<StructureMetadata | undefined> {
	const metadata = await fetchStructureMetadata(fetchFn);
	return metadata.find((s) => s.id === id);
}

/**
 * Check if player can afford to build a structure
 *
 * @param structure - Structure metadata
 * @param storage - Current resource storage
 * @returns Object with canBuild flag and reasons if not
 */
export function canBuildStructure(
	structure: StructureMetadata,
	storage: { food: number; water: number; wood: number; stone: number; ore: number }
): { canBuild: boolean; reasons: string[] } {
	const reasons: string[] = [];

	// Check resource costs
	if (storage.food < structure.costs.food) {
		reasons.push(`Need ${structure.costs.food} food (have ${storage.food})`);
	}
	if (storage.water < structure.costs.water) {
		reasons.push(`Need ${structure.costs.water} water (have ${storage.water})`);
	}
	if (storage.wood < structure.costs.wood) {
		reasons.push(`Need ${structure.costs.wood} wood (have ${storage.wood})`);
	}
	if (storage.stone < structure.costs.stone) {
		reasons.push(`Need ${structure.costs.stone} stone (have ${storage.stone})`);
	}
	if (storage.ore < structure.costs.ore) {
		reasons.push(`Need ${structure.costs.ore} ore (have ${storage.ore})`);
	}

	return {
		canBuild: reasons.length === 0,
		reasons
	};
}
