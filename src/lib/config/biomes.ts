/**
 * Biome Configuration Utilities
 *
 * Centralized biome display configuration matching server-side biome types.
 * Ensures consistency across all UI components.
 */

/**
 * Biome types from server schema
 * Must match server/src/db/schema.ts biomeTypeEnum
 */
export const BIOME_TYPES = [
	'GRASSLAND',
	'FOREST',
	'DESERT',
	'MOUNTAIN',
	'TUNDRA',
	'SWAMP',
	'COASTAL',
	'OCEAN'
] as const;

export type BiomeType = (typeof BIOME_TYPES)[number];

/**
 * Biome display configuration for UI components
 */
export interface BiomeDisplayConfig {
	type: BiomeType;
	name: string;
	icon: string;
	color: string; // Skeleton UI variant class
	description: string;
}

/**
 * Centralized biome configuration
 * Used by all UI components for consistent styling
 */
export const BIOME_CONFIG: Record<BiomeType, BiomeDisplayConfig> = {
	GRASSLAND: {
		type: 'GRASSLAND',
		name: 'Grassland',
		icon: '🌾',
		color: 'variant-soft-success',
		description: 'Fertile plains with abundant food production'
	},
	FOREST: {
		type: 'FOREST',
		name: 'Forest',
		icon: '🌲',
		color: 'variant-soft-tertiary',
		description: 'Dense woodlands with excellent lumber resources'
	},
	DESERT: {
		type: 'DESERT',
		name: 'Desert',
		icon: '🏜️',
		color: 'variant-soft-warning',
		description: 'Arid wasteland with stone and ore deposits'
	},
	MOUNTAIN: {
		type: 'MOUNTAIN',
		name: 'Mountain',
		icon: '⛰️',
		color: 'variant-soft-surface',
		description: 'Rocky peaks rich in stone and ore'
	},
	TUNDRA: {
		type: 'TUNDRA',
		name: 'Tundra',
		icon: '❄️',
		color: 'variant-soft-primary',
		description: 'Frozen landscape with unique resources'
	},
	SWAMP: {
		type: 'SWAMP',
		name: 'Swamp',
		icon: '🌿',
		color: 'variant-soft-secondary',
		description: 'Wetlands with herbs and special resources'
	},
	COASTAL: {
		type: 'COASTAL',
		name: 'Coastal',
		icon: '🏖️',
		color: 'variant-soft-primary',
		description: 'Shoreline with fishing and trade opportunities'
	},
	OCEAN: {
		type: 'OCEAN',
		name: 'Ocean',
		icon: '🌊',
		color: 'variant-soft-primary',
		description: 'Deep water, unsuitable for settlement'
	}
};

/**
 * Get biome display configuration
 * @param biome - Biome type (case-insensitive)
 * @returns Biome display config
 */
export function getBiomeConfig(biome: string): BiomeDisplayConfig {
	const biomeType = biome.toUpperCase() as BiomeType;
	return BIOME_CONFIG[biomeType] ?? BIOME_CONFIG.GRASSLAND; // Fallback to grassland
}

/**
 * Get Skeleton UI color variant class for a biome
 * @param biome - Biome type (case-insensitive)
 * @returns Skeleton UI variant class (e.g., 'variant-soft-success')
 */
export function getBiomeColor(biome: string): string {
	return getBiomeConfig(biome).color;
}

/**
 * Get biome icon emoji
 * @param biome - Biome type (case-insensitive)
 * @returns Emoji icon
 */
export function getBiomeIcon(biome: string): string {
	return getBiomeConfig(biome).icon;
}

/**
 * Get biome display name
 * @param biome - Biome type (case-insensitive)
 * @returns Human-readable name
 */
export function getBiomeName(biome: string): string {
	return getBiomeConfig(biome).name;
}
