/**
 * Structure Master Data (Client)
 * Re-exports types and provides structure definitions for the game client
 */

export type StructureCategory = 'BUILDING' | 'EXTRACTOR';
export type ExtractorType =
	| 'FARM'
	| 'WELL'
	| 'LUMBER_MILL'
	| 'QUARRY'
	| 'MINE'
	| 'FISHING_DOCK'
	| 'HUNTERS_LODGE'
	| 'HERB_GARDEN'
	| null;
export type BuildingType =
	| 'TENT'
	| 'HOUSE'
	| 'STORAGE'
	| 'WAREHOUSE'
	| 'BARRACKS'
	| 'WORKSHOP'
	| 'MARKETPLACE'
	| 'TOWN_HALL'
	| 'WALL'
	| 'WATCHTOWER'
	| 'HOSPITAL'
	| 'RESEARCH_LAB'
	| 'LIBRARY'
	| null;

export type StructureType = ExtractorType | BuildingType;

export interface StructureDefinition {
	id: string;
	name: string;
	description: string;
	category: StructureCategory;
	extractorType: ExtractorType;
	buildingType: BuildingType;
	maxLevel: number;
	cost?: {
		food?: number;
		water?: number;
		wood?: number;
		stone?: number;
		ore?: number;
	};
	requirements?: {
		area?: number;
		solar?: number;
		wind?: number;
		food?: number;
		water?: number;
		wood?: number;
		stone?: number;
		ore?: number;
	};
}

// Structure definitions (simplified for client)
export const structures: Record<string, StructureDefinition> = {
	TENT: {
		id: 'tent',
		name: 'Tent',
		description: 'Basic shelter for settlers',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'HOUSE',
		maxLevel: 1,
		cost: { wood: 10 }
	},
	HOUSE: {
		id: 'house',
		name: 'House',
		description: 'Permanent housing for settlers',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'HOUSE',
		maxLevel: 5,
		cost: { wood: 50, stone: 20 }
	},
	STORAGE: {
		id: 'storage',
		name: 'Storage',
		description: 'Stores resources',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'STORAGE',
		maxLevel: 5,
		cost: { wood: 40, stone: 20 }
	},
	WORKSHOP: {
		id: 'workshop',
		name: 'Workshop',
		description: 'Crafts and upgrades structures',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'WORKSHOP',
		maxLevel: 5,
		cost: { wood: 60, stone: 60, ore: 30 }
	},
	MARKETPLACE: {
		id: 'marketplace',
		name: 'Marketplace',
		description: 'Trading hub',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'MARKETPLACE',
		maxLevel: 3,
		cost: { wood: 120, stone: 80 }
	},
	TOWN_HALL: {
		id: 'town_hall',
		name: 'Town Hall',
		description: 'Administrative center',
		category: 'BUILDING',
		extractorType: null,
		buildingType: 'TOWN_HALL',
		maxLevel: 3,
		cost: { wood: 200, stone: 150, ore: 50 }
	},
	FARM: {
		id: 'farm',
		name: 'Farm',
		description: 'Produces food',
		category: 'EXTRACTOR',
		extractorType: 'FARM',
		buildingType: null,
		maxLevel: 5,
		cost: { wood: 20, stone: 10 }
	},
	WELL: {
		id: 'well',
		name: 'Well',
		description: 'Produces water',
		category: 'EXTRACTOR',
		extractorType: 'WELL',
		buildingType: null,
		maxLevel: 5,
		cost: { wood: 15, stone: 15 }
	},
	LUMBER_MILL: {
		id: 'lumber_mill',
		name: 'Lumber Mill',
		description: 'Produces wood',
		category: 'EXTRACTOR',
		extractorType: 'LUMBER_MILL',
		buildingType: null,
		maxLevel: 5,
		cost: { wood: 20, stone: 10 }
	},
	QUARRY: {
		id: 'quarry',
		name: 'Quarry',
		description: 'Produces stone',
		category: 'EXTRACTOR',
		extractorType: 'QUARRY',
		buildingType: null,
		maxLevel: 5,
		cost: { wood: 20, stone: 10 }
	},
	MINE: {
		id: 'mine',
		name: 'Mine',
		description: 'Produces ore',
		category: 'EXTRACTOR',
		extractorType: 'MINE',
		buildingType: null,
		maxLevel: 5,
		cost: { wood: 30, stone: 20 }
	}
};
