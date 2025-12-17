/**
 * Utility functions for world map grid calculations and layout
 *
 * ARCHITECTURAL DECISION: Import types from central repository
 * RegionBase imported from $lib/types/game (single source of truth)
 * GridDimensions is calculation-specific utility type (kept local)
 */

import type { RegionBase } from '@uncharted-lands/shared';

export interface GridDimensions {
	cols: number;
	rows: number;
	minX: number;
	maxX: number;
	minY: number;
	maxY: number;
}

export interface WorldStats {
	totalTiles: number;
	landTiles: number;
	oceanTiles: number;
}

/**
 * Calculates grid dimensions from a set of regions
 * @param regions - Array of regions with coordinates
 * @param lazyLoadEnabled - Whether lazy loading is enabled (calculates actual bounds)
 * @returns Grid dimensions with column/row counts and coordinate bounds
 */
export function calculateGridDimensions(
	regions: RegionBase[] | null | undefined,
	lazyLoadEnabled: boolean = false
): GridDimensions {
	if (!regions || regions.length === 0) {
		return { cols: 10, rows: 10, minX: 0, minY: 0, maxX: 9, maxY: 9 };
	}

	if (lazyLoadEnabled) {
		// For lazy loading, calculate actual bounds from loaded regions
		const xCoords = regions.map((r) => r.xCoord);
		const yCoords = regions.map((r) => r.yCoord);
		const minX = Math.min(...xCoords);
		const maxX = Math.max(...xCoords);
		const minY = Math.min(...yCoords);
		const maxY = Math.max(...yCoords);
		const cols = maxY - minY + 1;
		const rows = maxX - minX + 1;

		return { cols, rows, minX, maxX, minY, maxY };
	}

	// Full world mode: assume 10x10
	return { cols: 10, rows: 10, minX: 0, minY: 0, maxX: 9, maxY: 9 };
}

/**
 * Gets Tailwind CSS class for grid columns based on count
 * @param cols - Number of columns
 * @returns Tailwind grid-cols-* class name
 */
export function getGridColsClass(cols: number): string {
	switch (cols) {
		case 3:
			return 'grid-cols-3';
		case 4:
			return 'grid-cols-4';
		case 5:
			return 'grid-cols-5';
		case 6:
			return 'grid-cols-6';
		case 7:
			return 'grid-cols-7';
		case 8:
			return 'grid-cols-8';
		case 9:
			return 'grid-cols-9';
		case 10:
			return 'grid-cols-10';
		default:
			return 'grid-cols-10';
	}
}

/**
 * Gets Tailwind CSS class for grid rows based on count
 * @param rows - Number of rows
 * @returns Tailwind grid-rows-* class name
 */
export function getGridRowsClass(rows: number): string {
	switch (rows) {
		case 3:
			return 'grid-rows-3';
		case 4:
			return 'grid-rows-4';
		case 5:
			return 'grid-rows-5';
		case 6:
			return 'grid-rows-6';
		case 7:
			return 'grid-rows-7';
		case 8:
			return 'grid-rows-8';
		case 9:
			return 'grid-rows-9';
		case 10:
			return 'grid-rows-10';
		default:
			return 'grid-rows-10';
	}
}

/**
 * Calculates world statistics from preview regions (elevation maps)
 * @param previewRegions - Regions with elevation maps
 * @returns Statistics about total, land, and ocean tiles
 */
export function calculatePreviewStats(
	previewRegions: Array<{ elevationMap?: number[][] }>
): WorldStats {
	let totalTiles = 0;
	let landTiles = 0;
	let oceanTiles = 0;

	for (const region of previewRegions) {
		if (region.elevationMap && Array.isArray(region.elevationMap)) {
			const tiles = region.elevationMap.flat();
			totalTiles += tiles.length;
			landTiles += tiles.filter((e) => e >= 0).length;
			oceanTiles += tiles.filter((e) => e < 0).length;
		}
	}

	return { totalTiles, landTiles, oceanTiles };
}

/**
 * Calculates world statistics from actual regions with tiles
 * @param regions - Regions with tile arrays
 * @returns Statistics about total, land, and ocean tiles
 */
export function calculateRegionStats(
	regions: Array<{ tiles: Array<{ type: string }> }>
): WorldStats {
	const totalTiles = regions.reduce((sum, r) => sum + r.tiles.length, 0);
	const landTiles = regions.reduce(
		(sum, r) => sum + r.tiles.filter((t) => t.type === 'LAND').length,
		0
	);
	const oceanTiles = regions.reduce(
		(sum, r) => sum + r.tiles.filter((t) => t.type === 'OCEAN').length,
		0
	);

	return { totalTiles, landTiles, oceanTiles };
}

/**
 * Sorts regions by coordinates in row-major order
 * @param regions - Array of regions to sort
 * @returns New sorted array (does not mutate original)
 */
export function sortRegionsByCoordinates<T extends RegionBase>(regions: T[]): T[] {
	return [...regions].sort((a, b) => {
		if (a.xCoord !== b.xCoord) return a.xCoord - b.xCoord;
		return a.yCoord - b.yCoord;
	});
}
