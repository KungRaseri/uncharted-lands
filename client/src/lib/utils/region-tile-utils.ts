/**
 * Region tile tooltip utilities
 * Used for displaying detailed tile information in region map previews
 *
 * ARCHITECTURAL DECISION: Import types from central repository
 * RegionStats imported from $lib/types/game (single source of truth)
 */

import { getTerrainType } from './tile-colors';
import type { RegionStats } from '@uncharted-lands/shared';

export interface TileData {
	elevation: number;
	precipitation: number;
	temperature: number;
	type: string;
	plotSlots?: number; // Number of extractor slots (default 5)
	settlementId?: string | null; // If tile is claimed by a settlement
	Biome?: { name: string } | null;
	Settlement?: { id: string; name: string } | null;
}

/**
 * Generate detailed tooltip for a region tile
 * Shows position, biome, elevation, climate, and settlement info
 */
export function getRegionTileTooltip(tile: TileData, row: number, col: number): string {
	const terrainType = getTerrainType(tile.elevation);
	const hasSettlement = tile.settlementId || tile.Settlement;
	const slots = tile.plotSlots ?? 5; // Default 5 slots if not specified
	const settlementName = tile.Settlement?.name || 'Claimed';
	const settlementLine = hasSettlement ? '\n🏠 Settlement: ' + settlementName : '';

	return `Tile Position: (${row}, ${col})
Biome: ${tile.Biome?.name || 'Unknown'}
Type: ${tile.type}

Elevation: ${tile.elevation.toFixed(3)}
Terrain: ${terrainType}

Precipitation: ${tile.precipitation.toFixed(3)}
Temperature: ${tile.temperature.toFixed(3)}

Extractor Slots: ${slots}${settlementLine}`;
}

/**
 * Calculate statistics for a region's tiles
 * Returns elevation stats and tile type counts
 */
export function calculateRegionStats(tiles: TileData[]): RegionStats {
	if (!tiles || tiles.length === 0) {
		return {
			avgElevation: 0,
			minElevation: 0,
			maxElevation: 0,
			landTiles: 0,
			oceanTiles: 0
		};
	}

	const elevations = tiles.map((t) => t.elevation);
	const sum = elevations.reduce((a, b) => a + b, 0);
	const avg = sum / elevations.length;
	const min = Math.min(...elevations);
	const max = Math.max(...elevations);
	const land = tiles.filter((t) => t.type === 'LAND').length;
	const ocean = tiles.filter((t) => t.type === 'OCEAN').length;

	return {
		avgElevation: avg,
		minElevation: min,
		maxElevation: max,
		landTiles: land,
		oceanTiles: ocean
	};
}
