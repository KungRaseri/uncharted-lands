<script lang="ts">
	import { getElevationColor, getTerrainType } from '$lib/utils/map-colors';
	import { getRegionStats, formatRegionTileTooltip } from '$lib/utils/region-stats';
	
	type Props = {
		regions: any[];
	};

	let { regions }: Props = $props();

	// Create detailed tooltip for a tile using utility functions
	function getTileTooltip(
		region: any,
		tileRow: number,
		tileCol: number,
		elevation: number
	): string {
		const stats = getRegionStats(region.elevationMap);
		const terrainType = getTerrainType(elevation);

		return formatRegionTileTooltip({
			regionName: region.name,
			regionX: region.xCoord,
			regionY: region.yCoord,
			tileRow,
			tileCol,
			elevation,
			terrainType,
			stats
		});
	}
</script>

<div class="card p-4 rounded-md">
	<h2 class="text-xl font-semibold mb-4">World Preview (Elevation)</h2>
	<div class="bg-surface-200 dark:bg-surface-700 p-4 rounded-md">
		<div
			class="grid grid-cols-10 gap-0 w-full xl:w-1/2 mx-auto border border-surface-300 dark:border-surface-600"
		>
			{#each regions as region}
				<div class="border border-surface-300 dark:border-surface-600 p-0 aspect-square">
					<div class="grid grid-cols-10 gap-0 h-full w-full">
						{#if region.elevationMap && Array.isArray(region.elevationMap)}
							{#each region.elevationMap as row, rowIndex}
								{#each row as elevation, colIndex}
									<div
										class="w-full h-full cursor-help
										hover:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.8)]
										dark:hover:shadow-[inset_0_0_0_2px_rgba(0,0,0,0.9)]
										transition-shadow duration-150"
										style="background-color: {getElevationColor(elevation)}"
										title={getTileTooltip(region, rowIndex, colIndex, elevation)}
									></div>
								{/each}
							{/each}
						{/if}
					</div>
				</div>
			{/each}
		</div>
		<div class="mt-4 text-sm text-surface-600 dark:text-surface-400">
			<div>Generated {regions.length} regions ({regions.length * 100} tiles)</div>
			<div class="mt-2 flex items-center gap-4 flex-wrap">
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
