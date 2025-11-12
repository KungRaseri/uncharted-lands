import { describe, it, expect } from 'vitest';
import {
	getAdminElevationColor,
	getAdminTerrainDescription
} from '../../../src/lib/utils/admin-terrain';

describe('Admin Terrain Utilities', () => {
	describe('getAdminElevationColor', () => {
		describe('Ocean tiles', () => {
			it('should return deep ocean color for very deep water', () => {
				expect(getAdminElevationColor(-15, 'ocean')).toBe('#001a33');
				expect(getAdminElevationColor(-11, 'ocean')).toBe('#001a33');
				expect(getAdminElevationColor(-10.1, 'ocean')).toBe('#001a33');
			});

			it('should return ocean color for moderate depth', () => {
				expect(getAdminElevationColor(-10, 'ocean')).toBe('#003d66');
				expect(getAdminElevationColor(-7, 'ocean')).toBe('#003d66');
				expect(getAdminElevationColor(-5.1, 'ocean')).toBe('#003d66');
			});

			it('should return shallow water color for shallow areas', () => {
				expect(getAdminElevationColor(-5, 'ocean')).toBe('#006699');
				expect(getAdminElevationColor(-3, 'ocean')).toBe('#006699');
				expect(getAdminElevationColor(-1, 'ocean')).toBe('#006699');
				expect(getAdminElevationColor(0, 'ocean')).toBe('#006699');
			});

			it('should handle boundary at -10', () => {
				expect(getAdminElevationColor(-10, 'ocean')).toBe('#003d66');
				expect(getAdminElevationColor(-10.001, 'ocean')).toBe('#001a33');
			});

			it('should handle boundary at -5', () => {
				expect(getAdminElevationColor(-5, 'ocean')).toBe('#006699');
				expect(getAdminElevationColor(-5.001, 'ocean')).toBe('#003d66');
			});
		});

		describe('Land tiles', () => {
			it('should return beach color for coastal areas', () => {
				expect(getAdminElevationColor(0, 'land')).toBe('#c2b280');
				expect(getAdminElevationColor(2, 'land')).toBe('#c2b280');
				expect(getAdminElevationColor(4.9, 'land')).toBe('#c2b280');
			});

			it('should return lowland color for low elevation', () => {
				expect(getAdminElevationColor(5, 'land')).toBe('#228b22');
				expect(getAdminElevationColor(10, 'land')).toBe('#228b22');
				expect(getAdminElevationColor(14.9, 'land')).toBe('#228b22');
			});

			it('should return hills color for medium elevation', () => {
				expect(getAdminElevationColor(15, 'land')).toBe('#4a7c59');
				expect(getAdminElevationColor(20, 'land')).toBe('#4a7c59');
				expect(getAdminElevationColor(24.9, 'land')).toBe('#4a7c59');
			});

			it('should return mountains color for high elevation', () => {
				expect(getAdminElevationColor(25, 'land')).toBe('#8b7355');
				expect(getAdminElevationColor(30, 'land')).toBe('#8b7355');
				expect(getAdminElevationColor(34.9, 'land')).toBe('#8b7355');
			});

			it('should return snow peaks color for very high elevation', () => {
				expect(getAdminElevationColor(35, 'land')).toBe('#ffffff');
				expect(getAdminElevationColor(50, 'land')).toBe('#ffffff');
				expect(getAdminElevationColor(100, 'land')).toBe('#ffffff');
			});

			it('should handle exact boundaries', () => {
				expect(getAdminElevationColor(5, 'land')).toBe('#228b22');
				expect(getAdminElevationColor(4.999, 'land')).toBe('#c2b280');

				expect(getAdminElevationColor(15, 'land')).toBe('#4a7c59');
				expect(getAdminElevationColor(14.999, 'land')).toBe('#228b22');

				expect(getAdminElevationColor(25, 'land')).toBe('#8b7355');
				expect(getAdminElevationColor(24.999, 'land')).toBe('#4a7c59');

				expect(getAdminElevationColor(35, 'land')).toBe('#ffffff');
				expect(getAdminElevationColor(34.999, 'land')).toBe('#8b7355');
			});
		});

		describe('Edge cases', () => {
			it('should handle negative elevation on land type', () => {
				expect(getAdminElevationColor(-5, 'land')).toBe('#c2b280');
			});

			it('should handle very large elevations', () => {
				expect(getAdminElevationColor(1000, 'land')).toBe('#ffffff');
			});

			it('should handle very deep oceans', () => {
				expect(getAdminElevationColor(-1000, 'ocean')).toBe('#001a33');
			});

			it('should handle zero elevation', () => {
				expect(getAdminElevationColor(0, 'land')).toBe('#c2b280');
				expect(getAdminElevationColor(0, 'ocean')).toBe('#006699');
			});
		});
	});

	describe('getAdminTerrainDescription', () => {
		describe('Ocean descriptions', () => {
			it('should describe deep ocean', () => {
				expect(getAdminTerrainDescription(-15, 'ocean')).toBe('Deep Ocean');
				expect(getAdminTerrainDescription(-11, 'ocean')).toBe('Deep Ocean');
				expect(getAdminTerrainDescription(-10.1, 'ocean')).toBe('Deep Ocean');
			});

			it('should describe regular ocean', () => {
				expect(getAdminTerrainDescription(-10, 'ocean')).toBe('Ocean');
				expect(getAdminTerrainDescription(-7, 'ocean')).toBe('Ocean');
				expect(getAdminTerrainDescription(-5.1, 'ocean')).toBe('Ocean');
			});

			it('should describe shallow water', () => {
				expect(getAdminTerrainDescription(-5, 'ocean')).toBe('Shallow Water');
				expect(getAdminTerrainDescription(-3, 'ocean')).toBe('Shallow Water');
				expect(getAdminTerrainDescription(-1, 'ocean')).toBe('Shallow Water');
				expect(getAdminTerrainDescription(0, 'ocean')).toBe('Shallow Water');
			});
		});

		describe('Land descriptions', () => {
			it('should describe coastal/beach areas', () => {
				expect(getAdminTerrainDescription(0, 'land')).toBe('Coastal/Beach');
				expect(getAdminTerrainDescription(2, 'land')).toBe('Coastal/Beach');
				expect(getAdminTerrainDescription(4.9, 'land')).toBe('Coastal/Beach');
			});

			it('should describe lowland', () => {
				expect(getAdminTerrainDescription(5, 'land')).toBe('Lowland');
				expect(getAdminTerrainDescription(10, 'land')).toBe('Lowland');
				expect(getAdminTerrainDescription(14.9, 'land')).toBe('Lowland');
			});

			it('should describe hills', () => {
				expect(getAdminTerrainDescription(15, 'land')).toBe('Hills');
				expect(getAdminTerrainDescription(20, 'land')).toBe('Hills');
				expect(getAdminTerrainDescription(24.9, 'land')).toBe('Hills');
			});

			it('should describe mountains', () => {
				expect(getAdminTerrainDescription(25, 'land')).toBe('Mountains');
				expect(getAdminTerrainDescription(30, 'land')).toBe('Mountains');
				expect(getAdminTerrainDescription(34.9, 'land')).toBe('Mountains');
			});

			it('should describe high mountains', () => {
				expect(getAdminTerrainDescription(35, 'land')).toBe('High Mountains');
				expect(getAdminTerrainDescription(50, 'land')).toBe('High Mountains');
				expect(getAdminTerrainDescription(100, 'land')).toBe('High Mountains');
			});
		});

		describe('Boundary consistency', () => {
			it('should match color boundaries at -10', () => {
				expect(getAdminTerrainDescription(-10, 'ocean')).toBe('Ocean');
				expect(getAdminTerrainDescription(-10.001, 'ocean')).toBe('Deep Ocean');
			});

			it('should match color boundaries at -5', () => {
				expect(getAdminTerrainDescription(-5, 'ocean')).toBe('Shallow Water');
				expect(getAdminTerrainDescription(-5.001, 'ocean')).toBe('Ocean');
			});

			it('should match color boundaries at 5', () => {
				expect(getAdminTerrainDescription(5, 'land')).toBe('Lowland');
				expect(getAdminTerrainDescription(4.999, 'land')).toBe('Coastal/Beach');
			});

			it('should match color boundaries at 15', () => {
				expect(getAdminTerrainDescription(15, 'land')).toBe('Hills');
				expect(getAdminTerrainDescription(14.999, 'land')).toBe('Lowland');
			});

			it('should match color boundaries at 25', () => {
				expect(getAdminTerrainDescription(25, 'land')).toBe('Mountains');
				expect(getAdminTerrainDescription(24.999, 'land')).toBe('Hills');
			});

			it('should match color boundaries at 35', () => {
				expect(getAdminTerrainDescription(35, 'land')).toBe('High Mountains');
				expect(getAdminTerrainDescription(34.999, 'land')).toBe('Mountains');
			});
		});

		describe('Edge cases', () => {
			it('should handle extreme values', () => {
				expect(getAdminTerrainDescription(-1000, 'ocean')).toBe('Deep Ocean');
				expect(getAdminTerrainDescription(1000, 'land')).toBe('High Mountains');
			});

			it('should handle zero elevation', () => {
				expect(getAdminTerrainDescription(0, 'land')).toBe('Coastal/Beach');
				expect(getAdminTerrainDescription(0, 'ocean')).toBe('Shallow Water');
			});

			it('should handle negative elevation on land', () => {
				expect(getAdminTerrainDescription(-5, 'land')).toBe('Coastal/Beach');
			});
		});
	});
});
