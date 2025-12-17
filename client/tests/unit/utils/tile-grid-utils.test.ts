import { describe, it, expect } from 'vitest';
import {
	organizeTilesIntoGrid,
	findTilePosition,
	calculateTileNumber,
	indexToPosition,
	positionToIndex,
	type TileGridItem
} from '$lib/utils/tile-grid-utils';

describe('tile-grid-utils', () => {
	describe('organizeTilesIntoGrid', () => {
		it('should organize tiles into a 10x10 grid', () => {
			const tiles: TileGridItem[] = Array.from({ length: 100 }, (_, i) => ({
				id: `tile-${String(i).padStart(3, '0')}`,
				elevation: 0.5,
				type: 'LAND'
			}));

			const grid = organizeTilesIntoGrid(tiles);

			expect(grid).toHaveLength(10);
			expect(grid[0]).toHaveLength(10);
			expect(grid[0][0]).toEqual(tiles[0]);
			expect(grid[9][9]).toEqual(tiles[99]);
		});

		it('should handle fewer than 100 tiles', () => {
			const tiles: TileGridItem[] = Array.from({ length: 50 }, (_, i) => ({
				id: `tile-${String(i).padStart(3, '0')}`,
				elevation: 0.3,
				type: 'LAND'
			}));

			const grid = organizeTilesIntoGrid(tiles);

			expect(grid).toHaveLength(10);
			expect(grid[4][9]).toEqual(tiles[49]);
			expect(grid[5][0]).toBeNull();
		});

		it('should handle empty array', () => {
			const grid = organizeTilesIntoGrid([]);

			expect(grid).toHaveLength(10);
			expect(grid[0]).toHaveLength(10);
			expect(grid[0][0]).toBeNull();
		});

		it('should sort tiles by id before organizing', () => {
			const tiles: TileGridItem[] = [
				{ id: 'tile-002', elevation: 0.2, type: 'LAND' },
				{ id: 'tile-000', elevation: 0, type: 'LAND' },
				{ id: 'tile-001', elevation: 0.1, type: 'LAND' }
			];

			const grid = organizeTilesIntoGrid(tiles);

			expect(grid[0][0]?.id).toBe('tile-000');
			expect(grid[0][1]?.id).toBe('tile-001');
			expect(grid[0][2]?.id).toBe('tile-002');
		});

		it('should handle tiles with additional properties', () => {
			const tiles: TileGridItem[] = [
				{
					id: 'tile-000',
					elevation: 0.5,
					type: 'LAND',
					biome: 'Forest',
					temperature: 0.6
				}
			];

			const grid = organizeTilesIntoGrid(tiles);

			expect(grid[0][0]).toEqual(tiles[0]);
			expect(grid[0][0]?.biome).toBe('Forest');
		});

		it('should not mutate original tiles array', () => {
			const tiles: TileGridItem[] = [
				{ id: 'tile-002', elevation: 0.2, type: 'LAND' },
				{ id: 'tile-000', elevation: 0.0, type: 'LAND' }
			];
			const originalOrder = tiles.map((t) => t.id);

			organizeTilesIntoGrid(tiles);

			expect(tiles.map((t) => t.id)).toEqual(originalOrder);
		});
	});

	describe('findTilePosition', () => {
		const tiles: TileGridItem[] = Array.from({ length: 100 }, (_, i) => ({
			id: `tile-${String(i).padStart(3, '0')}`,
			elevation: 0.5,
			type: 'LAND'
		}));

		it('should find position of first tile', () => {
			const position = findTilePosition('tile-000', tiles);

			expect(position).toEqual({ row: 0, col: 0, index: 0 });
		});

		it('should find position of last tile', () => {
			const position = findTilePosition('tile-099', tiles);

			expect(position).toEqual({ row: 9, col: 9, index: 99 });
		});

		it('should find position of middle tile', () => {
			const position = findTilePosition('tile-055', tiles);

			expect(position).toEqual({ row: 5, col: 5, index: 55 });
		});

		it('should return -1 for non-existent tile', () => {
			const position = findTilePosition('tile-999', tiles);

			expect(position).toEqual({ row: -1, col: -1, index: -1 });
		});

		it('should handle empty tiles array', () => {
			const position = findTilePosition('tile-000', []);

			expect(position).toEqual({ row: -1, col: -1, index: -1 });
		});

		it('should sort tiles before finding position', () => {
			const unsortedTiles: TileGridItem[] = [
				{ id: 'tile-020', elevation: 0.2, type: 'LAND' },
				{ id: 'tile-010', elevation: 0.1, type: 'LAND' },
				{ id: 'tile-000', elevation: 0, type: 'LAND' }
			];

			const position = findTilePosition('tile-010', unsortedTiles);

			// tile-010 is at index 1 after sorting (between tile-000 and tile-020)
			expect(position).toEqual({ row: 0, col: 1, index: 1 });
		});

		it('should not mutate original tiles array', () => {
			const testTiles = [...tiles];
			const originalOrder = testTiles.map((t) => t.id);

			findTilePosition('tile-050', testTiles);

			expect(testTiles.map((t) => t.id)).toEqual(originalOrder);
		});
	});

	describe('calculateTileNumber', () => {
		it('should calculate tile number for first tile', () => {
			expect(calculateTileNumber(0, 0)).toBe(1);
		});

		it('should calculate tile number for last tile', () => {
			expect(calculateTileNumber(9, 9)).toBe(100);
		});

		it('should calculate tile number for middle tile', () => {
			expect(calculateTileNumber(5, 5)).toBe(56);
		});

		it('should calculate tile number for end of first row', () => {
			expect(calculateTileNumber(0, 9)).toBe(10);
		});

		it('should calculate tile number for start of second row', () => {
			expect(calculateTileNumber(1, 0)).toBe(11);
		});

		it('should calculate tile number for various positions', () => {
			expect(calculateTileNumber(2, 3)).toBe(24);
			expect(calculateTileNumber(7, 8)).toBe(79);
			expect(calculateTileNumber(4, 4)).toBe(45);
		});
	});

	describe('indexToPosition', () => {
		it('should convert index 0 to position (0, 0)', () => {
			expect(indexToPosition(0)).toEqual({ row: 0, col: 0 });
		});

		it('should convert index 99 to position (9, 9)', () => {
			expect(indexToPosition(99)).toEqual({ row: 9, col: 9 });
		});

		it('should convert index 50 to position (5, 0)', () => {
			expect(indexToPosition(50)).toEqual({ row: 5, col: 0 });
		});

		it('should convert index 9 to position (0, 9)', () => {
			expect(indexToPosition(9)).toEqual({ row: 0, col: 9 });
		});

		it('should convert various indices correctly', () => {
			expect(indexToPosition(23)).toEqual({ row: 2, col: 3 });
			expect(indexToPosition(78)).toEqual({ row: 7, col: 8 });
			expect(indexToPosition(44)).toEqual({ row: 4, col: 4 });
		});
	});

	describe('positionToIndex', () => {
		it('should convert position (0, 0) to index 0', () => {
			expect(positionToIndex(0, 0)).toBe(0);
		});

		it('should convert position (9, 9) to index 99', () => {
			expect(positionToIndex(9, 9)).toBe(99);
		});

		it('should convert position (5, 0) to index 50', () => {
			expect(positionToIndex(5, 0)).toBe(50);
		});

		it('should convert position (0, 9) to index 9', () => {
			expect(positionToIndex(0, 9)).toBe(9);
		});

		it('should convert various positions correctly', () => {
			expect(positionToIndex(2, 3)).toBe(23);
			expect(positionToIndex(7, 8)).toBe(78);
			expect(positionToIndex(4, 4)).toBe(44);
		});
	});

	describe('indexToPosition and positionToIndex are inverses', () => {
		it('should be inverses for all valid indices', () => {
			for (let i = 0; i < 100; i++) {
				const { row, col } = indexToPosition(i);
				expect(positionToIndex(row, col)).toBe(i);
			}
		});

		it('should be inverses for all valid positions', () => {
			for (let row = 0; row < 10; row++) {
				for (let col = 0; col < 10; col++) {
					const index = positionToIndex(row, col);
					expect(indexToPosition(index)).toEqual({ row, col });
				}
			}
		});
	});
});
