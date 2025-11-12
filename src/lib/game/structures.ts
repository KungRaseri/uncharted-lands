/**
 * Structure Definitions for Uncharted Lands
 *
 * ⚠️ IMPORTANT: This file is UI-ONLY
 *
 * This file provides structure metadata for the client UI:
 * - Display names and descriptions
 * - Categorization for UI organization
 * - Cost previews for build menus
 * - Helper functions for UI validation (canBuildStructure)
 *
 * 🔒 Server Authority:
 * The server (server/src/events/handlers.ts) is the authoritative
 * source for structure building. It validates all operations:
 * - Resource availability
 * - Ownership verification
 * - Cost enforcement
 * - Database persistence
 *
 * 🔄 Sync Warning:
 * Structure definitions here should match server definitions.
 * When adding new structures:
 * 1. Add to this file for UI display
 * 2. Add to server/src/events/handlers.ts for building
 *
 * 🚀 Future Improvement:
 * Move structure definitions to database or shared config file
 * to eliminate duplication and synchronization issues.
 */

export interface StructureDefinition {
	id: string;
	name: string;
	description: string;
	category: 'housing' | 'production' | 'storage' | 'defense' | 'utility';

	// Build requirements
	requirements: {
		area: number; // Plot area required
		solar: number; // Solar energy required
		wind: number; // Wind energy required
		food: number; // Food cost
		water: number; // Water cost
		wood: number; // Wood cost
		stone: number; // Stone cost
		ore: number; // Ore cost
	};

	// Effects/modifiers this structure provides
	modifiers: {
		name: string;
		description: string;
		value: number;
	}[];
}

/**
 * All available structures in the game
 */
export const STRUCTURE_DEFINITIONS: Record<string, StructureDefinition> = {
	// HOUSING STRUCTURES
	tent: {
		id: 'tent',
		name: 'Tent',
		description: 'Basic shelter for settlers. Provides minimal protection from the elements.',
		category: 'housing',
		requirements: {
			area: 1,
			solar: 0,
			wind: 0,
			food: 5,
			water: 2,
			wood: 10,
			stone: 0,
			ore: 0
		},
		modifiers: [
			{
				name: 'Population Capacity',
				description: 'Houses 2 settlers',
				value: 2
			}
		]
	},

	cottage: {
		id: 'cottage',
		name: 'Cottage',
		description:
			'Small wooden dwelling. More durable than a tent and provides better living conditions.',
		category: 'housing',
		requirements: {
			area: 2,
			solar: 0,
			wind: 0,
			food: 10,
			water: 5,
			wood: 30,
			stone: 10,
			ore: 0
		},
		modifiers: [
			{
				name: 'Population Capacity',
				description: 'Houses 5 settlers',
				value: 5
			},
			{
				name: 'Morale Boost',
				description: 'Improves settler happiness',
				value: 5
			}
		]
	},

	house: {
		id: 'house',
		name: 'House',
		description: 'Sturdy stone and wood house. Provides comfortable living space for a family.',
		category: 'housing',
		requirements: {
			area: 3,
			solar: 1,
			wind: 0,
			food: 20,
			water: 10,
			wood: 50,
			stone: 40,
			ore: 5
		},
		modifiers: [
			{
				name: 'Population Capacity',
				description: 'Houses 10 settlers',
				value: 10
			},
			{
				name: 'Morale Boost',
				description: 'Improves settler happiness',
				value: 10
			}
		]
	},

	// PRODUCTION STRUCTURES
	farm: {
		id: 'farm',
		name: 'Farm',
		description: 'Cultivated fields for growing crops. Produces food over time.',
		category: 'production',
		requirements: {
			area: 5,
			solar: 3,
			wind: 0,
			food: 10,
			water: 20,
			wood: 20,
			stone: 5,
			ore: 0
		},
		modifiers: [
			{
				name: 'Food Production',
				description: 'Generates food per day',
				value: 15
			}
		]
	},

	well: {
		id: 'well',
		name: 'Well',
		description: 'Deep well that taps into underground water sources. Provides fresh water.',
		category: 'production',
		requirements: {
			area: 1,
			solar: 0,
			wind: 0,
			food: 5,
			water: 5,
			wood: 10,
			stone: 30,
			ore: 5
		},
		modifiers: [
			{
				name: 'Water Production',
				description: 'Generates water per day',
				value: 20
			}
		]
	},

	lumbermill: {
		id: 'lumbermill',
		name: 'Lumber Mill',
		description: 'Processes trees into usable lumber. Increases wood production efficiency.',
		category: 'production',
		requirements: {
			area: 4,
			solar: 1,
			wind: 2,
			food: 15,
			water: 10,
			wood: 40,
			stone: 20,
			ore: 10
		},
		modifiers: [
			{
				name: 'Wood Production',
				description: 'Generates wood per day',
				value: 12
			},
			{
				name: 'Efficiency Bonus',
				description: 'Improves wood gathering',
				value: 10
			}
		]
	},

	quarry: {
		id: 'quarry',
		name: 'Quarry',
		description: 'Stone extraction site. Harvests stone from nearby rock formations.',
		category: 'production',
		requirements: {
			area: 6,
			solar: 0,
			wind: 1,
			food: 20,
			water: 15,
			wood: 30,
			stone: 20,
			ore: 15
		},
		modifiers: [
			{
				name: 'Stone Production',
				description: 'Generates stone per day',
				value: 10
			}
		]
	},

	mine: {
		id: 'mine',
		name: 'Mine',
		description: 'Deep mining operation. Extracts valuable ore from underground deposits.',
		category: 'production',
		requirements: {
			area: 8,
			solar: 0,
			wind: 2,
			food: 30,
			water: 20,
			wood: 50,
			stone: 60,
			ore: 20
		},
		modifiers: [
			{
				name: 'Ore Production',
				description: 'Generates ore per day',
				value: 8
			}
		]
	},

	// STORAGE STRUCTURES
	warehouse: {
		id: 'warehouse',
		name: 'Warehouse',
		description: 'Large storage facility. Increases maximum storage capacity for all resources.',
		category: 'storage',
		requirements: {
			area: 4,
			solar: 0,
			wind: 0,
			food: 15,
			water: 10,
			wood: 60,
			stone: 40,
			ore: 10
		},
		modifiers: [
			{
				name: 'Storage Capacity',
				description: 'Increases max storage',
				value: 500
			}
		]
	},

	silo: {
		id: 'silo',
		name: 'Silo',
		description: 'Specialized food storage. Preserves food and prevents spoilage.',
		category: 'storage',
		requirements: {
			area: 3,
			solar: 0,
			wind: 0,
			food: 10,
			water: 5,
			wood: 40,
			stone: 30,
			ore: 5
		},
		modifiers: [
			{
				name: 'Food Storage',
				description: 'Increases max food capacity',
				value: 300
			},
			{
				name: 'Preservation',
				description: 'Reduces food spoilage',
				value: 20
			}
		]
	},

	// DEFENSE STRUCTURES
	palisade: {
		id: 'palisade',
		name: 'Palisade',
		description: 'Wooden defensive wall. Provides basic protection against threats.',
		category: 'defense',
		requirements: {
			area: 3,
			solar: 0,
			wind: 0,
			food: 10,
			water: 5,
			wood: 80,
			stone: 20,
			ore: 0
		},
		modifiers: [
			{
				name: 'Defense',
				description: 'Increases settlement defense',
				value: 15
			}
		]
	},

	watchtower: {
		id: 'watchtower',
		name: 'Watchtower',
		description: 'Tall observation tower. Provides early warning of approaching dangers.',
		category: 'defense',
		requirements: {
			area: 2,
			solar: 0,
			wind: 1,
			food: 15,
			water: 10,
			wood: 50,
			stone: 40,
			ore: 10
		},
		modifiers: [
			{
				name: 'Detection Range',
				description: 'Increases threat detection',
				value: 25
			},
			{
				name: 'Defense',
				description: 'Increases settlement defense',
				value: 10
			}
		]
	},

	// UTILITY STRUCTURES
	workshop: {
		id: 'workshop',
		name: 'Workshop',
		description: "Craftsman's workplace. Allows creation of advanced tools and items.",
		category: 'utility',
		requirements: {
			area: 3,
			solar: 2,
			wind: 1,
			food: 20,
			water: 15,
			wood: 40,
			stone: 30,
			ore: 20
		},
		modifiers: [
			{
				name: 'Crafting Speed',
				description: 'Faster item creation',
				value: 20
			},
			{
				name: 'Resource Efficiency',
				description: 'Reduces crafting costs',
				value: 10
			}
		]
	},

	marketplace: {
		id: 'marketplace',
		name: 'Marketplace',
		description: 'Trading hub. Enables commerce with other settlements and passing traders.',
		category: 'utility',
		requirements: {
			area: 5,
			solar: 1,
			wind: 0,
			food: 30,
			water: 20,
			wood: 60,
			stone: 50,
			ore: 15
		},
		modifiers: [
			{
				name: 'Trade Income',
				description: 'Generates resources from trade',
				value: 15
			},
			{
				name: 'Morale Boost',
				description: 'Improves settler happiness',
				value: 15
			}
		]
	}
};

