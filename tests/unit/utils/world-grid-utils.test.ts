import { describe, it, expect } from 'vitest';
import {
	calculateGridDimensions,
	getGridColsClass,
	getGridRowsClass,
	calculatePreviewStats,
	calculateRegionStats,
	sortRegionsByCoordinates,
	type Region
} from '$lib/utils/world-grid-utils';

describe('world-grid-utils', () => {
	describe('calculateGridDimensions', () => {
		it('should return default 10x10 for empty regions', () => {
			expect(calculateGridDimensions([])).toEqual({
				cols: 10,
				rows: 10,
				minX: 0,
				maxX: 9,
				minY: 0,
				maxY: 9
			});
		});

		it('should return default 10x10 for null regions', () => {
			expect(calculateGridDimensions(null)).toEqual({
				cols: 10,
				rows: 10,
				minX: 0,
				maxX: 9,
				minY: 0,
				maxY: 9
			});
		});

		it('should return default 10x10 for undefined regions', () => {
			expect(calculateGridDimensions(undefined)).toEqual({
				cols: 10,
				rows: 10,
				minX: 0,
				maxX: 9,
				minY: 0,
				maxY: 9
			});
		});

		it('should return 10x10 when lazy load disabled', () => {
			const regions = [
				{ xCoord: 0, yCoord: 0 },
				{ xCoord: 2, yCoord: 2 }
			];
			expect(calculateGridDimensions(regions, false)).toEqual({
				cols: 10,
				rows: 10,
				minX: 0,
				maxX: 9,
				minY: 0,
				maxY: 9
			});
		});

		it('should calculate actual bounds when lazy load enabled', () => {
			const regions = [
				{ xCoord: 0, yCoord: 0 },
				{ xCoord: 2, yCoord: 2 }
			];
			expect(calculateGridDimensions(regions, true)).toEqual({
				cols: 3,
				rows: 3,
				minX: 0,
				maxX: 2,
				minY: 0,
				maxY: 2
			});
		});

		it('should handle non-zero starting coordinates', () => {
			const regions = [
				{ xCoord: 5, yCoord: 5 },
				{ xCoord: 7, yCoord: 9 }
			];
			expect(calculateGridDimensions(regions, true)).toEqual({
				cols: 5,
				rows: 3,
				minX: 5,
				maxX: 7,
				minY: 5,
				maxY: 9
			});
		});

		it('should handle single region', () => {
			const regions = [{ xCoord: 3, yCoord: 4 }];
			expect(calculateGridDimensions(regions, true)).toEqual({
				cols: 1,
				rows: 1,
				minX: 3,
				maxX: 3,
				minY: 4,
				maxY: 4
			});
		});

		it('should handle full 10x10 grid', () => {
			const regions: Region[] = [];
			for (let x = 0; x < 10; x++) {
				for (let y = 0; y < 10; y++) {
					regions.push({ xCoord: x, yCoord: y });
				}
			}
			expect(calculateGridDimensions(regions, true)).toEqual({
				cols: 10,
				rows: 10,
				minX: 0,
				maxX: 9,
				minY: 0,
				maxY: 9
			});
		});
	});

	describe('getGridColsClass', () => {
		it('should return correct class for valid column counts', () => {
			expect(getGridColsClass(3)).toBe('grid-cols-3');
			expect(getGridColsClass(4)).toBe('grid-cols-4');
			expect(getGridColsClass(5)).toBe('grid-cols-5');
			expect(getGridColsClass(6)).toBe('grid-cols-6');
			expect(getGridColsClass(7)).toBe('grid-cols-7');
			expect(getGridColsClass(8)).toBe('grid-cols-8');
			expect(getGridColsClass(9)).toBe('grid-cols-9');
			expect(getGridColsClass(10)).toBe('grid-cols-10');
		});

		it('should return default for invalid counts', () => {
			expect(getGridColsClass(0)).toBe('grid-cols-10');
			expect(getGridColsClass(1)).toBe('grid-cols-10');
			expect(getGridColsClass(2)).toBe('grid-cols-10');
			expect(getGridColsClass(11)).toBe('grid-cols-10');
			expect(getGridColsClass(100)).toBe('grid-cols-10');
		});

		it('should handle negative numbers', () => {
			expect(getGridColsClass(-1)).toBe('grid-cols-10');
		});
	});

	describe('getGridRowsClass', () => {
		it('should return correct class for valid row counts', () => {
			expect(getGridRowsClass(3)).toBe('grid-rows-3');
			expect(getGridRowsClass(4)).toBe('grid-rows-4');
			expect(getGridRowsClass(5)).toBe('grid-rows-5');
			expect(getGridRowsClass(6)).toBe('grid-rows-6');
			expect(getGridRowsClass(7)).toBe('grid-rows-7');
			expect(getGridRowsClass(8)).toBe('grid-rows-8');
			expect(getGridRowsClass(9)).toBe('grid-rows-9');
			expect(getGridRowsClass(10)).toBe('grid-rows-10');
		});

		it('should return default for invalid counts', () => {
			expect(getGridRowsClass(0)).toBe('grid-rows-10');
			expect(getGridRowsClass(1)).toBe('grid-rows-10');
			expect(getGridRowsClass(2)).toBe('grid-rows-10');
			expect(getGridRowsClass(11)).toBe('grid-rows-10');
			expect(getGridRowsClass(100)).toBe('grid-rows-10');
		});

		it('should handle negative numbers', () => {
			expect(getGridRowsClass(-1)).toBe('grid-rows-10');
		});
	});

	describe('calculatePreviewStats', () => {
		it('should calculate stats from elevation maps', () => {
			const regions = [
				{
					elevationMap: [
						[0.5, 0.3, -0.2],
						[0.1, -0.4, 0.7]
					]
				},
				{
					elevationMap: [
						[-0.5, 0.2],
						[0.6, -0.1]
					]
				}
			];

			const stats = calculatePreviewStats(regions);
			expect(stats).toEqual({
				totalTiles: 10,
				landTiles: 6,
				oceanTiles: 4
			});
		});

		it('should handle empty regions array', () => {
			const stats = calculatePreviewStats([]);
			expect(stats).toEqual({
				totalTiles: 0,
				landTiles: 0,
				oceanTiles: 0
			});
		});

		it('should handle regions without elevation maps', () => {
			const regions = [{}, { elevationMap: undefined }];
			const stats = calculatePreviewStats(regions);
			expect(stats).toEqual({
				totalTiles: 0,
				landTiles: 0,
				oceanTiles: 0
			});
		});

		it('should handle all land tiles', () => {
			const regions = [
				{
					elevationMap: [
						[0.1, 0.2],
						[0.3, 0.4]
					]
				}
			];
			const stats = calculatePreviewStats(regions);
			expect(stats).toEqual({
				totalTiles: 4,
				landTiles: 4,
				oceanTiles: 0
			});
		});

		it('should handle all ocean tiles', () => {
			const regions = [
				{
					elevationMap: [
						[-0.1, -0.2],
						[-0.3, -0.4]
					]
				}
			];
			const stats = calculatePreviewStats(regions);
			expect(stats).toEqual({
				totalTiles: 4,
				landTiles: 0,
				oceanTiles: 4
			});
		});

		it('should handle zero elevation (land)', () => {
			const regions = [
				{
					elevationMap: [[0, 0, 0]]
				}
			];
			const stats = calculatePreviewStats(regions);
			expect(stats).toEqual({
				totalTiles: 3,
				landTiles: 3,
				oceanTiles: 0
			});
		});

		it('should handle non-array elevation map', () => {
			const regions = [{ elevationMap: 'not an array' as any }];
			const stats = calculatePreviewStats(regions);
			expect(stats).toEqual({
				totalTiles: 0,
				landTiles: 0,
				oceanTiles: 0
			});
		});
	});

	describe('calculateRegionStats', () => {
		it('should calculate stats from tile arrays', () => {
			const regions = [
				{
					tiles: [
						{ type: 'LAND' },
						{ type: 'LAND' },
						{ type: 'OCEAN' },
						{ type: 'LAND' }
					]
				},
				{
					tiles: [
						{ type: 'OCEAN' },
						{ type: 'OCEAN' },
						{ type: 'LAND' }
					]
				}
			];

			const stats = calculateRegionStats(regions);
			expect(stats).toEqual({
				totalTiles: 7,
				landTiles: 4,
				oceanTiles: 3
			});
		});

		it('should handle empty regions array', () => {
			const stats = calculateRegionStats([]);
			expect(stats).toEqual({
				totalTiles: 0,
				landTiles: 0,
				oceanTiles: 0
			});
		});

		it('should handle regions with empty tile arrays', () => {
			const regions = [{ tiles: [] }, { tiles: [] }];
			const stats = calculateRegionStats(regions);
			expect(stats).toEqual({
				totalTiles: 0,
				landTiles: 0,
				oceanTiles: 0
			});
		});

		it('should handle all land tiles', () => {
			const regions = [
				{
					tiles: [{ type: 'LAND' }, { type: 'LAND' }, { type: 'LAND' }]
				}
			];
			const stats = calculateRegionStats(regions);
			expect(stats).toEqual({
				totalTiles: 3,
				landTiles: 3,
				oceanTiles: 0
			});
		});

		it('should handle all ocean tiles', () => {
			const regions = [
				{
					tiles: [{ type: 'OCEAN' }, { type: 'OCEAN' }]
				}
			];
			const stats = calculateRegionStats(regions);
			expect(stats).toEqual({
				totalTiles: 2,
				landTiles: 0,
				oceanTiles: 2
			});
		});

		it('should handle 100-tile regions', () => {
			const tiles = Array.from({ length: 100 }, (_, i) => ({
				type: i < 50 ? 'LAND' : 'OCEAN'
			}));
			const regions = [{ tiles }];
			const stats = calculateRegionStats(regions);
			expect(stats).toEqual({
				totalTiles: 100,
				landTiles: 50,
				oceanTiles: 50
			});
		});
	});

	describe('sortRegionsByCoordinates', () => {
		it('should sort regions in row-major order', () => {
			const regions = [
				{ xCoord: 1, yCoord: 1, name: 'B' },
				{ xCoord: 0, yCoord: 0, name: 'A' },
				{ xCoord: 1, yCoord: 0, name: 'C' },
				{ xCoord: 0, yCoord: 1, name: 'D' }
			];

			const sorted = sortRegionsByCoordinates(regions);

			expect(sorted.map((r) => r.name)).toEqual(['A', 'D', 'C', 'B']);
		});

		it('should not mutate original array', () => {
			const regions = [
				{ xCoord: 1, yCoord: 0 },
				{ xCoord: 0, yCoord: 0 }
			];
			const original = [...regions];

			sortRegionsByCoordinates(regions);

			expect(regions).toEqual(original);
		});

		it('should handle empty array', () => {
			const sorted = sortRegionsByCoordinates([]);
			expect(sorted).toEqual([]);
		});

		it('should handle single region', () => {
			const regions = [{ xCoord: 5, yCoord: 5 }];
			const sorted = sortRegionsByCoordinates(regions);
			expect(sorted).toEqual(regions);
		});

		it('should sort by x first, then y', () => {
			const regions = [
				{ xCoord: 2, yCoord: 0 },
				{ xCoord: 1, yCoord: 9 },
				{ xCoord: 1, yCoord: 0 },
				{ xCoord: 0, yCoord: 5 }
			];

			const sorted = sortRegionsByCoordinates(regions);

			expect(sorted[0]).toEqual({ xCoord: 0, yCoord: 5 });
			expect(sorted[1]).toEqual({ xCoord: 1, yCoord: 0 });
			expect(sorted[2]).toEqual({ xCoord: 1, yCoord: 9 });
			expect(sorted[3]).toEqual({ xCoord: 2, yCoord: 0 });
		});

		it('should handle negative coordinates', () => {
			const regions = [
				{ xCoord: 0, yCoord: 0 },
				{ xCoord: -1, yCoord: -1 },
				{ xCoord: -1, yCoord: 0 }
			];

			const sorted = sortRegionsByCoordinates(regions);

			expect(sorted[0]).toEqual({ xCoord: -1, yCoord: -1 });
			expect(sorted[1]).toEqual({ xCoord: -1, yCoord: 0 });
			expect(sorted[2]).toEqual({ xCoord: 0, yCoord: 0 });
		});

		it('should preserve extra properties', () => {
			const regions = [
				{ xCoord: 1, yCoord: 0, id: '2', name: 'Region 2' },
				{ xCoord: 0, yCoord: 0, id: '1', name: 'Region 1' }
			];

			const sorted = sortRegionsByCoordinates(regions);

			expect(sorted[0]).toEqual({ xCoord: 0, yCoord: 0, id: '1', name: 'Region 1' });
			expect(sorted[1]).toEqual({ xCoord: 1, yCoord: 0, id: '2', name: 'Region 2' });
		});
	});
});
