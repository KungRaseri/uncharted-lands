/**
 * Tile color utilities
 * Maps biome types and elevation to visual colors
 */

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
	DESERT_SUBTROPICAL: 'rgb(230, 200, 140)', // Sandy yellow
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
 * @param elevation - Elevation value
 * @returns RGB color string
 */
export function getElevationFallbackColor(elevation: number): string {
	if (elevation > 0.7) {
		return 'rgb(150, 150, 150)'; // Mountain gray
	}
	return 'rgb(100, 140, 80)'; // Default green
}

/**
 * Get tile color based on biome type and elevation
 * Main function that determines tile color using elevation, biome, and tile type
 * 
 * @param elevation - Tile elevation value
 * @param biomeName - Name of the biome
 * @param type - Type of tile (OCEAN or LAND)
 * @returns RGB color string
 */
export function getTileColor(
	elevation: number,
	biomeName: string,
	type: TileType
): string {
	// Ocean/Water - differentiate by depth
	if (type === 'OCEAN' || elevation < 0) {
		return getOceanColor(elevation);
	}

	// Beach/Coastal (low elevation land)
	if (elevation >= 0 && elevation < 0.15) {
		return getBeachColor();
	}

	// Check if biome is in our known biomes
	if (biomeName in BIOME_COLORS) {
		return BIOME_COLORS[biomeName as BiomeType];
	}

	// Fallback: elevation-based
	return getElevationFallbackColor(elevation);
}
