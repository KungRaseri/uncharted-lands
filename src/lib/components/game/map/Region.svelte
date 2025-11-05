<script lang="ts">
	import type { Prisma } from '@prisma/client';
	import TileComponent from './Tile.svelte';

	type Props = {
		region: Prisma.RegionGetPayload<{
			include: {
				tiles: {
					include: {
						Biome: true;
						Plots: true;
					};
				};
			};
		}>;
		/** Display mode - affects tile sizing and interaction */
		mode?: 'admin' | 'player';
	};

	let { region, mode = 'player' }: Props = $props();
	
	// Sort tiles by ID to ensure correct positioning (matching admin preview behavior)
	// Tiles are created in row-major order during world generation
	const sortedTiles = $derived(
		[...region.tiles].sort((a, b) => a.id.localeCompare(b.id))
	);
</script>

<div class="grid grid-cols-10 gap-0 h-full w-full">
	{#each sortedTiles as tile}
		<TileComponent {tile} {mode} />
	{/each}
</div>
