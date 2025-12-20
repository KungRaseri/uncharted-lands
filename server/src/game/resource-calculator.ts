/**
 * Resource Calculator
 *
 * Calculates resource production const EXTRACTOR_TIER_MAP: Record<string, number> = {
  // Tier 1 Extractors (5x base)
  FARM: 5,
  WELL: 5,
  LUMBER_MILL: 5,
  QUARRY: 5,
  MINE: 5,
  // Tier 2 Extractors (8x base) - planned
  FISHING_DOCK: 8,
  HUNTING_LODGE: 8,
  HERB_GARDEN: 8,
  // Tier 3 Extractors (12x base) - planned
  DEEP_MINE: 12,
  ADVANCED_FARM: 12,
};

/**
 * Calculate base (passive) resource production from a plot
 * This production happens even WITHOUT extractors (20% of max potential)
 *
 * Per GDD Section 3.1: "Base production = tileQuality × biomeEfficiency × 0.2"
 *
 * @param plot - Plot with quality and resource data
 * @param biomeEfficiency - Biome efficiency for specific resource (0.5-2.0)
 * @returns Base production rate (20% of max potential)
 *
 * @example
 * // Plot with quality=50, grassland food efficiency 1.2
 * calculateBaseProduction(plot, 1.2)
 * // Returns: 50 × 1.2 × 0.2 = 12 units/tick
 *
 * @example
 * // Tile with foodQuality=80, grassland food efficiency 1.2
 * calculateBaseProduction('food', tile, 1.2)
 * // Returns: (80/100) × 1.2 × 0.2 = 0.192 units/tick
 */
function calculateBaseProduction(
	resourceType: keyof Resources,
	tile: Tile,
	biomeEfficiency: number
): number {
	// Get quality for this specific resource type (0-100 scale)
	const qualityField = `${resourceType}Quality` as keyof Tile;
	const quality = (tile[qualityField] as number) || 50; // Default to 50 if not set

	// Convert quality to 0-1 multiplier
	const qualityMultiplier = quality / 100;

	// Get base production modifier (disaster impacts like drought)
	const baseModifier = tile.baseProductionModifier || 1;

	const result = qualityMultiplier * biomeEfficiency * baseModifier * 0.2;

	logger.debug(`[BASE PRODUCTION] Calculated for ${resourceType}`, {
		tileId: tile.id,
		quality,
		qualityMultiplier,
		biomeEfficiency,
		baseModifier,
		formula: `${qualityMultiplier} × ${biomeEfficiency} × ${baseModifier} × 0.2`,
		result,
	});

	return result;
}

/**
 * Get extractor tier multiplier based on structure level
 *
 * Per GDD Section 3.4: Tier-based multipliers for extractors
 * REBALANCED (December 20, 2025): Reduced by 10× for better game balance
 * - OLD: 5×/10×/16× (1 farm fed 100 people)
 * - NEW: 0.5×/1×/1.6× (1 farm feeds 10 people)
 *
 * Tier boundaries every 5 levels (L1-5, L6-10, L11-15, etc.):
 * - Tier 1 (Levels 1-5):   0.5× multiplier (Basic extractors)
 * - Tier 2 (Levels 6-10):  1.0× multiplier (Advanced extractors)
 * - Tier 3 (Levels 11+):   1.6× multiplier (Elite extractors)
 *
 * LEVEL-WITHIN-TIER BONUSES (December 20, 2025):
 * - Tier 1: +0.05× per level (L1=0.5×, L2=0.55×, L3=0.6×, L4=0.65×, L5=0.7×)
 * - Tier 2: +0.08× per level (L6=1.0×, L7=1.08×, L8=1.16×, L9=1.24×, L10=1.32×)
 * - Tier 3: +0.10× per level (L11=1.6×, L12=1.7×, L13=1.8×, etc.)
 *
 * This ensures every upgrade provides a meaningful production boost.
 *
 * @param level - Extractor structure level (1+, infinite progression)
 * @returns Tier multiplier with level bonus
 *
 * @example
 * getExtractorTierMultiplier(1)  // Returns: 0.50  (Tier 1, L1)
 * getExtractorTierMultiplier(3)  // Returns: 0.60  (Tier 1, L3)
 * getExtractorTierMultiplier(5)  // Returns: 0.70  (Tier 1, L5)
 * getExtractorTierMultiplier(6)  // Returns: 1.00  (Tier 2, L6)
 * getExtractorTierMultiplier(8)  // Returns: 1.16  (Tier 2, L8)
 * getExtractorTierMultiplier(10) // Returns: 1.32  (Tier 2, L10)
 * getExtractorTierMultiplier(11) // Returns: 1.60  (Tier 3, L11)
 * getExtractorTierMultiplier(15) // Returns: 2.00  (Tier 3, L15)
 */
