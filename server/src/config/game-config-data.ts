/**
 * Game Configuration - Default Data
 *
 * Imports types from shared package and defines the DEFAULT_GAME_CONFIG data.
 * This is the single source of truth for game configuration values.
 */

import type { GameConfig, BiomeDisplayConfig, BiomeType } from '@uncharted-lands/shared';

// Re-export all types and constants from shared for convenience
export * from '@uncharted-lands/shared';

// ===========================
// BIOME DISPLAY CONFIGURATION
// ===========================

/**
 * Biome Display Configuration
 * Icons, colors, and descriptions for UI rendering
 * Colors use Skeleton UI variant classes
 */
export const BIOME_DISPLAY_CONFIG = {
	GRASSLAND: {
		icon: '🌾',
		color: 'variant-soft-success',
		name: 'Grassland',
		description: 'Fertile plains ideal for farming',
	},
	FOREST: {
		icon: '🌲',
		color: 'variant-soft-primary',
		name: 'Forest',
		description: 'Dense woodlands rich in timber',
	},
	DESERT: {
		icon: '🏜️',
		color: 'variant-soft-warning',
		name: 'Desert',
		description: 'Arid wasteland with scarce water',
	},
	MOUNTAIN: {
		icon: '⛰️',
		color: 'variant-soft-surface',
		name: 'Mountain',
		description: 'Rocky highlands rich in stone and ore',
	},
	TUNDRA: {
		icon: '🧊',
		color: 'variant-soft-tertiary',
		name: 'Tundra',
		description: 'Frozen plains with harsh conditions',
	},
	SWAMP: {
		icon: '🌿',
		color: 'variant-soft-secondary',
		name: 'Swamp',
		description: 'Wetlands with unique resources',
	},
	COASTAL: {
		icon: '🏖️',
		color: 'variant-soft-primary',
		name: 'Coastal',
		description: 'Shoreline with access to fishing',
	},
	OCEAN: {
		icon: '🌊',
		color: 'variant-soft-primary',
		name: 'Ocean',
		description: 'Deep waters unsuitable for settlement',
	},
} as const satisfies Record<string, BiomeDisplayConfig>;

export type BiomeTypeLocal = keyof typeof BIOME_DISPLAY_CONFIG;

// ===========================
// DEFAULT CONFIG (Fallback)
// ===========================

