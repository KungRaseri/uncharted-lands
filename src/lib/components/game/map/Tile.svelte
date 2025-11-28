<script lang="ts">
	import type { TileWithRelations } from '$lib/types/game';
	import { getTileColorByViewMode, type MapViewMode } from '$lib/utils/tile-colors';
	import { getTileTooltip } from '$lib/utils/tile-tooltips';

	type Props = {
		tile: TileWithRelations;
		/** Display mode - affects styling and interaction */
		mode?: 'admin' | 'player';
		/** Current player's profile ID (for player mode settlement filtering) */
		currentPlayerProfileId?: string;
		/** Map visualization mode */
		mapViewMode?: MapViewMode;
	};

	let {
		tile,
		mode = 'player',
		currentPlayerProfileId,
		mapViewMode = 'satellite'
	}: Props = $props();
	// Check if tile has a settlement
	const hasSettlement = $derived(() => {
		if (!tile.settlement) {
			return false;
		}

		// In player mode, only show marker if player owns the settlement
		if (mode === 'player' && currentPlayerProfileId) {
			return tile.settlement.playerProfileId === currentPlayerProfileId;
		}

		// In admin mode, show marker if ANY settlement exists
		return true;
	});
</script>

<div
	class="w-full h-full cursor-help hover:shadow-[inset_0_0_0_2px_rgba(255,255,0,0.8)] hover:z-10 transition-shadow relative"
	style="background-color: {getTileColorByViewMode(
		mapViewMode,
		tile.elevation,
		tile.biome?.name || 'Unknown',
		tile.type,
		tile.temperature ?? 0,
		tile.precipitation ?? 0
	)}"
	role="button"
	tabindex="0"
	aria-label="Tile: {tile.biome?.name || 'Unknown'}"
	title={getTileTooltip(tile, mode, currentPlayerProfileId)}
>
	{#if hasSettlement()}
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div
				class="w-1.5 h-1.5 bg-warning-400 rounded-full shadow-[0_0_3px_rgba(251,191,36,1)]"
			></div>
		</div>
	{/if}
</div>
