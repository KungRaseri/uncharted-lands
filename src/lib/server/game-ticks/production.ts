/**
 * Production Tick Logic
 * 
 * Handles resource production calculations with structure bonuses.
 */

import type { Settlement, Plot, SettlementStructure, StructureModifier } from '@prisma/client';

export interface ResourceAmounts {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

type SettlementWithRelations = Settlement & {
	Plot: Plot;
	Structures: (SettlementStructure & {
		modifiers: StructureModifier[];
	})[];
};

/**
 * Calculate total production for a settlement including structure bonuses
 */
export function calculateProduction(settlement: SettlementWithRelations): ResourceAmounts {
	// Start with base plot production
	const production: ResourceAmounts = {
		food: settlement.Plot.food,
		water: settlement.Plot.water,
		wood: settlement.Plot.wood,
		stone: settlement.Plot.stone,
		ore: settlement.Plot.ore
	};

	// Track efficiency multipliers
	const efficiencyMultipliers: Partial<Record<keyof ResourceAmounts, number>> = {};

	// Add production bonuses from structures
	for (const structure of settlement.Structures) {
		for (const modifier of structure.modifiers) {
			// Direct production modifiers
			switch (modifier.name) {
				case 'Food Production':
					production.food += modifier.value;
					break;
				case 'Water Production':
					production.water += modifier.value;
					break;
				case 'Wood Production':
					production.wood += modifier.value;
					break;
				case 'Stone Production':
					production.stone += modifier.value;
					break;
				case 'Ore Production':
					production.ore += modifier.value;
					break;
				case 'Efficiency Bonus': {
					// Map structure type to resource
					const resource = getResourceFromStructure(structure.name);
					if (resource) {
						efficiencyMultipliers[resource] = (efficiencyMultipliers[resource] || 1) + (modifier.value / 100);
					}
					break;
				}
			}
		}
	}

	// Apply efficiency multipliers
	for (const [resource, multiplier] of Object.entries(efficiencyMultipliers)) {
		const key = resource as keyof ResourceAmounts;
		production[key] = Math.floor(production[key] * multiplier);
	}

	return production;
}

/**
 * Map structure name to primary resource it affects
 */
function getResourceFromStructure(structureName: string): keyof ResourceAmounts | null {
	const name = structureName.toLowerCase();
	
	if (name.includes('farm')) return 'food';
	if (name.includes('well')) return 'water';
	if (name.includes('lumber') || name.includes('mill')) return 'wood';
	if (name.includes('quarry')) return 'stone';
	if (name.includes('mine')) return 'ore';
	
	return null;
}

/**
 * Calculate production summary for display
 */
export function getProductionSummary(settlement: SettlementWithRelations) {
	const base: ResourceAmounts = {
		food: settlement.Plot.food,
		water: settlement.Plot.water,
		wood: settlement.Plot.wood,
		stone: settlement.Plot.stone,
		ore: settlement.Plot.ore
	};

	const total = calculateProduction(settlement);

	const bonuses: ResourceAmounts = {
		food: total.food - base.food,
		water: total.water - base.water,
		wood: total.wood - base.wood,
		stone: total.stone - base.stone,
		ore: total.ore - base.ore
	};

	return { base, bonuses, total };
}
