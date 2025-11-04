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
	
	// Tiles are stored in row-major order (10x10 grid)
	// Index 0-9 is row 0, 10-19 is row 1, etc.
	const TILES_PER_ROW = 10;
	const tileGrid = $derived(
		Array.from({ length: TILES_PER_ROW }, (_, rowIndex) => 
			region.tiles.slice(rowIndex * TILES_PER_ROW, (rowIndex + 1) * TILES_PER_ROW)
		)
	);
</script>

<div class="grid grid-cols-10 gap-0">
	{#each tileGrid as row}
		{#each row as tile}
			<TileComponent {tile} />
		{/each}
	{/each}
</div>
