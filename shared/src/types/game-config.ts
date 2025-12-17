/**
 * Game Configuration Types and Constants
 *
 * This file defines the shared game configuration that should be consistent
 * between client and server. These can be stored in the database and fetched
 * via API to ensure consistency.
 */

// ===========================
// ENUMS (Shared between client/server)
// ===========================

export const RESOURCE_TYPES = [
	'FOOD',
	'WATER',
	'WOOD',
	'STONE',
	'ORE',
	'CLAY',
	'HERBS',
	'PELTS',
	'GEMS',
	'EXOTIC_WOOD',
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

export const EXTRACTOR_TYPES = [
	'FARM',
	'WELL',
	'LUMBER_MILL',
	'QUARRY',
	'MINE',
	'FISHING_DOCK',
	'HUNTING_LODGE',
	'HERB_GARDEN',
] as const;

export type ExtractorType = (typeof EXTRACTOR_TYPES)[number];

export const BUILDING_TYPES = [
	'HOUSE',
	'STORAGE',
	'BARRACKS',
	'WORKSHOP',
	'MARKETPLACE',
	'TOWN_HALL',
	'WALL',
] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

export const SPECIAL_RESOURCES = ['GEMS', 'EXOTIC_WOOD', 'MAGICAL_HERBS', 'ANCIENT_STONE'] as const;

export type SpecialResource = (typeof SPECIAL_RESOURCES)[number];

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
} as const;

export type BiomeType = keyof typeof BIOME_DISPLAY_CONFIG;

export interface BiomeDisplayConfig {
	icon: string;
	color: string;
	name: string;
	description: string;
}

// ===========================
// CONFIGURATION TYPES
// ===========================

export interface ResourceDisplayConfig {
	type: ResourceType;
	name: string;
	icon: string;
	description?: string;
}

export interface ExtractorDisplayConfig {
	type: ExtractorType;
	name: string;
	icon?: string;
	description?: string;
}

export interface BuildingDisplayConfig {
	type: BuildingType;
	name: string;
	icon?: string;
	description?: string;
}

export interface QualityDisplayConfig {
	threshold: number;
	rating: string;
	color: string;
	multiplier: number;
}

export interface AccumulationConfig {
	/** Hours before diminishing returns start */
	fullRateHours: number;
	/** Multiplier for next tier (e.g., 0.5 = 50% rate) */
	tier1Multiplier: number;
	/** Hours before second diminishing returns tier */
	tier1Hours: number;
	/** Multiplier for third tier */
	tier2Multiplier: number;
	/** Hours before third diminishing returns tier */
	tier2Hours: number;
	/** Maximum effective hours cap */
	maxHours: number;
}

export interface GameLoopTimingConfig {
	/** Tick rate (ticks per second) */
	tickRate: number;
	/** Resource calculation interval (seconds) */
	resourceIntervalSec: number;
	/** Population update interval (seconds) */
	populationIntervalSec: number;
	/** Socket.IO emit interval (seconds) */
	socketEmitIntervalSec: number;
}

export interface ProductionRateConfig {
	resourceType: ResourceType;
	extractorType: ExtractorType;
	baseRate: number; // Units per hour at level 1
}

export interface BiomeEfficiencyConfig {
	biomeName: string;
	resourceType: ResourceType;
	efficiency: number; // Multiplier (0-2+)
}

export interface StructureLevelConfig {
	level: number;
	multiplier: number;
	requirements?: {
		food?: number;
		wood?: number;
		stone?: number;
		ore?: number;
	};
}

export interface GameConfig {
	productionRates: ProductionRateConfig[];
	biomeEfficiencies: BiomeEfficiencyConfig[];
	structureLevels: StructureLevelConfig[];
	qualityThresholds: {
		veryPoor: number;
		poor: number;
		average: number;
		good: number;
		excellent: number;
	};
	resourceDisplay: ResourceDisplayConfig[];
	extractorDisplay: ExtractorDisplayConfig[];
	buildingDisplay: BuildingDisplayConfig[];
	biomeDisplay: Record<BiomeType, BiomeDisplayConfig>;
	qualityDisplay: QualityDisplayConfig[];
	accumulation: AccumulationConfig;
	gameLoopTimingConfig: GameLoopTimingConfig;
}
