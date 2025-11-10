/**
 * Client-side biome matching utility
 * Matches elevation, precipitation, and temperature to biome colors
 * Uses the same logic as server-side biome matching
 */

import { BIOMES, type BiomeDefinition } from '$lib/data/biomes';

/**
 * Find biome that matches the given precipitation and temperature
 * Uses the same algorithm as server-side findBiome
 */
export function findBiomeForTile(
	precipitation: number,
	temperature: number
): BiomeDefinition | null {
	const biomes = BIOMES;

	// Normalize values to match server-side normalization
	const normalizedPrecip = Math.round(precipitation);
	const normalizedTemp = Math.round(temperature);

	// Filter biomes that match both precipitation and temperature
	let matches = biomes.filter(
		(biome) =>
			normalizedPrecip >= biome.precipitationMin &&
			normalizedPrecip <= biome.precipitationMax &&
			normalizedTemp >= biome.temperatureMin &&
			normalizedTemp <= biome.temperatureMax
	);

	// If no exact match, try matching precipitation only
	if (matches.length === 0) {
		matches = biomes.filter(
			(biome) =>
				normalizedPrecip >= biome.precipitationMin &&
				normalizedPrecip <= biome.precipitationMax
		);
	}

	// Fallback to first biome if still no match
	if (matches.length === 0) {
		return biomes[0] || null;
	}

	// Return first matching biome (deterministic for preview consistency)
	return matches[0];
}

/**
 * Normalize a value from raw range to 0-100 range
 * Matches server-side normalizeValue function
 */
export function normalizeValue(value: number, min: number, max: number): number {
	return ((value - min) / (max - min)) * 100;
}

/**
 * Get biome name for a tile based on elevation, precipitation, and temperature
 * This is now synchronous - no more async/await needed!
 */
export function getBiomeNameForPreview(
	elevation: number,
	precipitation: number,
	temperature: number
): string {
	// Ocean tiles (elevation < 0) always show as ocean
	if (elevation < 0) {
		if (elevation < -0.3) {
			return 'Deep Ocean';
		}
		return 'Ocean';
	}

	// Beach tiles (low elevation land)
	if (elevation < 0.1) {
		return 'Beach';
	}

	// Normalize precipitation and temperature to match server-side
	const normalizedPrecip = normalizeValue(precipitation, 0, 450);
	const normalizedTemp = normalizeValue(temperature, -10, 32);

	// Find matching biome
	const biome = findBiomeForTile(normalizedPrecip, normalizedTemp);
	return biome?.name || 'Unknown';
}
