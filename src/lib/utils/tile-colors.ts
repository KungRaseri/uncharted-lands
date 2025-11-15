/**
 * Tile color utilities
 * Consolidated color mapping for biomes, terrain, and elevation
 * Supports multiple visualization modes: satellite, topographical, political, etc.
 *
 * IMPORTANT: Elevation values are generated using fractal noise with:
 * - Base amplitude: 1.0
 * - Octaves: 4
 * - Persistence: 0.5
 *
 * This results in a theoretical range of approximately [-1.875, 1.875]
 * due to octave accumulation: 1 + 0.5 + 0.25 + 0.125 = 1.875
 *
 * In practice, values can exceed 2.0 in rare cases.
 */

/**
 * Map visualization mode
 */
export type MapViewMode =
	| 'satellite' // Realistic biome colors (default)
	| 'topographical' // Elevation-based height map
	| 'temperature' // Temperature gradient visualization
	| 'precipitation' // Precipitation/moisture visualization
	| 'political'; // Simplified colors for settlements/claims

/**
 * Biome type definition
 */
export type BiomeType =
	| 'TUNDRA'
	| 'FOREST_BOREAL'
	| 'FOREST_TEMPERATE_SEASONAL'
	| 'FOREST_TROPICAL_SEASONAL'
	| 'RAINFOREST_TEMPERATE'
	| 'RAINFOREST_TROPICAL'
	| 'WOODLAND'
	| 'SHRUBLAND'
	| 'SAVANNA'
	| 'GRASSLAND_TEMPERATE'
	| 'DESERT_COLD'
	| 'DESERT_SUBTROPICAL';

/**
 * Tile type
 */
export type TileType = 'OCEAN' | 'LAND';

/**
 * Biome color mapping
 * Maps each biome type to its RGB color representation
 */
export const BIOME_COLORS: Record<BiomeType, string> = {
	TUNDRA: 'rgb(220, 225, 240)', // Pale blue-white
	FOREST_BOREAL: 'rgb(45, 100, 60)', // Dark green
	FOREST_TEMPERATE_SEASONAL: 'rgb(60, 130, 50)', // Medium green
	FOREST_TROPICAL_SEASONAL: 'rgb(50, 140, 70)', // Tropical green
	RAINFOREST_TEMPERATE: 'rgb(40, 110, 55)', // Deep green
	RAINFOREST_TROPICAL: 'rgb(30, 130, 60)', // Lush green
	WOODLAND: 'rgb(90, 140, 70)', // Light forest green
	SHRUBLAND: 'rgb(140, 160, 90)', // Olive green
	SAVANNA: 'rgb(200, 170, 80)', // Golden grassland
	GRASSLAND_TEMPERATE: 'rgb(120, 180, 80)', // Bright grass green
	DESERT_COLD: 'rgb(190, 180, 160)', // Gray-tan
	DESERT_SUBTROPICAL: 'rgb(230, 200, 140)' // Sandy yellow
} as const;

/**
 * Get color for ocean based on depth (elevation)
 *
 * @param elevation - Elevation value (negative for ocean)
 * @returns RGB color string
 */
export function getOceanColor(elevation: number): string {
	if (elevation < -0.35) {
		return 'rgb(0, 26, 51)'; // Deep ocean - #001a33
	}
	return 'rgb(0, 61, 102)'; // Shallow ocean - #003d66
}

/**
 * Get color for beach/coastal areas
 *
 * @returns RGB color string
 */
export function getBeachColor(): string {
	return 'rgb(244, 228, 193)'; // Sandy beach color - #f4e4c1
}

/**
 * Get fallback color based on elevation
 * Used when biome type is unknown or not in the mapping
 *
 * @param elevation - Elevation value (approximately in range [-2, 2])
 * @returns RGB color string
 */
export function getElevationFallbackColor(elevation: number): string {
	if (elevation > 0.7) {
		return 'rgb(150, 150, 150)'; // Mountain gray
	}
	return 'rgb(100, 140, 80)'; // Default green
}

/**
 * Get color based on elevation value for admin/preview maps
 * These colors roughly correspond to common biomes at those elevations
 *
 * @param elevation - Elevation value (approximately in range [-2, 2])
 * @returns Hex color string
 */
