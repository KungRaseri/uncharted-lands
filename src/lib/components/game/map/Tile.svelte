<script lang="ts">
	import type { TileWithRelations } from '$lib/types/game';
	import { getTileColor } from '$lib/utils/tile-colors';

	type Props = {
		tile: TileWithRelations;
		/** Display mode - affects styling and interaction */
		mode?: 'admin' | 'player';
		/** Current player's profile ID (for player mode settlement filtering) */
		currentPlayerProfileId?: string;
	};

	let { tile, mode = 'player', currentPlayerProfileId }: Props = $props();
	// Check if tile has any settled plots
	const hasSettlement = $derived(() => {
		const settledPlots = tile.Plots.filter((plot) => plot.Settlement);
		
		if (settledPlots.length === 0) {
			return false;
		}
		
		// In player mode, only show marker if player owns the settlement
		if (mode === 'player' && currentPlayerProfileId) {
			return settledPlots.some((plot) => plot.Settlement?.playerProfileId === currentPlayerProfileId);
		}
		
		// In admin mode, show marker if ANY settlement exists
		return true;
	});

	// Get tooltip content based on mode
	function getTooltipContent(): string {
		if (mode === 'admin') {
			return `Biome: ${tile.Biome.name}
Type: ${tile.type}
Elevation: ${tile.elevation.toFixed(3)}
Precipitation: ${tile.precipitation.toFixed(3)}
Temperature: ${tile.temperature.toFixed(3)}
Plots: ${tile.Plots.length}`;
		}

		// Player mode - more user-friendly
		let tooltip = `${tile.Biome.name}
Elevation: ${(tile.elevation * 100).toFixed(1)}%
Temperature: ${tile.temperature.toFixed(1)}°C
Precipitation: ${tile.precipitation.toFixed(1)}mm`;

		// Add plot count if any
		if (tile.Plots.length > 0) {
			tooltip += `\n${tile.Plots.length} ${tile.Plots.length === 1 ? 'Plot' : 'Plots'}`;
		}

		// Add settlement name(s) if player owns any on this tile
		if (mode === 'player' && currentPlayerProfileId) {
			const playerSettlements = tile.Plots
				.filter((plot) => plot.Settlement?.playerProfileId === currentPlayerProfileId)
				.map((plot) => plot.Settlement?.name)
				.filter((name) => name);

			if (playerSettlements.length > 0) {
				tooltip += `\n\n🏘️ ${playerSettlements.join(', ')}`;
			}
		}

		return tooltip;
	}
</script>

<div
	class="w-full h-full cursor-help hover:shadow-[inset_0_0_0_2px_rgba(255,255,0,0.8)] hover:z-10 transition-shadow relative"
	style="background-color: {getTileColor(tile.elevation, tile.Biome.name, tile.type)}"
	role="button"
	tabindex="0"
	aria-label="Tile: {tile.Biome.name}"
	title={getTooltipContent()}
>
	{#if hasSettlement()}
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div
				class="w-1.5 h-1.5 bg-warning-400 rounded-full shadow-[0_0_3px_rgba(251,191,36,1)]"
			></div>
		</div>
	{/if}
</div>
