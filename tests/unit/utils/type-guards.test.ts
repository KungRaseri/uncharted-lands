import { describe, it, expect } from 'vitest';
import {
	isTileType,
	isServerStatus,
	isRole,
	isValidElevation,
	isOceanTile,
	isLandTile,
	isValidRegionCoordinate,
	isValidTileIndex,
	isValidResourceAmount,
	isValidUUID,
	isValidPrecipitation,
	isValidTemperature,
	hasTileProperties,
	isValidTileSlots
} from '$lib/utils/type-guards';

describe('type-guards', () => {
	describe('isTileType', () => {
		it('should return true for LAND', () => {
			expect(isTileType('LAND')).toBe(true);
		});

		it('should return true for OCEAN', () => {
			expect(isTileType('OCEAN')).toBe(true);
		});

		it('should return false for invalid types', () => {
			expect(isTileType('MOUNTAIN')).toBe(false);
			expect(isTileType('land')).toBe(false);
			expect(isTileType('')).toBe(false);
			expect(isTileType(null)).toBe(false);
			expect(isTileType(undefined)).toBe(false);
			expect(isTileType(123)).toBe(false);
		});
	});

	describe('isServerStatus', () => {
		it('should return true for OFFLINE', () => {
			expect(isServerStatus('OFFLINE')).toBe(true);
		});

		it('should return true for MAINTENANCE', () => {
			expect(isServerStatus('MAINTENANCE')).toBe(true);
		});

		it('should return true for ONLINE', () => {
			expect(isServerStatus('ONLINE')).toBe(true);
		});

		it('should return false for invalid statuses', () => {
			expect(isServerStatus('STARTING')).toBe(false);
			expect(isServerStatus('offline')).toBe(false);
			expect(isServerStatus('')).toBe(false);
			expect(isServerStatus(null)).toBe(false);
		});
	});

	describe('isRole', () => {
		it('should return true for MEMBER', () => {
			expect(isRole('MEMBER')).toBe(true);
		});

		it('should return true for SUPPORT', () => {
			expect(isRole('SUPPORT')).toBe(true);
		});

		it('should return true for ADMINISTRATOR', () => {
			expect(isRole('ADMINISTRATOR')).toBe(true);
		});

		it('should return false for invalid roles', () => {
			expect(isRole('ADMIN')).toBe(false);
			expect(isRole('member')).toBe(false);
			expect(isRole('')).toBe(false);
			expect(isRole(null)).toBe(false);
		});
	});

	describe('isValidElevation', () => {
		it('should return true for values within -1 to 1', () => {
			expect(isValidElevation(-1)).toBe(true);
			expect(isValidElevation(0)).toBe(true);
			expect(isValidElevation(1)).toBe(true);
			expect(isValidElevation(0.5)).toBe(true);
			expect(isValidElevation(-0.5)).toBe(true);
		});

		it('should return false for values outside range', () => {
			expect(isValidElevation(-1.1)).toBe(false);
			expect(isValidElevation(1.1)).toBe(false);
			expect(isValidElevation(-2)).toBe(false);
			expect(isValidElevation(2)).toBe(false);
		});
	});

	describe('isOceanTile', () => {
		it('should return true for negative elevation', () => {
			expect(isOceanTile(-0.1)).toBe(true);
			expect(isOceanTile(-0.5)).toBe(true);
			expect(isOceanTile(-1)).toBe(true);
		});

		it('should return false for non-negative elevation', () => {
			expect(isOceanTile(0)).toBe(false);
			expect(isOceanTile(0.1)).toBe(false);
			expect(isOceanTile(1)).toBe(false);
		});
	});

	describe('isLandTile', () => {
		it('should return true for non-negative elevation', () => {
			expect(isLandTile(0)).toBe(true);
			expect(isLandTile(0.1)).toBe(true);
			expect(isLandTile(1)).toBe(true);
		});

		it('should return false for negative elevation', () => {
			expect(isLandTile(-0.1)).toBe(false);
			expect(isLandTile(-0.5)).toBe(false);
			expect(isLandTile(-1)).toBe(false);
		});
	});

	describe('isValidRegionCoordinate', () => {
		it('should return true for valid coordinates', () => {
			expect(isValidRegionCoordinate(0, 0)).toBe(true);
			expect(isValidRegionCoordinate(5, 5)).toBe(true);
			expect(isValidRegionCoordinate(9, 9)).toBe(true);
			expect(isValidRegionCoordinate(0, 9)).toBe(true);
		});

		it('should return false for invalid coordinates', () => {
			expect(isValidRegionCoordinate(-1, 0)).toBe(false);
			expect(isValidRegionCoordinate(0, -1)).toBe(false);
			expect(isValidRegionCoordinate(10, 0)).toBe(false);
			expect(isValidRegionCoordinate(0, 10)).toBe(false);
			expect(isValidRegionCoordinate(10, 10)).toBe(false);
		});
	});

	describe('isValidTileIndex', () => {
		it('should return true for valid indices', () => {
			expect(isValidTileIndex(0)).toBe(true);
			expect(isValidTileIndex(50)).toBe(true);
			expect(isValidTileIndex(99)).toBe(true);
		});

		it('should return false for invalid indices', () => {
			expect(isValidTileIndex(-1)).toBe(false);
			expect(isValidTileIndex(100)).toBe(false);
			expect(isValidTileIndex(1000)).toBe(false);
		});
	});

	describe('isValidResourceAmount', () => {
		it('should return true for non-negative amounts', () => {
			expect(isValidResourceAmount(0)).toBe(true);
			expect(isValidResourceAmount(100)).toBe(true);
			expect(isValidResourceAmount(0.5)).toBe(true);
		});

		it('should return false for negative amounts', () => {
			expect(isValidResourceAmount(-1)).toBe(false);
			expect(isValidResourceAmount(-0.1)).toBe(false);
		});
	});

	describe('isValidUUID', () => {
		it('should return true for valid UUIDs', () => {
			expect(isValidUUID('123e4567-e89b-12d3-a456-426614174000')).toBe(true);
			expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
			expect(isValidUUID('00000000-0000-0000-0000-000000000000')).toBe(true);
		});

		it('should return false for invalid UUIDs', () => {
			expect(isValidUUID('not-a-uuid')).toBe(false);
			expect(isValidUUID('123e4567-e89b-12d3-a456')).toBe(false);
			expect(isValidUUID('123e4567-e89b-12d3-a456-42661417400g')).toBe(false);
			expect(isValidUUID('')).toBe(false);
			expect(isValidUUID('123')).toBe(false);
		});

		it('should be case insensitive', () => {
			expect(isValidUUID('123E4567-E89B-12D3-A456-426614174000')).toBe(true);
			expect(isValidUUID('123e4567-E89B-12d3-A456-426614174000')).toBe(true);
		});
	});

	describe('isValidPrecipitation', () => {
		it('should return true for values within 0 to 1', () => {
			expect(isValidPrecipitation(0)).toBe(true);
			expect(isValidPrecipitation(0.5)).toBe(true);
			expect(isValidPrecipitation(1)).toBe(true);
		});

		it('should return false for values outside range', () => {
			expect(isValidPrecipitation(-0.1)).toBe(false);
			expect(isValidPrecipitation(1.1)).toBe(false);
			expect(isValidPrecipitation(-1)).toBe(false);
			expect(isValidPrecipitation(2)).toBe(false);
		});
	});

	describe('isValidTemperature', () => {
		it('should return true for values within -1 to 1', () => {
			expect(isValidTemperature(-1)).toBe(true);
			expect(isValidTemperature(0)).toBe(true);
			expect(isValidTemperature(1)).toBe(true);
			expect(isValidTemperature(0.5)).toBe(true);
			expect(isValidTemperature(-0.5)).toBe(true);
		});

		it('should return false for values outside range', () => {
			expect(isValidTemperature(-1.1)).toBe(false);
			expect(isValidTemperature(1.1)).toBe(false);
			expect(isValidTemperature(-2)).toBe(false);
			expect(isValidTemperature(2)).toBe(false);
		});
	});

	describe('hasTileProperties', () => {
		it('should return true for objects with tile properties', () => {
			expect(hasTileProperties({ id: 'tile-1', elevation: 0.5, type: 'LAND' })).toBe(true);
			expect(
				hasTileProperties({ id: 'tile-2', elevation: -0.3, type: 'OCEAN', extra: 'data' })
			).toBe(true);
		});

		it('should return false for objects missing properties', () => {
			expect(hasTileProperties({ id: 'tile-1', elevation: 0.5 })).toBe(false);
			expect(hasTileProperties({ id: 'tile-1', type: 'LAND' })).toBe(false);
			expect(hasTileProperties({ elevation: 0.5, type: 'LAND' })).toBe(false);
		});

		it('should return false for objects with wrong types', () => {
			expect(hasTileProperties({ id: 123, elevation: 0.5, type: 'LAND' })).toBe(false);
			expect(hasTileProperties({ id: 'tile-1', elevation: '0.5', type: 'LAND' })).toBe(false);
			expect(hasTileProperties({ id: 'tile-1', elevation: 0.5, type: 123 })).toBe(false);
		});

		it('should return false for non-objects', () => {
			expect(hasTileProperties(null)).toBe(false);
			expect(hasTileProperties(undefined)).toBe(false);
			expect(hasTileProperties('string')).toBe(false);
			expect(hasTileProperties(123)).toBe(false);
			expect(hasTileProperties([])).toBe(false);
		});
	});

	describe('isValidTileSlots', () => {
		it('should return true for valid tile slots (1-10)', () => {
			expect(isValidTileSlots(1)).toBe(true);
			expect(isValidTileSlots(5)).toBe(true);
			expect(isValidTileSlots(10)).toBe(true);
		});

		it('should return false for invalid tile slots', () => {
			expect(isValidTileSlots(0)).toBe(false);
			expect(isValidTileSlots(-1)).toBe(false);
			expect(isValidTileSlots(11)).toBe(false);
			expect(isValidTileSlots(100)).toBe(false);
		});

		it('should accept decimal values within range', () => {
			expect(isValidTileSlots(1.5)).toBe(true);
			expect(isValidTileSlots(9.9)).toBe(true);
		});
	});
});
