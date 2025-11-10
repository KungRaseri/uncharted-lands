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
 * Normalize a raw noise value from [-1, 1] to [min, max]
 * This matches the server-side normalizeValue in world-generator.ts
 */
export function normalizeNoiseValue(value: number, min: number, max: number): number {
	return (value * (max - min)) / 2 + (max + min) / 2;
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

	// IMPORTANT: The raw precipitation and temperature values from the preview
	// are in the range [-1, 1] (from noise function), not the normalized ranges.
	// We need to convert them from [-1, 1] to [0, 450] and [-10, 32] respectively,
	// then normalize to 0-100 for biome matching.
	const precipInRange = normalizeNoiseValue(precipitation, 0, 450);
	const tempInRange = normalizeNoiseValue(temperature, -10, 32);
	
	const normalizedPrecip = normalizeValue(precipInRange, 0, 450);
	const normalizedTemp = normalizeValue(tempInRange, -10, 32);

	// Find matching biome
	const biome = findBiomeForTile(normalizedPrecip, normalizedTemp);
	
	// Debug logging - remove after verification
	if (!biome) {
		console.warn('[BIOME] No biome found for:', { 
			elevation, 
			precipitation, 
			temperature, 
			precipInRange,
			tempInRange,
			normalizedPrecip, 
			normalizedTemp 
		});
	}
	
	return biome?.name || 'Unknown';
}
