<script lang="ts">
	import type { Prisma } from '@prisma/client';

	type Props = {
		tile: Prisma.TileGetPayload<{ include: { Biome: true; Plots: true } }>;
		/** Display mode - affects styling and interaction */
		mode?: 'admin' | 'player';
	};

	let { tile, mode = 'player' }: Props = $props();

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
	
	// Get tooltip content based on mode
	function getTooltipContent(): string {
		if (mode === 'admin') {
			return `Biome: ${tile.Biome.name}
Type: ${tile.type}
Elevation: ${tile.elevation.toFixed(3)}
Precipitation: ${tile.precipitation.toFixed(3)}
Temperature: ${tile.temperature.toFixed(3)}
Plots: ${tile.Plots.length}`;
		}
		
		// Player mode - more user-friendly
		return `${tile.Biome.name}
Elevation: ${(tile.elevation * 100).toFixed(1)}%
Temperature: ${tile.temperature.toFixed(1)}°C
Precipitation: ${tile.precipitation.toFixed(1)}mm${tile.Plots.length > 0 ? '\n' + tile.Plots.length + ' ' + (tile.Plots.length === 1 ? 'Plot' : 'Plots') : ''}`;
	}
</script>

<div
	class="w-full h-full cursor-help hover:shadow-[inset_0_0_0_2px_rgba(255,255,0,0.8)] hover:z-10 transition-shadow relative"
	style="background-color: {getTileColor(tile)}"
	role="button"
	tabindex="0"
	aria-label="Tile: {tile.Biome.name}"
	title={getTooltipContent()}
>
	{#if tile.Plots.length > 0}
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div class="w-1.5 h-1.5 bg-warning-400 rounded-full shadow-[0_0_3px_rgba(251,191,36,1)]"></div>
		</div>
	{/if}
</div>
