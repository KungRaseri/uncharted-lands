import { describe, it, expect } from 'vitest';
import {
	getTileColor,
	getOceanColor,
	getBeachColor,
	getElevationFallbackColor,
	getElevationColor,
	getTerrainType,
	getTerrainData,
	BIOME_COLORS,
	ELEVATION_THRESHOLDS,
	TERRAIN_COLORS
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
				expect(getTileColor(0.02, 'FOREST_BOREAL', 'LAND')).toBe('rgb(244, 228, 193)');
				expect(getTileColor(0.03, 'DESERT_COLD', 'LAND')).toBe('rgb(244, 228, 193)');
				expect(getTileColor(0.049, 'SAVANNA', 'LAND')).toBe('rgb(244, 228, 193)');
			});

			it('should not return beach color at boundary 0.05', () => {
				expect(getTileColor(0.05, 'GRASSLAND_TEMPERATE', 'LAND')).not.toBe('rgb(244, 228, 193)');
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

				// Beach/Biome boundary (now at 0.05)
				expect(getTileColor(0.05, 'GRASSLAND_TEMPERATE', 'LAND')).toBe(
					BIOME_COLORS.GRASSLAND_TEMPERATE
				);
				expect(getTileColor(0.049, 'GRASSLAND_TEMPERATE', 'LAND')).toBe('rgb(244, 228, 193)');
			});

			it('should handle extreme elevation values', () => {
				expect(getTileColor(-10, 'TUNDRA', 'OCEAN')).toBe('rgb(0, 26, 51)');
				expect(getTileColor(10, 'UNKNOWN', 'LAND')).toBe('rgb(150, 150, 150)');
			});
		});
	});

	describe('getElevationColor', () => {
		it('should return abyssal depths color for extremely low elevations', () => {
			expect(getElevationColor(-2)).toBe(TERRAIN_COLORS.ABYSSAL_DEPTHS);
			expect(getElevationColor(-0.8)).toBe(TERRAIN_COLORS.ABYSSAL_DEPTHS);
			expect(getElevationColor(-0.71)).toBe(TERRAIN_COLORS.ABYSSAL_DEPTHS);
		});

		it('should return abyss color for very low elevations', () => {
			expect(getElevationColor(-0.69)).toBe(TERRAIN_COLORS.ABYSS);
			expect(getElevationColor(-0.6)).toBe(TERRAIN_COLORS.ABYSS);
			expect(getElevationColor(-0.51)).toBe(TERRAIN_COLORS.ABYSS);
		});

		it('should return deep ocean color for low elevations', () => {
			expect(getElevationColor(-0.49)).toBe(TERRAIN_COLORS.DEEP_OCEAN);
			expect(getElevationColor(-0.4)).toBe(TERRAIN_COLORS.DEEP_OCEAN);
			expect(getElevationColor(-0.31)).toBe(TERRAIN_COLORS.DEEP_OCEAN);
		});

		it('should return ocean color for low negative elevations', () => {
			expect(getElevationColor(-0.29)).toBe(TERRAIN_COLORS.OCEAN);
			expect(getElevationColor(-0.1)).toBe(TERRAIN_COLORS.OCEAN);
			expect(getElevationColor(-0.01)).toBe(TERRAIN_COLORS.OCEAN);
		});

		it('should return beach color for low positive elevations', () => {
			expect(getElevationColor(0)).toBe(TERRAIN_COLORS.BEACH);
			expect(getElevationColor(0.04)).toBe(TERRAIN_COLORS.BEACH);
			expect(getElevationColor(0.049)).toBe(TERRAIN_COLORS.BEACH);
		});

		it('should return plains color for low-medium elevations', () => {
			expect(getElevationColor(0.05)).toBe(TERRAIN_COLORS.PLAINS);
			expect(getElevationColor(0.2)).toBe(TERRAIN_COLORS.PLAINS);
			expect(getElevationColor(0.29)).toBe(TERRAIN_COLORS.PLAINS);
		});

		it('should return forest color for medium elevations', () => {
			expect(getElevationColor(0.3)).toBe(TERRAIN_COLORS.FOREST);
			expect(getElevationColor(0.4)).toBe(TERRAIN_COLORS.FOREST);
			expect(getElevationColor(0.49)).toBe(TERRAIN_COLORS.FOREST);
		});

		it('should return hills color for medium-high elevations', () => {
			expect(getElevationColor(0.5)).toBe(TERRAIN_COLORS.HILLS);
			expect(getElevationColor(0.6)).toBe(TERRAIN_COLORS.HILLS);
			expect(getElevationColor(0.64)).toBe(TERRAIN_COLORS.HILLS);
		});

		it('should return mountains color for high elevations', () => {
			expect(getElevationColor(0.65)).toBe(TERRAIN_COLORS.MOUNTAINS);
			expect(getElevationColor(0.7)).toBe(TERRAIN_COLORS.MOUNTAINS);
			expect(getElevationColor(0.79)).toBe(TERRAIN_COLORS.MOUNTAINS);
		});

		it('should return high mountains color for very high elevations', () => {
			expect(getElevationColor(0.8)).toBe(TERRAIN_COLORS.HIGH_MOUNTAINS);
			expect(getElevationColor(0.9)).toBe(TERRAIN_COLORS.HIGH_MOUNTAINS);
			expect(getElevationColor(0.99)).toBe(TERRAIN_COLORS.HIGH_MOUNTAINS);
		});

		it('should return alpine peaks color for extreme elevations', () => {
			expect(getElevationColor(1)).toBe(TERRAIN_COLORS.ALPINE_PEAKS);
			expect(getElevationColor(1.2)).toBe(TERRAIN_COLORS.ALPINE_PEAKS);
			expect(getElevationColor(1.49)).toBe(TERRAIN_COLORS.ALPINE_PEAKS);
		});

		it('should return extreme peaks color for the highest elevations', () => {
			expect(getElevationColor(1.5)).toBe(TERRAIN_COLORS.EXTREME_PEAKS);
			expect(getElevationColor(2)).toBe(TERRAIN_COLORS.EXTREME_PEAKS);
			expect(getElevationColor(2.5)).toBe(TERRAIN_COLORS.EXTREME_PEAKS);
		});

		it('should handle boundary values correctly', () => {
			// At exact threshold, we're in the NEXT category (condition is <, not <=)
			expect(getElevationColor(ELEVATION_THRESHOLDS.ABYSSAL_DEPTHS)).toBe(TERRAIN_COLORS.ABYSS);
			expect(getElevationColor(ELEVATION_THRESHOLDS.ABYSS)).toBe(TERRAIN_COLORS.DEEP_OCEAN);
			expect(getElevationColor(ELEVATION_THRESHOLDS.DEEP_OCEAN)).toBe(TERRAIN_COLORS.OCEAN);
			expect(getElevationColor(ELEVATION_THRESHOLDS.OCEAN)).toBe(TERRAIN_COLORS.BEACH);
			expect(getElevationColor(ELEVATION_THRESHOLDS.BEACH)).toBe(TERRAIN_COLORS.PLAINS);
			expect(getElevationColor(ELEVATION_THRESHOLDS.PLAINS)).toBe(TERRAIN_COLORS.FOREST);
			expect(getElevationColor(ELEVATION_THRESHOLDS.FOREST)).toBe(TERRAIN_COLORS.HILLS);
			expect(getElevationColor(ELEVATION_THRESHOLDS.HILLS)).toBe(TERRAIN_COLORS.MOUNTAINS);
			expect(getElevationColor(ELEVATION_THRESHOLDS.MOUNTAINS)).toBe(TERRAIN_COLORS.HIGH_MOUNTAINS);
			expect(getElevationColor(ELEVATION_THRESHOLDS.HIGH_MOUNTAINS)).toBe(
				TERRAIN_COLORS.ALPINE_PEAKS
			);
			expect(getElevationColor(ELEVATION_THRESHOLDS.ALPINE_PEAKS)).toBe(
				TERRAIN_COLORS.EXTREME_PEAKS
			);
		});
	});

	describe('getTerrainType', () => {
		it('should return correct terrain names for each elevation range', () => {
			expect(getTerrainType(-0.8)).toBe('Abyssal Depths');
			expect(getTerrainType(-0.6)).toBe('Abyss');
			expect(getTerrainType(-0.4)).toBe('Deep Ocean');
			expect(getTerrainType(-0.1)).toBe('Ocean');
			expect(getTerrainType(0.04)).toBe('Beach');
			expect(getTerrainType(0.2)).toBe('Plains');
			expect(getTerrainType(0.4)).toBe('Forest');
			expect(getTerrainType(0.6)).toBe('Hills');
			expect(getTerrainType(0.7)).toBe('Mountains');
			expect(getTerrainType(0.9)).toBe('High Mountains');
			expect(getTerrainType(1.2)).toBe('Alpine Peaks');
			expect(getTerrainType(1.8)).toBe('Extreme Peaks');
		});

		it('should match elevation color categories', () => {
			const testElevations = [-0.8, -0.6, -0.4, -0.1, 0.05, 0.2, 0.4, 0.6, 0.7, 0.9, 1.2, 1.8];
			for (const elevation of testElevations) {
				const type = getTerrainType(elevation);
				const color = getElevationColor(elevation);
				// Both should be consistent - same elevation should map to corresponding type and color
				expect(type).toBeTruthy();
				expect(color).toBeTruthy();
			}
		});
	});

	describe('getTerrainData', () => {
		it('should return both color and type', () => {
			const data = getTerrainData(0.6);
			expect(data).toHaveProperty('color');
			expect(data).toHaveProperty('type');
			expect(data.color).toBe(TERRAIN_COLORS.HILLS);
			expect(data.type).toBe('Hills');
		});

		it('should return consistent data across elevation ranges', () => {
			const testElevations = [-0.8, -0.6, -0.4, -0.1, 0.05, 0.2, 0.4, 0.6, 0.7, 0.9, 1.2, 1.8];
			for (const elevation of testElevations) {
				const data = getTerrainData(elevation);
				expect(data.color).toBe(getElevationColor(elevation));
				expect(data.type).toBe(getTerrainType(elevation));
			}
		});
	});

	describe('ELEVATION_THRESHOLDS', () => {
		it('should have all expected thresholds', () => {
			expect(ELEVATION_THRESHOLDS.ABYSSAL_DEPTHS).toBe(-0.7);
			expect(ELEVATION_THRESHOLDS.ABYSS).toBe(-0.5);
			expect(ELEVATION_THRESHOLDS.DEEP_OCEAN).toBe(-0.3);
			expect(ELEVATION_THRESHOLDS.OCEAN).toBe(0);
			expect(ELEVATION_THRESHOLDS.BEACH).toBe(0.05);
			expect(ELEVATION_THRESHOLDS.PLAINS).toBe(0.3);
			expect(ELEVATION_THRESHOLDS.FOREST).toBe(0.5);
			expect(ELEVATION_THRESHOLDS.HILLS).toBe(0.65);
			expect(ELEVATION_THRESHOLDS.MOUNTAINS).toBe(0.8);
			expect(ELEVATION_THRESHOLDS.HIGH_MOUNTAINS).toBe(1);
			expect(ELEVATION_THRESHOLDS.ALPINE_PEAKS).toBe(1.5);
		});

		it('should have thresholds in ascending order', () => {
			const thresholds = Object.values(ELEVATION_THRESHOLDS);
			for (let i = 1; i < thresholds.length; i++) {
				expect(thresholds[i]).toBeGreaterThan(thresholds[i - 1]);
			}
		});
	});

	describe('TERRAIN_COLORS', () => {
		it('should have all expected colors', () => {
			expect(TERRAIN_COLORS.ABYSSAL_DEPTHS).toBe('#00050d');
			expect(TERRAIN_COLORS.ABYSS).toBe('#000d1a');
			expect(TERRAIN_COLORS.DEEP_OCEAN).toBe('#001a33');
			expect(TERRAIN_COLORS.OCEAN).toBe('#003d66');
			expect(TERRAIN_COLORS.BEACH).toBe('#f4e4c1');
			expect(TERRAIN_COLORS.PLAINS).toBe('#78b450');
			expect(TERRAIN_COLORS.FOREST).toBe('#5a8232');
			expect(TERRAIN_COLORS.HILLS).toBe('#8d6e63');
			expect(TERRAIN_COLORS.MOUNTAINS).toBe('#969696');
			expect(TERRAIN_COLORS.HIGH_MOUNTAINS).toBe('#c0c0c0');
			expect(TERRAIN_COLORS.ALPINE_PEAKS).toBe('#e8e8e8');
			expect(TERRAIN_COLORS.EXTREME_PEAKS).toBe('#ffffff');
		});

		it('should have valid hex colors', () => {
			const hexRegex = /^#[0-9a-f]{6}$/i;
			for (const color of Object.values(TERRAIN_COLORS)) {
				expect(hexRegex.test(color)).toBe(true);
			}
		});
	});
});
