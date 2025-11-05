/**
 * Consumption Tick Logic
 * 
 * Handles resource consumption calculations including:
 * - Population food/water consumption
 * - Structure maintenance costs
 * - Resource decay/spoilage
 */

import type { Settlement, SettlementStructure, StructureModifier } from '@prisma/client';
import type { ResourceAmounts } from './production';

type SettlementWithRelations = Settlement & {
	Structures: (SettlementStructure & {
		modifiers: StructureModifier[];
	})[];
};

/**
 * Per-capita consumption rates per hour
 * These can be adjusted for game balance
 */
export const CONSUMPTION_RATES = {
	FOOD_PER_CAPITA: 0.5,   // 0.5 food per person per hour = 12 food/day
	WATER_PER_CAPITA: 0.75  // 0.75 water per person per hour = 18 water/day
};

/**
 * Calculate population from settlement structures
 * Based on "Population Capacity" modifiers
 */
export function calculatePopulation(settlement: SettlementWithRelations): number {
	let capacity = 0;

	for (const structure of settlement.Structures) {
		for (const modifier of structure.modifiers) {
			if (modifier.name === 'Population Capacity') {
				capacity += modifier.value;
			}
		}
	}

	// For now, assume settlements are at max capacity
	// Phase 2: Implement actual population tracking with growth/decline
	return capacity;
}

/**
 * Calculate total consumption for a settlement
 * 
 * PHASE 2: This returns zero for now - implement population consumption
 * 
 * Future implementation will include:
 * - Population food/water consumption based on per-capita rates
 * - Structure maintenance costs
 * - Resource decay/spoilage
 */
export function calculateConsumption(settlement: SettlementWithRelations): ResourceAmounts {
	// Placeholder - returns zero consumption for Phase 1
	// This prevents breaking existing gameplay while we build the consumption system
	
	// Phase 2 will calculate:
	// - const population = calculatePopulation(settlement);
	// - food consumption: population * CONSUMPTION_RATES.FOOD_PER_CAPITA
	// - water consumption: population * CONSUMPTION_RATES.WATER_PER_CAPITA
	// - structure maintenance: wood/stone costs per structure
	
	return {
		food: 0,
		water: 0,
		wood: 0,
		stone: 0,
		ore: 0
	};
}

/**
 * Calculate morale from structures
 * Based on "Morale Boost" modifiers
 */
export function calculateMorale(settlement: SettlementWithRelations): number {
	let morale = 50; // Base morale

	for (const structure of settlement.Structures) {
		for (const modifier of structure.modifiers) {
			if (modifier.name === 'Morale Boost') {
				morale += modifier.value;
			}
		}
	}

	// Clamp to 0-100 range
	return Math.max(0, Math.min(100, morale));
}

/**
 * Get consumption summary for display
 */
export function getConsumptionSummary(settlement: SettlementWithRelations) {
	const population = calculatePopulation(settlement);
	const consumption = calculateConsumption(settlement);
	const morale = calculateMorale(settlement);

	return {
		population,
		consumption,
		morale,
		perCapita: {
			food: CONSUMPTION_RATES.FOOD_PER_CAPITA,
			water: CONSUMPTION_RATES.WATER_PER_CAPITA
		}
	};
}