export const DEFAULT_GAME_CONFIG: GameConfig = {
	productionRates: [
		{ resourceType: 'FOOD', extractorType: 'FARM', baseRate: 10 },
		{ resourceType: 'WATER', extractorType: 'WELL', baseRate: 15 },
		{ resourceType: 'WOOD', extractorType: 'LUMBER_MILL', baseRate: 8 },
		{ resourceType: 'STONE', extractorType: 'QUARRY', baseRate: 6 },
		{ resourceType: 'ORE', extractorType: 'MINE', baseRate: 4 },
		{ resourceType: 'CLAY', extractorType: 'QUARRY', baseRate: 3 },
		{ resourceType: 'HERBS', extractorType: 'HERB_GARDEN', baseRate: 5 },
		{ resourceType: 'PELTS', extractorType: 'HUNTING_LODGE', baseRate: 4 },
		{ resourceType: 'GEMS', extractorType: 'MINE', baseRate: 1 },
		{ resourceType: 'EXOTIC_WOOD', extractorType: 'LUMBER_MILL', baseRate: 2 },
	],
	biomeEfficiencies: [
		// Tropical Rainforest
		{ biomeName: 'Tropical Rainforest', resourceType: 'FOOD', efficiency: 1.5 },
		{ biomeName: 'Tropical Rainforest', resourceType: 'WOOD', efficiency: 2 },
		{ biomeName: 'Tropical Rainforest', resourceType: 'STONE', efficiency: 0.5 },
		{ biomeName: 'Tropical Rainforest', resourceType: 'ORE', efficiency: 0.5 },
		{ biomeName: 'Tropical Rainforest', resourceType: 'HERBS', efficiency: 1.8 },
		{ biomeName: 'Tropical Rainforest', resourceType: 'PELTS', efficiency: 1.2 },
		// Add more as needed...
	],
	structureLevels: [
		{ level: 1, multiplier: 1 },
		{ level: 2, multiplier: 1.5, requirements: { wood: 100, stone: 50 } },
		{ level: 3, multiplier: 2.25, requirements: { wood: 200, stone: 100, ore: 50 } },
		{ level: 4, multiplier: 3.375, requirements: { wood: 400, stone: 200, ore: 100 } },
		{ level: 5, multiplier: 5.0625, requirements: { wood: 800, stone: 400, ore: 200 } },
	],
	qualityThresholds: {
		veryPoor: 20,
		poor: 40,
		average: 60,
		good: 80,
		excellent: 100,
	},
	resourceDisplay: [
		{ type: 'FOOD', name: 'Food', icon: '🌾', description: 'Basic sustenance for your people' },
		{ type: 'WATER', name: 'Water', icon: '💧', description: 'Vital for survival and growth' },
		{ type: 'WOOD', name: 'Wood', icon: '🪵', description: 'Essential building material' },
		{ type: 'STONE', name: 'Stone', icon: '🪨', description: 'Durable construction resource' },
		{ type: 'ORE', name: 'Ore', icon: '⛏️', description: 'Metal for advanced structures' },
		{ type: 'CLAY', name: 'Clay', icon: '🧱', description: 'Pottery and construction material' },
		{ type: 'HERBS', name: 'Herbs', icon: '🌿', description: 'Medicinal plants' },
		{ type: 'PELTS', name: 'Pelts', icon: '🦊', description: 'Animal furs for trade' },
		{ type: 'GEMS', name: 'Gems', icon: '💎', description: 'Rare precious stones' },
		{ type: 'EXOTIC_WOOD', name: 'Exotic Wood', icon: '🌳', description: 'Rare hardwood timber' },
	],
	extractorDisplay: [
		{ type: 'FARM', name: 'Farm', icon: '🚜', description: 'Cultivates crops for food production' },
		{
			type: 'WELL',
			name: 'Well',
			icon: '🕳️',
			description: 'Extracts groundwater for settlement use',
		},
		{
			type: 'LUMBER_MILL',
			name: 'Lumber Mill',
			icon: '🪚',
			description: 'Harvests and processes timber',
		},
		{
			type: 'QUARRY',
			name: 'Quarry',
			icon: '⛏️',
			description: 'Extracts stone and clay from rock',
		},
		{ type: 'MINE', name: 'Mine', icon: '⚒️', description: 'Digs deep for ore and gems' },
		{
			type: 'FISHING_DOCK',
			name: 'Fishing Dock',
			icon: '🎣',
			description: 'Catches fish from water',
		},
		{
			type: 'HUNTING_LODGE',
			name: "Hunter's Lodge",
			icon: '🏹',
			description: 'Hunts wildlife for pelts',
		},
		{
			type: 'HERB_GARDEN',
			name: 'Herb Garden',
			icon: '🌿',
			description: 'Cultivates medicinal herbs',
		},
	],
	buildingDisplay: [
		{ type: 'HOUSE', name: 'House', icon: '🏠', description: 'Housing for settlers' },
		{ type: 'STORAGE', name: 'Storage', icon: '📦', description: 'Stores resources' },
		{ type: 'BARRACKS', name: 'Barracks', icon: '⚔️', description: 'Military training facility' },
		{ type: 'WORKSHOP', name: 'Workshop', icon: '🔨', description: 'Crafts tools and equipment' },
		{ type: 'MARKETPLACE', name: 'Marketplace', icon: '🏪', description: 'Enables trade' },
		{ type: 'TOWN_HALL', name: 'Town Hall', icon: '🏛️', description: 'Administrative center' },
		{ type: 'WALL', name: 'Wall', icon: '🧱', description: 'Defensive fortification' },
	],
	biomeDisplay: BIOME_DISPLAY_CONFIG as Record<BiomeType, BiomeDisplayConfig>,
	qualityDisplay: [
		{ threshold: 20, rating: 'Very Poor', color: 'text-red-600', multiplier: 0.5 },
		{ threshold: 40, rating: 'Poor', color: 'text-orange-600', multiplier: 0.75 },
		{ threshold: 60, rating: 'Average', color: 'text-yellow-600', multiplier: 1 },
		{ threshold: 80, rating: 'Good', color: 'text-green-600', multiplier: 1.5 },
		{ threshold: 100, rating: 'Excellent', color: 'text-blue-600', multiplier: 2 },
	],
	accumulation: {
		fullRateHours: 24,
		tier1Multiplier: 0.5,
		tier1Hours: 48,
		tier2Multiplier: 0.25,
		tier2Hours: 96,
		maxHours: 96,
	},
	gameLoopTimingConfig: {
		tickRate: Number.parseInt(process.env.TICK_RATE || '60', 10),
		resourceIntervalSec: Number.parseInt(process.env.RESOURCE_INTERVAL_SEC || '3600', 10),
		populationIntervalSec: Number.parseInt(process.env.POPULATION_INTERVAL_SEC || '3600', 10),
		socketEmitIntervalSec: Number.parseInt(process.env.SOCKET_EMIT_INTERVAL_SEC || '5', 10),
	},
};
