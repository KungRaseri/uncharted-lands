/**
 * Production Calculator
 *
 * Calculates production rates and extractor details from real settlement structures
 */

export interface ProductionRates {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

export interface ExtractorInfo {
	id: string;
	type: 'FARM' | 'WELL' | 'LUMBER_MILL' | 'QUARRY' | 'MINE';
	name: string;
	level: number;
	health: number;
	quality: number;
	production: number;
	location: { x: number; y: number };
}

export interface ProductionData {
	rates: ProductionRates;
	extractors: ExtractorInfo[];
}

interface SettlementStructure {
	id: string;
	structureId: string;
	category: string;
	level: number;
	health: number;
	tileId: string | null;
	name: string;
}

interface Tile {
	id: string;
	xCoord: number;
	yCoord: number;
	foodQuality?: number;
	waterQuality?: number;
	woodQuality?: number;
	stoneQuality?: number;
	oreQuality?: number;
}

/**
 * Map structure type to resource type
 */
function getResourceType(structureId: string): keyof ProductionRates | null {
	const typeMap: Record<string, keyof ProductionRates> = {
		FARM: 'food',
		WELL: 'water',
		LUMBER_MILL: 'wood',
		QUARRY: 'stone',
		MINE: 'ore'
	};
	return typeMap[structureId] || null;
}

/**
 * Get tile quality for resource type
 */
function getTileQuality(tile: Tile | undefined, resourceType: keyof ProductionRates): number {
	if (!tile) return 50; // Default quality

	const qualityMap: Record<keyof ProductionRates, number> = {
		food: tile.foodQuality || 50,
		water: tile.waterQuality || 50,
		wood: tile.woodQuality || 50,
		stone: tile.stoneQuality || 50,
		ore: tile.oreQuality || 50
	};

	return qualityMap[resourceType];
}

/**
 * Calculate production rate for an extractor
 * Based on GDD formula: Production = BaseRate × Quality × Level × Health
 */
function calculateExtractorProduction(
	structure: SettlementStructure,
	tile: Tile | undefined,
	resourceType: keyof ProductionRates
): number {
	// Base production rates (per hour) from GDD
	const baseRates: Record<keyof ProductionRates, number> = {
		food: 10,
		water: 15,
		wood: 8,
		stone: 6,
		ore: 4
	};

	const baseRate = baseRates[resourceType];
	const quality = getTileQuality(tile, resourceType) / 100; // Convert to 0-1 scale
	const level = structure.level;
	const health = structure.health / 100; // Convert to 0-1 scale

	return baseRate * quality * level * health;
}

/**
 * Calculate production data from settlement structures
 */
export function calculateProduction(
	structures: SettlementStructure[],
	tiles?: Map<string, Tile>
): ProductionData {
	const rates: ProductionRates = {
		food: 0,
		water: 0,
		wood: 0,
		stone: 0,
		ore: 0
	};

	const extractors: ExtractorInfo[] = [];

	// Filter to extractors only
	const extractorStructures = structures.filter((s) => s.category === 'EXTRACTOR');

	for (const structure of extractorStructures) {
		const resourceType = getResourceType(structure.structureId);
		if (!resourceType) continue;

		const tile = structure.tileId && tiles ? tiles.get(structure.tileId) : undefined;
		const quality = getTileQuality(tile, resourceType);
		const production = calculateExtractorProduction(structure, tile, resourceType);

		// Add to total production rate
		rates[resourceType] += production;

		// Add to extractor list
		extractors.push({
			id: structure.id,
			type: structure.structureId as ExtractorInfo['type'],
			name: structure.name || structure.structureId,
			level: structure.level,
			health: structure.health,
			quality,
			production,
			location: tile ? { x: tile.xCoord, y: tile.yCoord } : { x: 0, y: 0 }
		});
	}

	return {
		rates,
		extractors
	};
}
