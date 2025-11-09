import { describe, it, expect } from 'vitest';
import {
	getTileColor,
	getOceanColor,
	getBeachColor,
	getElevationFallbackColor,
	BIOME_COLORS,
} from '../../../src/lib/utils/tile-colors';

describe('Tile Color Utilities', () => {
	describe('BIOME_COLORS', () => {
		it('should have all expected biome colors', () => {
			expect(BIOME_COLORS.TUNDRA).toBe('rgb(220, 225, 240)');
			expect(BIOME_COLORS.FOREST_BOREAL).toBe('rgb(45, 100, 60)');
			expect(BIOME_COLORS.FOREST_TEMPERATE_SEASONAL).toBe('rgb(60, 130, 50)');
			expect(BIOME_COLORS.FOREST_TROPICAL_SEASONAL).toBe('rgb(50, 140, 70)');
			expect(BIOME_COLORS.RAINFOREST_TEMPERATE).toBe('rgb(40, 110, 55)');
			expect(BIOME_COLORS.RAINFOREST_TROPICAL).toBe('rgb(30, 130, 60)');
			expect(BIOME_COLORS.WOODLAND).toBe('rgb(90, 140, 70)');
			expect(BIOME_COLORS.SHRUBLAND).toBe('rgb(140, 160, 90)');
			expect(BIOME_COLORS.SAVANNA).toBe('rgb(200, 170, 80)');
			expect(BIOME_COLORS.GRASSLAND_TEMPERATE).toBe('rgb(120, 180, 80)');
			expect(BIOME_COLORS.DESERT_COLD).toBe('rgb(190, 180, 160)');
			expect(BIOME_COLORS.DESERT_SUBTROPICAL).toBe('rgb(230, 200, 140)');
		});

		it('should have 12 biome types', () => {
			expect(Object.keys(BIOME_COLORS)).toHaveLength(12);
		});

		it('should have valid RGB format for all colors', () => {
			const rgbRegex = /^rgb\(\d{1,3}, \d{1,3}, \d{1,3}\)$/;
			for (const color of Object.values(BIOME_COLORS)) {
				expect(rgbRegex.test(color)).toBe(true);
			}
		});
	});

	describe('getOceanColor', () => {
		it('should return deep ocean color for very low elevation', () => {
			expect(getOceanColor(-0.5)).toBe('rgb(0, 26, 51)');
			expect(getOceanColor(-0.4)).toBe('rgb(0, 26, 51)');
			expect(getOceanColor(-0.36)).toBe('rgb(0, 26, 51)');
		});

		it('should return shallow ocean color for higher negative elevation', () => {
			expect(getOceanColor(-0.34)).toBe('rgb(0, 61, 102)');
			expect(getOceanColor(-0.2)).toBe('rgb(0, 61, 102)');
			expect(getOceanColor(-0.1)).toBe('rgb(0, 61, 102)');
			expect(getOceanColor(-0.01)).toBe('rgb(0, 61, 102)');
		});

		it('should handle boundary at -0.35', () => {
			expect(getOceanColor(-0.35)).toBe('rgb(0, 61, 102)');
			expect(getOceanColor(-0.350001)).toBe('rgb(0, 26, 51)');
		});
	});

	describe('getBeachColor', () => {
		it('should always return sandy beach color', () => {
			expect(getBeachColor()).toBe('rgb(244, 228, 193)');
		});
	});

	describe('getElevationFallbackColor', () => {
		it('should return mountain gray for high elevation', () => {
			expect(getElevationFallbackColor(0.71)).toBe('rgb(150, 150, 150)');
			expect(getElevationFallbackColor(0.8)).toBe('rgb(150, 150, 150)');
			expect(getElevationFallbackColor(0.9)).toBe('rgb(150, 150, 150)');
			expect(getElevationFallbackColor(1)).toBe('rgb(150, 150, 150)');
		});

		it('should return default green for normal elevation', () => {
			expect(getElevationFallbackColor(0)).toBe('rgb(100, 140, 80)');
			expect(getElevationFallbackColor(0.3)).toBe('rgb(100, 140, 80)');
			expect(getElevationFallbackColor(0.5)).toBe('rgb(100, 140, 80)');
			expect(getElevationFallbackColor(0.69)).toBe('rgb(100, 140, 80)');
		});

		it('should handle boundary at 0.7', () => {
			expect(getElevationFallbackColor(0.7)).toBe('rgb(100, 140, 80)');
			expect(getElevationFallbackColor(0.700001)).toBe('rgb(150, 150, 150)');
		});
	});

	describe('getTileColor', () => {
		describe('Ocean tiles', () => {
			it('should return deep ocean color for OCEAN type with low elevation', () => {
				expect(getTileColor(-0.5, 'GRASSLAND_TEMPERATE', 'OCEAN')).toBe('rgb(0, 26, 51)');
				expect(getTileColor(-0.4, 'FOREST_BOREAL', 'OCEAN')).toBe('rgb(0, 26, 51)');
			});

			it('should return shallow ocean color for OCEAN type with higher elevation', () => {
				expect(getTileColor(-0.2, 'TUNDRA', 'OCEAN')).toBe('rgb(0, 61, 102)');
				expect(getTileColor(-0.1, 'SAVANNA', 'OCEAN')).toBe('rgb(0, 61, 102)');
			});

			it('should return ocean color for negative elevation regardless of type', () => {
				expect(getTileColor(-0.1, 'GRASSLAND_TEMPERATE', 'LAND')).toBe('rgb(0, 61, 102)');
				expect(getTileColor(-0.5, 'DESERT_COLD', 'LAND')).toBe('rgb(0, 26, 51)');
			});
		});

		describe('Beach/Coastal tiles', () => {
			it('should return beach color for low elevation land', () => {
				expect(getTileColor(0, 'GRASSLAND_TEMPERATE', 'LAND')).toBe('rgb(244, 228, 193)');
				expect(getTileColor(0.05, 'FOREST_BOREAL', 'LAND')).toBe('rgb(244, 228, 193)');
				expect(getTileColor(0.1, 'DESERT_COLD', 'LAND')).toBe('rgb(244, 228, 193)');
				expect(getTileColor(0.14, 'SAVANNA', 'LAND')).toBe('rgb(244, 228, 193)');
			});

			it('should not return beach color at boundary 0.15', () => {
				expect(getTileColor(0.15, 'GRASSLAND_TEMPERATE', 'LAND')).not.toBe('rgb(244, 228, 193)');
			});
		});

		describe('Biome-based colors', () => {
			it('should return correct color for TUNDRA', () => {
				expect(getTileColor(0.3, 'TUNDRA', 'LAND')).toBe(BIOME_COLORS.TUNDRA);
			});

			it('should return correct color for forest biomes', () => {
				expect(getTileColor(0.4, 'FOREST_BOREAL', 'LAND')).toBe(BIOME_COLORS.FOREST_BOREAL);
				expect(getTileColor(0.4, 'FOREST_TEMPERATE_SEASONAL', 'LAND')).toBe(
					BIOME_COLORS.FOREST_TEMPERATE_SEASONAL
				);
				expect(getTileColor(0.4, 'FOREST_TROPICAL_SEASONAL', 'LAND')).toBe(
					BIOME_COLORS.FOREST_TROPICAL_SEASONAL
				);
			});

			it('should return correct color for rainforest biomes', () => {
				expect(getTileColor(0.5, 'RAINFOREST_TEMPERATE', 'LAND')).toBe(
					BIOME_COLORS.RAINFOREST_TEMPERATE
				);
				expect(getTileColor(0.5, 'RAINFOREST_TROPICAL', 'LAND')).toBe(
					BIOME_COLORS.RAINFOREST_TROPICAL
				);
			});

			it('should return correct color for grassland biomes', () => {
				expect(getTileColor(0.3, 'WOODLAND', 'LAND')).toBe(BIOME_COLORS.WOODLAND);
				expect(getTileColor(0.3, 'SHRUBLAND', 'LAND')).toBe(BIOME_COLORS.SHRUBLAND);
				expect(getTileColor(0.3, 'SAVANNA', 'LAND')).toBe(BIOME_COLORS.SAVANNA);
				expect(getTileColor(0.3, 'GRASSLAND_TEMPERATE', 'LAND')).toBe(
					BIOME_COLORS.GRASSLAND_TEMPERATE
				);
			});

			it('should return correct color for desert biomes', () => {
				expect(getTileColor(0.3, 'DESERT_COLD', 'LAND')).toBe(BIOME_COLORS.DESERT_COLD);
				expect(getTileColor(0.3, 'DESERT_SUBTROPICAL', 'LAND')).toBe(
					BIOME_COLORS.DESERT_SUBTROPICAL
				);
			});
		});

		describe('Fallback colors', () => {
			it('should use elevation-based fallback for unknown biome at low elevation', () => {
				expect(getTileColor(0.3, 'UNKNOWN_BIOME', 'LAND')).toBe('rgb(100, 140, 80)');
			});

			it('should use elevation-based fallback for unknown biome at high elevation', () => {
				expect(getTileColor(0.8, 'UNKNOWN_BIOME', 'LAND')).toBe('rgb(150, 150, 150)');
			});

			it('should handle empty string biome name', () => {
				expect(getTileColor(0.5, '', 'LAND')).toBe('rgb(100, 140, 80)');
			});
		});

		describe('Edge cases', () => {
			it('should handle exact boundary values', () => {
				// Ocean/Beach boundary
				expect(getTileColor(0, 'GRASSLAND_TEMPERATE', 'LAND')).toBe('rgb(244, 228, 193)');
				expect(getTileColor(-0.001, 'GRASSLAND_TEMPERATE', 'LAND')).toBe('rgb(0, 61, 102)');

				// Beach/Biome boundary
				expect(getTileColor(0.15, 'GRASSLAND_TEMPERATE', 'LAND')).toBe(
					BIOME_COLORS.GRASSLAND_TEMPERATE
				);
				expect(getTileColor(0.149, 'GRASSLAND_TEMPERATE', 'LAND')).toBe('rgb(244, 228, 193)');
			});

			it('should handle extreme elevation values', () => {
				expect(getTileColor(-10, 'TUNDRA', 'OCEAN')).toBe('rgb(0, 26, 51)');
				expect(getTileColor(10, 'UNKNOWN', 'LAND')).toBe('rgb(150, 150, 150)');
			});
		});
	});
});
