<script lang="ts">
	import Tile from './Tile.svelte';
	import type { RegionWithTiles } from '$lib/types/game';

	type Props = {
		region: RegionWithTiles;
		/** Display mode - affects tile sizing and interaction */
		mode?: 'admin' | 'player';
		/** Current player's profile ID (for player mode settlement filtering) */
		currentPlayerProfileId?: string;
	};

	let { region, mode = 'player', currentPlayerProfileId }: Props = $props();
	
	// Match tiles to their positions using elevation map (same as preview mode)
	// This ensures tiles display in EXACTLY the same positions as during world creation preview
	const sortedTiles = $derived(() => {
		if (!region.elevationMap || !Array.isArray(region.elevationMap)) {
			// Fallback: use tiles as-is if no elevation map
			console.warn('[REGION] No elevation map available, using unsorted tiles');
			return region.tiles;
		}
		
		const positioned: any[] = [];
		const used = new Set<string>();
		
		// Iterate in the same order as preview: row by row
		for (const [rowIndex, row] of region.elevationMap.entries()) {
			if (!Array.isArray(row)) continue;
			
			for (const [colIndex, elevation] of row.entries()) {
				// Find the tile that matches this position
				const tile = region.tiles.find(t => 
					!used.has(t.id) &&
					t.elevation === elevation &&
					t.precipitation === region.precipitationMap?.[rowIndex]?.[colIndex] &&
					t.temperature === region.temperatureMap?.[rowIndex]?.[colIndex]
				);
				
				if (tile) {
					positioned.push(tile);
					used.add(tile.id);
				} else {
					console.warn(`[REGION] No tile found for position [${rowIndex}][${colIndex}] with elevation ${elevation}`);
					positioned.push(null);
				}
			}
		}
		
		return positioned;
	});
</script>

<div class="grid grid-cols-10 gap-0 h-full w-full">
	{#each sortedTiles() as tile}
		{#if tile}
			<Tile {tile} {mode} {currentPlayerProfileId} />
		{:else}
			<!-- Placeholder for missing tile -->
			<div class="w-full h-full bg-red-900/50" title="Missing tile data"></div>
		{/if}
	{/each}
</div>
