<script lang="ts">
	import { getElevationColor, getTerrainType } from '$lib/utils/map-colors';
	
	type Props = {
		tiles: any[];
		regionName?: string;
	};

	let { tiles, regionName = 'Region' }: Props = $props();

	// Create tooltip for a tile
	function getTileTooltip(tile: any, row: number, col: number): string {
		const terrainType = getTerrainType(tile.elevation);
		
		return `Tile Position: (${row}, ${col})
Biome: ${tile.Biome?.name || 'Unknown'}
Type: ${tile.type}

Elevation: ${tile.elevation.toFixed(3)}
Terrain: ${terrainType}

Precipitation: ${tile.precipitation.toFixed(3)}
Temperature: ${tile.temperature.toFixed(3)}

Plots: ${tile.Plots?.length || 0}${tile.Plots?.some((p: any) => p.Settlement) ? '\n🏠 Has Settlement' : ''}`;
	}

	// Calculate stats for the region
	const stats = $derived(() => {
		if (!tiles || tiles.length === 0) {
			return { avgElevation: 0, minElevation: 0, maxElevation: 0, landTiles: 0, oceanTiles: 0 };
		}

		const elevations = tiles.map(t => t.elevation);
		const sum = elevations.reduce((a, b) => a + b, 0);
		const avg = sum / elevations.length;
		const min = Math.min(...elevations);
		const max = Math.max(...elevations);
		const land = tiles.filter(t => t.type === 'LAND').length;
		const ocean = tiles.filter(t => t.type === 'OCEAN').length;

		return {
			avgElevation: avg,
			minElevation: min,
			maxElevation: max,
			landTiles: land,
			oceanTiles: ocean
		};
	});

	// Organize tiles into 10x10 grid
	const tileGrid = $derived(() => {
		const grid: any[][] = Array.from({ length: 10 }, () => Array(10).fill(null));
		
		// Sort tiles to ensure correct positioning
		const sortedTiles = [...tiles].sort((a, b) => a.id.localeCompare(b.id));
		
		sortedTiles.forEach((tile, index) => {
			const row = Math.floor(index / 10);
			const col = index % 10;
			if (row < 10 && col < 10) {
				grid[row][col] = tile;
			}
		});
		
		return grid;
	});
</script>

<div class="card p-4 rounded-md">
	<h2 class="text-xl font-semibold mb-4">{regionName} Preview (Elevation)</h2>
	
	<!-- Stats Bar -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4 p-3 bg-surface-200 dark:bg-surface-700 rounded-md">
		<div class="text-center">
			<p class="text-xs text-surface-600 dark:text-surface-400">Avg Elevation</p>
			<p class="font-semibold">{stats().avgElevation.toFixed(3)}</p>
		</div>
		<div class="text-center">
			<p class="text-xs text-surface-600 dark:text-surface-400">Range</p>
			<p class="font-semibold text-xs">{stats().minElevation.toFixed(2)} to {stats().maxElevation.toFixed(2)}</p>
		</div>
		<div class="text-center">
			<p class="text-xs text-surface-600 dark:text-surface-400">Land Tiles</p>
			<p class="font-semibold text-success-500">{stats().landTiles}</p>
		</div>
		<div class="text-center">
			<p class="text-xs text-surface-600 dark:text-surface-400">Ocean Tiles</p>
			<p class="font-semibold text-primary-500">{stats().oceanTiles}</p>
		</div>
		<div class="text-center">
			<p class="text-xs text-surface-600 dark:text-surface-400">Total Tiles</p>
			<p class="font-semibold">{tiles.length}</p>
		</div>
	</div>

	<div class="bg-surface-200 dark:bg-surface-700 p-4 rounded-md">
		<div class="grid grid-cols-10 gap-0 w-full max-w-2xl mx-auto border-2 border-surface-400 dark:border-surface-500">
			{#each tileGrid() as row, rowIndex}
				{#each row as tile, colIndex}
					{#if tile}
						<div
							class="aspect-square cursor-help hover:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.8)] dark:hover:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.9)] transition-shadow duration-150"
							style="background-color: {getElevationColor(tile.elevation)}"
							title={getTileTooltip(tile, rowIndex, colIndex)}
						></div>
					{:else}
						<div class="aspect-square bg-surface-500"></div>
					{/if}
				{/each}
			{/each}
		</div>

		<!-- Legend -->
		<div class="mt-4 text-sm text-surface-600 dark:text-surface-400">
			<div class="flex items-center gap-4 flex-wrap justify-center">
				<span class="font-semibold">Legend:</span>
				<span class="flex items-center gap-1">
					<span class="w-4 h-4 inline-block" style="background-color: #001a33"></span>
					Deep Ocean
				</span>
				<span class="flex items-center gap-1">
					<span class="w-4 h-4 inline-block" style="background-color: #003d66"></span>
					Ocean
				</span>
				<span class="flex items-center gap-1">
					<span class="w-4 h-4 inline-block" style="background-color: #f4e4c1"></span>
					Beach
				</span>
				<span class="flex items-center gap-1">
					<span class="w-4 h-4 inline-block" style="background-color: #7cb342"></span>
					Plains
				</span>
				<span class="flex items-center gap-1">
					<span class="w-4 h-4 inline-block" style="background-color: #558b2f"></span>
					Forest
				</span>
				<span class="flex items-center gap-1">
					<span class="w-4 h-4 inline-block" style="background-color: #8d6e63"></span>
					Hills
				</span>
				<span class="flex items-center gap-1">
					<span class="w-4 h-4 inline-block" style="background-color: #757575"></span>
					Mountains
				</span>
				<span class="flex items-center gap-1">
					<span class="w-4 h-4 inline-block" style="background-color: #ffffff"></span>
					Snow Peaks
				</span>
			</div>
		</div>
	</div>
</div>
