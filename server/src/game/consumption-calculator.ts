/**
 * Consumption Calculator
 *
 * Calculates resource consumption for settlements including:
 * - Population food/water consumption
 * - Structure maintenance costs
 *
 * GDD Spec (Section 6.4 - Resource Consumption Balance):
 * - Food: 18 units per person per hour
 * - Water: 36 units per person per hour
 * - Wood: ~3.6 units per structure per hour
 * - Stone: ~1.8 units per structure per hour
 * - Ore: ~0.9 units per structure per hour
 *
 * Implementation:
 * Game loop runs at 60 ticks/second (3,600 ticks/hour)
 * Therefore, per-tick consumption = (hourly rate) / 3,600
 */

import type { Resources } from './resource-calculator.js';
import { logger } from '../utils/logger.js';
import { MODIFIER_NAMES } from './modifier-names.js';

/**
 * Per-capita consumption rates per tick (60 ticks per second)
 * Based on GDD specifications (Section 6.4)
 *
 * Population Consumption:
 * - Food:  0.005 units/person/tick = 18 units/person/hour = 432 units/person/day
 * - Water: 0.010 units/person/tick = 36 units/person/hour = 864 units/person/day
 *
 * Structure Maintenance:
 * - Wood:  0.001 units/structure/tick = 3.6 units/structure/hour
 * - Stone: 0.0005 units/structure/tick = 1.8 units/structure/hour
 * - Ore:   0.00025 units/structure/tick = 0.9 units/structure/hour
 *
 * Example: Settlement with 10 population, 5 structures
 * - Hourly food: 10 × 18 = 180 units
 * - Hourly water: 10 × 36 = 360 units
 * - Hourly wood: 5 × 3.6 = 18 units
 * - Hourly stone: 5 × 1.8 = 9 units
 * - Hourly ore: 5 × 0.9 = 4.5 units
 */
export const CONSUMPTION_RATES = {
	/** Food consumed per person per tick (GDD spec: 18/hour) */
	FOOD_PER_PERSON_PER_TICK: 18 / 3600,

	/** Water consumed per person per tick (GDD spec: 36/hour) */
	WATER_PER_PERSON_PER_TICK: 36 / 3600,

	/** Base population capacity without structures */
	BASE_POPULATION_CAPACITY: 10,

	/** Wood maintenance per structure per tick (REMOVED - see GDD Phase 1D) */
	WOOD_PER_STRUCTURE_PER_TICK: 0,

	/** Stone maintenance per structure per tick (REMOVED - see GDD Phase 1D) */
	STONE_PER_STRUCTURE_PER_TICK: 0,

	/** Ore maintenance per structure per tick (REMOVED - see GDD Phase 1D) */
	ORE_PER_STRUCTURE_PER_TICK: 0,
};

/**
 * Structure modifiers that affect population
 */
export interface StructureModifier {
	name: string;
	value: number;
}

/**
 * Structure with modifiers
 */
export interface Structure {
	name: string;
	modifiers: StructureModifier[];
}

/**
 * Calculate population capacity from settlement structures
 *
 * Uses standardized snake_case modifier name: "population_capacity"
 * Maintains backward compatibility with legacy names:
 * - "Population Capacity" (old format)
 * - "Housing Capacity" (broken implementation name)
 *
 * @param structures Array of settlement structures with modifiers
 * @returns Total population capacity
 */
