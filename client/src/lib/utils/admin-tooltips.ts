/**
 * Admin tooltip formatting utilities
 * Used for displaying technical information in admin mode
 */

import { getTerrainType } from './tile-colors';
import { getBiomeDisplayName } from '$lib/data/biomes';

export interface RegionCoordinates {
	name?: string | null;
	xCoord: number;
	yCoord: number;
}

/**
 * Generate admin tooltip for a region tile
 * Shows region info, tile coordinates, elevation, terrain type, and biome information
 */
export function getAdminRegionTooltip(
	region: RegionCoordinates,
	row: number,
	col: number,
	elevation: number,
	precipitation?: number,
	temperature?: number,
	biomeName?: string
): string {
	const terrain = getTerrainType(elevation);

	let tooltip = `Region: ${region.name || 'Unknown'} (${region.xCoord}, ${region.yCoord})
Tile: (${row}, ${col})
Elevation: ${elevation.toFixed(3)}
Terrain: ${terrain}`;

	// Add environmental data if available (preview mode)
	if (precipitation !== undefined) {
		tooltip += `\nPrecipitation: ${precipitation.toFixed(3)} (raw noise)`;
	}

	if (temperature !== undefined) {
		tooltip += `\nTemperature: ${temperature.toFixed(3)} (raw noise)`;
	}

	// Add biome if available
	if (biomeName) {
		const displayName = getBiomeDisplayName(biomeName);
		tooltip += `\nBiome: ${displayName} (${biomeName})`;
	}

	return tooltip;
}