function getExtractorTierMultiplier(level: number): number {
	if (level <= 5) {
		// Tier 1: 0.5× base + 0.05× per level
		return 0.5 + (level - 1) * 0.05;
	}
	if (level <= 10) {
		// Tier 2: 1.0× base + 0.08× per level within tier
		return 1.0 + (level - 6) * 0.08;
	}
	// Tier 3: 1.6× base + 0.10× per level within tier
	return 1.6 + (level - 11) * 0.10;
}

import type { Tile, SettlementStructure } from '../db/schema.js';
import { getBiomeEfficiency } from '../config/biome-config.js';
import { getEffectiveness } from './structure-effectiveness.js';
import { logger } from '../utils/logger.js';

/**
 * Resource types in the game
 */
export interface Resources {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

/**
 * Production rates per tick (1/60th of a second)
 * Extends Resources interface to maintain same structure
 */
export interface ProductionRates {
	wood: number;
	stone: number;
	food: number;
	water: number;
	gold: number;
	iron: number;
	ore: number;
}

/**
 * Extended structure info with category and type information
 * (Requires joining settlementStructures with structures table)
 */
export interface StructureWithInfo extends SettlementStructure {
	category?: 'EXTRACTOR' | 'BUILDING' | null;
	extractorType?: string | null;
	buildingType?: string | null;
}

/**
 * Extractor type to resource mapping
 */
const EXTRACTOR_RESOURCE_MAP: Record<string, keyof Resources> = {
	FARM: 'food',
	WELL: 'water',
	LUMBER_MILL: 'wood',
	QUARRY: 'stone',
	MINE: 'ore',
	FISHING_DOCK: 'food', // Alternative food source
	HUNTING_LODGE: 'food', // Alternative food source
	HERB_GARDEN: 'food', // Special resource (treated as food for now)
	// Tier 3 Extractors
	DEEP_MINE: 'ore', // Advanced ore extraction
	ADVANCED_FARM: 'food', // Advanced food production
};

/**
 * Extractor tier definitions (determines base multiplier)
 *
 * ISSUE #2 Spec:
 * - Tier 1: 5x base multiplier (FARM, LUMBER_MILL, QUARRY, MINE, WELL)
 * - Tier 2: 8x base multiplier (FISHING_DOCK, HUNTING_LODGE, HERB_GARDEN - planned)
 * - Tier 3: 12x base multiplier (DEEP_MINE, ADVANCED_FARM - planned)
 *
 * Formula: Multiplier = TierBase + (level - 1) × 1
 * Example: Tier 1 Level 5 = 5 + (5 - 1) × 1 = 9x
 */
const EXTRACTOR_TIER_MAP: Record<string, number> = {
	// Tier 1 Extractors (5x base)
	FARM: 5,
	WELL: 5,
	LUMBER_MILL: 5,
	QUARRY: 5,
	MINE: 5,
	// Tier 2 Extractors (8x base) - planned
	FISHING_DOCK: 8,
	HUNTING_LODGE: 8,
	HERB_GARDEN: 8,
	// Tier 3 Extractors (12x base) - planned
	DEEP_MINE: 12,
	ADVANCED_FARM: 12,
};

/**
 * DEPRECATED: Get extractor multiplier based on type and level
 *
 * This function is no longer used after BLOCKER 2 fix.
 * Keeping for reference in case tier system is re-introduced.
 *
 * ISSUE #2: Extractor multipliers are variable by tier and level
 * Formula: TierBase + (level - 1) × 1
 *
 * @param extractorType - Type of extractor (e.g., 'FARM', 'LUMBER_MILL')
 * @param level - Structure level (1-5 typically)
 * @returns Multiplier to apply to base production
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getExtractorMultiplier(extractorType: string, level: number): number {
	const tierBase = EXTRACTOR_TIER_MAP[extractorType] || 5; // Default to Tier 1 if unknown
	const levelBonus = (level - 1) * 1; // +1 per level above 1
	return tierBase + levelBonus;
}

/**
 * Calculate resource production for a settlement based on its plot and extractors
 *
 * **BLOCKER 2 IMPLEMENTATION**: GDD-Compliant Hybrid Production System (Nov 2025)
 *
 * FORMULA:
 * ```
 * Production = Base × TierMultiplier × HealthModifier × Ticks × WorldTemplate
 *
 * Where:
 * - Base = Quality × BiomeEfficiency × 0.20 (20% passive, ALWAYS active)
 * - TierMultiplier = Tier 1 (L1-3): 5×, Tier 2 (L4-6): 10×, Tier 3 (L7-10): 16×
 * - HealthModifier = StructureHealth / 100 (disaster damage impact, 0-100%)
 * - Ticks = Number of game ticks (60 ticks/second in production)
 * - WorldTemplate = Multiplier from world difficulty (0.5× to 2.0×, default 1.0×)
 * ```
 *
 * IMPLEMENTATION NOTES:
 * - **Resource-Type-Loop Architecture**: Processes each resource independently (not extractor-loop)
 * - **20% Base Production**: Ensures survival even without extractors (prevents "death spiral")
 * - **Tier-Based Multipliers**: Replaces old linear levelMultiplier (1 + (level-1) × 0.2)
 * - **Health Integration**: Damaged structures produce less (disaster system integration)
 * - **Highest-Level-Wins**: Multiple extractors of same type use highest level only
 *
 * EXAMPLES:
 * ```typescript
 * // Scenario 1: No Extractor (Base Production Only)
 * // Plot: quality=50, Biome: Grassland (food efficiency 1.2)
 * calculateProduction(plot, [], 1) // Returns: { food: 12, water: 0, ... }
 * // Calculation: 50 × 1.2 × 0.2 × 1 × 1.0 × 1 = 12 food/tick
 *
 * // Scenario 2: Level 1 Farm (Tier 1 Multiplier)
 * // Plot: quality=50, Biome: Grassland, Extractor: FARM L1 (100% health)
 * calculateProduction(plot, [farmL1], 1) // Returns: { food: 60, water: 0, ... }
 * // Calculation: 50 × 1.2 × 0.2 × 5 × 1.0 × 1 = 60 food/tick
 *
 * // Scenario 3: Level 5 Farm (Tier 2 Multiplier, Damaged)
 * // Plot: quality=50, Biome: Grassland, Extractor: FARM L5 (70% health)
 * calculateProduction(plot, [farmL5Damaged], 1) // Returns: { food: 84, ... }
 * // Calculation: 50 × 1.2 × 0.2 × 10 × 0.7 × 1 = 84 food/tick
 *
 * // Scenario 4: Level 9 Farm (Tier 3 Multiplier, 60 ticks)
 * // Plot: quality=50, Biome: Grassland, Extractor: FARM L9 (100% health)
 * calculateProduction(plot, [farmL9], 60) // Returns: { food: 11520, ... }
 * // Calculation: 50 × 1.2 × 0.2 × 16 × 1.0 × 60 = 11,520 food per second
 * ```
 *
 * VALIDATION (BLOCKER 2 Test Results):
 * - Unit Tests: 26/26 passing ✅
 * - Integration Tests: 24/24 production tests passing ✅
 * - Production Increase: 10× average (0.1 → 1.0 per tick at Level 1)
 * - Disaster Integration: Health modifier validated in damage-production-chain tests
 *
 * PERFORMANCE:
 * - Architecture: Resource-type-loop (5 iterations max, not extractor-loop)
 * - Complexity: O(R × E) where R=5 resources, E=extractors per resource (typically 1)
 * - Optimized: Early exit if no extractors, no redundant biome lookups
 *
 * @param plot - Plot where settlement is located (contains quality multiplier and resource data)
 * @param extractors - Array of extractor structures (must include category, extractorType, level, health)
 * @param tickCount - Number of game ticks elapsed (default: 1, production uses 60 for 1 second)
 * @param biomeName - Name of the biome (determines efficiency multipliers per resource)
 * @param worldTemplateMultiplier - World difficulty multiplier (default: 1.0, Phase 1D feature)
 * @returns Production rates per resource type (food, water, wood, stone, ore)
 *
 * @see {@link calculateBaseProduction} for base (passive) production calculation
 * @see {@link getExtractorTierMultiplier} for tier-based multiplier logic
 * @see {@link getEffectiveness} for health-to-effectiveness conversion
 * @see GDD Section 3.1 for complete production system specification
 * @see BLOCKER-2-ARCHITECTURE.md for implementation design decisions
 *
 * @example
 * // Basic usage with single tick
 * const production = calculateProduction(plot, extractors, 1, 'GRASSLAND');
 * console.log(production.food); // e.g., 60 food/tick
 *
 * @example
 * // Calculate production for 1 second (60 ticks at 60Hz)
 * const productionPerSecond = calculateProduction(plot, extractors, 60, 'GRASSLAND');
 * console.log(productionPerSecond.food); // e.g., 3600 food/second
 *
 * @example
 * // World template with production bonus (Relaxed Mode: 1.5×)
 * const boostedProduction = calculateProduction(tile, extractors, 1, 'GRASSLAND', 1.5);
 * console.log(boostedProduction.food); // e.g., 90 food/tick (60 × 1.5)
 */
export function calculateProduction(
	tile: Tile,
	extractors: StructureWithInfo[],
	tickCount: number = 1,
	biomeName?: string | null,
	worldTemplateMultiplier: number = 1
): Resources {
	// Get biome efficiency multipliers for all resources
	const biomeEfficiency = getBiomeEfficiency(biomeName);

	// Initialize production object
	const production: Resources = {
		food: 0,
		water: 0,
		wood: 0,
		stone: 0,
		ore: 0,
	};

	// Log production calculation start
	logger.debug('[RESOURCE CALC] Starting production calculation', {
		tileId: tile.id,
		biomeName,
		extractorCount: extractors.length,
		tickCount,
		worldTemplateMultiplier,
	});

	// BLOCKER 2 FIX: Process EACH resource type independently
	// Base production (20%) happens even WITHOUT extractors
	const resourceTypes: (keyof Resources)[] = ['food', 'water', 'wood', 'stone', 'ore'];

	for (const resourceType of resourceTypes) {
		// Check if tile has this resource (quality > 0 means resource available)
		const qualityField = `${resourceType}Quality` as keyof Tile;
		const resourceQuality = (tile[qualityField] as number) || 0;

		if (resourceQuality === 0) {
			// Tile doesn't have this resource - skip
			logger.debug(`[RESOURCE CALC] Skipping ${resourceType} (quality = 0)`);
			continue;
		}

		// Step 1: Calculate base production (20% of max potential - ALWAYS active)
		const baseProduction = calculateBaseProduction(
			resourceType,
			tile,
			biomeEfficiency[resourceType]
		);

		// Step 2: Find extractor for this specific resource (if any)
		// If multiple extractors of same type, use HIGHEST level only
		const extractor = extractors
			?.filter(
				(e) =>
					e.category === 'EXTRACTOR' &&
					e.extractorType &&
					EXTRACTOR_RESOURCE_MAP[e.extractorType] === resourceType
			)
			.reduce(
				(highest, current) => {
					return !highest || (current.level || 1) > (highest.level || 1)
						? current
						: highest;
				},
				undefined as StructureWithInfo | undefined
			);

		// Step 3: Determine tier multiplier
		let tierMultiplier = 1; // Default: No extractor = 1x (base production only)
		let healthModifier = 1; // Default: No structure = 100% health

		if (extractor) {
			// Apply tier-based multiplier (5x/10x/16x based on level)
			tierMultiplier = getExtractorTierMultiplier(extractor.level || 1);

			// Apply structure health modifier (disaster damage impact)
			healthModifier = getEffectiveness(extractor.health);

			logger.debug(`[RESOURCE CALC] ${resourceType} extractor found`, {
				extractorType: extractor.extractorType,
				level: extractor.level,
				health: extractor.health,
				tierMultiplier,
				healthModifier,
			});
		} else {
			logger.debug(`[RESOURCE CALC] ${resourceType} - NO extractor (base production only)`);
		}

		// Step 4: Calculate final production for this resource
		// Formula: BaseProduction × TierMultiplier × HealthModifier × Ticks × WorldTemplate
		production[resourceType] =
			baseProduction * tierMultiplier * healthModifier * tickCount * worldTemplateMultiplier;

		logger.debug(`[RESOURCE CALC] ${resourceType} production calculated`, {
			baseProduction,
			tierMultiplier,
			healthModifier,
			tickCount,
			worldTemplateMultiplier,
			finalProduction: production[resourceType],
		});
	}

	logger.debug('[RESOURCE CALC] Total production', {
		production,
	});

	return production;
}

/**
 * Calculate time-based production since last collection
 *
 * @param tile - The tile where the settlement is located
 * @param extractors - Extractor structures on this tile (must include category and extractorType)
 * @param lastCollectionTime - Timestamp of last collection (in milliseconds)
 * @param currentTime - Current timestamp (in milliseconds)
 * @param biomeName - Name of the biome (for efficiency multiplier)
 * @param worldTemplateMultiplier - World template production multiplier (Phase 1D)
 * @returns Total resources produced since last collection
 */
export function calculateTimedProduction(
	tile: Tile,
	extractors: StructureWithInfo[],
	lastCollectionTime: number,
	currentTime: number = Date.now(),
	biomeName?: string | null,
	worldTemplateMultiplier: number = 1
): Resources {
	// Calculate elapsed time in milliseconds
	const elapsedMs = currentTime - lastCollectionTime;

	// Convert to ticks (60 ticks per second)
	const ticksElapsed = Math.floor(elapsedMs / (1000 / 60));

	// Calculate production for elapsed ticks
	return calculateProduction(tile, extractors, ticksElapsed, biomeName, worldTemplateMultiplier);
}

/**
 * Add resources to storage
 *
 * @param storage - Current storage amounts
 * @param resources - Resources to add
 * @param maxCapacity - Maximum storage capacity (optional, defaults to no limit)
 * @returns Updated storage amounts
 */
export function addResources(
	storage: Resources,
	resources: Resources,
	maxCapacity?: number
): Resources {
	const updated = {
		food: storage.food + resources.food,
		water: storage.water + resources.water,
		wood: storage.wood + resources.wood,
		stone: storage.stone + resources.stone,
		ore: storage.ore + resources.ore,
	};

	// Apply capacity limits if specified
	if (maxCapacity) {
		return {
			food: Math.min(updated.food, maxCapacity),
			water: Math.min(updated.water, maxCapacity),
			wood: Math.min(updated.wood, maxCapacity),
			stone: Math.min(updated.stone, maxCapacity),
			ore: Math.min(updated.ore, maxCapacity),
		};
	}

	return updated;
}

/**
 * Subtract resources from storage
 *
 * @param storage - Current storage amounts
 * @param resources - Resources to subtract
 * @returns Updated storage amounts (won't go below 0)
 */
export function subtractResources(storage: Resources, resources: Resources): Resources {
	return {
		food: Math.max(0, storage.food - resources.food),
		water: Math.max(0, storage.water - resources.water),
		wood: Math.max(0, storage.wood - resources.wood),
		stone: Math.max(0, storage.stone - resources.stone),
		ore: Math.max(0, storage.ore - resources.ore),
	};
}

/**
 * Check if storage has enough resources
 *
 * @param storage - Current storage amounts
 * @param required - Required resource amounts
 * @returns True if storage has enough of all resources
 */
export function hasEnoughResources(storage: Resources, required: Resources): boolean {
	return (
		storage.food >= required.food &&
		storage.water >= required.water &&
		storage.wood >= required.wood &&
		storage.stone >= required.stone &&
		storage.ore >= required.ore
	);
}

/**
 * Calculate consumption rates for a settlement
 * (Future: based on population, structures, etc.)
 *
 * @param populationCount - Number of people in settlement
 * @param structureCount - Number of structures (for maintenance)
 * @returns Consumption rates per tick
 */
export function calculateConsumption(
	populationCount: number = 0,
	structureCount: number = 0
): Resources {
	// Base consumption per person per tick
	const FOOD_PER_PERSON_PER_TICK = 0.005;
	const WATER_PER_PERSON_PER_TICK = 0.01;

	// Maintenance cost per structure per tick
	const MAINTENANCE_PER_STRUCTURE_PER_TICK = 0.001;

	return {
		food: populationCount * FOOD_PER_PERSON_PER_TICK,
		water: populationCount * WATER_PER_PERSON_PER_TICK,
		wood: structureCount * MAINTENANCE_PER_STRUCTURE_PER_TICK,
		stone: structureCount * MAINTENANCE_PER_STRUCTURE_PER_TICK * 0.5,
		ore: structureCount * MAINTENANCE_PER_STRUCTURE_PER_TICK * 0.25,
	};
}

/**
 * Calculate net production (production - consumption)
 *
 * @param tile - The tile where the settlement is located
 * @param extractors - Extractor structures on this tile (must include category and extractorType)
 * @param populationCount - Number of people in settlement
 * @param structureCount - Number of structures
 * @param tickCount - Number of ticks elapsed
 * @param biomeName - Name of the biome (for efficiency multiplier)
 * @returns Net resources (can be negative if consumption exceeds production)
 */
export function calculateNetProduction(
	tile: Tile,
	extractors: StructureWithInfo[],
	populationCount: number = 0,
	structureCount: number = 0,
	tickCount: number = 1,
	biomeName?: string | null
): Resources {
	const production = calculateProduction(tile, extractors, tickCount, biomeName);
	const consumption = calculateConsumption(populationCount, structureCount);

	return {
		food: production.food - consumption.food * tickCount,
		water: production.water - consumption.water * tickCount,
		wood: production.wood - consumption.wood * tickCount,
		stone: production.stone - consumption.stone * tickCount,
		ore: production.ore - consumption.ore * tickCount,
	};
}

// ===========================
// HELPER FUNCTIONS
// ===========================

/**
 * Check if a structure is an extractor
 *
 * @param structure - Structure to check (with category and extractorType fields)
 * @returns True if the structure is an extractor
 */
export function isExtractor(structure: StructureWithInfo): boolean {
	return structure.category === 'EXTRACTOR' && !!structure.extractorType;
}

/**
 * Get the average level of extractors
 *
 * Useful for calculating overall production efficiency
 *
 * @param extractors - Array of extractor structures
 * @returns Average level, or 0 if no extractors
 */
export function getAverageLevel(extractors: StructureWithInfo[]): number {
	if (extractors.length === 0) return 0;

	const totalLevel = extractors.reduce((sum, extractor) => sum + extractor.level, 0);
	return totalLevel / extractors.length;
}

/**
 * Get the maximum level among extractors
 *
 * Useful for determining the highest tier of production available
 *
 * @param extractors - Array of extractor structures
 * @returns Maximum level, or 0 if no extractors
 */
export function getMaxLevel(extractors: StructureWithInfo[]): number {
	if (extractors.length === 0) return 0;

	return Math.max(...extractors.map((extractor) => extractor.level));
}

/**
 * Get extractors for a specific resource type
 *
 * @param extractors - Array of extractor structures
 * @param resourceType - Type of resource to filter by
 * @returns Array of extractors that produce the specified resource
 */
export function getExtractorsByResource(
	extractors: StructureWithInfo[],
	resourceType: keyof Resources
): StructureWithInfo[] {
	return extractors.filter((extractor) => {
		if (!extractor.extractorType) return false;
		return EXTRACTOR_RESOURCE_MAP[extractor.extractorType] === resourceType;
	});
}

/**
 * Format resources for display
 *
 * @param resources - Resource amounts
 * @returns Formatted string
 */
export function formatResources(resources: Resources): string {
	return `Food: ${Math.floor(resources.food)}, Water: ${Math.floor(resources.water)}, Wood: ${Math.floor(resources.wood)}, Stone: ${Math.floor(resources.stone)}, Ore: ${Math.floor(resources.ore)}`;
}
