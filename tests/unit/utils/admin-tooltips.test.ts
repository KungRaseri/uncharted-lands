import { describe, it, expect } from 'vitest';
import { getAdminRegionTooltip } from '../../../src/lib/utils/admin-tooltips';

describe('admin-tooltips', () => {
	describe('getAdminRegionTooltip', () => {
		it('should format tooltip with region name', () => {
			const region = { name: 'Northern Plains', xCoord: 5, yCoord: 10 };
			const result = getAdminRegionTooltip(region, 3, 7, 0.456);

			expect(result).toBe(
				`Region: Northern Plains (5, 10)
Tile: (3, 7)
Elevation: 0.456
Terrain: Forest`
			);
		});

		it('should format tooltip without region name', () => {
			const region = { name: null, xCoord: 0, yCoord: 0 };
			const result = getAdminRegionTooltip(region, 1, 2, 0.123);

			expect(result).toBe(
				`Region: Unknown (0, 0)
Tile: (1, 2)
Elevation: 0.123
Terrain: Plains`
			);
		});

		it('should format tooltip with undefined region name', () => {
			const region = { xCoord: 15, yCoord: 20 };
			const result = getAdminRegionTooltip(region, 5, 8, 0.678);

			expect(result).toBe(
				`Region: Unknown (15, 20)
Tile: (5, 8)
Elevation: 0.678
Terrain: Hills`
			);
		});

		it('should handle ocean elevation', () => {
			const region = { name: 'Deep Sea', xCoord: 2, yCoord: 3 };
			const result = getAdminRegionTooltip(region, 0, 0, 0.1);

			expect(result).toContain('Elevation: 0.100');
			expect(result).toContain('Terrain: Plains');
		});

		it('should handle beach elevation', () => {
			const region = { name: 'Coastal', xCoord: 4, yCoord: 5 };
			const result = getAdminRegionTooltip(region, 2, 3, 0.41);

			expect(result).toContain('Elevation: 0.410');
			expect(result).toContain('Terrain: Forest');
		});

		it('should handle land elevation', () => {
			const region = { name: 'Grasslands', xCoord: 6, yCoord: 7 };
			const result = getAdminRegionTooltip(region, 4, 5, 0.5);

			expect(result).toContain('Elevation: 0.500');
			expect(result).toContain('Terrain: Hills');
		});

		it('should handle hill elevation', () => {
			const region = { name: 'Highlands', xCoord: 8, yCoord: 9 };
			const result = getAdminRegionTooltip(region, 6, 7, 0.61);

			expect(result).toContain('Elevation: 0.610');
			expect(result).toContain('Terrain: Hills');
		});

		it('should handle mountain elevation', () => {
			const region = { name: 'Mountain Range', xCoord: 10, yCoord: 11 };
			const result = getAdminRegionTooltip(region, 8, 9, 0.8);

			expect(result).toContain('Elevation: 0.800');
			expect(result).toContain('Terrain: Mountain');
		});

		it('should handle zero coordinates', () => {
			const region = { name: 'Origin', xCoord: 0, yCoord: 0 };
			const result = getAdminRegionTooltip(region, 0, 0, 0.5);

			expect(result).toBe(
				`Region: Origin (0, 0)
Tile: (0, 0)
Elevation: 0.500
Terrain: Hills`
			);
		});

		it('should handle large coordinates', () => {
			const region = { name: 'Far East', xCoord: 999, yCoord: 999 };
			const result = getAdminRegionTooltip(region, 99, 99, 0.5);

			expect(result).toContain('Region: Far East (999, 999)');
			expect(result).toContain('Tile: (99, 99)');
		});

		it('should format elevation to 3 decimal places', () => {
			const region = { name: 'Test', xCoord: 1, yCoord: 1 };
			
			expect(getAdminRegionTooltip(region, 0, 0, 0.123456789)).toContain('0.123');
			expect(getAdminRegionTooltip(region, 0, 0, 0.999999)).toContain('1.000');
			expect(getAdminRegionTooltip(region, 0, 0, 0.1)).toContain('0.100');
		});

		it('should handle negative coordinates', () => {
			const region = { name: 'West Region', xCoord: -5, yCoord: -10 };
			const result = getAdminRegionTooltip(region, 0, 0, 0.5);

			expect(result).toContain('Region: West Region (-5, -10)');
		});

		it('should maintain multiline format', () => {
			const region = { name: 'Test', xCoord: 1, yCoord: 2 };
			const result = getAdminRegionTooltip(region, 3, 4, 0.5);

			const lines = result.split('\n');
			expect(lines).toHaveLength(4);
			expect(lines[0]).toContain('Region:');
			expect(lines[1]).toContain('Tile:');
			expect(lines[2]).toContain('Elevation:');
			expect(lines[3]).toContain('Terrain:');
		});

		it('should handle extreme elevation values', () => {
			const region = { name: 'Test', xCoord: 0, yCoord: 0 };
			
			// Very low
			expect(getAdminRegionTooltip(region, 0, 0, 0)).toContain('Beach');
			
			// Very high
			expect(getAdminRegionTooltip(region, 0, 0, 1)).toContain('Snow Peaks');
		});

		it('should handle special characters in region name', () => {
			const region = { name: "Dragon's Peak (North)", xCoord: 5, yCoord: 5 };
			const result = getAdminRegionTooltip(region, 1, 1, 0.5);

			expect(result).toContain("Region: Dragon's Peak (North)");
		});

		it('should handle empty string region name', () => {
			const region = { name: '', xCoord: 1, yCoord: 1 };
			const result = getAdminRegionTooltip(region, 0, 0, 0.5);

			// Empty string is falsy, so should show Unknown
			expect(result).toContain('Region: Unknown (1, 1)');
		});
	});
});
