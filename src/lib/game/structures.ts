/**
 * Structure Type Definitions (Client)
 *
 * Type definitions for structures in the game.
 * IMPORTANT: Actual structure data comes from the API (server/src/api/routes/structures-metadata.ts)
 *
 * See: client/src/lib/api/structures.ts for fetching structure metadata
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

/**
 * Structure definition interface (for type checking only)
 *
 * NOTE: Do not use this for runtime data. Use API:
 * import { fetchStructureMetadata } from '$lib/api/structures';
 */
export interface StructureDefinition {
	id: string;
	name: string;
	description: string;
	category: StructureCategory;
	type: string; // ExtractorType or BuildingType
	maxLevel: number;
	costs: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};
	prerequisites?: {
		structureId: string;
		minLevel: number;
	}[];
}
