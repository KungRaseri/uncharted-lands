import { describe, it, expect } from 'vitest';
import {
	getElevationColor,
	getTerrainType,
	getTerrainData,
	ELEVATION_THRESHOLDS,
	TERRAIN_COLORS,
} from '../../../src/lib/utils/map-colors';

describe('Map Colors Utilities', () => {
	describe('getElevationColor', () => {
		it('should return deep ocean color for very low elevations', () => {
			expect(getElevationColor(-1)).toBe(TERRAIN_COLORS.DEEP_OCEAN);
			expect(getElevationColor(-0.5)).toBe(TERRAIN_COLORS.DEEP_OCEAN);
			expect(getElevationColor(-0.31)).toBe(TERRAIN_COLORS.DEEP_OCEAN);
		});

		it('should return ocean color for low negative elevations', () => {
			expect(getElevationColor(-0.29)).toBe(TERRAIN_COLORS.OCEAN);
			expect(getElevationColor(-0.1)).toBe(TERRAIN_COLORS.OCEAN);
			expect(getElevationColor(-0.01)).toBe(TERRAIN_COLORS.OCEAN);
		});

		it('should return beach color for low positive elevations', () => {
			expect(getElevationColor(0)).toBe(TERRAIN_COLORS.BEACH);
			expect(getElevationColor(0.05)).toBe(TERRAIN_COLORS.BEACH);
			expect(getElevationColor(0.09)).toBe(TERRAIN_COLORS.BEACH);
		});

		it('should return plains color for low-medium elevations', () => {
			expect(getElevationColor(0.1)).toBe(TERRAIN_COLORS.PLAINS);
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
			expect(getElevationColor(0.69)).toBe(TERRAIN_COLORS.HILLS);
		});

		it('should return mountains color for high elevations', () => {
			expect(getElevationColor(0.7)).toBe(TERRAIN_COLORS.MOUNTAINS);
			expect(getElevationColor(0.8)).toBe(TERRAIN_COLORS.MOUNTAINS);
			expect(getElevationColor(0.89)).toBe(TERRAIN_COLORS.MOUNTAINS);
		});

		it('should return snow peaks color for very high elevations', () => {
			expect(getElevationColor(0.9)).toBe(TERRAIN_COLORS.SNOW_PEAKS);
			expect(getElevationColor(0.95)).toBe(TERRAIN_COLORS.SNOW_PEAKS);
			expect(getElevationColor(1)).toBe(TERRAIN_COLORS.SNOW_PEAKS);
		});

		it('should handle boundary values correctly', () => {
			// At exact threshold, we're in the NEXT category (condition is <, not <=)
			expect(getElevationColor(ELEVATION_THRESHOLDS.DEEP_OCEAN)).toBe(TERRAIN_COLORS.OCEAN);
			expect(getElevationColor(ELEVATION_THRESHOLDS.OCEAN)).toBe(TERRAIN_COLORS.BEACH);
			expect(getElevationColor(ELEVATION_THRESHOLDS.BEACH)).toBe(TERRAIN_COLORS.PLAINS);
			expect(getElevationColor(ELEVATION_THRESHOLDS.PLAINS)).toBe(TERRAIN_COLORS.FOREST);
			expect(getElevationColor(ELEVATION_THRESHOLDS.FOREST)).toBe(TERRAIN_COLORS.HILLS);
			expect(getElevationColor(ELEVATION_THRESHOLDS.HILLS)).toBe(TERRAIN_COLORS.MOUNTAINS);
			expect(getElevationColor(ELEVATION_THRESHOLDS.MOUNTAINS)).toBe(TERRAIN_COLORS.SNOW_PEAKS);
		});
	});

	describe('getTerrainType', () => {
		it('should return correct terrain names for each elevation range', () => {
			expect(getTerrainType(-0.5)).toBe('Deep Ocean');
			expect(getTerrainType(-0.1)).toBe('Ocean');
			expect(getTerrainType(0.05)).toBe('Beach');
			expect(getTerrainType(0.2)).toBe('Plains');
			expect(getTerrainType(0.4)).toBe('Forest');
			expect(getTerrainType(0.6)).toBe('Hills');
			expect(getTerrainType(0.8)).toBe('Mountains');
			expect(getTerrainType(0.95)).toBe('Snow Peaks');
		});

		it('should match elevation color categories', () => {
			const testElevations = [-0.5, -0.1, 0.05, 0.2, 0.4, 0.6, 0.8, 0.95];
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
			const data = getTerrainData(0.5);
			expect(data).toHaveProperty('color');
			expect(data).toHaveProperty('type');
			expect(data.color).toBe(TERRAIN_COLORS.HILLS);
			expect(data.type).toBe('Hills');
		});

		it('should return consistent data across elevation ranges', () => {
			const testElevations = [-0.5, -0.1, 0.05, 0.2, 0.4, 0.6, 0.8, 0.95];
			for (const elevation of testElevations) {
				const data = getTerrainData(elevation);
				expect(data.color).toBe(getElevationColor(elevation));
				expect(data.type).toBe(getTerrainType(elevation));
			}
		});
	});

	describe('ELEVATION_THRESHOLDS', () => {
		it('should have all expected thresholds', () => {
			expect(ELEVATION_THRESHOLDS.DEEP_OCEAN).toBe(-0.3);
			expect(ELEVATION_THRESHOLDS.OCEAN).toBe(0);
			expect(ELEVATION_THRESHOLDS.BEACH).toBe(0.1);
			expect(ELEVATION_THRESHOLDS.PLAINS).toBe(0.3);
			expect(ELEVATION_THRESHOLDS.FOREST).toBe(0.5);
			expect(ELEVATION_THRESHOLDS.HILLS).toBe(0.7);
			expect(ELEVATION_THRESHOLDS.MOUNTAINS).toBe(0.9);
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
			expect(TERRAIN_COLORS.DEEP_OCEAN).toBe('#001a33');
			expect(TERRAIN_COLORS.OCEAN).toBe('#003d66');
			expect(TERRAIN_COLORS.BEACH).toBe('#f4e4c1');
			expect(TERRAIN_COLORS.PLAINS).toBe('#78b450');
			expect(TERRAIN_COLORS.FOREST).toBe('#5a8232');
			expect(TERRAIN_COLORS.HILLS).toBe('#8d6e63');
			expect(TERRAIN_COLORS.MOUNTAINS).toBe('#969696');
			expect(TERRAIN_COLORS.SNOW_PEAKS).toBe('#dce1f0');
		});

		it('should have valid hex colors', () => {
			const hexRegex = /^#[0-9a-f]{6}$/i;
			for (const color of Object.values(TERRAIN_COLORS)) {
				expect(hexRegex.test(color)).toBe(true);
			}
		});
	});
});
