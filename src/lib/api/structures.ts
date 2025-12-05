/**
 * Structure Metadata API Client
 *
 * Fetches structure definitions from the server API instead of using
 * hardcoded data. The server is the authoritative source for all structure
 * costs, requirements, and modifiers.
 *
 * Endpoint: GET /api/structures/metadata (SvelteKit proxy)
 * Backend: server/src/api/routes/structures-metadata.ts
 */

/**
 * Structure metadata from the API
 */
export interface StructureMetadata {
	id: string; // lowercase structure name (e.g., "farm")
	name: string; // UPPERCASE structure name (e.g., "FARM")
	description: string;

	// Build costs (all resources, defaulted to 0)
	costs: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};

	// Plot requirements (optional - legacy fields being phased out)
	requirements?: {
		area?: number;
		solar?: number;
		wind?: number;
	};

	// Construction info
	constructionTime: number; // seconds
	populationRequired: number;

	// Effects/modifiers (optional)
	modifiers?: {
		name: string;
		description: string;
		value: number;
	}[];
}

/**
 * API response format
 */
interface StructureMetadataResponse {
	success: boolean;
	data: StructureMetadata[];
	timestamp: number;
}

/**
 * Cached structure metadata
 */
let cachedMetadata: StructureMetadata[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch all structure metadata from the API
 *
 * @param forceRefresh - Force a fresh fetch, bypassing cache
 * @returns Array of structure metadata
 */
export async function fetchStructureMetadata(forceRefresh = false): Promise<StructureMetadata[]> {
	// Return cached data if valid
	const now = Date.now();
	if (!forceRefresh && cachedMetadata && now - cacheTimestamp < CACHE_DURATION) {
		return cachedMetadata;
	}

	try {
		// Use SvelteKit proxy route (avoids CORS, handles auth)
		const response = await fetch('/api/structures/metadata');

		if (!response.ok) {
			throw new Error(`API request failed: ${response.status} ${response.statusText}`);
		}

		const result: StructureMetadataResponse = await response.json();

		if (!result.success) {
			throw new Error('API returned unsuccessful response');
		}

		// Update cache
		cachedMetadata = result.data;
		cacheTimestamp = result.timestamp;

		return result.data;
	} catch (error) {
		console.error('Failed to fetch structure metadata:', error);

		// Return cached data if available, even if stale
		if (cachedMetadata) {
			console.warn('Using stale cached data due to fetch error');
			return cachedMetadata;
		}

		// Re-throw if no cached data available
		throw error;
	}
}

/**
 * Get structure metadata by ID
 *
 * @param id - Lowercase structure name (e.g., "farm")
 * @returns Structure metadata or undefined if not found
 */
export async function getStructureMetadata(id: string): Promise<StructureMetadata | undefined> {
	const metadata = await fetchStructureMetadata();
	return metadata.find((s) => s.id === id);
}

/**
 * Clear the cache (useful for testing or forcing a refresh)
 */
export function clearStructureMetadataCache(): void {
	cachedMetadata = null;
	cacheTimestamp = 0;
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
