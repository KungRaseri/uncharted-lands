/**
 * Structure Modifier Configuration
 *
 * Config-based dynamic bonus calculation system.
 * NO DATABASE SEEDING - modifiers calculated at runtime from this config.
 *
 * Based on Architectural Decision 1:
 * - Dynamic calculation from config (not template-based)
 * - Supports LINEAR, EXPONENTIAL, DIMINISHING scaling formulas
 * - Base values defined here, actual values calculated by modifier-calculator.ts
 *
 * @see client/docs/STRUCTURE-DATA-ARCHITECTURE-ANALYSIS.md Decision 1
 * @see server/src/game/modifier-calculator.ts
 */

import { MODIFIER_NAMES } from '../game/modifier-names.js';

export type ScalingFormula = 'LINEAR' | 'EXPONENTIAL' | 'DIMINISHING';

export interface StructureModifierConfig {
	type: string; // e.g., 'FOOD_PRODUCTION'
	name: string; // e.g., 'Food Production'
	description: string; // Human-readable description
	baseValue: number; // Base value at level 1
	formula: ScalingFormula; // How it scales with levels
}

/**
 * Structure Base Bonuses Configuration
 *
 * Defines the base bonuses for each structure type.
 * Actual values calculated dynamically based on structure level.
 *
 * Scaling Formulas:
 * - LINEAR: base × level (steady growth)
 * - EXPONENTIAL: base × 1.5^(level-1) (accelerating growth)
 * - DIMINISHING: base × log2(level+1) (diminishing returns)
 *
 * Examples:
 * - Farm Level 1: 10 food (LINEAR: 10 × 1)
 * - Farm Level 2: 20 food (LINEAR: 10 × 2)
 * - Farm Level 5: 50 food (LINEAR: 10 × 5)
 *
 * - Workshop Level 1: 5% upgrade speed (EXPONENTIAL: 5 × 1.5^0 = 5)
 * - Workshop Level 2: 7.5% upgrade speed (EXPONENTIAL: 5 × 1.5^1 = 7.5)
 * - Workshop Level 5: 25% upgrade speed (EXPONENTIAL: 5 × 1.5^4 = 25.3)
 */
