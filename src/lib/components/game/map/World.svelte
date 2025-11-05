<script lang="ts">
	import type { Prisma } from '@prisma/client';
	import RegionComponent from '$lib/components/game/map/Region.svelte';

	type Props = {
		regions: Prisma.RegionGetPayload<{
			include: {
				tiles: {
					include: {
						Biome: true;
						Plots: true;
					};
				};
			};
		}>[];
	};

	let { regions }: Props = $props();
	
	$effect(() => {
		console.log('[WORLD] Total regions:', regions.length);
		console.log('[WORLD] First few regions:', regions.slice(0, 5).map(r => `(${r.xCoord},${r.yCoord})`).join(', '));
	});
	
	// Sort regions by coordinates to ensure correct row-major order
	// xCoord represents row (i from generation), yCoord represents column (j from generation)
	// This matches how the admin preview displays regions in order
	const sortedRegions = $derived(
		[...regions].sort((a, b) => {
			// Sort by row first (xCoord), then by column (yCoord)
			if (a.xCoord !== b.xCoord) return a.xCoord - b.xCoord;
			return a.yCoord - b.yCoord;
		})
	);
</script>

<div class="space-y-4">
	<!-- Map Container -->
	<div class="flex justify-center">
		<div class="bg-surface-200 dark:bg-surface-800 p-4 rounded-lg">
			<div class="grid grid-cols-10 gap-0 border border-surface-300 dark:border-surface-600 w-full xl:w-1/2 mx-auto">
				{#each sortedRegions as region}
					<div class="border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-900 aspect-square" 
					     title="Region {region.name} ({region.xCoord}, {region.yCoord})">
						<RegionComponent {region} />
					</div>
				{/each}
			</div>
		</div>
	</div>
	
	<!-- Legend -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded" style="background-color: rgb(30, 60, 150)"></div>
			<span>Ocean/Water</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded" style="background-color: rgb(238, 214, 175)"></div>
			<span>Beach</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded" style="background-color: rgb(60, 150, 40)"></div>
			<span>Grassland</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded" style="background-color: rgb(34, 120, 34)"></div>
			<span>Forest</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded" style="background-color: rgb(220, 180, 100)"></div>
			<span>Desert</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded" style="background-color: rgb(150, 150, 150)"></div>
			<span>Mountain</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-4 h-4 rounded" style="background-color: rgb(220, 220, 255)"></div>
			<span>Tundra/Snow</span>
		</div>
		<div class="flex items-center gap-2">
			<div class="w-2 h-2 bg-warning-500 rounded-full border border-surface-900"></div>
			<span>Settled Plots</span>
		</div>
	</div>
</div>
