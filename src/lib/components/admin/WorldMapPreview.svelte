<script lang="ts">
	import { getElevationColor, getTerrainType } from '$lib/utils/map-colors';
	
	type Props = {
		regions: any[];
	};

	let { regions }: Props = $props();

	// Calculate average values for a region
	function getRegionStats(region: any) {
		if (!region.elevationMap || !Array.isArray(region.elevationMap)) {
			return { avgElevation: 0, minElevation: 0, maxElevation: 0 };
		}

		const allValues = region.elevationMap.flat();
		const sum = allValues.reduce((a: number, b: number) => a + b, 0);
		const avg = sum / allValues.length;
		const min = Math.min(...allValues);
		const max = Math.max(...allValues);

		return {
			avgElevation: avg,
			minElevation: min,
			maxElevation: max
		};
	}

	// Create detailed tooltip for a tile
	function getTileTooltip(
		region: any,
		tileRow: number,
		tileCol: number,
		elevation: number
	): string {
		const stats = getRegionStats(region);
		const terrainType = getTerrainType(elevation);

		return `Region: ${region.name || 'Unknown'} (${region.xCoord}, ${region.yCoord})
Region Avg Elevation: ${stats.avgElevation.toFixed(3)}
Region Range: ${stats.minElevation.toFixed(2)} to ${stats.maxElevation.toFixed(2)}

Tile: (${tileRow}, ${tileCol})
Tile Elevation: ${elevation.toFixed(3)}
Terrain Type: ${terrainType}`;
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
