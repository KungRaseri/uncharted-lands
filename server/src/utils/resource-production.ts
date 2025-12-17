/**
 * Resource Production System
 *
 * This implements our hybrid resource system:
 * - Tier 1 (FOOD, WOOD, STONE, ORE): Rate-limited production with quality affecting value
 * - Tier 2 (CLAY, HERBS, PELTS): Quality-based production
 * - Tier 3 (GEMS, EXOTIC_WOOD): Special rare resources from specific biomes
 */

// Production rates per hour at base level
export const BASE_PRODUCTION_RATES = {
	// Tier 1: Basic resources (rate-limited)
	FOOD: {
		FARM: 10, // 10 units/hour base
	},
	WOOD: {
		LUMBER_MILL: 8, // 8 units/hour base
	},
	STONE: {
		QUARRY: 6, // 6 units/hour base
	},
	ORE: {
		MINE: 4, // 4 units/hour base
	},
	// Tier 2: Advanced resources (quality-based)
	CLAY: {
		QUARRY: 3, // 3 units/hour base
	},
	HERBS: {
		HERB_GARDEN: 5, // 5 units/hour base
	},
	PELTS: {
		HUNTING_LODGE: 4, // 4 units/hour base
	},
	// Tier 3: Rare resources (special locations only)
	GEMS: {
		MINE: 1, // 1 unit/hour base
	},
	EXOTIC_WOOD: {
		LUMBER_MILL: 2, // 2 units/hour base
	},
} as const;

// Biome efficiency modifiers (how well a biome supports each resource)
export const BIOME_EFFICIENCY: Record<string, Record<string, number>> = {
	'Tropical Rainforest': {
		FOOD: 1.5,
		WOOD: 2,
		STONE: 0.5,
		ORE: 0.5,
		HERBS: 1.8,
		PELTS: 1.2,
	},
	'Temperate Forest': {
		FOOD: 1.2,
		WOOD: 1.5,
		STONE: 0.8,
		ORE: 0.8,
		HERBS: 1,
		PELTS: 1.5,
	},
	Grassland: {
		FOOD: 1.8,
		WOOD: 0.5,
		STONE: 0.7,
		ORE: 0.6,
		HERBS: 1.3,
		PELTS: 1,
	},
	Desert: {
		FOOD: 0.3,
		WOOD: 0.2,
		STONE: 1.5,
		ORE: 1.2,
		HERBS: 0.5,
		PELTS: 0.4,
	},
	Mountains: {
		FOOD: 0.4,
		WOOD: 0.6,
		STONE: 2,
		ORE: 2,
		HERBS: 0.8,
		PELTS: 1.3,
	},
	Tundra: {
		FOOD: 0.5,
		WOOD: 0.4,
		STONE: 1,
		ORE: 1.5,
		HERBS: 0.3,
		PELTS: 2,
	},
	Savanna: {
		FOOD: 1.3,
		WOOD: 0.8,
		STONE: 0.9,
		ORE: 0.7,
		HERBS: 1,
		PELTS: 1.8,
	},
	'Boreal Forest': {
		FOOD: 0.8,
		WOOD: 1.8,
		STONE: 0.9,
		ORE: 1,
		HERBS: 0.7,
		PELTS: 1.7,
	},
};

// Structure level multipliers (geometric progression)
export function getStructureLevelMultiplier(level: number): number {
	// Level 1 = 1x, Level 2 = 1.5x, Level 3 = 2.25x, Level 4 = 3.375x, etc.
	return Math.pow(1.5, level - 1);
}

/**
 * Calculate the production rate for an extractor structure
 *
 * Formula: baseRate × biomeEfficiency × structureLevel × worldTemplateMultiplier
 *
 * Quality affects VALUE when trading/using, not production rate (for Tier 1 resources)
 */
export function calculateProductionRate(params: {
	resourceType: keyof typeof BASE_PRODUCTION_RATES;
	extractorType: string;
	biomeName: string;
	structureLevel: number;
	worldTemplateMultiplier?: number; // Phase 1D: World template production modifier
}): number {
	const {
		resourceType,
		extractorType,
		biomeName,
		structureLevel,
		worldTemplateMultiplier = 1,
	} = params;

	// Get base rate for this resource/extractor combination
	const resourceRates = BASE_PRODUCTION_RATES[resourceType];
	if (!resourceRates) return 0;

	const baseRate = (resourceRates as Record<string, number>)[extractorType];
	if (!baseRate) return 0;

	// Get biome efficiency
	const biomeEfficiencies = BIOME_EFFICIENCY[biomeName] || {};
	const biomeEfficiency = biomeEfficiencies[resourceType] || 1;

	// Get structure level multiplier
	const levelMultiplier = getStructureLevelMultiplier(structureLevel);

	// Calculate final rate with world template multiplier (Phase 1D)
	const productionRate = baseRate * biomeEfficiency * levelMultiplier * worldTemplateMultiplier;

	return Math.round(productionRate * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate accumulated resources since last harvest
 *
 * @param productionRate - Units per hour
 * @param lastHarvested - Timestamp of last harvest (or null for new extractors)
 * @returns Number of resources accumulated
 */
export function calculateAccumulatedResources(
	productionRate: number,
	lastHarvested: Date | null
): number {
	if (!lastHarvested) return 0;

	const now = new Date();
	const hoursSinceHarvest = (now.getTime() - lastHarvested.getTime()) / (1000 * 60 * 60);

	// Apply diminishing returns after 24 hours to prevent infinite accumulation
	let effectiveHours = hoursSinceHarvest;
	if (hoursSinceHarvest > 24) {
		// 24 hours full rate, then 50% rate
		effectiveHours = 24 + (hoursSinceHarvest - 24) * 0.5;
	}
	if (effectiveHours > 48) {
		// Cap at 48 effective hours (24 + 24*0.5 + 24*0.25 = 60 max)
		effectiveHours = 48 + (hoursSinceHarvest - 48) * 0.25;
	}
	if (effectiveHours > 96) {
		// Hard cap at 96 effective hours
		effectiveHours = 96;
	}

	return Math.floor(productionRate * effectiveHours);
}

/**
 * Calculate resource quality multiplier for trading/using
 *
 * Quality ranges from 0-100:
 * - 0-20: Very Poor (0.5x value)
 * - 21-40: Poor (0.75x value)
 * - 41-60: Average (1x value)
 * - 61-80: Good (1.5x value)
 * - 81-100: Excellent (2x value)
 */
export function getQualityMultiplier(quality: number): number {
	if (quality <= 20) return 0.5;
	if (quality <= 40) return 0.75;
	if (quality <= 60) return 1;
	if (quality <= 80) return 1.5;
	return 2;
}

/**
 * Get quality rating label
 */
export function getQualityRating(quality: number): string {
	if (quality <= 20) return 'Very Poor';
	if (quality <= 40) return 'Poor';
	if (quality <= 60) return 'Average';
	if (quality <= 80) return 'Good';
	return 'Excellent';
}

/**
 * Calculate how many extractor slots a tile can support based on biome
 *
 * This uses the biome's plotsMin and plotsMax fields to determine base slots,
 * then applies terrain modifiers.
 *
 * Note: plotsMin/plotsMax are legacy field names from the old plot system,
 * but still valid for determining tile extractor capacity.
 */
export function calculatePlotSlots(biome: { plotsMin: number; plotsMax: number }): number {
	const baseSlots = Math.floor((biome.plotsMin + biome.plotsMax) / 2);
	return Math.max(4, Math.min(9, baseSlots)); // Clamp between 4-9
}
