import { describe, it, expect } from 'vitest';
import { getRegionStats, formatRegionTileTooltip } from '../../../src/lib/utils/region-stats';
import type { RegionStats } from '@uncharted-lands/shared';

describe('Region Statistics Utilities', () => {
	describe('getRegionStats', () => {
		it('should return zeros for null elevation map', () => {
			const stats = getRegionStats(null);
			expect(stats.avgElevation).toBe(0);
			expect(stats.minElevation).toBe(0);
			expect(stats.maxElevation).toBe(0);
		});

		it('should return zeros for undefined elevation map', () => {
			const stats = getRegionStats(undefined);
			expect(stats.avgElevation).toBe(0);
			expect(stats.minElevation).toBe(0);
			expect(stats.maxElevation).toBe(0);
		});

		it('should return zeros for empty array', () => {
			const stats = getRegionStats([]);
			expect(stats.avgElevation).toBe(0);
			expect(stats.minElevation).toBe(0);
			expect(stats.maxElevation).toBe(0);
		});

		it('should return zeros for array of empty arrays', () => {
			const stats = getRegionStats([[], [], []]);
			expect(stats.avgElevation).toBe(0);
			expect(stats.minElevation).toBe(0);
			expect(stats.maxElevation).toBe(0);
		});

		it('should calculate stats for 1x1 elevation map', () => {
			const elevationMap = [[0.5]];
			const stats = getRegionStats(elevationMap);

			expect(stats.avgElevation).toBe(0.5);
			expect(stats.minElevation).toBe(0.5);
			expect(stats.maxElevation).toBe(0.5);
		});

		it('should calculate stats for 2x2 elevation map', () => {
			const elevationMap = [
				[0.1, 0.2],
				[0.3, 0.4]
			];
			const stats = getRegionStats(elevationMap);

			expect(stats.avgElevation).toBe(0.25); // (0.1 + 0.2 + 0.3 + 0.4) / 4
			expect(stats.minElevation).toBe(0.1);
			expect(stats.maxElevation).toBe(0.4);
		});

		it('should calculate stats for 3x3 elevation map', () => {
			const elevationMap = [
				[0, 0.2, 0.4],
				[0.1, 0.3, 0.5],
				[0.2, 0.4, 0.6]
			];
			const stats = getRegionStats(elevationMap);

			expect(stats.avgElevation).toBeCloseTo(0.3, 5); // Sum: 2.7 / 9
			expect(stats.minElevation).toBe(0);
			expect(stats.maxElevation).toBe(0.6);
		});

		it('should handle negative elevations (ocean)', () => {
			const elevationMap = [
				[-0.5, -0.2],
				[-0.3, 0.1]
			];
			const stats = getRegionStats(elevationMap);

			expect(stats.avgElevation).toBe(-0.225); // (-0.5 - 0.2 - 0.3 + 0.1) / 4
			expect(stats.minElevation).toBe(-0.5);
			expect(stats.maxElevation).toBe(0.1);
		});

		it('should handle all negative elevations', () => {
			const elevationMap = [
				[-0.8, -0.6],
				[-0.4, -0.2]
			];
			const stats = getRegionStats(elevationMap);

			expect(stats.avgElevation).toBeCloseTo(-0.5, 10);
			expect(stats.minElevation).toBe(-0.8);
			expect(stats.maxElevation).toBe(-0.2);
		});
		it('should handle all zero elevations', () => {
			const elevationMap = [
				[0, 0],
				[0, 0]
			];
			const stats = getRegionStats(elevationMap);

			expect(stats.avgElevation).toBe(0);
			expect(stats.minElevation).toBe(0);
			expect(stats.maxElevation).toBe(0);
		});

		it('should handle large elevation values', () => {
			const elevationMap = [
				[1, 2],
				[3, 4]
			];
			const stats = getRegionStats(elevationMap);

			expect(stats.avgElevation).toBe(2.5);
			expect(stats.minElevation).toBe(1);
			expect(stats.maxElevation).toBe(4);
		});

		it('should handle non-square elevation maps', () => {
			const elevationMap = [
				[0.1, 0.2, 0.3],
				[0.4, 0.5, 0.6]
			];
			const stats = getRegionStats(elevationMap);

			expect(stats.avgElevation).toBeCloseTo(0.35, 5); // 2.1 / 6
			expect(stats.minElevation).toBe(0.1);
			expect(stats.maxElevation).toBe(0.6);
		});

		it('should filter out NaN values', () => {
			const elevationMap = [
				[0.1, Number.NaN],
				[0.3, 0.4]
			];
			const stats = getRegionStats(elevationMap); // Should calculate with only valid numbers: (0.1 + 0.3 + 0.4) / 3
			expect(stats.avgElevation).toBeCloseTo(0.267, 2);
			expect(stats.minElevation).toBe(0.1);
			expect(stats.maxElevation).toBe(0.4);
		});
	});

	describe('formatRegionTileTooltip', () => {
		const baseStats: RegionStats = {
			avgElevation: 0.456,
			minElevation: -0.2,
			maxElevation: 0.8,
			landTiles: 0,
			oceanTiles: 0
		};

		it('should format complete tooltip with all information', () => {
			const tooltip = formatRegionTileTooltip({
				regionName: 'Test Region',
				regionX: 5,
				regionY: 10,
				tileRow: 2,
				tileCol: 3,
				elevation: 0.65,
				terrainType: 'Hills',
				stats: baseStats
			});

			expect(tooltip).toContain('Region: Test Region (5, 10)');
			expect(tooltip).toContain('Region Avg Elevation: 0.456');
			expect(tooltip).toContain('Region Range: -0.20 to 0.80');
			expect(tooltip).toContain('Tile: (2, 3)');
			expect(tooltip).toContain('Tile Elevation: 0.650');
			expect(tooltip).toContain('Terrain Type: Hills');
		});

		it('should handle empty region name', () => {
			const tooltip = formatRegionTileTooltip({
				regionName: '',
				regionX: 0,
				regionY: 0,
				tileRow: 0,
				tileCol: 0,
				elevation: 0,
				terrainType: 'Ocean',
				stats: {
					avgElevation: 0,
					minElevation: 0,
					maxElevation: 0,
					landTiles: 0,
					oceanTiles: 0
				}
			});

			expect(tooltip).toContain('Region: Unknown (0, 0)');
		});

		it('should format numbers with correct precision', () => {
			const tooltip = formatRegionTileTooltip({
				regionName: 'Test',
				regionX: 1,
				regionY: 1,
				tileRow: 0,
				tileCol: 0,
				elevation: 0.123456789,
				terrainType: 'Plains',
				stats: {
					avgElevation: 0.987654321,
					minElevation: -0.555555555,
					maxElevation: 1.111111111,
					landTiles: 0,
					oceanTiles: 0
				}
			});

			// Average elevation: 3 decimals
			expect(tooltip).toContain('0.988');

			// Range: 2 decimals
			expect(tooltip).toContain('-0.56');
			expect(tooltip).toContain('1.11');

			// Tile elevation: 3 decimals
			expect(tooltip).toContain('0.123');
		});

		it('should handle negative elevations in tooltip', () => {
			const tooltip = formatRegionTileTooltip({
				regionName: 'Ocean Region',
				regionX: 3,
				regionY: 4,
				tileRow: 5,
				tileCol: 6,
				elevation: -0.45,
				terrainType: 'Deep Ocean',
				stats: {
					avgElevation: -0.3,
					minElevation: -0.8,
					maxElevation: -0.1,
					landTiles: 0,
					oceanTiles: 0
				}
			});

			expect(tooltip).toContain('Tile Elevation: -0.450');
			expect(tooltip).toContain('Region Avg Elevation: -0.300');
			expect(tooltip).toContain('Region Range: -0.80 to -0.10');
		});

		it('should handle zero values', () => {
			const tooltip = formatRegionTileTooltip({
				regionName: 'Sea Level Region',
				regionX: 0,
				regionY: 0,
				tileRow: 0,
				tileCol: 0,
				elevation: 0,
				terrainType: 'Beach',
				stats: {
					avgElevation: 0,
					minElevation: 0,
					maxElevation: 0,
					landTiles: 0,
					oceanTiles: 0
				}
			});

			expect(tooltip).toContain('Tile Elevation: 0.000');
			expect(tooltip).toContain('Region Avg Elevation: 0.000');
			expect(tooltip).toContain('Region Range: 0.00 to 0.00');
		});

		it('should preserve terrain type exactly', () => {
			const terrainTypes = ['Ocean', 'Beach', 'Plains', 'Hills', 'Mountains', 'Snow Peaks'];

			for (const terrainType of terrainTypes) {
				const tooltip = formatRegionTileTooltip({
					regionName: 'Test',
					regionX: 0,
					regionY: 0,
					tileRow: 0,
					tileCol: 0,
					elevation: 0,
					terrainType,
					stats: baseStats
				});

				expect(tooltip).toContain(`Terrain Type: ${terrainType}`);
			}
		});
	});
});
