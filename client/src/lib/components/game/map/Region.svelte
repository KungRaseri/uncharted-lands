<script lang="ts">
	import Tile from './Tile.svelte';
	import type { RegionWithTiles } from '@uncharted-lands/shared';
	import type { MapViewMode } from '$lib/utils/tile-colors';

	type Props = {
		region: RegionWithTiles;
		/** Display mode - affects tile sizing and interaction */
		mode?: 'admin' | 'player';
		/** Current player's profile ID (for player mode settlement filtering) */
		currentPlayerProfileId?: string;
		/** Map visualization mode */
		mapViewMode?: MapViewMode;
	};

	let {
		region,
		mode = 'player',
		currentPlayerProfileId,
		mapViewMode = 'satellite'
	}: Props = $props();

	// Tiles are ordered by (xCoord, yCoord) from database query
	// This matches the creation order: row-by-row (x=row index, y=column index)
	// Which is EXACTLY the same order as the preview displays them
	// Database columns added: xCoord, yCoord (integers 0-9)

	// Debug: Log tile coordinates to verify ordering
	$effect(() => {
		if (typeof window !== 'undefined' && region.tiles.length > 0) {
			const coords = region.tiles
				.slice(0, 20)
				.map((t: any) => `(${t.xCoord ?? '?'},${t.yCoord ?? '?'})`)
				.join(' ');
			console.log('Region tile coords:', coords);
		}
	});
</script>

<div class="grid grid-cols-10 gap-0 h-full w-full">
	{#each region.tiles as tile}
		<Tile {tile} {mode} {currentPlayerProfileId} {mapViewMode} />
	{/each}
</div>
