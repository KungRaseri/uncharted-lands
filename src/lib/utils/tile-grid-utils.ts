/**
 * Utility functions for organizing and working with tile grids in regions
 */

export interface TilePosition {
	row: number;
	col: number;
	index: number;
}

export interface TileGridItem {
	id: string;
	elevation: number;
	type: string;
	[key: string]: any;
}

/**
 * Organizes tiles into a 10x10 grid structure
 * @param tiles - Array of tiles to organize
 * @returns 2D array representing the 10x10 grid
 */
export function organizeTilesIntoGrid(tiles: TileGridItem[]): (TileGridItem | null)[][] {
	const grid: (TileGridItem | null)[][] = Array.from({ length: 10 }, () =>
		new Array(10).fill(null)
	);

	// Sort tiles to ensure correct positioning
	const sortedTiles = [...tiles].sort((a, b) => a.id.localeCompare(b.id));

	for (const [index, tile] of sortedTiles.entries()) {
		const row = Math.floor(index / 10);
		const col = index % 10;
		if (row < 10 && col < 10) {
			grid[row][col] = tile;
		}
	}

	return grid;
}

/**
 * Finds the position of a specific tile within a region's tile array
 * @param tileId - ID of the tile to find
 * @param tiles - Array of tiles to search
 * @returns Object containing row, col, and index position, or {row: -1, col: -1, index: -1} if not found
 */
export function findTilePosition(tileId: string, tiles: TileGridItem[]): TilePosition {
	const sortedTiles = [...tiles].sort((a, b) => a.id.localeCompare(b.id));
	const index = sortedTiles.findIndex((t) => t.id === tileId);

	if (index === -1) {
		return { row: -1, col: -1, index: -1 };
	}

	return {
		row: Math.floor(index / 10),
		col: index % 10,
		index
	};
}

/**
 * Calculates the tile number (1-100) from row and column position
 * @param row - Row index (0-9)
 * @param col - Column index (0-9)
 * @returns Tile number from 1 to 100
 */
export function calculateTileNumber(row: number, col: number): number {
	return row * 10 + col + 1;
}

/**
 * Converts a tile index (0-99) to row and column position
 * @param index - Tile index (0-99)
 * @returns Object containing row and col position
 */
export function indexToPosition(index: number): { row: number; col: number } {
	return {
		row: Math.floor(index / 10),
		col: index % 10
	};
}

/**
 * Converts row and column position to tile index (0-99)
 * @param row - Row index (0-9)
 * @param col - Column index (0-9)
 * @returns Tile index from 0 to 99
 */
export function positionToIndex(row: number, col: number): number {
	return row * 10 + col;
}
