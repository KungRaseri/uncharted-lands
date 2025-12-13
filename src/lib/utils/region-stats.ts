/**
 * Region statistics utilities
 * Calculates statistical information about regions and their elevation maps
 */

/**
 * Region statistics result
 */
export type RegionStats = {
	avgElevation: number;
	minElevation: number;
	maxElevation: number;
};

/**
 * Calculate average, minimum, and maximum elevation for a region
 *
 * @param elevationMap - 2D array of elevation values for the region
 * @returns Object containing average, minimum, and maximum elevation
 */
export function getRegionStats(elevationMap: number[][] | null | undefined): RegionStats {
	// Handle invalid or empty elevation map
	if (!elevationMap || !Array.isArray(elevationMap) || elevationMap.length === 0) {
		return { avgElevation: 0, minElevation: 0, maxElevation: 0 };
	}

	// Flatten the 2D array and filter out any non-numeric values
	const allValues = elevationMap
		.flat()
		.filter((val) => typeof val === 'number' && !Number.isNaN(val));

	// Handle empty array after filtering
	if (allValues.length === 0) {
		return { avgElevation: 0, minElevation: 0, maxElevation: 0 };
	}

	const sum = allValues.reduce((a, b) => a + b, 0);
	const avg = sum / allValues.length;
	const min = Math.min(...allValues);
	const max = Math.max(...allValues);

	return {
		avgElevation: avg,
		minElevation: min,
		maxElevation: max
	};
}

/**
 * Options for formatting a region tile tooltip
 */
export type RegionTileTooltipOptions = {
	regionName: string;
	regionX: number;
	regionY: number;
	tileRow: number;
	tileCol: number;
	elevation: number;
	terrainType: string;
	stats: RegionStats;
};

/**
 * Format a detailed tooltip for a region tile
 *
 * @param options - Options object containing all tooltip information
 * @returns Formatted tooltip string with newlines
 */
export function formatRegionTileTooltip(options: RegionTileTooltipOptions): string {
	const { regionName, regionX, regionY, tileRow, tileCol, elevation, terrainType, stats } = options;

	return `Region: ${regionName || 'Unknown'} (${regionX}, ${regionY})
Region Avg Elevation: ${stats.avgElevation.toFixed(3)}
Region Range: ${stats.minElevation.toFixed(2)} to ${stats.maxElevation.toFixed(2)}

Tile: (${tileRow}, ${tileCol})
Tile Elevation: ${elevation.toFixed(3)}
Terrain Type: ${terrainType}`;
}
