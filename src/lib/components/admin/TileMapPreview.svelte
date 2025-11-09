<script lang="ts">
	import { getElevationColor, getTerrainType } from '$lib/utils/map-colors';
	import {
		organizeTilesIntoGrid,
		findTilePosition,
		calculateTileNumber
	} from '$lib/utils/tile-grid-utils';

	type Props = {
		tile: any;
		regionTiles: any[];
		regionName?: string;
	};

	let { tile, regionTiles, regionName = 'Region' }: Props = $props();

	// Organize tiles into 10x10 grid - using utility function
	const tileGrid = $derived(() => organizeTilesIntoGrid(regionTiles));

	// Find current tile position - using utility function
	const tilePosition = $derived(() => findTilePosition(tile.id, regionTiles));
</script>

<div class="card p-4 rounded-md">
	<h2 class="text-xl font-semibold mb-4">Tile Location in {regionName}</h2>
	
	<div class="bg-surface-200 dark:bg-surface-700 p-4 rounded-md">
		<!-- Position Info -->
		<div class="mb-4 p-3 bg-surface-100 dark:bg-surface-800 rounded-md text-center">
			<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Position in Region</p>
			<p class="text-lg font-bold">Row {tilePosition().row}, Column {tilePosition().col}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400">
				(Tile {calculateTileNumber(tilePosition().row, tilePosition().col)} of 100)
			</p>
		</div>

		<!-- Region Grid with Current Tile Highlighted -->
		<div class="grid grid-cols-10 gap-0 w-full max-w-2xl mx-auto border-2 border-surface-400 dark:border-surface-500">
			{#each tileGrid() as row, rowIndex}
				{#each row as t, colIndex}
					{@const isCurrentTile = t && t.id === tile.id}
					{#if t}
						<div
							class="aspect-square cursor-help transition-all duration-150"
							class:ring-4={isCurrentTile}
							class:ring-warning-500={isCurrentTile}
							class:hover:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.8)]={!isCurrentTile}
							class:dark:hover:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.9)]={!isCurrentTile}
							style="background-color: {getElevationColor(t.elevation)}"
							title={isCurrentTile ? 'Current Tile' : `Tile at (${rowIndex}, ${colIndex})\nElevation: ${t.elevation.toFixed(3)}\nType: ${t.type}`}
						></div>
					{:else}
						<div class="aspect-square bg-surface-500"></div>
					{/if}
				{/each}
			{/each}
		</div>

		<!-- Current Tile Details -->
		<div class="mt-4 p-4 bg-surface-100 dark:bg-surface-800 rounded-md">
			<h3 class="font-semibold mb-3 flex items-center gap-2">
				<span class="w-3 h-3 rounded-full bg-warning-500 animate-pulse"></span>
				Current Tile Details
			</h3>
			
			<div class="grid grid-cols-2 md:grid-cols-4 gap-3">
				<div>
					<p class="text-xs text-surface-600 dark:text-surface-400">Terrain</p>
					<div class="flex items-center gap-2">
						<div
							class="w-6 h-6 rounded border-2 border-surface-300 dark:border-surface-600"
							style="background-color: {getElevationColor(tile.elevation)}"
						></div>
						<p class="font-semibold text-sm">{getTerrainType(tile.elevation)}</p>
					</div>
				</div>
				<div>
					<p class="text-xs text-surface-600 dark:text-surface-400">Type</p>
					<p class="font-semibold text-sm capitalize">{tile.type.toLowerCase()}</p>
				</div>
				<div>
					<p class="text-xs text-surface-600 dark:text-surface-400">Biome</p>
					<p class="font-semibold text-sm">{tile.Biome?.name || 'Unknown'}</p>
				</div>
				<div>
					<p class="text-xs text-surface-600 dark:text-surface-400">Plots</p>
					<p class="font-semibold text-sm">{tile.Plots?.length || 0} plots</p>
				</div>
			</div>
		</div>

		<!-- Legend -->
		<div class="mt-4 text-xs text-surface-600 dark:text-surface-400">
			<div class="flex items-center gap-4 flex-wrap justify-center">
				<span class="font-semibold">Legend:</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-3 inline-block rounded-full bg-warning-500"></span>
					Current Tile
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-3 inline-block" style="background-color: #001a33"></span>
					Deep Ocean
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-3 inline-block" style="background-color: #003d66"></span>
					Ocean
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-3 inline-block" style="background-color: #f4e4c1"></span>
					Beach
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-3 inline-block" style="background-color: #7cb342"></span>
					Plains
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-3 inline-block" style="background-color: #558b2f"></span>
					Forest
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-3 inline-block" style="background-color: #8d6e63"></span>
					Hills
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-3 inline-block" style="background-color: #757575"></span>
					Mountains
				</span>
				<span class="flex items-center gap-1">
					<span class="w-3 h-3 inline-block" style="background-color: #ffffff"></span>
					Snow Peaks
				</span>
			</div>
		</div>
	</div>
</div>
