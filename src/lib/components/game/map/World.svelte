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
	
	console.log('[WORLD] Rendering world with regions:', {
		regionCount: regions.length,
		firstRegion: regions[0] ? {
			id: regions[0].id,
			coords: [regions[0].xCoord, regions[0].yCoord],
			tileCount: regions[0].tiles?.length
		} : null
	});
	
	// Sort regions by coordinates for proper grid display
	const sortedRegions = $derived(
		[...regions].sort((a, b) => {
			if (a.yCoord !== b.yCoord) return a.yCoord - b.yCoord;
			return a.xCoord - b.xCoord;
		})
	);
	
	// Calculate grid dimensions based on actual region coordinates
	const maxX = $derived(Math.max(...regions.map(r => r.xCoord)) + 1);
	const maxY = $derived(Math.max(...regions.map(r => r.yCoord)) + 1);
	
	$effect(() => {
		console.log('[WORLD] Grid dimensions:', { maxX, maxY, totalCells: maxX * maxY });
		console.log('[WORLD] Region coordinates:', regions.map(r => ({ x: r.xCoord, y: r.yCoord, name: r.name })));
	});
	
	// Create a 2D grid of regions for proper layout
	const regionGrid = $derived(() => {
		const grid: (typeof regions[0] | null)[][] = Array.from({ length: maxY }, () => 
			Array(maxX).fill(null)
		);
		
		console.log('[WORLD] Creating grid:', { rows: maxY, cols: maxX });
		
		for (const region of sortedRegions) {
			if (region.yCoord >= 0 && region.xCoord >= 0 && region.yCoord < maxY && region.xCoord < maxX) {
				console.log('[WORLD] Placing region at:', { x: region.xCoord, y: region.yCoord, name: region.name });
				grid[region.yCoord][region.xCoord] = region;
			} else {
				console.warn('[WORLD] Region coordinates out of bounds:', { x: region.xCoord, y: region.yCoord, name: region.name });
			}
		}
		
		return grid;
	});
</script>

<div class="space-y-4">
	<!-- Map Container -->
	<div class="flex justify-center items-start">
		<div class="inline-grid gap-0.5 p-4 bg-surface-200 dark:bg-surface-800 rounded-lg border-2 border-surface-300 dark:border-surface-700"
		     style="grid-template-columns: repeat({maxX}, minmax(0, 1fr))">
			{#each regionGrid() as row, rowIndex}
				{#each row as region, colIndex}
					{#if region}
						<div class="border border-surface-500 dark:border-surface-600 bg-surface-100 dark:bg-surface-900" 
						     title="Region {region.name} ({region.xCoord}, {region.yCoord})">
							<RegionComponent {region} />
						</div>
					{:else}
						<div class="border border-surface-400 dark:border-surface-700 bg-surface-300 dark:bg-surface-800"
						     title="Empty region ({colIndex}, {rowIndex})">
							<div class="w-20 h-20"></div>
						</div>
					{/if}
				{/each}
			{/each}
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
