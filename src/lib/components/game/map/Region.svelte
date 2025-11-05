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
	
	// Sort tiles by ID to ensure correct positioning (matching admin preview behavior)
	// Tiles are created in row-major order during world generation
	const sortedTiles = $derived(
		[...region.tiles].sort((a, b) => a.id.localeCompare(b.id))
	);
	
	$effect(() => {
		console.log('[REGION]', region.name, '@ (' + region.xCoord + ',' + region.yCoord + ')', {
			totalTiles: region.tiles.length,
			firstTileId: sortedTiles[0]?.id,
			firstTileElevation: sortedTiles[0]?.elevation.toFixed(3),
			firstTileBiome: sortedTiles[0]?.Biome.name
		});
	});
	
	// Tiles are stored in row-major order (10x10 grid)
	// Index 0-9 is row 0, 10-19 is row 1, etc.
	const TILES_PER_ROW = 10;
	const tileGrid = $derived(
		Array.from({ length: TILES_PER_ROW }, (_, rowIndex) => 
			sortedTiles.slice(rowIndex * TILES_PER_ROW, (rowIndex + 1) * TILES_PER_ROW)
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