export function getElevationColor(elevation: number): string {
	if (elevation < -0.7) return '#00050d'; // Abyssal depths
	if (elevation < -0.5) return '#000d1a'; // Deepest ocean (abyss)
	if (elevation < -0.3) return '#001a33'; // Deep ocean
	if (elevation < 0) return '#003d66'; // Shallow ocean
	if (elevation < 0.05) return '#f4e4c1'; // Beach/Sand
	if (elevation < 0.3) return '#78b450'; // Low grassland/plains
	if (elevation < 0.5) return '#5a8232'; // Forest/woodland
	if (elevation < 0.65) return '#8d6e63'; // Hills
	if (elevation < 0.8) return '#969696'; // Mountains
	if (elevation < 1) return '#c0c0c0'; // High mountains
	if (elevation < 1.5) return '#e8e8e8'; // Alpine peaks
	return '#ffffff'; // Extreme peaks (rare)
}

/**
 * Get terrain type name from elevation value
 *
 * @param elevation - Elevation value (approximately in range [-2, 2])
 * @returns Human-readable terrain type name
 */
export function getTerrainType(elevation: number): string {
	if (elevation < -0.7) return 'Abyssal Depths';
	if (elevation < -0.5) return 'Abyss';
	if (elevation < -0.3) return 'Deep Ocean';
	if (elevation < 0) return 'Ocean';
	if (elevation < 0.05) return 'Beach';
	if (elevation < 0.3) return 'Plains';
	if (elevation < 0.5) return 'Forest';
	if (elevation < 0.65) return 'Hills';
	if (elevation < 0.8) return 'Mountains';
	if (elevation < 1) return 'High Mountains';
	if (elevation < 1.5) return 'Alpine Peaks';
	return 'Extreme Peaks';
}

/**
 * Elevation thresholds for terrain classification
 * Useful for testing and consistency
 * Values account for fractal noise accumulation (range ≈ [-2, 2])
 */
export const ELEVATION_THRESHOLDS = {
	ABYSSAL_DEPTHS: -0.7,
	ABYSS: -0.5,
	DEEP_OCEAN: -0.3,
	OCEAN: 0,
	BEACH: 0.05, // Reduced from 0.1 for narrower beaches
	PLAINS: 0.3,
	FOREST: 0.5,
	HILLS: 0.65,
	MOUNTAINS: 0.8,
	HIGH_MOUNTAINS: 1,
	ALPINE_PEAKS: 1.5
} as const;

/**
 * Terrain color palette
 * Centralized colors for consistency across the app
 */
export const TERRAIN_COLORS = {
	ABYSSAL_DEPTHS: '#00050d',
	ABYSS: '#000d1a',
	DEEP_OCEAN: '#001a33',
	OCEAN: '#003d66',
	BEACH: '#f4e4c1',
	PLAINS: '#78b450',
	FOREST: '#5a8232',
	HILLS: '#8d6e63',
	MOUNTAINS: '#969696',
	HIGH_MOUNTAINS: '#c0c0c0',
	ALPINE_PEAKS: '#e8e8e8',
	EXTREME_PEAKS: '#ffffff'
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
		type: getTerrainType(elevation)
	};
}

/**
 * Get tile color based on biome type and elevation
 * Main function that determines tile color using elevation, biome, and tile type
 *
 * Priority order:
 * 1. Tile type OCEAN or negative elevation → ocean colors
 * 2. Low elevation (0-0.15) → beach color
 * 3. Special biome names (Deep Ocean, Ocean, Beach) → corresponding colors
 * 4. Known biome types → biome-specific colors
 * 5. Unknown biomes → elevation fallback colors
 *
 * @param elevation - Tile elevation value
 * @param biomeName - Name of the biome (including special cases like "Deep Ocean", "Ocean", "Beach")
 * @param type - Type of tile (OCEAN or LAND)
 * @returns RGB color string
 */
