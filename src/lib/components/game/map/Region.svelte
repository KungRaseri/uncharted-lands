<script lang="ts">
	import type { Prisma } from '@prisma/client';
	import TileComponent from './Tile.svelte';

	export let region: Prisma.RegionGetPayload<{
		include: {
			tiles: {
				include: {
					Biome: true;
					Plots: true;
				};
			};
		};
	}>;
</script>

{#each region.tiles as tile}
	<TileComponent {tile} />
{/each}
