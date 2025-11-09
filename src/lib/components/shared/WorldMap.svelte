<script lang="ts">
	import RegionComponent from '$lib/components/game/map/Region.svelte';
	import type { RegionWithTiles } from '$lib/types/game';
	import { getElevationColor, getTerrainType } from '$lib/utils/map-colors';
	import { getAdminRegionTooltip } from '$lib/utils/admin-tooltips';
	
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
		/** Regions with full tile data */
		regions?: RegionWithTiles[];
		/** Regions with elevation map data (ONLY for world creation preview) */
		previewRegions?: RegionWithElevationMap[];
		/** Display mode: affects tooltips and hover details */
		mode?: 'admin' | 'player';
		/** Current player's profile ID (for player mode settlement filtering) */
		currentPlayerProfileId?: string;
		/** Show legend */
		showLegend?: boolean;
		/** Show stats */
		showStats?: boolean;
		/** Lazy load mode: adjust grid size based on loaded regions */
		lazyLoadEnabled?: boolean;
	};

	let { 
		regions, 
		previewRegions, 
		mode = 'player',
		currentPlayerProfileId,
		showLegend = true,
		showStats = false,
		lazyLoadEnabled = false
	}: Props = $props();
	
	// Preview mode is ONLY for world creation (before tiles exist)
	const isPreviewMode = $derived(!!previewRegions && !regions);
	const displayRegions = $derived(regions || previewRegions);
	
	// Sort regions by coordinates to ensure correct row-major order
	// xCoord represents row (i from generation), yCoord represents column (j from generation)
	const sortedRegions = $derived(
		displayRegions ? [...displayRegions].sort((a, b) => {
			if (a.xCoord !== b.xCoord) return a.xCoord - b.xCoord;
			return a.yCoord - b.yCoord;
		}) : []
	);
	
	// Calculate grid dimensions dynamically
	const gridDimensions = $derived(() => {
		if (!displayRegions || displayRegions.length === 0) {
			return { cols: 10, rows: 10, minX: 0, minY: 0, maxX: 9, maxY: 9 }; // Default 10x10
		}
		
		if (lazyLoadEnabled) {
			// For lazy loading, calculate actual bounds from loaded regions
			const xCoords = displayRegions.map(r => r.xCoord);
			const yCoords = displayRegions.map(r => r.yCoord);
			const minX = Math.min(...xCoords);
			const maxX = Math.max(...xCoords);
			const minY = Math.min(...yCoords);
			const maxY = Math.max(...yCoords);
			const cols = maxY - minY + 1;
			const rows = maxX - minX + 1;
			
			console.log('[WORLDMAP] Lazy load grid dimensions:', {
				regionCount: displayRegions.length,
				xRange: [minX, maxX],
				yRange: [minY, maxY],
				cols,
				rows,
				regions: displayRegions.map(r => `(${r.xCoord},${r.yCoord})`).join(', ')
			});
			
			return { cols, rows, minX, maxX, minY, maxY };
		}
		
		// Full world mode: assume 10x10
		return { cols: 10, rows: 10, minX: 0, minY: 0, maxX: 9, maxY: 9 };
	});
	
	// Get grid CSS class based on column count
	const gridColsClass = $derived(() => {
		const cols = gridDimensions().cols;
		switch(cols) {
			case 3: return 'grid-cols-3';
			case 4: return 'grid-cols-4';
			case 5: return 'grid-cols-5';
			case 6: return 'grid-cols-6';
			case 7: return 'grid-cols-7';
			case 8: return 'grid-cols-8';
			case 9: return 'grid-cols-9';
			case 10: return 'grid-cols-10';
			default: return 'grid-cols-10';
		}
	});
	
	// Get grid CSS class based on row count
	const gridRowsClass = $derived(() => {
		const rows = gridDimensions().rows;
		switch(rows) {
			case 3: return 'grid-rows-3';
			case 4: return 'grid-rows-4';
			case 5: return 'grid-rows-5';
			case 6: return 'grid-rows-6';
			case 7: return 'grid-rows-7';
			case 8: return 'grid-rows-8';
			case 9: return 'grid-rows-9';
			case 10: return 'grid-rows-10';
			default: return 'grid-rows-10';
		}
	});
	
	// Calculate stats if needed
	const stats = $derived(() => {
		if (!showStats || !displayRegions) return null;
		
		if (isPreviewMode && previewRegions) {
			// Preview mode: count based on elevation maps
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
			// Normal mode: count based on actual tiles
			const totalTiles = regions.reduce((sum, r) => sum + r.tiles.length, 0);
			const landTiles = regions.reduce((sum, r) => 
				sum + r.tiles.filter((t) => t.type === 'LAND').length, 0
			);
			const oceanTiles = regions.reduce((sum, r) => 
				sum + r.tiles.filter((t) => t.type === 'OCEAN').length, 0
			);
			
			return { totalTiles, landTiles, oceanTiles };
		}
		
		return null;
	});
	
	// Helper removed - now using getAdminRegionTooltip from utils
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
			<!-- Dynamic grid size based on loaded regions -->
			<div class="grid {gridColsClass()} {gridRowsClass()} gap-0 border-2 border-surface-400 dark:border-surface-500 w-[600px] h-[600px] max-w-[90vw] max-h-[90vw]">
				{#if isPreviewMode && previewRegions}
					<!-- Preview Mode (World Creation ONLY): Show elevation data -->
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
													title={getAdminRegionTooltip(region, rowIndex, colIndex, elevationValue)}
												></div>
											{/each}
										{/if}
									{/each}
								{/if}
							</div>
						</div>
					{/each}
				{:else if regions}
					<!-- Normal Mode: Show biome-based tiles using Region component (both admin & player) -->
					{#each regions as region}
						{@const dims = gridDimensions()}
						{@const gridRow = region.xCoord - dims.minX + 1}
						{@const gridCol = region.yCoord - dims.minY + 1}
						<div class="border border-surface-400 dark:border-surface-600 bg-surface-100 dark:bg-surface-900 w-full h-full" 
						     style="grid-row: {gridRow}; grid-column: {gridCol};"
						     title="Region {region.name} ({region.xCoord}, {region.yCoord}) -> Grid ({gridRow}, {gridCol})">
							<RegionComponent {region} mode={mode} {currentPlayerProfileId} />
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
				{#if isPreviewMode}
					<!-- Preview Legend (Elevation-based - World Creation Only) -->
					<div class="text-sm text-surface-600 dark:text-surface-400">
						<div class="flex items-center gap-3 flex-wrap justify-center">
							<span class="font-semibold text-base mr-2">Elevation Preview:</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #001a33"></span>
								<span>Deep Ocean (&lt; -0.3)</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #003d66"></span>
								<span>Ocean (&lt; 0)</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #f4e4c1"></span>
								<span>Beach (0-0.1)</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #78b450"></span>
								<span>Plains (0.1-0.3)</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #5a8232"></span>
								<span>Forest (0.3-0.5)</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #8d6e63"></span>
								<span>Hills (0.5-0.7)</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #969696"></span>
								<span>Mountains (0.7-0.9)</span>
							</span>
							<span class="flex items-center gap-1.5">
								<span class="w-5 h-5 inline-block border border-surface-400 rounded" style="background-color: #dce1f0"></span>
								<span>Snow Peaks (&gt; 0.9)</span>
							</span>
						</div>
					</div>
				{:else}
					<!-- Biome Legend (Both Admin & Player) -->
					<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
						<!-- Water & Coastal -->
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(0, 26, 51)"></div>
							<span>Deep Ocean</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(0, 61, 102)"></div>
							<span>Ocean</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(244, 228, 193)"></div>
							<span>Beach</span>
						</div>
						
						<!-- Cold Biomes -->
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(220, 225, 240)"></div>
							<span>Tundra</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(45, 100, 60)"></div>
							<span>Boreal Forest</span>
						</div>
						
						<!-- Temperate Biomes -->
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(60, 130, 50)"></div>
							<span>Temperate Forest</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(120, 180, 80)"></div>
							<span>Grassland</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(90, 140, 70)"></div>
							<span>Woodland</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(140, 160, 90)"></div>
							<span>Shrubland</span>
						</div>
						
						<!-- Tropical Biomes -->
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(50, 140, 70)"></div>
							<span>Tropical Forest</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(30, 130, 60)"></div>
							<span>Rainforest</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(200, 170, 80)"></div>
							<span>Savanna</span>
						</div>
						
						<!-- Deserts -->
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(190, 180, 160)"></div>
							<span>Cold Desert</span>
						</div>
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(230, 200, 140)"></div>
							<span>Desert</span>
						</div>
						
						<!-- Mountains -->
						<div class="flex items-center gap-2">
							<div class="w-5 h-5 rounded border border-surface-400" style="background-color: rgb(150, 150, 150)"></div>
							<span>Mountains</span>
						</div>
						
						<!-- Settlement Marker (Player Mode Only) -->
						{#if mode === 'player'}
							<div class="flex items-center gap-2">
								<div class="w-3 h-3 bg-warning-400 rounded-full border border-surface-900 shadow-[0_0_3px_rgba(251,191,36,1)]"></div>
								<span>Settled Plots</span>
							</div>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