export function getTileColor(elevation: number, biomeName: string, type: TileType): string {
	// Priority 1: OCEAN type or negative elevation always gets ocean colors
	if (type === 'OCEAN' || elevation < 0) {
		return getOceanColor(elevation);
	}

	// Priority 2: Low elevation land gets beach color
	if (elevation >= 0 && elevation < 0.05) {
		return getBeachColor();
	}

	// Priority 3: Handle special biome names (from getBiomeNameForPreview)
	if (biomeName === 'Deep Ocean' || biomeName === 'Ocean') {
		return getOceanColor(elevation);
	}

	if (biomeName === 'Beach') {
		return getBeachColor();
	}

	// Priority 4: Check if biome is in our known biomes
	if (biomeName in BIOME_COLORS) {
		return BIOME_COLORS[biomeName as BiomeType];
	}

	// Priority 5: Fallback to elevation-based coloring for unknown biomes
	// Debug logging for unknown biomes - remove after verification
	console.warn('[TILE COLOR] Unknown biome, using fallback:', {
		biomeName,
		elevation,
		type,
		availableBiomes: Object.keys(BIOME_COLORS)
	});

	return getElevationFallbackColor(elevation);
}

/**
 * Get color based on temperature value
 * Temperature ranges from approximately -1 to 1 in the noise generation
 *
 * @param temperature - Temperature value
 * @returns Hex color string
 */
export function getTemperatureColor(temperature: number): string {
	// Normalize temperature to 0-1 range (assuming input is roughly -1 to 1)
	const normalized = (temperature + 1) / 2;

	if (normalized < 0.15) return '#0d1f4d'; // Frigid - deep blue
	if (normalized < 0.3) return '#2e5c8a'; // Very cold - blue
	if (normalized < 0.45) return '#4a9eff'; // Cold - light blue
	if (normalized < 0.55) return '#90ee90'; // Cool - light green
	if (normalized < 0.65) return '#ffff00'; // Mild - yellow
	if (normalized < 0.75) return '#ffa500'; // Warm - orange
	if (normalized < 0.85) return '#ff4500'; // Hot - red-orange
	return '#8b0000'; // Very hot - dark red
}

/**
 * Get color based on precipitation value
 * Precipitation ranges from approximately 0 to 1 in the noise generation
 *
 * @param precipitation - Precipitation value
 * @returns Hex color string
 */
export function getPrecipitationColor(precipitation: number): string {
	if (precipitation < 0.1) return '#d4a574'; // Arid - tan/brown
	if (precipitation < 0.25) return '#c9b896'; // Dry - light brown
	if (precipitation < 0.4) return '#b8d4a8'; // Semi-dry - pale green
	if (precipitation < 0.55) return '#90c878'; // Moderate - light green
	if (precipitation < 0.7) return '#5fb04e'; // Moist - green
	if (precipitation < 0.85) return '#3a8c3a'; // Wet - dark green
	return '#1e5a1e'; // Very wet - very dark green
}

/**
 * Get tile color based on view mode
 * Unified function that handles all visualization modes
 *
 * @param viewMode - The visualization mode to use
 * @param elevation - Tile elevation value
 * @param biomeName - Name of the biome
 * @param type - Type of tile (OCEAN or LAND)
 * @param temperature - Temperature value (optional, needed for temperature view)
 * @param precipitation - Precipitation value (optional, needed for precipitation view)
 * @returns RGB/Hex color string
 */
export function getTileColorByViewMode(
	viewMode: MapViewMode,
	elevation: number,
	biomeName: string,
	type: TileType,
	temperature?: number,
	precipitation?: number
): string {
	switch (viewMode) {
		case 'satellite':
			// Realistic biome colors
			return getTileColor(elevation, biomeName, type);

		case 'topographical':
			// Elevation-based colors
			return getElevationColor(elevation);

		case 'temperature':
			// Temperature gradient
			if (type === 'OCEAN' || elevation < 0) {
				// Ocean gets darker blue based on depth
				return getOceanColor(elevation);
			}
			return getTemperatureColor(temperature ?? 0);

		case 'precipitation':
			// Precipitation/moisture gradient
			if (type === 'OCEAN' || elevation < 0) {
				// Ocean is always wet, show as deep blue-green
				return '#1e5a5a';
			}
			return getPrecipitationColor(precipitation ?? 0);

		case 'political':
			// Simplified colors for political boundaries
			if (type === 'OCEAN' || elevation < 0) {
				return '#b0c4de'; // Light steel blue for ocean
			}
			if (elevation < 0.05) {
				return '#f5deb3'; // Wheat for beach
			}
			return '#d2b48c'; // Tan for land

		default:
			return getTileColor(elevation, biomeName, type);
	}
}
