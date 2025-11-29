/**
 * Tile tooltip generation utilities
 * Creates formatted tooltips for tile information in admin and player modes
 */

/**
 * Settlement data for tile information
 */
export type SettlementData = {
	playerProfileId: string;
	name: string;
} | null;

/**
 * Tile data for tooltip generation
 */
export type TileData = {
	biome?: {
		name: string;
	};
	type: string;
	elevation: number;
	precipitation: number;
	temperature: number;
	plotSlots: number;
	settlement?: SettlementData;
};

/**
 * Generate admin mode tooltip for a tile
 * Shows technical details like raw elevation, precipitation, and temperature values
 *
 * @param tile - Tile data with biome, type, elevation, precipitation, temperature, and settlement
 * @returns Formatted tooltip string with newlines
 */
export function getAdminTileTooltip(tile: TileData): string {
	const biomeName = tile.biome?.name || 'Unknown';
	const hasSettlement = !!tile.settlement;
	return `Biome: ${biomeName}
Type: ${tile.type}
Elevation: ${tile.elevation.toFixed(3)}
Precipitation: ${tile.precipitation.toFixed(3)}
Temperature: ${tile.temperature.toFixed(3)}
Slots: ${tile.plotSlots}
Settlement: ${hasSettlement ? tile.settlement?.name || 'Unnamed' : 'None'}`;
}

/**
 * Generate player mode tooltip for a tile
 * Shows user-friendly information with percentage elevation and settlement name
 *
 * @param tile - Tile data with biome, elevation, temperature, precipitation, and settlement
 * @param currentPlayerProfileId - Optional player ID to filter settlements
 * @returns Formatted tooltip string with newlines
 */
export function getPlayerTileTooltip(tile: TileData, currentPlayerProfileId?: string): string {
	const biomeName = tile.biome?.name || 'Unknown';

	// Base tooltip with tile information
	let tooltip = `${biomeName}
Elevation: ${(tile.elevation * 100).toFixed(1)}%
Temperature: ${tile.temperature.toFixed(1)}°C
Precipitation: ${tile.precipitation.toFixed(1)}mm
Available Slots: ${tile.plotSlots}`;

	// Add settlement name if player owns it
	if (currentPlayerProfileId && tile.settlement?.playerProfileId === currentPlayerProfileId) {
		tooltip += `\n\n🏘️ ${tile.settlement.name}`;
	}

	return tooltip;
}

/**
 * Generate tooltip for a tile based on display mode
 * Delegates to admin or player tooltip generation
 *
 * @param tile - Tile data
 * @param mode - Display mode ('admin' or 'player')
 * @param currentPlayerProfileId - Optional player ID for player mode
 * @returns Formatted tooltip string
 */
export function getTileTooltip(
	tile: TileData,
	mode: 'admin' | 'player' = 'player',
	currentPlayerProfileId?: string
): string {
	if (mode === 'admin') {
		return getAdminTileTooltip(tile);
	}
	return getPlayerTileTooltip(tile, currentPlayerProfileId);
}
