/**
 * Resource Configuration Utilities
 *
 * Centralized resource type configuration matching server-side data.
 * Maps resource types to icons, labels, and metadata.
 */

/**
 * Resource types from server schema
 * Must match server/src/db/schema.ts resourceTypeEnum
 */
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
	'EXOTIC_WOOD'
] as const;

export type ResourceType = (typeof RESOURCE_TYPES)[number];

/**
 * Resource display configuration
 */
export interface ResourceDisplayConfig {
	type: ResourceType;
	name: string; // Human-readable name
	icon: string; // Emoji icon
	description: string;
	category: 'basic' | 'special'; // Basic resources vs special/rare
	storageMultiplier: number; // Default storage capacity multiplier
}

/**
 * Centralized resource configuration
 * Used for display, icons, and resource metadata
 */
export const RESOURCE_CONFIG: Record<ResourceType, ResourceDisplayConfig> = {
	FOOD: {
		type: 'FOOD',
		name: 'Food',
		icon: '🌾',
		description: 'Sustains population',
		category: 'basic',
		storageMultiplier: 1
	},
	WATER: {
		type: 'WATER',
		name: 'Water',
		icon: '💧',
		description: 'Essential for survival',
		category: 'basic',
		storageMultiplier: 1
	},
	WOOD: {
		type: 'WOOD',
		name: 'Wood',
		icon: '🪵',
		description: 'Basic building material',
		category: 'basic',
		storageMultiplier: 1
	},
	STONE: {
		type: 'STONE',
		name: 'Stone',
		icon: '🪨',
		description: 'Durable construction material',
		category: 'basic',
		storageMultiplier: 1
	},
	ORE: {
		type: 'ORE',
		name: 'Ore',
		icon: '⛏️',
		description: 'Metallic minerals for tools',
		category: 'basic',
		storageMultiplier: 0.8 // Ore is heavier, less storage
	},
	CLAY: {
		type: 'CLAY',
		name: 'Clay',
		icon: '🧱',
		description: 'Ceramic and brick material',
		category: 'special',
		storageMultiplier: 0.9
	},
	HERBS: {
		type: 'HERBS',
		name: 'Herbs',
		icon: '🌿',
		description: 'Medicinal plants',
		category: 'special',
		storageMultiplier: 0.5 // Herbs take less space
	},
	PELTS: {
		type: 'PELTS',
		name: 'Pelts',
		icon: '🦌',
		description: 'Animal hides for trade',
		category: 'special',
		storageMultiplier: 0.7
	},
	GEMS: {
		type: 'GEMS',
		name: 'Gems',
		icon: '💎',
		description: 'Precious stones',
		category: 'special',
		storageMultiplier: 0.3 // Gems are very dense
	},
	EXOTIC_WOOD: {
		type: 'EXOTIC_WOOD',
		name: 'Exotic Wood',
		icon: '🌳',
		description: 'Rare hardwood for luxury items',
		category: 'special',
		storageMultiplier: 0.8
	}
};

/**
 * Get resource configuration by type
 * @param resourceType - Resource type (case-insensitive)
 * @returns Resource display config or undefined if not found
 */
export function getResourceConfig(resourceType: string): ResourceDisplayConfig | undefined {
	const type = resourceType.toUpperCase() as ResourceType;
	return RESOURCE_CONFIG[type];
}

/**
 * Get resource icon
 * @param resourceType - Resource type
 * @returns Emoji icon or empty string
 */
export function getResourceIcon(resourceType: string): string {
	return getResourceConfig(resourceType)?.icon ?? '';
}

/**
 * Get resource display name
 * @param resourceType - Resource type
 * @returns Human-readable name or original type
 */
export function getResourceName(resourceType: string): string {
	return getResourceConfig(resourceType)?.name ?? resourceType;
}

/**
 * Get resource description
 * @param resourceType - Resource type
 * @returns Description or empty string
 */
export function getResourceDescription(resourceType: string): string {
	return getResourceConfig(resourceType)?.description ?? '';
}

/**
 * Get basic resources only (excludes special resources)
 * @returns Array of basic resource types
 */
export function getBasicResources(): ResourceType[] {
	return Object.values(RESOURCE_CONFIG)
		.filter((config) => config.category === 'basic')
		.map((config) => config.type);
}

/**
 * Get special resources only
 * @returns Array of special resource types
 */
export function getSpecialResources(): ResourceType[] {
	return Object.values(RESOURCE_CONFIG)
		.filter((config) => config.category === 'special')
		.map((config) => config.type);
}

/**
 * Check if resource is a basic resource
 * @param resourceType - Resource type to check
 * @returns True if basic resource
 */
export function isBasicResource(resourceType: string): boolean {
	const config = getResourceConfig(resourceType);
	return config ? config.category === 'basic' : false;
}

/**
 * Check if resource is a special/rare resource
 * @param resourceType - Resource type to check
 * @returns True if special resource
 */
export function isSpecialResource(resourceType: string): boolean {
	const config = getResourceConfig(resourceType);
	return config ? config.category === 'special' : false;
}