/**
 * Get structure definition by ID
 */
export function getStructureDefinition(id: string): StructureDefinition | undefined {
	return STRUCTURE_DEFINITIONS[id];
}

/**
 * Get all structures by category
 */
export function getStructuresByCategory(
	category: StructureDefinition['category']
): StructureDefinition[] {
	return Object.values(STRUCTURE_DEFINITIONS).filter((s) => s.category === category);
}

/**
 * Get all structure categories
 */
export function getStructureCategories(): StructureDefinition['category'][] {
	return ['housing', 'production', 'storage', 'defense', 'utility'];
}

/**
 * Check if player can afford to build a structure
 */
export function canBuildStructure(
	structure: StructureDefinition,
	storage: { food: number; water: number; wood: number; stone: number; ore: number },
	plot: { area: number; solar: number; wind: number }
): { canBuild: boolean; reasons: string[] } {
	const reasons: string[] = [];

	// Check plot area
	if (plot.area < structure.requirements.area) {
		reasons.push(`Need ${structure.requirements.area} plot area (have ${plot.area})`);
	}

	// Check solar
	if (plot.solar < structure.requirements.solar) {
		reasons.push(`Need ${structure.requirements.solar} solar (have ${plot.solar})`);
	}

	// Check wind
	if (plot.wind < structure.requirements.wind) {
		reasons.push(`Need ${structure.requirements.wind} wind (have ${plot.wind})`);
	}

	// Check resources
	if (storage.food < structure.requirements.food) {
		reasons.push(`Need ${structure.requirements.food} food (have ${storage.food})`);
	}
	if (storage.water < structure.requirements.water) {
		reasons.push(`Need ${structure.requirements.water} water (have ${storage.water})`);
	}
	if (storage.wood < structure.requirements.wood) {
		reasons.push(`Need ${structure.requirements.wood} wood (have ${storage.wood})`);
	}
	if (storage.stone < structure.requirements.stone) {
		reasons.push(`Need ${structure.requirements.stone} stone (have ${storage.stone})`);
	}
	if (storage.ore < structure.requirements.ore) {
		reasons.push(`Need ${structure.requirements.ore} ore (have ${storage.ore})`);
	}

	return {
		canBuild: reasons.length === 0,
		reasons
	};
}
