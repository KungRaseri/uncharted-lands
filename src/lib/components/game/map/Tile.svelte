<script lang="ts">
	import type { Prisma } from '@prisma/client';

	type Props = {
		tile: Prisma.TileGetPayload<{ include: { Biome: true; Plots: { include: { Settlement: true } } } }>;
		/** Display mode - affects styling and interaction */
		mode?: 'admin' | 'player';
		/** Current player's profile ID (for player mode settlement filtering) */
		currentPlayerProfileId?: string;
	};

	let { tile, mode = 'player', currentPlayerProfileId }: Props = $props();
	
	// Check if tile has any settled plots
	const hasSettlement = $derived(() => {
		const settledPlots = tile.Plots.filter(plot => plot.Settlement);
		
		if (settledPlots.length === 0) {
			return false;
		}
		
		// In player mode, only show marker if player owns the settlement
		if (mode === 'player' && currentPlayerProfileId) {
			return settledPlots.some(plot => plot.Settlement?.playerProfileId === currentPlayerProfileId);
		}
		
		// In admin mode, show marker if ANY settlement exists
		return true;
	});

	// Get color based on biome type and elevation
	function getTileColor(tile: Props['tile']): string {
		const elevation = tile.elevation;
		const biomeName = tile.Biome.name;
		const type = tile.type;

		// Ocean/Water - differentiate by depth
		if (type === 'OCEAN' || elevation < 0) {
			if (elevation < -0.35) {
				return 'rgb(0, 26, 51)'; // Deep ocean - #001a33
			}
			return 'rgb(0, 61, 102)'; // Shallow ocean - #003d66
		}

		// Beach/Coastal (low elevation land)
		if (elevation >= 0 && elevation < 0.15) {
			return 'rgb(244, 228, 193)'; // Sandy beach color - #f4e4c1
		}

		// Biome-specific colors
		switch (biomeName) {
			case 'TUNDRA':
				return 'rgb(220, 225, 240)'; // Pale blue-white

			case 'FOREST_BOREAL':
				return 'rgb(45, 100, 60)'; // Dark green

			case 'FOREST_TEMPERATE_SEASONAL':
				return 'rgb(60, 130, 50)'; // Medium green

			case 'FOREST_TROPICAL_SEASONAL':
				return 'rgb(50, 140, 70)'; // Tropical green

			case 'RAINFOREST_TEMPERATE':
				return 'rgb(40, 110, 55)'; // Deep green

			case 'RAINFOREST_TROPICAL':
				return 'rgb(30, 130, 60)'; // Lush green

			case 'WOODLAND':
				return 'rgb(90, 140, 70)'; // Light forest green

			case 'SHRUBLAND':
				return 'rgb(140, 160, 90)'; // Olive green

			case 'SAVANNA':
				return 'rgb(200, 170, 80)'; // Golden grassland

			case 'GRASSLAND_TEMPERATE':
				return 'rgb(120, 180, 80)'; // Bright grass green

			case 'DESERT_COLD':
				return 'rgb(190, 180, 160)'; // Gray-tan

			case 'DESERT_SUBTROPICAL':
				return 'rgb(230, 200, 140)'; // Sandy yellow

			default:
				// Fallback: elevation-based
				if (elevation > 0.7) {
					return 'rgb(150, 150, 150)'; // Mountain gray
				}

				return 'rgb(100, 140, 80)'; // Default green
		}
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
		let tooltip = `${tile.Biome.name}
Elevation: ${(tile.elevation * 100).toFixed(1)}%
Temperature: ${tile.temperature.toFixed(1)}°C
Precipitation: ${tile.precipitation.toFixed(1)}mm`;

		// Add plot count if any
		if (tile.Plots.length > 0) {
			tooltip += `\n${tile.Plots.length} ${tile.Plots.length === 1 ? 'Plot' : 'Plots'}`;
		}

		// Add settlement name(s) if player owns any on this tile
		if (mode === 'player' && currentPlayerProfileId) {
			const playerSettlements = tile.Plots
				.filter(plot => plot.Settlement?.playerProfileId === currentPlayerProfileId)
				.map(plot => plot.Settlement?.name)
				.filter(name => name);

			if (playerSettlements.length > 0) {
				tooltip += `\n\n🏘️ ${playerSettlements.join(', ')}`;
			}
		}

		return tooltip;
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
	{#if hasSettlement()}
		<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div
				class="w-1.5 h-1.5 bg-warning-400 rounded-full shadow-[0_0_3px_rgba(251,191,36,1)]"
			></div>
		</div>
	{/if}
</div>
