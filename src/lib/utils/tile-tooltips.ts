/**
 * Tile tooltip generation utilities
 * Creates formatted tooltips for tile information in admin and player modes
 */

/**
 * Plot data for settlement information
 */
export type PlotData = {
	Settlement?: {
		playerProfileId: string;
		name: string;
	} | null;
};

/**
 * Tile data for tooltip generation
 */
export type TileData = {
	Biome: {
		name: string;
	};
	type: string;
	elevation: number;
	precipitation: number;
	temperature: number;
	Plots: PlotData[];
};

/**
 * Generate admin mode tooltip for a tile
 * Shows technical details like raw elevation, precipitation, and temperature values
 * 
 * @param tile - Tile data with biome, type, elevation, precipitation, temperature, and plots
 * @returns Formatted tooltip string with newlines
 */
export function getAdminTileTooltip(tile: TileData): string {
	return `Biome: ${tile.Biome.name}
Type: ${tile.type}
Elevation: ${tile.elevation.toFixed(3)}
Precipitation: ${tile.precipitation.toFixed(3)}
Temperature: ${tile.temperature.toFixed(3)}
Plots: ${tile.Plots.length}`;
}

/**
 * Generate player mode tooltip for a tile
 * Shows user-friendly information with percentage elevation and filtered settlement names
 * 
 * @param tile - Tile data with biome, elevation, temperature, precipitation, and plots
 * @param currentPlayerProfileId - Optional player ID to filter settlements
 * @returns Formatted tooltip string with newlines
 */
export function getPlayerTileTooltip(
	tile: TileData,
	currentPlayerProfileId?: string
): string {
	// Base tooltip with tile information
	let tooltip = `${tile.Biome.name}
Elevation: ${(tile.elevation * 100).toFixed(1)}%
Temperature: ${tile.temperature.toFixed(1)}°C
Precipitation: ${tile.precipitation.toFixed(1)}mm`;

	// Add plot count if any plots exist
	if (tile.Plots.length > 0) {
		tooltip += `\n${tile.Plots.length} ${tile.Plots.length === 1 ? 'Plot' : 'Plots'}`;
	}

	// Add settlement names if player owns any on this tile
	if (currentPlayerProfileId) {
		const playerSettlements = tile.Plots
			.filter((plot) => plot.Settlement?.playerProfileId === currentPlayerProfileId)
			.map((plot) => plot.Settlement?.name)
			.filter((name): name is string => name !== undefined && name !== null && name !== '');

		if (playerSettlements.length > 0) {
			tooltip += `\n\n🏘️ ${playerSettlements.join(', ')}`;
		}
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
