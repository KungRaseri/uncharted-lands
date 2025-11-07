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
	
	// Sort tiles by ID to ensure correct positioning (matching admin preview behavior)
	// Tiles are created in row-major order during world generation
	const sortedTiles = $derived(
		[...region.tiles].sort((a, b) => a.id.localeCompare(b.id))
	);
</script>

<div class="grid grid-cols-10 gap-0 h-full w-full">
	{#each sortedTiles as tile}
		<Tile {tile} {mode} {currentPlayerProfileId} />
	{/each}
</div>
