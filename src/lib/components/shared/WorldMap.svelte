<script lang="ts">
	import type { Prisma } from '@prisma/client';
	import RegionComponent from '$lib/components/game/map/Region.svelte';
	
	type RegionWithTiles = Prisma.RegionGetPayload<{
		include: {
			tiles: {
				include: {
					Biome: true;
					Plots: true;
				};
			};
		};
	}>;
	
	type RegionWithElevationMap = {
		id: string;
		worldId: string;
		xCoord: number;
		yCoord: number;
		name: string | null;
		elevationMap: number[][];
		precipitationMap?: number[][];
		temperatureMap?: number[][];
	};
	
	type Props = {
		/** Regions with full tile data (for player view) */
		regions?: RegionWithTiles[];
		/** Regions with elevation map data (for admin preview) */
		previewRegions?: RegionWithElevationMap[];
		/** Display mode: 'admin' shows elevation data, 'player' shows biome-based tiles */
		mode?: 'admin' | 'player';
		/** Show legend */
		showLegend?: boolean;
		/** Show stats */
		showStats?: boolean;
	};

	let { 
		regions, 
		previewRegions, 
		mode = 'player',
		showLegend = true,
		showStats = false
	}: Props = $props();
	
	// Determine which data set to use
	const isAdminMode = $derived(mode === 'admin' || (previewRegions && !regions));
	const displayRegions = $derived(isAdminMode ? previewRegions : regions);
	
	// Sort regions by coordinates to ensure correct row-major order
	// xCoord represents row (i from generation), yCoord represents column (j from generation)
	const sortedRegions = $derived(
		displayRegions ? [...displayRegions].sort((a, b) => {
			if (a.xCoord !== b.xCoord) return a.xCoord - b.xCoord;
			return a.yCoord - b.yCoord;
		}) : []
	);
	
	// Calculate stats if needed
	const stats = $derived(() => {
		if (!showStats || !displayRegions) return null;
		
		if (isAdminMode && previewRegions) {
			// Admin mode: count based on elevation maps
			let totalTiles = 0;
			let landTiles = 0;
			let oceanTiles = 0;
			
			for (const region of previewRegions) {
				if (region.elevationMap && Array.isArray(region.elevationMap)) {
					const tiles = region.elevationMap.flat();
					totalTiles += tiles.length;
					landTiles += tiles.filter(e => e >= 0).length;
					oceanTiles += tiles.filter(e => e < 0).length;
				}
			}
			
			return { totalTiles, landTiles, oceanTiles };
		} else if (regions) {
			// Player mode: count based on actual tiles
			const totalTiles = regions.reduce((sum, r) => sum + r.tiles.length, 0);
			const landTiles = regions.reduce((sum, r) => 
				sum + r.tiles.filter(t => t.type === 'LAND').length, 0
			);
			const oceanTiles = regions.reduce((sum, r) => 
				sum + r.tiles.filter(t => t.type === 'OCEAN').length, 0
			);
			
			return { totalTiles, landTiles, oceanTiles };
		}
		
		return null;
	});
	
	// Get elevation color (for admin mode)
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
	
	// Get terrain type name (for tooltips)
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
	
	// Create tooltip for admin mode (elevation map preview)
	function getAdminTooltip(region: RegionWithElevationMap, row: number, col: number, elevation: number): string {
		const terrain = getTerrainType(elevation);
		return `Region: ${region.name || 'Unknown'} (${region.xCoord}, ${region.yCoord})
Tile: (${row}, ${col})
Elevation: ${elevation.toFixed(3)}
Terrain: ${terrain}`;
	}
</script>

