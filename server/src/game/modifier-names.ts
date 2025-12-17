/**
 * Structure Modifier Name Constants
 *
 * Standardized modifier names in snake_case format.
 * These constants ensure consistency between structure creation
 * and game logic calculations.
 */

export const MODIFIER_NAMES = {
	// Population & Housing
	POPULATION_CAPACITY: 'population_capacity',
	SHELTER_CAPACITY: 'shelter_capacity',
	GUILD_STORAGE_CAPACITY: 'guild_storage_capacity',

	// Production Modifiers
	FOOD_PRODUCTION: 'food_production',
	WATER_PRODUCTION: 'water_production',
	HERB_PRODUCTION: 'herb_production',
	WOOD_PRODUCTION: 'wood_production',
	STONE_PRODUCTION: 'stone_production',
	ORE_PRODUCTION: 'ore_production',

	// Storage Modifiers
	STORAGE_CAPACITY: 'storage_capacity',

	// Efficiency Modifiers
	PRODUCTION_EFFICIENCY: 'production_efficiency',
	CONSUMPTION_EFFICIENCY: 'consumption_efficiency',
	TRADE_EFFICIENCY: 'trade_efficiency',

	// Defense Modifiers (Disaster System)
	EARTHQUAKE_RESISTANCE: 'earthquake_resistance',
	FLOOD_RESISTANCE: 'flood_resistance',
	FIRE_RESISTANCE: 'fire_resistance',
	STORM_RESISTANCE: 'storm_resistance',
	DISASTER_RESISTANCE: 'disaster_resistance',

	// Happiness Modifiers
	HAPPINESS_BONUS: 'happiness_bonus',
	MORALE_BONUS: 'morale_bonus',

	// Research Modifiers
	RESEARCH_SPEED: 'research_speed',
	UPGRADE_SPEED: 'upgrade_speed',
	CONSTRUCTION_SPEED: 'construction_speed',
	GUILD_PROJECT_SPEED: 'guild_project_speed',

	TRADE_DISCOUNT: 'TRADE_DISCOUNT',

	CASUALTY_REDUCTION: 'casualty_reduction',

	DISASTER_WARNING_TIME: 'disaster_warning_time',
	EARTHQUAKE_WARNING_TIME: 'earthquake_warning_time',
	WEATHER_WARNING_TIME: 'weather_warning_time',
} as const;

// Type for modifier names (for TypeScript safety)
export type ModifierName = (typeof MODIFIER_NAMES)[keyof typeof MODIFIER_NAMES];
