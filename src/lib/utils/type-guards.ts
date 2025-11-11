/**
 * Type guard utilities for runtime type checking
 */

import type { TileType, ServerStatus, Role } from '$lib/types/game';

/**
 * Checks if a value is a valid TileType
 * @param value - Value to check
 * @returns True if value is a valid TileType
 */
export function isTileType(value: unknown): value is TileType {
	return value === 'LAND' || value === 'OCEAN';
}

/**
 * Checks if a value is a valid ServerStatus
 * @param value - Value to check
 * @returns True if value is a valid ServerStatus
 */
export function isServerStatus(value: unknown): value is ServerStatus {
	return value === 'OFFLINE' || value === 'MAINTENANCE' || value === 'ONLINE';
}

/**
 * Checks if a value is a valid Role
 * @param value - Value to check
 * @returns True if value is a valid Role
 */
export function isRole(value: unknown): value is Role {
	return value === 'MEMBER' || value === 'SUPPORT' || value === 'ADMINISTRATOR';
}

/**
 * Checks if a tile has valid elevation (between -1 and 1)
 * @param elevation - Elevation value to check
 * @returns True if elevation is in valid range
 */
export function isValidElevation(elevation: number): boolean {
	return elevation >= -1 && elevation <= 1;
}

/**
 * Checks if a tile is an ocean tile based on elevation
 * @param elevation - Elevation value
 * @returns True if elevation indicates ocean (< 0)
 */
export function isOceanTile(elevation: number): boolean {
	return elevation < 0;
}

/**
 * Checks if a tile is a land tile based on elevation
 * @param elevation - Elevation value
 * @returns True if elevation indicates land (>= 0)
 */
export function isLandTile(elevation: number): boolean {
	return elevation >= 0;
}

/**
 * Checks if coordinates are valid for a 10x10 region grid
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns True if coordinates are within 0-9 range
 */
export function isValidRegionCoordinate(x: number, y: number): boolean {
	return x >= 0 && x < 10 && y >= 0 && y < 10;
}

/**
 * Checks if an index is valid for a 10x10 grid (0-99)
 * @param index - Index to check
 * @returns True if index is between 0 and 99
 */
export function isValidTileIndex(index: number): boolean {
	return index >= 0 && index < 100;
}

/**
 * Checks if a value is a valid resource amount (non-negative)
 * @param amount - Amount to check
 * @returns True if amount is non-negative
 */
export function isValidResourceAmount(amount: number): boolean {
	return amount >= 0;
}

/**
 * Checks if a string is a valid UUID format (basic check)
 * @param id - ID string to check
 * @returns True if string matches UUID pattern
 */
export function isValidUUID(id: string): boolean {
	const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
	return uuidPattern.test(id);
}

/**
 * Checks if a value is a valid precipitation value (0-1 range typical)
 * @param precipitation - Precipitation value
 * @returns True if precipitation is in valid range
 */
export function isValidPrecipitation(precipitation: number): boolean {
	return precipitation >= 0 && precipitation <= 1;
}

/**
 * Checks if a value is a valid temperature value (-1 to 1 range typical)
 * @param temperature - Temperature value
 * @returns True if temperature is in valid range
 */
export function isValidTemperature(temperature: number): boolean {
	return temperature >= -1 && temperature <= 1;
}

/**
 * Checks if an object has required tile properties
 * @param obj - Object to check
 * @returns True if object has id, elevation, type properties
 */
export function hasTileProperties(obj: unknown): obj is { id: string; elevation: number; type: string } {
	return (
		typeof obj === 'object' &&
		obj !== null &&
		'id' in obj &&
		'elevation' in obj &&
		'type' in obj &&
		typeof (obj as any).id === 'string' &&
		typeof (obj as any).elevation === 'number' &&
		typeof (obj as any).type === 'string'
	);
}

/**
 * Checks if a number is a valid plot area (positive, reasonable bounds)
 * @param area - Area value in square meters
 * @returns True if area is positive and within reasonable bounds (1-10000)
 */
export function isValidPlotArea(area: number): boolean {
	return area > 0 && area <= 10000;
}
