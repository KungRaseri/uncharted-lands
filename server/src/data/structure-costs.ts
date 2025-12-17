/**
 * Structure Costs Configuration
 *
 * Single source of truth for all structure costs, construction times, and requirements.
 * This data is used to seed the database and ensure consistency between server and client.
 *
 * Source: GDD-Monolith.md Section 6.3 'Construction Time Balance'
 * Last Updated: 2025-11-18
 */

export interface StructureCostDefinition {
	id: string;
	name: string;
	displayName: string;
	category: 'BUILDING' | 'EXTRACTOR';
	tier: 1 | 2 | 3 | 4 | 5;
	costs: {
		wood?: number;
		stone?: number;
		ore?: number;
		food?: number;
		water?: number;
	};
	constructionTimeSeconds: number;
	populationRequired: number;
	description: string;
}

export const STRUCTURE_COSTS: StructureCostDefinition[] = [
	// ==========================================
	// TIER 1: BASIC STRUCTURES (1-5 minutes)
	// ==========================================
	{
		id: 'TENT',
		name: 'TENT',
		displayName: 'Tent',
		category: 'BUILDING',
		tier: 1,
		costs: { wood: 10 },
		constructionTimeSeconds: 60,
		populationRequired: 0,
		description: 'Basic shelter, instant construction. Provides minimal population capacity.',
	},
	{
		id: 'FARM',
		name: 'FARM',
		displayName: 'Farm',
		category: 'EXTRACTOR',
		tier: 1,
		costs: { wood: 20, stone: 10 },
		constructionTimeSeconds: 180,
		populationRequired: 2,
		description: 'Produces food to sustain your population. Requires 2 workers.',
	},
	{
		id: 'LUMBER_MILL',
		name: 'LUMBER_MILL',
		displayName: 'Lumber Mill',
		category: 'EXTRACTOR',
		tier: 1,
		costs: { wood: 20, stone: 10 },
		constructionTimeSeconds: 180,
		populationRequired: 2,
		description: 'Extracts wood from nearby forest tiles. Requires 2 workers.',
	},
	{
		id: 'QUARRY',
		name: 'QUARRY',
		displayName: 'Quarry',
		category: 'EXTRACTOR',
		tier: 1,
		costs: { wood: 20, stone: 10 },
		constructionTimeSeconds: 180,
		populationRequired: 3,
		description: 'Extracts stone from rocky terrain. Requires 3 workers.',
	},
	{
		id: 'MINE',
		name: 'MINE',
		displayName: 'Mine',
		category: 'EXTRACTOR',
		tier: 1,
		costs: { wood: 30, stone: 20 },
		constructionTimeSeconds: 240,
		populationRequired: 3,
		description: 'Extracts ore from ore-rich deposits. Requires 3 workers.',
	},
	{
		id: 'WAREHOUSE',
		name: 'WAREHOUSE',
		displayName: 'Warehouse',
		category: 'BUILDING',
		tier: 1,
		costs: { wood: 40, stone: 20 },
		constructionTimeSeconds: 300,
		populationRequired: 0,
		description: 'Warehouse that increases resource storage capacity by 500 units per level.',
	},
	{
		id: 'FISHING_DOCK',
		name: 'FISHING_DOCK',
		displayName: 'Fishing Dock',
		category: 'EXTRACTOR',
		tier: 1,
		costs: { wood: 30, stone: 15 },
		constructionTimeSeconds: 240,
		populationRequired: 2,
		description: 'Extracts food from nearby water tiles. Requires 2 workers.',
	},
	{
		id: 'WELL',
		name: 'WELL',
		displayName: 'Well',
		category: 'EXTRACTOR',
		tier: 1,
		costs: { wood: 20, stone: 30 },
		constructionTimeSeconds: 240,
		populationRequired: 1,
		description: 'Extracts water from underground sources. Requires 1 worker.',
	},
	{
		id: 'HERB_GARDEN',
		name: 'HERB_GARDEN',
		displayName: 'Herb Garden',
		category: 'EXTRACTOR',
		tier: 1,
		costs: { wood: 25, stone: 10 },
		constructionTimeSeconds: 300,
		populationRequired: 1,
		description: 'Cultivates medicinal herbs for healing. Requires 1 worker.',
	},
	{
		id: 'HUNTING_LODGE',
		name: 'HUNTING_LODGE',
		displayName: 'Hunting Lodge',
		category: 'EXTRACTOR',
		tier: 1,
		costs: { wood: 35, stone: 15 },
		constructionTimeSeconds: 300,
		populationRequired: 2,
		description: 'Hunters gather food from wildlife. Requires 2 workers.',
	},
	{
		id: 'BARRACKS',
		name: 'BARRACKS',
		displayName: 'Barracks',
		category: 'BUILDING',
		tier: 2,
		costs: { wood: 80, stone: 60, ore: 20 },
		constructionTimeSeconds: 900,
		populationRequired: 0,
		description: 'Military structure for training soldiers and defense.',
	},
	{
		id: 'WALL',
		name: 'WALL',
		displayName: 'Wall',
		category: 'BUILDING',
		tier: 2,
		costs: { stone: 100, ore: 30 },
		constructionTimeSeconds: 1200,
		populationRequired: 0,
		description: 'Defensive structure that protects settlement from attacks.',
	},

	// ==========================================
	// TIER 2: INTERMEDIATE STRUCTURES (5-30 minutes)
	// ==========================================
	{
		id: 'HOUSE',
		name: 'HOUSE',
		displayName: 'House',
		category: 'BUILDING',
		tier: 2,
		costs: { wood: 50, stone: 20 },
		constructionTimeSeconds: 600,
		populationRequired: 0,
		description: 'Provides housing for 5 population. Upgradeable to increase capacity.',
	},
	{
		id: 'WORKSHOP',
		name: 'WORKSHOP',
		displayName: 'Workshop',
		category: 'BUILDING',
		tier: 2,
		costs: { wood: 60, stone: 60, ore: 30 },
		constructionTimeSeconds: 900,
		populationRequired: 2,
		description: 'Enables structure upgrades and provides +10% construction speed bonus.',
	},
	{
		id: 'MARKETPLACE',
		name: 'MARKETPLACE',
		displayName: 'Marketplace',
		category: 'BUILDING',
		tier: 2,
		costs: { wood: 120, stone: 80 },
		constructionTimeSeconds: 1800,
		populationRequired: 0,
		description: 'Trading hub for player-to-player commerce and NPC trade routes.',
	},
	{
		id: 'NPC_EMBASSY',
		name: 'NPC_EMBASSY',
		displayName: 'NPC Embassy',
		category: 'BUILDING',
		tier: 2,
		costs: { wood: 600, stone: 400, ore: 200 },
		constructionTimeSeconds: 1200,
		populationRequired: 0,
		description: 'Establishes diplomatic relations with NPC settlements. Unlocks quests and trade.',
	},
	{
		id: 'TRADE_CARAVAN_STATION',
		name: 'TRADE_CARAVAN_STATION',
		displayName: 'Trade Caravan Station',
		category: 'BUILDING',
		tier: 2,
		costs: { wood: 400, stone: 300, ore: 100 },
		constructionTimeSeconds: 1200,
		populationRequired: 0,
		description: 'NPC trade caravans visit regularly, offering special goods at discounted rates.',
	},

	// ==========================================
	// TIER 3: ADVANCED STRUCTURES (30min - 4 hours)
	// ==========================================
	{
		id: 'TOWN_HALL',
		name: 'TOWN_HALL',
		displayName: 'Town Hall',
		category: 'BUILDING',
		tier: 3,
		costs: { wood: 200, stone: 150, ore: 50 },
		constructionTimeSeconds: 3600,
		populationRequired: 0,
		description: 'Unlocks advanced settlement features and enables settlement tier upgrades.',
	},
	{
		id: 'RESEARCH_LAB',
		name: 'RESEARCH_LAB',
		displayName: 'Research Lab',
		category: 'BUILDING',
		tier: 3,
		costs: { wood: 500, stone: 400, ore: 200 },
		constructionTimeSeconds: 5400,
		populationRequired: 5,
		description: 'Required for technology research. Base research speed. Requires 5 workers.',
	},
	{
		id: 'HOSPITAL',
		name: 'HOSPITAL',
		displayName: 'Hospital',
		category: 'BUILDING',
		tier: 3,
		costs: { wood: 500, stone: 300, ore: 100 },
		constructionTimeSeconds: 7200,
		populationRequired: 3,
		description: 'Treats disaster casualties, saves 50% with resources. Requires 3 workers.',
	},
	{
		id: 'LIBRARY',
		name: 'LIBRARY',
		displayName: 'Library',
		category: 'BUILDING',
		tier: 3,
		costs: { wood: 400, stone: 300 },
		constructionTimeSeconds: 3600,
		populationRequired: 0,
		description: 'Provides +20% research speed bonus when active during research.',
	},
	{
		id: 'RELIEF_CENTER',
		name: 'RELIEF_CENTER',
		displayName: 'Relief Center',
		category: 'BUILDING',
		tier: 3,
		costs: { wood: 400, stone: 250 },
		constructionTimeSeconds: 4800,
		populationRequired: 0,
		description: 'Distributes emergency supplies post-disaster, stabilizes happiness +20.',
	},
	{
		id: 'DISASTER_COMMAND_CENTER',
		name: 'DISASTER_COMMAND_CENTER',
		displayName: 'Disaster Command Center',
		category: 'BUILDING',
		tier: 3,
		costs: { wood: 800, stone: 600, ore: 300 },
		constructionTimeSeconds: 14400,
		populationRequired: 0,
		description: 'Command center for coordinating large-scale disaster response efforts.',
	},

	// ==========================================
	// TIER 4: DISASTER DEFENSE (2-8 hours)
	// ==========================================
	{
		id: 'EMERGENCY_SHELTER',
		name: 'EMERGENCY_SHELTER',
		displayName: 'Emergency Shelter',
		category: 'BUILDING',
		tier: 4,
		costs: { wood: 300, stone: 200 },
		constructionTimeSeconds: 7200,
		populationRequired: 0,
		description:
			'Protects 50 population from disaster casualties. Consumes food/water when active.',
	},
	{
		id: 'WATCHTOWER',
		name: 'WATCHTOWER',
		displayName: 'Watchtower',
		category: 'BUILDING',
		tier: 4,
		costs: { wood: 200, stone: 150 },
		constructionTimeSeconds: 10800,
		populationRequired: 2,
		description: 'Provides 1-hour advance disaster warning. Requires 2 scouts when active.',
	},
	{
		id: 'SEISMOLOGY_STATION',
		name: 'SEISMOLOGY_STATION',
		displayName: 'Seismology Station',
		category: 'BUILDING',
		tier: 4,
		costs: { wood: 600, stone: 500, ore: 300 },
		constructionTimeSeconds: 21600,
		populationRequired: 3,
		description:
			'Early warning for seismic disasters (earthquakes, landslides). Requires 3 workers.',
	},
	{
		id: 'METEOROLOGY_CENTER',
		name: 'METEOROLOGY_CENTER',
		displayName: 'Meteorology Center',
		category: 'BUILDING',
		tier: 4,
		costs: { wood: 600, stone: 500, ore: 300 },
		constructionTimeSeconds: 21600,
		populationRequired: 3,
		description:
			'Early warning for weather disasters (storms, droughts, floods). Requires 3 workers.',
	},
	{
		id: 'NPC_GUEST_QUARTERS',
		name: 'NPC_GUEST_QUARTERS',
		displayName: 'NPC Guest Quarters',
		category: 'BUILDING',
		tier: 4,
		costs: { wood: 300, stone: 200 },
		constructionTimeSeconds: 7200,
		populationRequired: 0,
		description: 'Host NPC specialists for temporary bonuses. Capacity for 3 NPCs simultaneously.',
	},

	// ==========================================
	// TIER 5: GUILD & SPECIALIZATION (12 hours - 30 days)
	// ==========================================
	{
		id: 'GUILD_HEADQUARTERS',
		name: 'GUILD_HEADQUARTERS',
		displayName: 'Guild Headquarters',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 1000, stone: 800, ore: 300 },
		constructionTimeSeconds: 86400,
		populationRequired: 0,
		description:
			'Main guild base. Unlocks guild storage, projects, and monuments. Guild leader only.',
	},
	{
		id: 'GUILD_OUTPOST',
		name: 'GUILD_OUTPOST',
		displayName: 'Guild Outpost',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 200, stone: 150 },
		constructionTimeSeconds: 7200,
		populationRequired: 0,
		description: 'Local guild presence in member settlements. Provides guild benefits and storage.',
	},
	{
		id: 'GUILD_WORKSHOP',
		name: 'GUILD_WORKSHOP',
		displayName: 'Guild Workshop',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 600, stone: 500, ore: 200 },
		constructionTimeSeconds: 43200,
		populationRequired: 0,
		description: 'Guild crafting facility. +20% faster cooperative project completion.',
	},
	{
		id: 'GUILD_MONUMENT',
		name: 'GUILD_MONUMENT',
		displayName: 'Guild Monument',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 5000, stone: 5000, ore: 2000 },
		constructionTimeSeconds: 2592000,
		populationRequired: 0,
		description:
			'Massive cooperative project (30 days). Cosmetic prestige structure for elite guilds.',
	},
	{
		id: 'ALLIANCE_PAVILION',
		name: 'ALLIANCE_PAVILION',
		displayName: 'Alliance Pavilion',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 800, stone: 600, ore: 200 },
		constructionTimeSeconds: 28800,
		populationRequired: 0,
		description: 'Enables permanent alliances, shared warnings, and emergency aid coordination.',
	},
	{
		id: 'ADVANCED_GREENHOUSE',
		name: 'ADVANCED_GREENHOUSE',
		displayName: 'Advanced Greenhouse',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 1200, stone: 800, ore: 300 },
		constructionTimeSeconds: 43200,
		populationRequired: 0,
		description: 'Agricultural specialization. +50% food/herb production, -30% ore, -20% stone.',
	},
	{
		id: 'DEEP_MINING_COMPLEX',
		name: 'DEEP_MINING_COMPLEX',
		displayName: 'Deep Mining Complex',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 1500, stone: 1000, ore: 500 },
		constructionTimeSeconds: 57600,
		populationRequired: 0,
		description: 'Mining specialization. +60% ore, +40% stone, -20% food, +30% water consumption.',
	},
	{
		id: 'FORTRESS',
		name: 'FORTRESS',
		displayName: 'Fortress',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 800, stone: 2000, ore: 800 },
		constructionTimeSeconds: 86400,
		populationRequired: 0,
		description: 'Defensive specialization. +30% disaster resistance, -15% all production.',
	},
	{
		id: 'GRAND_MARKET',
		name: 'GRAND_MARKET',
		displayName: 'Grand Market',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 1000, stone: 800, ore: 600 },
		constructionTimeSeconds: 43200,
		populationRequired: 0,
		description: 'Trade specialization. +25% trade discount, -20% resource production.',
	},
	{
		id: 'ADVANCED_ACADEMY',
		name: 'ADVANCED_ACADEMY',
		displayName: 'Advanced Academy',
		category: 'BUILDING',
		tier: 5,
		costs: { wood: 1500, stone: 1200, ore: 800 },
		constructionTimeSeconds: 57600,
		populationRequired: 0,
		description: 'Research specialization. +50% research speed, -25% resource production.',
	},
];

