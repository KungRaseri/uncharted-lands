/**
 * Structure Master Data
 * Single source of truth for all structures in the game
 */

export type StructureCategory = 'BUILDING' | 'EXTRACTOR';
export type ExtractorType =
	| 'FARM'
	| 'WELL'
	| 'LUMBER_MILL'
	| 'QUARRY'
	| 'MINE'
	| 'FISHING_DOCK'
	| 'HUNTING_LODGE'
	| 'HERB_GARDEN'
	| null;

export type BuildingType =
	| 'HOUSE'
	| 'STORAGE'
	| 'WORKSHOP'
	| 'MARKETPLACE'
	| 'TOWN_HALL'
	| null;

export interface StructureDefinition {
	name: string;
	description: string;
	category: StructureCategory;
	extractorType: ExtractorType;
	buildingType: BuildingType;
	maxLevel?: number; // DEPRECATED: Kept for backwards compatibility, no longer enforced
	requirements: {
		food?: number;
		water?: number;
		wood?: number;
		stone?: number;
		ore?: number;
	};
	// Building Area System properties
	unique: boolean; // Can only build one per settlement?
	areaCost: number; // Area consumed (0 for extractors)
	minTownHallLevel: number; // Tier gating - minimum Town Hall level required
}

export const STRUCTURES: StructureDefinition[] = [
	{
		name: 'Tent',
		description: 'Basic shelter for settlers (+2 population per level)',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'HOUSE',
		maxLevel: 3,
		requirements: {
			food: 5,
			water: 2,
			wood: 10,
		},
		unique: false,
		areaCost: 25,
		minTownHallLevel: 0, // Available immediately at Outpost tier
	},
	{
		name: 'House',
		description: 'Provides housing capacity for settlers (+5 population per level)',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'HOUSE',
		maxLevel: 10,
		requirements: {
			wood: 50,
			stone: 20,
		},
		unique: false,
		areaCost: 50,
		minTownHallLevel: 1, // Requires Town Hall Level 1 (Village tier)
	},
	{
		name: 'Warehouse',
		description: 'Increases storage capacity (+500 storage per level)',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'STORAGE',
		maxLevel: 10,
		requirements: {
			wood: 40,
			stone: 20,
		},
		unique: false,
		areaCost: 50,
		minTownHallLevel: 0, // Available immediately at Outpost tier
	},
	{
		name: 'Town Hall',
		description: 'Administrative center for the settlement (+100 area capacity per level)',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'TOWN_HALL',
		maxLevel: 10,
		requirements: {
			wood: 200,
			stone: 150,
			ore: 50,
		},
		unique: true,
		areaCost: 100,
		minTownHallLevel: 0, // Can build at Outpost tier
	},
	{
		name: 'Workshop',
		description: 'Allows upgrading structures (+10% construction speed per level)',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'WORKSHOP',
		maxLevel: 10,
		requirements: {
			wood: 60,
			stone: 60,
			ore: 30,
		},
		unique: true,
		areaCost: 75,
		minTownHallLevel: 1, // Requires Town Hall Level 1 (Village tier)
	},
	{
		name: 'Farm',
		description: 'Produces food',
		category: 'EXTRACTOR',
		extractorType: 'FARM',
		buildingType: null,
		// maxLevel removed - infinite progression enabled
		requirements: {
			wood: 20,
			stone: 10,
		},
		unique: false,
		areaCost: 0, // Extractors use plotSlots system, not building area
		minTownHallLevel: 0,
	},
	{
		name: 'Quarry',
		description: 'Extracts stone from the ground',
		category: 'EXTRACTOR',
		extractorType: 'QUARRY',
		buildingType: null,
		requirements: {
			wood: 30,
			stone: 20,
		},
		unique: false,
		areaCost: 0,
		minTownHallLevel: 0,
	},
	{
		name: 'Mine',
		description: 'Extracts ore from the ground',
		category: 'EXTRACTOR',
		extractorType: 'MINE',
		buildingType: null,
		requirements: {
			wood: 40,
			stone: 30,
		},
		unique: false,
		areaCost: 0,
		minTownHallLevel: 1, // Advanced extractor - Village tier
	},
	{
		name: 'Lumber Mill',
		description: 'Produces wood',
		category: 'EXTRACTOR',
		extractorType: 'LUMBER_MILL',
		buildingType: null,
		requirements: {
			wood: 20,
			stone: 10,
		},
		unique: false,
		areaCost: 0,
		minTownHallLevel: 0,
	},
	{
		name: 'Fishing Dock',
		description: 'Produces food from water',
		category: 'EXTRACTOR',
		extractorType: 'FISHING_DOCK',
		buildingType: null,
		requirements: {
			wood: 30,
			stone: 15,
		},
		unique: false,
		areaCost: 0,
		minTownHallLevel: 1, // Advanced extractor - Village tier
	},
	{
		name: 'Hunting Lodge',
		description: 'Produces pelts and food from hunting',
		category: 'EXTRACTOR',
		extractorType: 'HUNTING_LODGE',
		buildingType: null,
		requirements: {
			wood: 25,
			stone: 10,
		},
		unique: false,
		areaCost: 0,
		minTownHallLevel: 1, // Advanced extractor - Village tier
	},
	{
		name: 'Well',
		description: 'Provides water to the settlement',
		category: 'EXTRACTOR',
		extractorType: 'WELL',
		buildingType: null,
		requirements: {
			wood: 15,
			stone: 20,
		},
		unique: false,
		areaCost: 0,
		minTownHallLevel: 0,
	},
	{
		name: 'Herb Garden',
		description: 'Grows medicinal herbs',
		category: 'EXTRACTOR',
		extractorType: 'HERB_GARDEN',
		buildingType: null,
		requirements: {
			wood: 15,
			stone: 5,
		},
		unique: false,
		areaCost: 0,
		minTownHallLevel: 1, // Advanced extractor - Village tier
	},
	{
		name: 'Marketplace',
		description: 'Enables trading with other settlements (NPC trade routes, guild recruitment)',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'MARKETPLACE',
		maxLevel: 5,
		requirements: {
			wood: 120,
			stone: 80,
		},
		unique: true,
		areaCost: 100,
		minTownHallLevel: 3, // Requires Town Hall Level 3 (Town tier)
	},
];
