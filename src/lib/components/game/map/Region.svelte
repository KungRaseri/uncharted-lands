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
	};

	let { region }: Props = $props();
</script>

{#each region.tiles as tile}
	<TileComponent {tile} />
{/each}
