/**
 * Production Calculator
 *
 * Calculates production rates and extractor details from real settlement structures
 *
 * ARCHITECTURAL DECISION: Import types from central repository
 * ProductionRates imported from $lib/types/resources (single source of truth)
 * ExtractorDetailsForUI is calculation-specific (differs from generic ExtractorInfo)
 * ProductionDetailsForUI is calculation-specific (differs from generic ProductionData)
 */

import { getProductionRates, type ProductionBaseRates } from '../api/game-config';
import type { ProductionRates } from '../types/resources';

/**
 * Detailed extractor information for UI display
 * Extends base ExtractorInfo with UI-specific fields (id, name, location, production)
 */
export interface ExtractorDetailsForUI {
	id: string;
	type: 'FARM' | 'WELL' | 'LUMBER_MILL' | 'QUARRY' | 'MINE';
	name: string;
	level: number;
	health: number;
	quality: number;
	production: number;
	location: { x: number; y: number };
}

/**
 * Production calculation result for UI display
 * Combines aggregated rates with detailed extractor information
 */
export interface ProductionDetailsForUI {
	rates: ProductionRates;
	extractors: ExtractorDetailsForUI[];
}

/**
 * Module-level cache for production base rates
 * Fetched once from API on first use
 */
let cachedBaseRates: ProductionBaseRates | null = null;

/**
 * Ensure base rates are loaded from API
 * Uses module-level cache to avoid repeated fetches
 */
async function ensureBaseRates(): Promise<ProductionBaseRates> {
	cachedBaseRates ??= await getProductionRates();
	return cachedBaseRates;
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
async function calculateExtractorProduction(
	structure: SettlementStructure,
	tile: Tile | undefined,
	resourceType: keyof ProductionRates
): Promise<number> {
	// Get base production rates from API (cached after first call)
	const baseRates = await ensureBaseRates();

	const baseRate = baseRates[resourceType];
	const quality = getTileQuality(tile, resourceType) / 100; // Convert to 0-1 scale
	const level = structure.level;
	const health = structure.health / 100; // Convert to 0-1 scale

	return baseRate * quality * level * health;
}

/**
 * Calculate production data from settlement structures
 */
export async function calculateProduction(
	structures: SettlementStructure[],
	tiles?: Map<string, Tile>
): Promise<ProductionDetailsForUI> {
	const rates: ProductionRates = {
		food: 0,
		water: 0,
		wood: 0,
		stone: 0,
		ore: 0
	};

	const extractors: ExtractorDetailsForUI[] = [];

	// Filter to extractors only
	const extractorStructures = structures.filter((s) => s.category === 'EXTRACTOR');

	for (const structure of extractorStructures) {
		const resourceType = getResourceType(structure.structureId);
		if (!resourceType) continue;

		const tile = structure.tileId && tiles ? tiles.get(structure.tileId) : undefined;
		const quality = getTileQuality(tile, resourceType);
		const production = await calculateExtractorProduction(structure, tile, resourceType);

		// Add to total production rate
		rates[resourceType] += production;

		// Add to extractor list
		extractors.push({
			id: structure.id,
			type: structure.structureId as ExtractorDetailsForUI['type'],
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
