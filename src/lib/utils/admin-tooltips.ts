/**
 * Admin tooltip formatting utilities
 * Used for displaying technical information in admin mode
 */

import { getTerrainType } from './map-colors';

export interface RegionCoordinates {
	name?: string | null;
	xCoord: number;
	yCoord: number;
}

/**
 * Generate admin tooltip for a region tile
 * Shows region info, tile coordinates, elevation, and terrain type
 */
export function getAdminRegionTooltip(
	region: RegionCoordinates,
	row: number,
	col: number,
	elevation: number
): string {
	const terrain = getTerrainType(elevation);
	return `Region: ${region.name || 'Unknown'} (${region.xCoord}, ${region.yCoord})
Tile: (${row}, ${col})
Elevation: ${elevation.toFixed(3)}
Terrain: ${terrain}`;
}