<div class="space-y-4">
	<!-- Stats (if enabled) -->
	{#if showStats && stats()}
		{@const currentStats = stats()}
		{#if currentStats}
			<div class="flex justify-center gap-6 text-sm">
				<div class="text-center">
					<p class="text-2xl font-bold">{currentStats.totalTiles}</p>
					<p class="text-surface-600 dark:text-surface-400">Total Tiles</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-success-500">{currentStats.landTiles}</p>
					<p class="text-surface-600 dark:text-surface-400">Land Tiles</p>
				</div>
				<div class="text-center">
					<p class="text-2xl font-bold text-primary-500">{currentStats.oceanTiles}</p>
					<p class="text-surface-600 dark:text-surface-400">Ocean Tiles</p>
				</div>
			</div>
		{/if}
	{/if}
	
	<!-- Map Container -->
	<div class="flex justify-center">
		<div class="bg-surface-200 dark:bg-surface-800 p-4 rounded-lg inline-block">
			<!-- Set a specific size that's large and square. Max-w ensures it fits on smaller screens -->
			<div class="grid grid-cols-10 gap-0 border-2 border-surface-400 dark:border-surface-500 w-[600px] h-[600px] max-w-[90vw] max-h-[90vw] aspect-square">
				{#if isAdminMode && previewRegions}
					<!-- Admin Mode: Show elevation data -->
					{#each previewRegions as region}
						<div class="border border-surface-400 dark:border-surface-600 p-0 aspect-square">
							<div class="grid grid-cols-10 gap-0 h-full w-full">
								{#if region.elevationMap && Array.isArray(region.elevationMap)}
									{#each region.elevationMap as row, rowIndex}
										{#if Array.isArray(row)}
											{#each row as elevation, colIndex}
												{@const elevationValue = typeof elevation === 'number' ? elevation : 0}
												<div
													class="w-full h-full cursor-help
													hover:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.8)]
													dark:hover:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.9)]
													transition-shadow duration-150"
													style="background-color: {getElevationColor(elevationValue)}"
													title={getAdminTooltip(region, rowIndex, colIndex, elevationValue)}
												></div>
											{/each}
										{/if}
									{/each}
								{/if}
							</div>
						</div>
					{/each}
				{:else if regions}
					<!-- Player Mode: Show biome-based tiles using Region component -->
					{#each regions as region}
						<div class="border border-surface-400 dark:border-surface-600 bg-surface-100 dark:bg-surface-900 aspect-square" 
						     title="Region {region.name} ({region.xCoord}, {region.yCoord})">
							<RegionComponent {region} mode={mode} />
						</div>
					{/each}
				{/if}
			</div>
		</div>
	</div>
	
	<!-- Legend -->
	{#if showLegend}
		<div class="flex justify-center">
			<div class="bg-surface-200 dark:bg-surface-700 p-6 rounded-lg max-w-4xl">
				{#if isAdminMode}
					<!-- Admin Legend (Elevation-based) -->
					<div class="text-sm text-surface-600 dark:text-surface-400">
						<div class="flex items-center gap-3 flex-wrap justify-center">
							<span class="font-semibold text-base mr-2">Elevation Legend:</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #001a33"></span>
								<span>Deep Ocean</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #003d66"></span>
								<span>Ocean</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #f4e4c1"></span>
								<span>Beach</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #7cb342"></span>
								<span>Plains</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #558b2f"></span>
								<span>Forest</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #8d6e63"></span>
								<span>Hills</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #757575"></span>
								<span>Mountains</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #ffffff"></span>
								<span>Snow Peaks</span>
							</span>
						</div>
					</div>
				{:else}
					<!-- Player Legend (Biome-based) -->
					<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(30, 60, 150)"></div>
							<span>Ocean/Water</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(238, 214, 175)"></div>
							<span>Beach</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(60, 150, 40)"></div>
							<span>Grassland</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(34, 120, 34)"></div>
							<span>Forest</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(220, 180, 100)"></div>
							<span>Desert</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(150, 150, 150)"></div>
							<span>Mountain</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(220, 220, 255)"></div>
							<span>Tundra/Snow</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-3 h-3 bg-warning-400 rounded-full border border-surface-900 shadow-[0_0_3px_rgba(251,191,36,1)]"></div>
							<span>Settled Plots</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
