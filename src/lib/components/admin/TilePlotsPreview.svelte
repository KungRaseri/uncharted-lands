<script lang="ts">
	import { Grid3x3, Home } from 'lucide-svelte';
	import { 
		calculatePlotStats, 
		getPlotTooltip, 
		getPlotLayout,
		type Plot 
	} from '$lib/utils/plot-layout';
	import { getAdminElevationColor, getAdminTerrainDescription } from '$lib/utils/admin-terrain';
	
	type TileProps = {
		id: string;
		elevation: number;
		precipitation: number;
		temperature: number;
		type: string;
		Biome?: {
			name: string;
		};
		Plots: Plot[];
	};

	let { 
		tile, 
		tileName = 'Tile',
		tileX = 0,
		tileY = 0
	}: { 
		tile: TileProps; 
		tileName?: string;
		tileX?: number;
		tileY?: number;
	} = $props();

	// Calculate plot statistics using utility function
	const plotStats = $derived(calculatePlotStats(tile.Plots));

	// Use utility function for plot layout
	const plotLayout = $derived(getPlotLayout(tile.Plots));
</script>

<div class="card preset-filled-surface-100-900 p-6 max-w-2xl mx-auto">
	<!-- Header -->
	<div class="mb-4">
		<h3 class="text-lg font-semibold mb-2 flex items-center gap-2">
			<Grid3x3 size={20} />
			{tileName} - Plots Layout
		</h3>
		<div class="flex items-center gap-4 text-sm text-surface-600 dark:text-surface-400">
			<span>Coordinates: ({tileX}, {tileY})</span>
			<span>Biome: {tile.Biome?.name || 'Unknown'}</span>
			<span>Type: {tile.type.charAt(0).toUpperCase() + tile.type.slice(1)}</span>
			<span>Terrain: {getAdminTerrainDescription(tile.elevation, tile.type)}</span>
		</div>
	</div>

	<!-- Tile with Plots Overlay -->
	<div class="relative aspect-square mb-4 rounded-lg overflow-hidden border-2 border-surface-300 dark:border-surface-600">
		<!-- Base Tile (colored by elevation) -->
		<div
			class="absolute inset-0"
			style="background-color: {getAdminElevationColor(tile.elevation, tile.type)}"
		></div>

		<!-- Plots Overlay -->
		{#if tile.Plots.length > 0}
			{#each plotLayout as { plot, top, left, width, height, scale }}
				{@const hasSettlement = plot.Settlement}
				<div
					class="absolute border-2 border-white/60 rounded transition-all duration-150 hover:border-warning-500 hover:z-10 hover:scale-105 cursor-pointer"
					style="
						top: {top}%;
						left: {left}%;
						width: {width}%;
						height: {height}%;
						background-color: rgba(255, 255, 255, 0.1);
						backdrop-filter: blur(1px);
					"
					title={getPlotTooltip(plot)}
				>
					<!-- Plot Content -->
					<div class="absolute inset-0 flex items-center justify-center">
						<div class="text-center">
							<!-- Settlement Indicator -->
							{#if hasSettlement}
								<div class="bg-warning-500 rounded-full p-1 inline-block mb-1">
									<Home size={12} class="text-white" />
								</div>
							{/if}
							<!-- Plot Number/ID (shortened) -->
							<div class="text-[0.5rem] font-mono text-white bg-black/40 px-1 rounded">
								{plot.id.substring(0, 6)}
							</div>
						</div>
					</div>

					<!-- Area indicator (corner badge) -->
					<div class="absolute top-0 right-0 bg-black/60 text-white text-[0.45rem] px-1 rounded-bl">
						{plot.area}m²
					</div>
				</div>
			{/each}
		{:else}
			<!-- No Plots Message -->
			<div class="absolute inset-0 flex items-center justify-center">
				<div class="text-center text-white bg-black/60 px-4 py-2 rounded">
					<Grid3x3 size={32} class="mx-auto mb-2" />
					<p class="text-sm font-semibold">No plots on this tile</p>
				</div>
			</div>
		{/if}
	</div>

	<!-- Stats Bar -->
	<div class="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-sm">
		<div class="p-2 rounded bg-surface-100 dark:bg-surface-800">
			<p class="text-xs text-surface-600 dark:text-surface-400">Total Plots</p>
			<p class="font-semibold">{plotStats.totalPlots}</p>
		</div>
		<div class="p-2 rounded bg-surface-100 dark:bg-surface-800">
			<p class="text-xs text-surface-600 dark:text-surface-400">Total Area</p>
			<p class="font-semibold">{plotStats.totalArea.toFixed(0)} m²</p>
		</div>
		<div class="p-2 rounded bg-surface-100 dark:bg-surface-800">
			<p class="text-xs text-surface-600 dark:text-surface-400">Settlements</p>
			<p class="font-semibold text-warning-500">{plotStats.withSettlements}</p>
		</div>
		<div class="p-2 rounded bg-surface-100 dark:bg-surface-800">
			<p class="text-xs text-surface-600 dark:text-surface-400">Avg Solar</p>
			<p class="font-semibold">{plotStats.avgSolar.toFixed(1)}</p>
		</div>
		<div class="p-2 rounded bg-surface-100 dark:bg-surface-800">
			<p class="text-xs text-surface-600 dark:text-surface-400">Avg Wind</p>
			<p class="font-semibold">{plotStats.avgWind.toFixed(1)}</p>
		</div>
	</div>

	<!-- Legend -->
	<div class="mt-4 p-3 rounded bg-surface-100 dark:bg-surface-800 text-xs">
		<p class="font-semibold mb-2 flex items-center gap-1">
			<span>Legend:</span>
		</p>
		<div class="flex flex-wrap gap-3">
			<div class="flex items-center gap-1.5">
				<div class="w-4 h-4 border-2 border-white/60 rounded bg-white/10"></div>
				<span>Plot Boundary</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="w-4 h-4 bg-warning-500 rounded-full flex items-center justify-center">
					<Home size={8} class="text-white" />
				</div>
				<span>Settlement</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="px-1.5 py-0.5 bg-black/60 text-white rounded text-[0.6rem]">123456</div>
				<span>Plot ID</span>
			</div>
			<div class="flex items-center gap-1.5">
				<div class="px-1 py-0.5 bg-black/60 text-white rounded text-[0.6rem]">100m²</div>
				<span>Plot Area</span>
			</div>
		</div>
		<p class="mt-2 text-surface-600 dark:text-surface-400 italic">
			Hover over plots to see detailed information
		</p>
	</div>

	<!-- Elevation Reference -->
	<div class="mt-3 p-2 rounded bg-surface-50 dark:bg-surface-900 text-xs">
		<p class="font-semibold mb-1">Tile Information:</p>
		<div class="flex flex-col gap-1">
			<div class="flex items-center gap-2">
				<span class="text-surface-600 dark:text-surface-400 w-24">Type:</span>
				<span class="font-semibold">{tile.type.charAt(0).toUpperCase() + tile.type.slice(1)}</span>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-surface-600 dark:text-surface-400 w-24">Elevation:</span>
				<div class="flex items-center gap-2">
					<div
						class="w-4 h-4 rounded border border-surface-300 dark:border-surface-600"
						style="background-color: {getAdminElevationColor(tile.elevation, tile.type)}"
					></div>
					<span>{tile.elevation.toFixed(3)} ({getAdminTerrainDescription(tile.elevation, tile.type)})</span>
				</div>
			</div>
		</div>
	</div>
</div>
