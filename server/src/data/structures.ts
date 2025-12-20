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
	| 'BARRACKS'
	| 'WORKSHOP'
	| 'MARKETPLACE'
	| 'TOWN_HALL'
	| 'WALL'
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
}

export const STRUCTURES: StructureDefinition[] = [
	{
		name: 'Tent',
		description: 'Basic shelter for settlers',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'HOUSE',
		maxLevel: 3,
		requirements: {
			food: 5,
			water: 2,
			wood: 10,
		},
	},
	{
		name: 'House',
		description: 'Provides housing capacity for settlers',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'HOUSE',
		maxLevel: 10,
		requirements: {
			wood: 50,
			stone: 20,
		},
	},
	{
		name: 'Warehouse',
		description: 'Increases storage capacity',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'STORAGE',
		maxLevel: 10,
		requirements: {
			wood: 40,
			stone: 20,
		},
	},
	{
		name: 'Town Hall',
		description: 'Administrative center for the settlement',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'TOWN_HALL',
		maxLevel: 5,
		requirements: {
			wood: 200,
			stone: 150,
			ore: 50,
		},
	},
	{
		name: 'Workshop',
		description: 'Allows upgrading structures',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'WORKSHOP',
		maxLevel: 10,
		requirements: {
			wood: 60,
			stone: 60,
			ore: 30,
		},
	},
	{
		name: 'Farm',
		description: 'Produces food',
		category: 'EXTRACTOR',
		extractorType: 'FARM',
		buildingType: null,
		maxLevel: 5,
		requirements: {
			wood: 20,
			stone: 10,
		},
	},
	{
		name: 'Quarry',
		description: 'Extracts stone from the ground',
		category: 'EXTRACTOR',
		extractorType: 'QUARRY',
		buildingType: null,
		maxLevel: 5,
		requirements: {
			wood: 30,
			stone: 20,
		},
	},
	{
		name: 'Mine',
		description: 'Extracts ore from the ground',
		category: 'EXTRACTOR',
		extractorType: 'MINE',
		buildingType: null,
		maxLevel: 5,
		requirements: {
			wood: 40,
			stone: 30,
		},
	},
	{
		name: 'Lumber Mill',
		description: 'Produces wood',
		category: 'EXTRACTOR',
		extractorType: 'LUMBER_MILL',
		buildingType: null,
		maxLevel: 5,
		requirements: {
			wood: 20,
			stone: 10,
		},
	},
	{
		name: 'Fishing Dock',
		description: 'Produces food from water',
		category: 'EXTRACTOR',
		extractorType: 'FISHING_DOCK',
		buildingType: null,
		maxLevel: 5,
		requirements: {
			wood: 30,
			stone: 15,
		},
	},
	{
		name: 'Hunting Lodge',
		description: 'Produces pelts and food from hunting',
		category: 'EXTRACTOR',
		extractorType: 'HUNTING_LODGE',
		buildingType: null,
		maxLevel: 5,
		requirements: {
			wood: 25,
			stone: 10,
		},
	},
	{
		name: 'Well',
		description: 'Provides water to the settlement',
		category: 'EXTRACTOR',
		extractorType: 'WELL',
		buildingType: null,
		maxLevel: 5,
		requirements: {
			wood: 15,
			stone: 20,
		},
	},
	{
		name: 'Herb Garden',
		description: 'Grows medicinal herbs',
		category: 'EXTRACTOR',
		extractorType: 'HERB_GARDEN',
		buildingType: null,
		maxLevel: 5,
		requirements: {
			wood: 15,
			stone: 5,
		},
	},
	{
		name: 'Marketplace',
		description: 'Enables trading with other settlements',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'MARKETPLACE',
		maxLevel: 5,
		requirements: {
			wood: 120,
			stone: 80,
		},
	},
];