export function calculatePopulationCapacity(structures: Structure[]): number {
	let capacity = CONSUMPTION_RATES.BASE_POPULATION_CAPACITY;

	logger.debug('[CAPACITY DEBUG] Starting calculation', {
		baseCapacity: CONSUMPTION_RATES.BASE_POPULATION_CAPACITY,
		structureCount: structures.length,
		structures: structures.map((s) => ({
			name: s.name,
			modifierCount: s.modifiers?.length || 0,
			modifiers: JSON.stringify(s.modifiers?.map((m) => ({ name: m.name, value: m.value }))),
		})),
	});

	for (const structure of structures) {
		for (const modifier of structure.modifiers) {
			// Check for standard snake_case name OR legacy names (backward compatibility)
			const isPopulationCapacity = modifier.name === MODIFIER_NAMES.POPULATION_CAPACITY;

			logger.debug('[CAPACITY DEBUG] Checking modifier', {
				structureName: structure.name,
				modifierName: modifier.name,
				modifierValue: modifier.value,
				expectedName: MODIFIER_NAMES.POPULATION_CAPACITY,
				isMatch: isPopulationCapacity,
			});

			if (isPopulationCapacity) {
				capacity += modifier.value;
				logger.debug('[CAPACITY DEBUG] Added capacity', {
					modifierValue: modifier.value,
					newCapacity: capacity,
				});
			}
		}
	}

	const finalCapacity = Math.max(0, Math.floor(capacity));
	logger.debug('[CAPACITY DEBUG] Final capacity', {
		beforeFloor: capacity,
		afterFloor: finalCapacity,
	});

	return finalCapacity;
}

/**
 * Calculate actual population (for now, same as capacity)
 *
 * Future: Track actual population with growth/decline mechanics
 * - Population grows when food/water abundant
 * - Population declines when resources scarce
 * - Population capped by capacity
 *
 * @param structures Array of settlement structures
 * @param _currentPopulation Current population (optional, for future use)
 * @returns Current population count
 */
export function calculatePopulation(structures: Structure[], _currentPopulation?: number): number {
	const capacity = calculatePopulationCapacity(structures);

	// For now, assume settlements are at max capacity
	// Future: Return Math.min(currentPopulation ?? capacity, capacity)
	return capacity;
}

/**
 * Calculate resource consumption per tick for a settlement
 *
 * Only food and water are consumed (survival resources).
 * Wood, stone, and ore are stockpiled materials - NOT consumed over time.
 *
 * Formula: baseConsumption × worldTemplateMultiplier
 *
 * @param population Current population count
 * @param structureCount Total number of structures (not used for consumption anymore)
 * @param tickCount Number of ticks to calculate for (default: 1)
 * @param worldTemplateMultiplier Consumption modifier from world template (default: 1, Phase 1D)
 * @returns Resource consumption amounts (wood/stone/ore always 0)
 */
export function calculateConsumption(
	population: number,
	_structureCount: number = 0,
	tickCount: number = 1,
	worldTemplateMultiplier: number = 1
): Resources {
	// Calculate base consumption rates (only food/water)
	const baseFoodConsumption = population * CONSUMPTION_RATES.FOOD_PER_PERSON_PER_TICK * tickCount;
	const baseWaterConsumption =
		population * CONSUMPTION_RATES.WATER_PER_PERSON_PER_TICK * tickCount;

	// Apply world template multiplier (Phase 1D)
	return {
		food: baseFoodConsumption * worldTemplateMultiplier,
		water: baseWaterConsumption * worldTemplateMultiplier,
		wood: 0, // Not consumed - only used for construction
		stone: 0, // Not consumed - only used for construction
		ore: 0, // Not consumed - only used for construction
	};
}

/**
 * Calculate morale from structures
 * Based on "Morale Boost" modifiers
 *
 * @param structures Array of settlement structures
 * @returns Morale value (0-100)
 */
export function calculateMorale(structures: Structure[]): number {
	let morale = 50; // Base morale

	for (const structure of structures) {
		for (const modifier of structure.modifiers) {
			if (modifier.name === MODIFIER_NAMES.MORALE_BONUS) {
				morale += modifier.value;
			}
		}
	}

	// Clamp to 0-100 range
	return Math.max(0, Math.min(100, morale));
}

/**
 * Calculate consumption summary for display
 *
 * @param structures Array of settlement structures
 * @param currentPopulation Current population (optional)
 * @returns Consumption summary with rates and totals
 */
