<script lang="ts">
	import type { Prisma } from '@prisma/client';

	type Props = {
		tile: Prisma.TileGetPayload<{ include: { Biome: true; Plots: true } }>;
	};

	let { tile }: Props = $props();

	// Get color based on biome and elevation
	function getTileColor(tile: Props['tile']): string {
		const elevation = tile.elevation;
		const biomeName = tile.Biome.name.toLowerCase();
		
		// Water/Ocean (very low elevation)
		if (elevation < 0.3) {
			const blue = Math.floor(100 + elevation * 400);
			return `rgb(30, 60, ${blue})`;
		}
		
		// Beach/Sand (low elevation)
		if (elevation < 0.35) {
			return `rgb(238, 214, 175)`;
		}
		
		// Grassland/Plains
		if (biomeName.includes('grassland') || biomeName.includes('plain')) {
			const green = Math.floor(100 + elevation * 100);
			return `rgb(60, ${green}, 40)`;
		}
		
		// Forest
		if (biomeName.includes('forest')) {
			const green = Math.floor(80 + elevation * 60);
			return `rgb(34, ${green}, 34)`;
		}
		
		// Desert
		if (biomeName.includes('desert')) {
			const sand = Math.floor(200 + elevation * 40);
			return `rgb(${sand}, ${sand - 40}, 100)`;
		}
		
		// Tundra/Snow
		if (biomeName.includes('tundra') || biomeName.includes('snow')) {
			const white = Math.floor(200 + elevation * 50);
			return `rgb(${white}, ${white}, 255)`;
		}
		
		// Mountain (high elevation)
		if (elevation > 0.7) {
			const gray = Math.floor(100 + elevation * 100);
			return `rgb(${gray}, ${gray}, ${gray})`;
		}
		
		// Default: elevation-based green to brown gradient
		const r = Math.floor(60 + elevation * 100);
		const g = Math.floor(100 + elevation * 80);
		const b = Math.floor(40 + elevation * 60);
		return `rgb(${r}, ${g}, ${b})`;
	}

	let showTooltip = $state(false);
	let tooltipX = $state(0);
	let tooltipY = $state(0);

	function handleMouseEnter(e: MouseEvent) {
		showTooltip = true;
		tooltipX = e.clientX;
		tooltipY = e.clientY;
	}

	function handleMouseLeave() {
		showTooltip = false;
	}

	function handleMouseMove(e: MouseEvent) {
		tooltipX = e.clientX;
		tooltipY = e.clientY;
	}
</script>

<div
	class="w-2 h-2 border-[0.5px] border-surface-400 dark:border-surface-600 hover:border-primary-400 hover:scale-150 hover:z-10 cursor-pointer transition-all relative"
	style="background-color: {getTileColor(tile)}"
	onmouseenter={handleMouseEnter}
	onmouseleave={handleMouseLeave}
	onmousemove={handleMouseMove}
	role="button"
	tabindex="0"
	aria-label="Tile: {tile.Biome.name}"
>
	{#if tile.Plots.length > 0}
		<div class="absolute inset-0 flex items-center justify-center">
			<div class="w-1 h-1 bg-warning-400 rounded-full shadow-[0_0_2px_rgba(251,191,36,1)]"></div>
		</div>
	{/if}
</div>

{#if showTooltip}
	<div
		class="fixed z-50 pointer-events-none"
		style="left: {tooltipX + 10}px; top: {tooltipY + 10}px"
	>
		<div class="card preset-filled-surface-50-950 p-3 text-xs shadow-xl max-w-xs">
			<div class="font-bold mb-1">{tile.Biome.name}</div>
			<div class="space-y-0.5 text-surface-600 dark:text-surface-400">
				<div>Elevation: {(tile.elevation * 100).toFixed(1)}%</div>
				<div>Temperature: {tile.temperature.toFixed(1)}°C</div>
				<div>Precipitation: {tile.precipitation.toFixed(1)}mm</div>
				{#if tile.Plots.length > 0}
					<div class="text-warning-500 font-semibold mt-1">
						{tile.Plots.length} {tile.Plots.length === 1 ? 'Plot' : 'Plots'}
					</div>
				{/if}
			</div>
		</div>
	</div>
{/if}
