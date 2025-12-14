/**
 * Extractor Configuration Utilities
 *
 * Centralized extractor type configuration matching server-side data.
 * Maps extractor types to resources, icons, and metadata.
 */

/**
 * Extractor types from server schema
 * Must match server/src/db/schema.ts extractorTypeEnum
 */
export const EXTRACTOR_TYPES = [
	'FARM',
	'WELL',
	'LUMBER_MILL',
	'QUARRY',
	'MINE',
	'FISHING_DOCK',
	'HUNTING_LODGE',
	'HERB_GARDEN'
] as const;

export type ExtractorType = (typeof EXTRACTOR_TYPES)[number];

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
 * Extractor display configuration
 */
export interface ExtractorDisplayConfig {
	type: ExtractorType;
	resourceType: ResourceType;
	icon: string;
	produces: string; // Human-readable resource name
	name: string; // Extractor display name
	description: string;
}

/**
 * Centralized extractor configuration
 * Used to determine what resource an extractor produces and its display info
 */
export const EXTRACTOR_CONFIG: Record<ExtractorType, ExtractorDisplayConfig> = {
	FARM: {
		type: 'FARM',
		resourceType: 'FOOD',
		icon: '🌾',
		produces: 'Food',
		name: 'Farm',
		description: 'Produces food from crops'
	},
	WELL: {
		type: 'WELL',
		resourceType: 'WATER',
		icon: '💧',
		produces: 'Water',
		name: 'Well',
		description: 'Extracts fresh water'
	},
	LUMBER_MILL: {
		type: 'LUMBER_MILL',
		resourceType: 'WOOD',
		icon: '🪵',
		produces: 'Wood',
		name: 'Lumber Mill',
		description: 'Harvests wood from forests'
	},
	QUARRY: {
		type: 'QUARRY',
		resourceType: 'STONE',
		icon: '🪨',
		produces: 'Stone',
		name: 'Quarry',
		description: 'Extracts stone from quarries'
	},
	MINE: {
		type: 'MINE',
		resourceType: 'ORE',
		icon: '⛏️',
		produces: 'Ore',
		name: 'Mine',
		description: 'Mines ore from deposits'
	},
	FISHING_DOCK: {
		type: 'FISHING_DOCK',
		resourceType: 'FOOD',
		icon: '🎣',
		produces: 'Food',
		name: 'Fishing Dock',
		description: 'Catches fish from water'
	},
	HUNTING_LODGE: {
		type: 'HUNTING_LODGE',
		resourceType: 'FOOD',
		icon: '🏹',
		produces: 'Food',
		name: 'Hunting Lodge',
		description: 'Hunts game for food'
	},
	HERB_GARDEN: {
		type: 'HERB_GARDEN',
		resourceType: 'HERBS',
		icon: '🌿',
		produces: 'Herbs',
		name: 'Herb Garden',
		description: 'Cultivates medicinal herbs'
	}
};

/**
 * Get extractor configuration by type
 * @param extractorType - Extractor type (case-insensitive)
 * @returns Extractor display config or undefined if not found
 */
export function getExtractorConfig(extractorType: string): ExtractorDisplayConfig | undefined {
	const type = extractorType.toUpperCase() as ExtractorType;
	return EXTRACTOR_CONFIG[type];
}

/**
 * Get resource type that an extractor produces
 * @param extractorType - Extractor type
 * @returns Resource type or undefined
 */
export function getExtractorResourceType(extractorType: string): ResourceType | undefined {
	return getExtractorConfig(extractorType)?.resourceType;
}

/**
 * Get extractor icon
 * @param extractorType - Extractor type
 * @returns Emoji icon or empty string
 */
export function getExtractorIcon(extractorType: string): string {
	return getExtractorConfig(extractorType)?.icon ?? '';
}

/**
 * Get human-readable resource name produced by extractor
 * @param extractorType - Extractor type
 * @returns Resource name or 'Unknown'
 */
export function getExtractorProduces(extractorType: string): string {
	return getExtractorConfig(extractorType)?.produces ?? 'Unknown';
}

/**
 * Get extractor display name
 * @param extractorType - Extractor type
 * @returns Display name or original type
 */
export function getExtractorName(extractorType: string): string {
	return getExtractorConfig(extractorType)?.name ?? extractorType;
}

/**
 * Filter extractors by resource type
 * @param resourceType - Resource type to filter by
 * @returns Array of extractor types that produce this resource
 */
export function getExtractorsForResource(resourceType: ResourceType): ExtractorType[] {
	return Object.entries(EXTRACTOR_CONFIG)
		.filter(([_, config]) => config.resourceType === resourceType)
		.map(([type, _]) => type as ExtractorType);
}