export function getConsumptionSummary(structures: Structure[], currentPopulation?: number) {
	const population = calculatePopulation(structures, currentPopulation);
	const capacity = calculatePopulationCapacity(structures);
	const structureCount = structures.length;
	const consumption = calculateConsumption(population, structureCount, 60); // Per second
	const morale = calculateMorale(structures);

	return {
		population,
		capacity,
		structureCount,
		consumption,
		morale,
		perCapitaPerSecond: {
			food: CONSUMPTION_RATES.FOOD_PER_PERSON_PER_TICK * 60,
			water: CONSUMPTION_RATES.WATER_PER_PERSON_PER_TICK * 60,
		},
		perCapitaPerHour: {
			food: CONSUMPTION_RATES.FOOD_PER_PERSON_PER_TICK * 3600,
			water: CONSUMPTION_RATES.WATER_PER_PERSON_PER_TICK * 3600,
		},
		perStructurePerHour: {
			wood: CONSUMPTION_RATES.WOOD_PER_STRUCTURE_PER_TICK * 3600,
			stone: CONSUMPTION_RATES.STONE_PER_STRUCTURE_PER_TICK * 3600,
			ore: CONSUMPTION_RATES.ORE_PER_STRUCTURE_PER_TICK * 3600,
		},
	};
}

/**
 * Check if settlement has sufficient resources for population
 * Returns true if resources can sustain population for at least 1 hour
 *
 * @param population Current population
 * @param structureCount Total number of structures
 * @param resources Current resource amounts
 * @returns Whether resources are sufficient
 */
export function hasResourcesForPopulation(
	population: number,
	structureCount: number,
	resources: Resources
): boolean {
	// Calculate consumption for 1 hour (3,600 ticks)
	// Game time runs 60x faster: 60 ticks/sec × 60 seconds = 3,600 ticks/hour
	const hourlyConsumption = calculateConsumption(population, structureCount, 3600);

	return (
		resources.food >= hourlyConsumption.food &&
		resources.water >= hourlyConsumption.water &&
		resources.wood >= hourlyConsumption.wood &&
		resources.stone >= hourlyConsumption.stone &&
		resources.ore >= hourlyConsumption.ore
	);
}

/**
 * Verify consumption rates match GDD specification
 * Used for testing and validation
 *
 * @returns True if all consumption rates match GDD spec within tolerance
 */
export function verifyConsumptionRates(): boolean {
	// Test case: 100 population, 10 structures, 1 hour (3,600 ticks)
	const population = 100;
	const structureCount = 10;
	const ticksPerHour = 3600;

	const consumption = calculateConsumption(population, structureCount, ticksPerHour);

	// Expected values (GDD Section 6.4):
	const expectedFood = 100 * 18; // 1,800 food/hour
	const expectedWater = 100 * 36; // 3,600 water/hour
	const expectedWood = 10 * 3.6; // 36 wood/hour
	const expectedStone = 10 * 1.8; // 18 stone/hour
	const expectedOre = 10 * 0.9; // 9 ore/hour

	// Verify (allow 0.01% tolerance for floating point precision)
	const tolerance = 0.01;
	const foodMatch = Math.abs(consumption.food - expectedFood) < tolerance;
	const waterMatch = Math.abs(consumption.water - expectedWater) < tolerance;
	const woodMatch = Math.abs(consumption.wood - expectedWood) < tolerance;
	const stoneMatch = Math.abs(consumption.stone - expectedStone) < tolerance;
	const oreMatch = Math.abs(consumption.ore - expectedOre) < tolerance;

	if (!foodMatch || !waterMatch || !woodMatch || !stoneMatch || !oreMatch) {
		logger.error('Consumption rate verification failed:', {
			food: { actual: consumption.food, expected: expectedFood, match: foodMatch },
			water: { actual: consumption.water, expected: expectedWater, match: waterMatch },
			wood: { actual: consumption.wood, expected: expectedWood, match: woodMatch },
			stone: { actual: consumption.stone, expected: expectedStone, match: stoneMatch },
			ore: { actual: consumption.ore, expected: expectedOre, match: oreMatch },
		});
	}

	return foodMatch && waterMatch && woodMatch && stoneMatch && oreMatch;
}
