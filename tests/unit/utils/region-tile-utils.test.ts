import { describe, it, expect } from 'vitest';
import {
	getRegionTileTooltip,
	calculateRegionStats,
	type TileData
} from '../../../src/lib/utils/region-tile-utils';

describe('region-tile-utils', () => {
	describe('getRegionTileTooltip', () => {
		it('should format complete tooltip with all data', () => {
			const tile: TileData = {
				elevation: 0.456,
				precipitation: 0.678,
				temperature: 0.543,
				type: 'LAND',
				Biome: { name: 'Temperate Forest' },
				Plots: [{ Settlement: { id: '1' } }]
			};

			const result = getRegionTileTooltip(tile, 3, 7);

			expect(result).toContain('Tile Position: (3, 7)');
			expect(result).toContain('Biome: Temperate Forest');
			expect(result).toContain('Type: LAND');
			expect(result).toContain('Elevation: 0.456');
			expect(result).toContain('Terrain: Forest');
			expect(result).toContain('Precipitation: 0.678');
			expect(result).toContain('Temperature: 0.543');
			expect(result).toContain('Plots: 1');
			expect(result).toContain('🏠 Has Settlement');
		});

		it('should format tooltip without biome', () => {
			const tile: TileData = {
				elevation: 0.2,
				precipitation: 0.5,
				temperature: 0.6,
				type: 'LAND',
				Biome: null,
				Plots: []
			};

			const result = getRegionTileTooltip(tile, 0, 0);

			expect(result).toContain('Biome: Unknown');
		});

		it('should format tooltip without plots', () => {
			const tile: TileData = {
				elevation: 0.1,
				precipitation: 0.3,
				temperature: 0.4,
				type: 'OCEAN',
				Biome: { name: 'Deep Ocean' }
			};

			const result = getRegionTileTooltip(tile, 5, 5);

			expect(result).toContain('Plots: 0');
			expect(result).not.toContain('🏠 Has Settlement');
		});

		it('should show settlement indicator when settlement exists', () => {
			const tile: TileData = {
				elevation: 0.5,
				precipitation: 0.6,
				temperature: 0.7,
				type: 'LAND',
				Biome: { name: 'Grassland' },
				Plots: [
					{ Settlement: undefined },
					{ Settlement: { id: '123' } }
				]
			};

			const result = getRegionTileTooltip(tile, 2, 3);

			expect(result).toContain('Plots: 2');
			expect(result).toContain('🏠 Has Settlement');
		});

		it('should not show settlement indicator when no settlements', () => {
			const tile: TileData = {
				elevation: 0.4,
				precipitation: 0.5,
				temperature: 0.6,
				type: 'LAND',
				Biome: { name: 'Plains' },
				Plots: [
					{ Settlement: undefined },
					{ Settlement: undefined }
				]
			};

			const result = getRegionTileTooltip(tile, 1, 1);

			expect(result).toContain('Plots: 2');
			expect(result).not.toContain('🏠 Has Settlement');
		});

		it('should format ocean tile correctly', () => {
			const tile: TileData = {
				elevation: -0.5,
				precipitation: 0.8,
				temperature: 0.3,
				type: 'OCEAN',
				Biome: { name: 'Deep Ocean' },
				Plots: []
			};

			const result = getRegionTileTooltip(tile, 9, 9);

			expect(result).toContain('Type: OCEAN');
			expect(result).toContain('Terrain: Deep Ocean');
		});

		it('should format numbers to 3 decimal places', () => {
			const tile: TileData = {
				elevation: 0.123456,
				precipitation: 0.987654,
				temperature: 0.555555,
				type: 'LAND',
				Biome: { name: 'Test' },
				Plots: []
			};

			const result = getRegionTileTooltip(tile, 0, 0);

			expect(result).toContain('Elevation: 0.123');
			expect(result).toContain('Precipitation: 0.988');
			expect(result).toContain('Temperature: 0.556');
		});

		it('should handle zero coordinates', () => {
			const tile: TileData = {
				elevation: 0.5,
				precipitation: 0.5,
				temperature: 0.5,
				type: 'LAND',
				Biome: { name: 'Test' }
			};

			const result = getRegionTileTooltip(tile, 0, 0);

			expect(result).toContain('Tile Position: (0, 0)');
		});

		it('should handle large coordinates', () => {
			const tile: TileData = {
				elevation: 0.5,
				precipitation: 0.5,
				temperature: 0.5,
				type: 'LAND',
				Biome: { name: 'Test' }
			};

			const result = getRegionTileTooltip(tile, 99, 99);

			expect(result).toContain('Tile Position: (99, 99)');
		});

		it('should maintain multiline format', () => {
			const tile: TileData = {
				elevation: 0.5,
				precipitation: 0.5,
				temperature: 0.5,
				type: 'LAND',
				Biome: { name: 'Test' }
			};

			const result = getRegionTileTooltip(tile, 0, 0);
			const lines = result.split('\n');

			expect(lines.length).toBeGreaterThan(8);
		});
	});

	describe('calculateRegionStats', () => {
		it('should calculate stats for mixed tiles', () => {
			const tiles: TileData[] = [
				{ elevation: 0.5, precipitation: 0.5, temperature: 0.5, type: 'LAND' },
				{ elevation: 0.6, precipitation: 0.5, temperature: 0.5, type: 'LAND' },
				{ elevation: -0.2, precipitation: 0.5, temperature: 0.5, type: 'OCEAN' },
				{ elevation: -0.5, precipitation: 0.5, temperature: 0.5, type: 'OCEAN' }
			];

			const result = calculateRegionStats(tiles);

			expect(result.avgElevation).toBeCloseTo(0.1, 2);
			expect(result.minElevation).toBe(-0.5);
			expect(result.maxElevation).toBe(0.6);
			expect(result.landTiles).toBe(2);
			expect(result.oceanTiles).toBe(2);
		});

		it('should handle all land tiles', () => {
			const tiles: TileData[] = [
				{ elevation: 0.3, precipitation: 0.5, temperature: 0.5, type: 'LAND' },
				{ elevation: 0.5, precipitation: 0.5, temperature: 0.5, type: 'LAND' },
				{ elevation: 0.7, precipitation: 0.5, temperature: 0.5, type: 'LAND' }
			];

			const result = calculateRegionStats(tiles);

			expect(result.avgElevation).toBeCloseTo(0.5, 2);
			expect(result.minElevation).toBe(0.3);
			expect(result.maxElevation).toBe(0.7);
			expect(result.landTiles).toBe(3);
			expect(result.oceanTiles).toBe(0);
		});

		it('should handle all ocean tiles', () => {
			const tiles: TileData[] = [
				{ elevation: -0.8, precipitation: 0.5, temperature: 0.5, type: 'OCEAN' },
				{ elevation: -0.5, precipitation: 0.5, temperature: 0.5, type: 'OCEAN' },
				{ elevation: -0.2, precipitation: 0.5, temperature: 0.5, type: 'OCEAN' }
			];

			const result = calculateRegionStats(tiles);

			expect(result.avgElevation).toBeCloseTo(-0.5, 2);
			expect(result.minElevation).toBe(-0.8);
			expect(result.maxElevation).toBe(-0.2);
			expect(result.landTiles).toBe(0);
			expect(result.oceanTiles).toBe(3);
		});

		it('should return zeros for empty array', () => {
			const result = calculateRegionStats([]);

			expect(result.avgElevation).toBe(0);
			expect(result.minElevation).toBe(0);
			expect(result.maxElevation).toBe(0);
			expect(result.landTiles).toBe(0);
			expect(result.oceanTiles).toBe(0);
		});

		it('should handle single tile', () => {
			const tiles: TileData[] = [
				{ elevation: 0.456, precipitation: 0.5, temperature: 0.5, type: 'LAND' }
			];

			const result = calculateRegionStats(tiles);

			expect(result.avgElevation).toBe(0.456);
			expect(result.minElevation).toBe(0.456);
			expect(result.maxElevation).toBe(0.456);
			expect(result.landTiles).toBe(1);
			expect(result.oceanTiles).toBe(0);
		});

		it('should handle extreme elevation values', () => {
			const tiles: TileData[] = [
				{ elevation: -1, precipitation: 0.5, temperature: 0.5, type: 'OCEAN' },
				{ elevation: 1, precipitation: 0.5, temperature: 0.5, type: 'LAND' }
			];

			const result = calculateRegionStats(tiles);

			expect(result.avgElevation).toBe(0);
			expect(result.minElevation).toBe(-1);
			expect(result.maxElevation).toBe(1);
		});

		it('should handle 100 tiles (typical region)', () => {
			const tiles: TileData[] = Array.from({ length: 100 }, (_, i) => ({
				elevation: (i / 100) - 0.5, // Range from -0.5 to 0.495
				precipitation: 0.5,
				temperature: 0.5,
				type: i < 50 ? 'OCEAN' : 'LAND'
			}));

			const result = calculateRegionStats(tiles);

			expect(result.avgElevation).toBeCloseTo(-0.005, 2);
			expect(result.minElevation).toBe(-0.5);
			expect(result.landTiles).toBe(50);
			expect(result.oceanTiles).toBe(50);
		});

		it('should handle identical elevations', () => {
			const tiles: TileData[] = [
				{ elevation: 0.5, precipitation: 0.5, temperature: 0.5, type: 'LAND' },
				{ elevation: 0.5, precipitation: 0.5, temperature: 0.5, type: 'LAND' },
				{ elevation: 0.5, precipitation: 0.5, temperature: 0.5, type: 'LAND' }
			];

			const result = calculateRegionStats(tiles);

			expect(result.avgElevation).toBe(0.5);
			expect(result.minElevation).toBe(0.5);
			expect(result.maxElevation).toBe(0.5);
		});

		it('should handle zero elevation', () => {
			const tiles: TileData[] = [
				{ elevation: 0, precipitation: 0.5, temperature: 0.5, type: 'LAND' }
			];

			const result = calculateRegionStats(tiles);

			expect(result.avgElevation).toBe(0);
			expect(result.minElevation).toBe(0);
			expect(result.maxElevation).toBe(0);
		});
	});
});