export const STRUCTURE_BASE_BONUSES: Record<string, StructureModifierConfig[]> = {
	// ===== Resource Production Structures =====

	FARM: [
		{
			type: MODIFIER_NAMES.FOOD_PRODUCTION,
			name: 'Food Production',
			description: 'Increases food production per tick',
			baseValue: 10,
			formula: 'LINEAR',
		},
		{
			type: MODIFIER_NAMES.HAPPINESS_BONUS,
			name: 'Happiness Bonus',
			description: 'Provides happiness to settlement from food security',
			baseValue: 2,
			formula: 'DIMINISHING',
		},
	],

	LUMBER_MILL: [
		{
			type: MODIFIER_NAMES.WOOD_PRODUCTION,
			name: 'Wood Production',
			description: 'Increases wood production per tick',
			baseValue: 8,
			formula: 'LINEAR',
		},
	],

	QUARRY: [
		{
			type: MODIFIER_NAMES.STONE_PRODUCTION,
			name: 'Stone Production',
			description: 'Increases stone production per tick',
			baseValue: 6,
			formula: 'LINEAR',
		},
	],

	MINE: [
		{
			type: MODIFIER_NAMES.ORE_PRODUCTION,
			name: 'Ore Production',
			description: 'Increases ore production per tick',
			baseValue: 4,
			formula: 'LINEAR',
		},
	],

	FISHING_DOCK: [
		{
			type: MODIFIER_NAMES.FOOD_PRODUCTION,
			name: 'Food Production',
			description: 'Increases food production per tick from fishing',
			baseValue: 8,
			formula: 'LINEAR',
		},
	],

	HUNTING_LODGE: [
		{
			type: MODIFIER_NAMES.FOOD_PRODUCTION,
			name: 'Food Production',
			description: 'Increases food production per tick from hunting',
			baseValue: 6,
			formula: 'LINEAR',
		},
		{
			type: MODIFIER_NAMES.PELT_PRODUCTION,
			name: 'Pelt Production',
			description: 'Produces pelts for trade',
			baseValue: 2,
			formula: 'LINEAR',
		},
	],

	HERB_GARDEN: [
		{
			type: MODIFIER_NAMES.HERB_PRODUCTION,
			name: 'Herb Production',
			description: 'Produces medicinal herbs',
			baseValue: 3,
			formula: 'LINEAR',
		},
	],

	// ===== Infrastructure Structures =====

	TENT: [
		{
			type: MODIFIER_NAMES.POPULATION_CAPACITY,
			name: 'Population Capacity',
			description: 'Increases maximum population',
			baseValue: 2,
			formula: 'LINEAR',
		},
	],

	HOUSE: [
		{
			type: MODIFIER_NAMES.POPULATION_CAPACITY,
			name: 'Population Capacity',
			description: 'Increases maximum population',
			baseValue: 5,
			formula: 'LINEAR',
		},
		{
			type: MODIFIER_NAMES.HAPPINESS_BONUS,
			name: 'Happiness Bonus',
			description: 'Provides happiness from good housing',
			baseValue: 1,
			formula: 'DIMINISHING',
		},
	],

	STORAGE: [
		{
			type: MODIFIER_NAMES.STORAGE_CAPACITY,
			name: 'Storage Capacity',
			description: 'Increases resource storage capacity',
			baseValue: 500,
			formula: 'LINEAR',
		},
	],

	TOWN_HALL: [
		{
			type: MODIFIER_NAMES.HAPPINESS_BONUS,
			name: 'Happiness Bonus',
			description: 'Provides happiness from good governance',
			baseValue: 5,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.PRODUCTION_EFFICIENCY,
			name: 'Production Efficiency',
			description: 'Increases overall settlement production efficiency',
			baseValue: 2,
			formula: 'DIMINISHING',
		},
	],

	WORKSHOP: [
		{
			type: MODIFIER_NAMES.UPGRADE_SPEED,
			name: 'Upgrade Speed',
			description: 'Reduces upgrade time for structures (percentage)',
			baseValue: 5,
			formula: 'EXPONENTIAL',
		},
		{
			type: MODIFIER_NAMES.CONSTRUCTION_SPEED,
			name: 'Construction Speed',
			description: 'Reduces construction time for structures (percentage)',
			baseValue: 3,
			formula: 'EXPONENTIAL',
		},
	],

	MARKETPLACE: [
		{
			type: MODIFIER_NAMES.TRADE_DISCOUNT,
			name: 'Trade Discount',
			description: 'Reduces trade costs (percentage)',
			baseValue: 5,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.HAPPINESS_BONUS,
			name: 'Happiness Bonus',
			description: 'Provides happiness from trade opportunities',
			baseValue: 3,
			formula: 'DIMINISHING',
		},
	],

	// ===== Research & Knowledge =====

	RESEARCH_LAB: [
		{
			type: MODIFIER_NAMES.RESEARCH_SPEED,
			name: 'Research Speed',
			description: 'Increases technology research speed (percentage)',
			baseValue: 10,
			formula: 'EXPONENTIAL',
		},
	],

	LIBRARY: [
		{
			type: MODIFIER_NAMES.RESEARCH_SPEED,
			name: 'Research Speed Bonus',
			description: 'Additional research speed bonus (percentage)',
			baseValue: 5,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.HAPPINESS_BONUS,
			name: 'Happiness Bonus',
			description: 'Provides happiness from knowledge',
			baseValue: 2,
			formula: 'DIMINISHING',
		},
	],

	// ===== Disaster Response =====

	EMERGENCY_SHELTER: [
		{
			type: MODIFIER_NAMES.POPULATION_PROTECTION,
			name: 'Population Protection',
			description: 'Protects population during disasters',
			baseValue: 50,
			formula: 'LINEAR',
		},
	],

	WATCHTOWER: [
		{
			type: MODIFIER_NAMES.DISASTER_WARNING_TIME,
			name: 'Disaster Warning Time',
			description: 'Provides advance warning of disasters (minutes)',
			baseValue: 30,
			formula: 'EXPONENTIAL',
		},
	],

	HOSPITAL: [
		{
			type: MODIFIER_NAMES.CASUALTY_REDUCTION,
			name: 'Casualty Reduction',
			description: 'Reduces casualties from disasters (percentage)',
			baseValue: 50,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.HAPPINESS_BONUS,
			name: 'Happiness Bonus',
			description: 'Provides happiness from healthcare',
			baseValue: 3,
			formula: 'DIMINISHING',
		},
	],

	RELIEF_CENTER: [
		{
			type: MODIFIER_NAMES.HAPPINESS_RECOVERY,
			name: 'Happiness Recovery',
			description: 'Speeds up happiness recovery after disasters (percentage)',
			baseValue: 20,
			formula: 'DIMINISHING',
		},
	],

	SEISMOLOGY_STATION: [
		{
			type: MODIFIER_NAMES.EARTHQUAKE_WARNING_TIME,
			name: 'Earthquake Warning Time',
			description: 'Provides advance warning of earthquakes (minutes)',
			baseValue: 60,
			formula: 'EXPONENTIAL',
		},
	],

	METEOROLOGY_CENTER: [
		{
			type: MODIFIER_NAMES.WEATHER_WARNING_TIME,
			name: 'Weather Warning Time',
			description: 'Provides advance warning of weather disasters (minutes)',
			baseValue: 120,
			formula: 'EXPONENTIAL',
		},
	],

	DISASTER_COMMAND_CENTER: [
		{
			type: MODIFIER_NAMES.DISASTER_COORDINATION,
			name: 'Disaster Coordination Bonus',
			description: 'Improves overall disaster response efficiency (percentage)',
			baseValue: 15,
			formula: 'DIMINISHING',
		},
	],

	// ===== NPC Interaction =====

	NPC_EMBASSY: [
		{
			type: MODIFIER_NAMES.NPC_RELATIONSHIP_GAIN,
			name: 'NPC Relationship Gain',
			description: 'Increases NPC relationship growth rate (percentage)',
			baseValue: 10,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.TRADE_DISCOUNT,
			name: 'NPC Trade Discount',
			description: 'Reduces costs for NPC trades (percentage)',
			baseValue: 5,
			formula: 'DIMINISHING',
		},
	],

	TRADE_CARAVAN_STATION: [
		{
			type: MODIFIER_NAMES.CARAVAN_FREQUENCY,
			name: 'Caravan Frequency',
			description: 'Increases NPC caravan visit frequency (percentage)',
			baseValue: 10,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.TRADE_DISCOUNT,
			name: 'Caravan Trade Discount',
			description: 'Additional discount for caravan trades (percentage)',
			baseValue: 5,
			formula: 'DIMINISHING',
		},
	],

	NPC_GUEST_QUARTERS: [
		{
			type: MODIFIER_NAMES.NPC_GUEST_CAPACITY,
			name: 'NPC Guest Capacity',
			description: 'Number of NPC guests that can be hosted',
			baseValue: 3,
			formula: 'LINEAR',
		},
	],

	// ===== Guild Structures =====

	GUILD_HEADQUARTERS: [
		{
			type: MODIFIER_NAMES.GUILD_STORAGE_CAPACITY,
			name: 'Guild Storage Capacity',
			description: 'Shared guild storage capacity',
			baseValue: 10000,
			formula: 'LINEAR',
		},
		{
			type: MODIFIER_NAMES.GUILD_MEMBER_LIMIT,
			name: 'Guild Member Limit',
			description: 'Maximum guild members',
			baseValue: 50,
			formula: 'LINEAR',
		},
	],

	GUILD_OUTPOST: [
		{
			type: MODIFIER_NAMES.GUILD_STORAGE_CAPACITY,
			name: 'Local Guild Storage',
			description: 'Local shared storage capacity',
			baseValue: 500,
			formula: 'LINEAR',
		},
		{
			type: MODIFIER_NAMES.PROJECT_CONTRIBUTION_SPEED,
			name: 'Project Contribution Bonus',
			description: 'Speeds up guild project contributions (percentage)',
			baseValue: 10,
			formula: 'DIMINISHING',
		},
	],

	GUILD_WORKSHOP: [
		{
			type: MODIFIER_NAMES.GUILD_PROJECT_SPEED,
			name: 'Guild Project Speed',
			description: 'Speeds up cooperative guild projects (percentage)',
			baseValue: 20,
			formula: 'DIMINISHING',
		},
	],

	GUILD_MONUMENT: [
		{
			type: MODIFIER_NAMES.GUILD_REPUTATION,
			name: 'Guild Reputation',
			description: 'Increases guild reputation permanently',
			baseValue: 500,
			formula: 'LINEAR',
		},
	],

	// ===== Alliance & Cooperation =====

	ALLIANCE_PAVILION: [
		{
			type: MODIFIER_NAMES.ALLIANCE_LIMIT,
			name: 'Alliance Limit',
			description: 'Number of permanent alliances allowed',
			baseValue: 3,
			formula: 'LINEAR',
		},
		{
			type: MODIFIER_NAMES.TRADE_DISCOUNT,
			name: 'Alliance Trade Discount',
			description: 'Trade discount with allies (percentage)',
			baseValue: 10,
			formula: 'DIMINISHING',
		},
	],

	// ===== Specialization Structures =====

	ADVANCED_GREENHOUSE: [
		{
			type: MODIFIER_NAMES.FOOD_PRODUCTION,
			name: 'Settlement Food Production',
			description: 'Increases ALL farm production in settlement (percentage)',
			baseValue: 50,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.HERB_PRODUCTION,
			name: 'Settlement Herb Production',
			description: 'Increases herb production in settlement (percentage)',
			baseValue: 40,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.DROUGHT_RESISTANCE,
			name: 'Drought Resistance',
			description: 'Reduces drought damage (percentage)',
			baseValue: 30,
			formula: 'DIMINISHING',
		},
	],

	DEEP_MINING_COMPLEX: [
		{
			type: MODIFIER_NAMES.ORE_PRODUCTION,
			name: 'Settlement Ore Production',
			description: 'Increases ALL mine production in settlement (percentage)',
			baseValue: 60,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.STONE_PRODUCTION,
			name: 'Settlement Stone Production',
			description: 'Increases quarry production in settlement (percentage)',
			baseValue: 40,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.EARTHQUAKE_WARNING_TIME,
			name: 'Earthquake Detection',
			description: 'Provides earthquake warning (minutes)',
			baseValue: 60,
			formula: 'EXPONENTIAL',
		},
	],

	FORTRESS: [
		{
			type: MODIFIER_NAMES.DISASTER_RESISTANCE,
			name: 'All Disaster Resistance',
			description: 'Reduces damage from all disasters (percentage)',
			baseValue: 30,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.POPULATION_PROTECTION,
			name: 'Fortress Population Protection',
			description: 'Additional protected population capacity',
			baseValue: 100,
			formula: 'LINEAR',
		},
		{
			type: MODIFIER_NAMES.STRUCTURE_DURABILITY,
			name: 'Structure Durability',
			description: 'Increases structure health (percentage)',
			baseValue: 40,
			formula: 'DIMINISHING',
		},
	],

	GRAND_MARKET: [
		{
			type: MODIFIER_NAMES.TRADE_DISCOUNT,
			name: 'Grand Market Discount',
			description: 'Major trade discount (percentage)',
			baseValue: 25,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.NPC_RELATIONSHIP_GAIN,
			name: 'NPC Relationship Bonus',
			description: 'Increased NPC relationship growth (percentage)',
			baseValue: 40,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.CARAVAN_FREQUENCY,
			name: 'Caravan Attraction',
			description: 'Increases caravan visit frequency (percentage)',
			baseValue: 100,
			formula: 'DIMINISHING',
		},
	],

	ADVANCED_ACADEMY: [
		{
			type: MODIFIER_NAMES.RESEARCH_SPEED,
			name: 'Advanced Research Speed',
			description: 'Major research speed bonus (percentage)',
			baseValue: 50,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.RESEARCH_COST_REDUCTION,
			name: 'Research Cost Reduction',
			description: 'Reduces research costs (percentage)',
			baseValue: 20,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.HAPPINESS_BONUS,
			name: 'Knowledge Happiness',
			description: 'Provides happiness from advanced knowledge',
			baseValue: 5,
			formula: 'DIMINISHING',
		},
	],

	IRRIGATION_NETWORK: [
		{
			type: MODIFIER_NAMES.FOOD_PRODUCTION,
			name: 'Irrigation Bonus',
			description: 'Additional food production bonus (stacks with Greenhouse)',
			baseValue: 30,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.DROUGHT_RESISTANCE,
			name: 'Drought Mitigation',
			description: 'Additional drought resistance (percentage)',
			baseValue: 40,
			formula: 'DIMINISHING',
		},
		{
			type: MODIFIER_NAMES.WATER_STORAGE,
			name: 'Water Storage',
			description: 'Additional water storage capacity',
			baseValue: 5000,
			formula: 'LINEAR',
		},
	],
};

/**
 * Get modifier config for a specific structure
 *
 * @param structureName - Structure name (e.g., 'FARM')
 * @returns Array of modifier configs for this structure
 */
export function getStructureModifierConfig(structureName: string): StructureModifierConfig[] {
	// Convert structure name to config key format (e.g., "Town Hall" → "TOWN_HALL")
	const configKey = structureName.toUpperCase().replace(/ /g, '_');
	return STRUCTURE_BASE_BONUSES[configKey] || [];
}

/**
 * Check if a structure has modifiers
 *
 * @param structureName - Structure name to check
 * @returns True if structure has modifier configs
 */
export function hasModifiers(structureName: string): boolean {
	// Convert structure name to config key format (e.g., "Town Hall" → "TOWN_HALL")
	const configKey = structureName.toUpperCase().replace(/ /g, '_');
	return configKey in STRUCTURE_BASE_BONUSES;
}
