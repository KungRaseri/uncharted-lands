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
		console.log('[WORLD] Region coordinates:', regions.map(r => `(${r.xCoord},${r.yCoord})`).join(', '));
		
		// Check coordinate ranges
		const xCoords = regions.map(r => r.xCoord);
		const yCoords = regions.map(r => r.yCoord);
		console.log('[WORLD] X range:', Math.min(...xCoords), '-', Math.max(...xCoords));
		console.log('[WORLD] Y range:', Math.min(...yCoords), '-', Math.max(...yCoords));
	});
	
	// Calculate actual grid dimensions from coordinates
	const maxX = $derived(Math.max(...regions.map(r => r.xCoord)) + 1);
	const maxY = $derived(Math.max(...regions.map(r => r.yCoord)) + 1);
	const gridCols = $derived(maxX);
	
	// Create a 2D grid and place regions at their coordinates
	const regionGrid = $derived(() => {
		// Initialize empty grid
		const grid: (typeof regions[0] | null)[][] = Array.from({ length: maxY }, () => 
			Array(maxX).fill(null)
		);
		
		console.log('[WORLD] Creating grid:', maxY, 'rows x', maxX, 'cols');
		
		// Place each region at its coordinate position
		for (const region of regions) {
			const x = region.xCoord;
			const y = region.yCoord;
			
			if (y >= 0 && y < maxY && x >= 0 && x < maxX) {
				grid[y][x] = region;
				console.log('[WORLD] Placed', region.name, 'at grid[' + y + '][' + x + ']');
			} else {
				console.error('[WORLD] Region out of bounds!', region.name, 'coords:', x, y, 'grid:', maxX, 'x', maxY);
			}
		}
		
		// Log grid structure
		console.log('[WORLD] Grid filled cells:', grid.flat().filter(r => r !== null).length, '/', maxX * maxY);
		
		// Log first row to verify
		console.log('[WORLD] First row (y=0):', grid[0].map(r => r?.name || 'null').join(', '));
		console.log('[WORLD] First column (x=0):', grid.map(row => row[0]?.name || 'null').join(', '));
		
		return grid;
	});
</script>

<div class="space-y-4">
	<!-- Map Container -->
	<div class="flex justify-center">
		<div class="bg-surface-200 dark:bg-surface-800 p-4 rounded-lg">
			<div class="inline-grid gap-0 border border-surface-300 dark:border-surface-600"
			     style="grid-template-columns: repeat({gridCols}, minmax(0, 1fr))">
				{#each regionGrid() as row}
					{#each row as region}
						{#if region}
							<div class="border border-surface-300 dark:border-surface-600 bg-surface-100 dark:bg-surface-900 aspect-square" 
							     title="Region {region.name} ({region.xCoord}, {region.yCoord})">
								<RegionComponent {region} />
							</div>
						{:else}
							<div class="border border-surface-400 dark:border-surface-700 bg-surface-300 dark:bg-surface-800 aspect-square opacity-30"
							     title="Empty region">
								<div class="w-20 h-20"></div>
							</div>
						{/if}
					{/each}
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
