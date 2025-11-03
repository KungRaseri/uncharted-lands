<script lang="ts">
	type Props = {
		tile: any;
		regionTiles: any[];
		regionName?: string;
	};

	let { tile, regionTiles, regionName = 'Region' }: Props = $props();

	// Get color based on elevation value
	function getElevationColor(value: number): string {
		if (value < -0.3) return '#001a33'; // Deep ocean
		if (value < 0) return '#003d66'; // Ocean
		if (value < 0.1) return '#f4e4c1'; // Beach/Sand
		if (value < 0.3) return '#7cb342'; // Plains
		if (value < 0.5) return '#558b2f'; // Forest
		if (value < 0.7) return '#8d6e63'; // Hills
		if (value < 0.9) return '#757575'; // Mountains
		return '#ffffff'; // Snow peaks
	}

	// Get terrain type name from elevation
	function getTerrainType(elevation: number): string {
		if (elevation < -0.3) return 'Deep Ocean';
		if (elevation < 0) return 'Ocean';
		if (elevation < 0.1) return 'Beach';
		if (elevation < 0.3) return 'Plains';
		if (elevation < 0.5) return 'Forest';
		if (elevation < 0.7) return 'Hills';
		if (elevation < 0.9) return 'Mountains';
		return 'Snow Peaks';
	}

	// Organize tiles into 10x10 grid
	const tileGrid = $derived(() => {
		const grid: any[][] = Array.from({ length: 10 }, () => Array(10).fill(null));
		
		// Sort tiles to ensure correct positioning
		const sortedTiles = [...regionTiles].sort((a, b) => a.id.localeCompare(b.id));
		
		sortedTiles.forEach((t, index) => {
			const row = Math.floor(index / 10);
			const col = index % 10;
			if (row < 10 && col < 10) {
				grid[row][col] = t;
			}
		});
		
		return grid;
	});

	// Find current tile position
	const tilePosition = $derived(() => {
		const sortedTiles = [...regionTiles].sort((a, b) => a.id.localeCompare(b.id));
		const index = sortedTiles.findIndex((t) => t.id === tile.id);
		if (index === -1) return { row: -1, col: -1 };
		return {
			row: Math.floor(index / 10),
			col: index % 10
		};
	});
</script>

<div class="card p-4 rounded-md">
	<h2 class="text-xl font-semibold mb-4">Tile Location in {regionName}</h2>
	
	<div class="bg-surface-200 dark:bg-surface-700 p-4 rounded-md">
		<!-- Position Info -->
		<div class="mb-4 p-3 bg-surface-100 dark:bg-surface-800 rounded-md text-center">
			<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">Position in Region</p>
			<p class="text-lg font-bold">Row {tilePosition().row}, Column {tilePosition().col}</p>
			<p class="text-xs text-surface-600 dark:text-surface-400">
				(Tile {tilePosition().row * 10 + tilePosition().col + 1} of 100)
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
