/**
 * Structure Modifiers Configuration
 *
 * Defines production bonuses and other modifiers for each structure type.
 * These are custom game mechanics not specified in the GDD.
 *
 * @see GDD Section 4.4 - Building & Construction System (for structure types)
 * @note This data was extracted from the old hardcoded structureTypes object
 *       in events/handlers.ts (lines 318-378)
 */
import { MODIFIER_NAMES } from '../game/modifier-names.js';

export interface StructureModifier {
	name: string;
	description: string;
	value: number;
}

/**
 * Map of structure names (uppercase) to their modifiers
 */
export const STRUCTURE_MODIFIERS: Record<string, StructureModifier[]> = {
	// Housing - Population capacity
	TENT: [
		{
			name: MODIFIER_NAMES.POPULATION_CAPACITY,
			description: 'Increases settlement population capacity',
			value: 2,
		},
	],
	HOUSE: [
		{
			name: MODIFIER_NAMES.POPULATION_CAPACITY,
			description: 'Increases settlement population capacity',
			value: 5,
		},
	],

	// Resource Production - Extractors
	FARM: [
		{
			name: MODIFIER_NAMES.FOOD_PRODUCTION,
			description: 'Increases food production',
			value: 10,
		},
	],
	WELL: [
		{
			name: MODIFIER_NAMES.WATER_PRODUCTION,
			description: 'Increases water production',
			value: 15,
		},
	],
	LUMBER_MILL: [
		{
			name: MODIFIER_NAMES.WOOD_PRODUCTION,
			description: 'Increases wood production',
			value: 8,
		},
	],
	QUARRY: [
		{
			name: MODIFIER_NAMES.STONE_PRODUCTION,
			description: 'Increases stone production',
			value: 6,
		},
	],
	MINE: [
		{
			name: MODIFIER_NAMES.ORE_PRODUCTION,
			description: 'Increases ore production',
			value: 4,
		},
	],

	// Storage
	WAREHOUSE: [
		{
			name: MODIFIER_NAMES.STORAGE_CAPACITY,
			description: 'Increases resource storage capacity',
			value: 500,
		},
	],

	// Advanced Production
	WORKSHOP: [
		{
			name: MODIFIER_NAMES.CONSTRUCTION_SPEED,
			description: 'Increases construction speed',
			value: 10, // 10% faster
		},
	],

	// Trade & Commerce
	MARKETPLACE: [
		{
			name: MODIFIER_NAMES.TRADE_EFFICIENCY,
			description: 'Improves trade rates',
			value: 10, // 10% better rates
		},
	],

	// Research & Technology
	RESEARCH_LAB: [
		{
			name: MODIFIER_NAMES.RESEARCH_SPEED,
			description: 'Increases research speed',
			value: 100, // Base research speed
		},
	],
	LIBRARY: [
		{
			name: MODIFIER_NAMES.RESEARCH_SPEED,
			description: 'Bonus research speed',
			value: 20, // +20% research speed
		},
	],

	// Population Services
	HOSPITAL: [
		{
			name: MODIFIER_NAMES.CASUALTY_REDUCTION,
			description: 'Reduces disaster casualties',
			value: 50, // 50% casualty reduction
		},
	],

	// Disaster Defense
	EMERGENCY_SHELTER: [
		{
			name: MODIFIER_NAMES.SHELTER_CAPACITY,
			description: 'Population that can be protected during disasters',
			value: 50,
		},
	],
	WATCHTOWER: [
		{
			name: MODIFIER_NAMES.DISASTER_WARNING_TIME,
			description: 'Advance warning time in seconds',
			value: 3600, // 1 hour
		},
	],
	SEISMOLOGY_STATION: [
		{
			name: MODIFIER_NAMES.EARTHQUAKE_WARNING_TIME,
			description: 'Earthquake warning time in seconds',
			value: 3600, // 1 hour
		},
	],
	METEOROLOGY_CENTER: [
		{
			name: MODIFIER_NAMES.WEATHER_WARNING_TIME,
			description: 'Weather disaster warning time in seconds',
			value: 7200, // 2 hours
		},
	],

	// Guild Structures
	GUILD_HEADQUARTERS: [
		{
			name: MODIFIER_NAMES.GUILD_STORAGE_CAPACITY,
			description: 'Shared guild storage capacity',
			value: 50000,
		},
	],
	GUILD_WORKSHOP: [
		{
			name: MODIFIER_NAMES.GUILD_PROJECT_SPEED,
			description: 'Guild cooperative project speed bonus',
			value: 20, // 20% faster
		},
	],

	// Specialization Structures
	ADVANCED_GREENHOUSE: [
		{
			name: MODIFIER_NAMES.FOOD_PRODUCTION,
			description: 'Food production bonus',
			value: 50, // 50% bonus
		},
		{
			name: MODIFIER_NAMES.HERB_PRODUCTION,
			description: 'Herb production bonus',
			value: 40, // 40% bonus
		},
	],
	DEEP_MINING_COMPLEX: [
		{
			name: MODIFIER_NAMES.ORE_PRODUCTION,
			description: 'Ore production bonus',
			value: 60, // 60% bonus
		},
		{
			name: MODIFIER_NAMES.STONE_PRODUCTION,
			description: 'Stone production bonus',
			value: 40, // 40% bonus
		},
	],
	FORTRESS: [
		{
			name: MODIFIER_NAMES.DISASTER_RESISTANCE,
			description: 'All disaster resistance',
			value: 30, // 30% resistance
		},
	],
	GRAND_MARKET: [
		{
			name: MODIFIER_NAMES.TRADE_DISCOUNT,
			description: 'Trade discount percentage',
			value: 25, // 25% discount
		},
	],
	ADVANCED_ACADEMY: [
		{
			name: MODIFIER_NAMES.RESEARCH_SPEED,
			description: 'Research speed bonus',
			value: 50, // 50% bonus
		},
	],
};

/**
 * Get modifiers for a structure by name
 * @param structureName - The structure name (case-insensitive)
 * @returns The structure modifiers array or undefined if none defined
 */
export function getStructureModifiers(structureName: string): StructureModifier[] | undefined {
	const upperName = structureName.toUpperCase();
	return STRUCTURE_MODIFIERS[upperName];
}

/**
 * Check if a structure has defined modifiers
 * @param structureName - The structure name (case-insensitive)
 * @returns True if structure has modifiers defined
 */
export function hasStructureModifiers(structureName: string): boolean {
	const upperName = structureName.toUpperCase();
	return upperName in STRUCTURE_MODIFIERS;
}
