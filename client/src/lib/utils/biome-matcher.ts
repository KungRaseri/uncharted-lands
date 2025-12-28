/**
 * Client-side biome matching utility
 * Matches elevation, precipitation, and temperature to biome colors
 * Uses the same logic as server-side biome matching
 */

import { BIOMES, type BiomeDefinition } from '$lib/data/biomes';
import { logger } from '../utils/logger.js';

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
	// We need to convert them from [-1, 1] to [0, 450] and [-10, 32] respectively.
	// The biome matching uses these actual value ranges, NOT 0-100!
	const precipInRange = normalizeNoiseValue(precipitation, 0, 450);
	const tempInRange = normalizeNoiseValue(temperature, -10, 32);

	// Find matching biome (uses actual ranges, not normalized)
	const biome = findBiomeForTile(precipInRange, tempInRange);

	// Debug logging - sample every 100th tile to avoid spam
	if (Math.random() < 0.01) {
		logger.debug('[BIOME DEBUG]', {
			elevation,
			precipitation: precipitation.toFixed(3),
			temperature: temperature.toFixed(3),
			precipInRange: precipInRange.toFixed(2),
			tempInRange: tempInRange.toFixed(2),
			biomeName: biome?.name || 'Unknown'
		});
	}

	return biome?.name || 'Unknown';
}
