/**
 * Biome Efficiency Configuration
 *
 * Defines resource production efficiency multipliers for each biome type.
 * Based on GDD-Monolith.md Section 3.5 "World System"
 *
 * Formula: Production = BaseRate × Quality × BiomeEfficiency × StructureLevel × TickCount
 */

export interface BiomeEfficiency {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

/**
 * Biome efficiency multipliers for resource production
 *
 * @see GDD-Monolith.md Section 5.3 "Biomes & Terrain"
 */
export const BIOME_EFFICIENCY: Record<string, BiomeEfficiency> = {
	/**
	 * GRASSLAND - Balanced biome (standard difficulty)
	 * Good starter biome, no extreme modifiers
	 */
	GRASSLAND: {
		food: 1,
		water: 1,
		wood: 1,
		stone: 1,
		ore: 1,
	},

	/**
	 * FOREST - Wood-focused biome
	 * Abundant wood, reduced ore
	 * Fire risk offset by wood abundance
	 */
	FOREST: {
		food: 0.8,
		water: 1,
		wood: 2, // ++++ Abundant wood
		stone: 0.8,
		ore: 0.5,
	},

	/**
	 * DESERT - Stone/Ore-focused biome
	 * Extreme: Water scarcity, harsh disasters
	 * Reward: Stone/Ore abundant
	 */
	DESERT: {
		food: 0.5,
		water: 0.3, // Extreme scarcity
		wood: 0.3,
		stone: 2, // ++ Abundant stone
		ore: 1.5, // + Good ore
	},

	/**
	 * MOUNTAIN - Ore-focused biome
	 * Extreme: Seismic activity, high ore rewards
	 * +20% defense bonus
	 */
	MOUNTAIN: {
		food: 0.6,
		water: 0.7,
		wood: 0.7,
		stone: 1.5, // +++ Excellent stone
		ore: 2, // +++ Abundant ore
	},

	/**
	 * TUNDRA - Cold biome
	 * Cold disasters, manageable with preparation
	 * Ore boost
	 */
	TUNDRA: {
		food: 0.5,
		water: 1,
		wood: 0.6,
		stone: 1,
		ore: 1.2, // + Good ore (pelts alternative)
	},

	/**
	 * SWAMP - Herb-focused biome
	 * Disease risk offset by herb abundance
	 * Water abundant, stone scarce
	 */
	SWAMP: {
		food: 1.2,
		water: 1.5, // ++ Abundant water
		wood: 0.8,
		stone: 0.5,
		ore: 0.4,
	},

	/**
	 * COASTAL - Food/Water-focused biome
	 * Extreme: Tsunami/hurricane risk
	 * Reward: Fish+++, trade benefits
	 */
	COASTAL: {
		food: 1.3, // +++ Excellent food (fish)
		water: 1.2, // ++ Good water
		wood: 0.9,
		stone: 0.9,
		ore: 0.8,
	},
};

/**
 * Default efficiency for unknown biomes
 * Uses balanced GRASSLAND values
 */
export const DEFAULT_BIOME_EFFICIENCY: BiomeEfficiency = BIOME_EFFICIENCY.GRASSLAND;

/**
 * Get biome efficiency multiplier for a specific biome
 *
 * @param biome - Biome name (case-insensitive)
 * @returns BiomeEfficiency multipliers for all resources
 */
export function getBiomeEfficiency(biome: string | null | undefined): BiomeEfficiency {
	if (!biome) {
		return DEFAULT_BIOME_EFFICIENCY;
	}

	const biomeKey = biome.toUpperCase();
	return BIOME_EFFICIENCY[biomeKey] || DEFAULT_BIOME_EFFICIENCY;
}

/**
 * Get efficiency multiplier for a specific resource in a biome
 *
 * @param biome - Biome name
 * @param resource - Resource type ('food', 'water', 'wood', 'stone', 'ore')
 * @returns Efficiency multiplier (0.0 to 2.0+)
 */
export function getResourceEfficiency(
	biome: string | null | undefined,
	resource: keyof BiomeEfficiency
): number {
	const efficiency = getBiomeEfficiency(biome);
	return efficiency[resource] || 1;
}
