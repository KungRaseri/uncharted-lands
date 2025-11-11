/**
 * Admin terrain visualization utilities
 * Provides elevation-based color mapping and terrain descriptions for admin views
 * Note: Uses different elevation scale than player-facing map-colors.ts
 */

/**
 * Get elevation-based color for admin tile visualization
 * Uses numeric elevation values (not normalized 0-1 range)
 * 
 * @param elevation - Actual elevation value (can be negative for ocean)
 * @param tileType - Type of tile ('ocean' or 'land')
 * @returns Hex color string
 */
export function getAdminElevationColor(elevation: number, tileType: string): string {
	// Ocean tiles (negative elevation or ocean type)
	if (tileType === 'ocean') {
		if (elevation < -10) return '#001a33'; // Deep ocean
		if (elevation < -5) return '#003d66'; // Ocean
		return '#006699'; // Shallow water
	}
	
	// Land tiles (elevation >= 0)
	if (elevation < 5) return '#c2b280'; // Beach/coastal lowland
	if (elevation < 15) return '#228b22'; // Lowland/grassland
	if (elevation < 25) return '#4a7c59'; // Hills/forest
	if (elevation < 35) return '#8b7355'; // Mountains
	return '#ffffff'; // Snow peaks
}

/**
 * Get terrain description based on elevation and tile type
 * Provides human-readable terrain classification for admin views
 * 
 * @param elevation - Actual elevation value
 * @param tileType - Type of tile ('ocean' or 'land')
 * @returns Terrain description string
 */
export function getAdminTerrainDescription(elevation: number, tileType: string): string {
	// Ocean terrain types
	if (tileType === 'ocean') {
		if (elevation < -10) return 'Deep Ocean';
		if (elevation < -5) return 'Ocean';
		return 'Shallow Water';
	}
	
	// Land terrain types
	if (elevation < 5) return 'Coastal/Beach';
	if (elevation < 15) return 'Lowland';
	if (elevation < 25) return 'Hills';
	if (elevation < 35) return 'Mountains';
	return 'High Mountains';
}