/**
 * Helper function to get structure cost definition by ID
 */
export function getStructureCost(structureId: string): StructureCostDefinition | undefined {
	return STRUCTURE_COSTS.find((s) => s.id === structureId);
}

/**
 * Helper function to get structure cost definition by name (case-sensitive)
 */
export function getStructureCostByName(structureName: string): StructureCostDefinition | undefined {
	return STRUCTURE_COSTS.find((s) => s.name === structureName);
}

/**
 * Get all structure costs for a specific tier
 */
export function getStructuresByTier(tier: 1 | 2 | 3 | 4 | 5): StructureCostDefinition[] {
	return STRUCTURE_COSTS.filter((s) => s.tier === tier);
}

/**
 * Get all structure costs for a specific category
 */
export function getStructuresByCategory(
	category: 'BUILDING' | 'EXTRACTOR'
): StructureCostDefinition[] {
	return STRUCTURE_COSTS.filter((s) => s.category === category);
}

/**
 * Validate if a structure name exists in the configuration
 */
export function isValidStructure(structureName: string): boolean {
	return getStructureCostByName(structureName) !== undefined;
}

/**
 * Get all structure cost definitions
 * @returns Array of all structure cost configurations
 */
export function getAllStructureCosts(): StructureCostDefinition[] {
	return STRUCTURE_COSTS;
}

/**
 * Type alias for backwards compatibility with API routes
 */
export type StructureCost = StructureCostDefinition;
