/**
 * Map and terrain color utilities
 * Extracted from Svelte components for testability
 */

/**
 * Get color based on elevation value
 * These colors roughly correspond to common biomes at those elevations
 * 
 * @param elevation - Elevation value (typically -1 to 1 range)
 * @returns Hex color string
 */
export function getElevationColor(elevation: number): string {
	if (elevation < -0.3) return '#001a33'; // Deep ocean
	if (elevation < 0) return '#003d66'; // Shallow ocean
	if (elevation < 0.1) return '#f4e4c1'; // Beach/Sand
	if (elevation < 0.3) return '#78b450'; // Low grassland/plains
	if (elevation < 0.5) return '#5a8232'; // Forest/woodland
	if (elevation < 0.7) return '#8d6e63'; // Hills
	if (elevation < 0.9) return '#969696'; // Mountains
	return '#dce1f0'; // Snow/tundra peaks
}

/**
 * Get terrain type name from elevation value
 * 
 * @param elevation - Elevation value (typically -1 to 1 range)
 * @returns Human-readable terrain type name
 */
export function getTerrainType(elevation: number): string {
	if (elevation < -0.3) return 'Deep Ocean';
	if (elevation < 0) return 'Ocean';
	if (elevation < 0.1) return 'Beach';
	if (elevation < 0.3) return 'Plains';
	if (elevation < 0.5) return 'Forest';
	if (elevation < 0.7) return 'Hills';
	if (elevation < 0.9) return 'Mountains';
	return 'Snow Peaks';
}

/**
 * Elevation thresholds for terrain classification
 * Useful for testing and consistency
 */
export const ELEVATION_THRESHOLDS = {
	DEEP_OCEAN: -0.3,
	OCEAN: 0,
	BEACH: 0.1,
	PLAINS: 0.3,
	FOREST: 0.5,
	HILLS: 0.7,
	MOUNTAINS: 0.9,
} as const;

/**
 * Terrain color palette
 * Centralized colors for consistency across the app
 */
export const TERRAIN_COLORS = {
	DEEP_OCEAN: '#001a33',
	OCEAN: '#003d66',
	BEACH: '#f4e4c1',
	PLAINS: '#78b450',
	FOREST: '#5a8232',
	HILLS: '#8d6e63',
	MOUNTAINS: '#969696',
	SNOW_PEAKS: '#dce1f0',
} as const;

/**
 * Get terrain classification data
 * Returns both color and type name
 * 
 * @param elevation - Elevation value
 * @returns Object with color and type
 */
export function getTerrainData(elevation: number): {
	color: string;
	type: string;
} {
	return {
		color: getElevationColor(elevation),
		type: getTerrainType(elevation),
	};
}
