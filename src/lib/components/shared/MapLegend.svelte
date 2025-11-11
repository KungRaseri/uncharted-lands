<script lang="ts">
	import { TERRAIN_COLORS } from '$lib/utils/tile-colors';
	import type { MapViewMode } from '$lib/utils/tile-colors';

	type DisplayMode = 'admin' | 'player';

	type Props = {
		/** Map view mode to display legend for */
		viewMode?: MapViewMode;
		/** Display mode: affects whether to show settlement markers */
		mode?: DisplayMode;
		/** Show in preview mode (affects settlement marker display) */
		isPreviewMode?: boolean;
	};

	let { viewMode = 'satellite', mode = 'player', isPreviewMode = false }: Props = $props();
</script>

<div class="flex justify-center">
	<div class="bg-surface-200 dark:bg-surface-700 p-6 rounded-lg max-w-6xl w-full">
		<!-- Satellite View Legend (Biomes) -->
		{#if viewMode === 'satellite'}
			<div class="space-y-2">
				<h3 class="text-sm font-semibold text-center mb-3">Satellite View - Biomes</h3>
				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
					<!-- Water & Coastal -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(0, 26, 51)"
						></div>
						<span>Deep Ocean</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(0, 61, 102)"
						></div>
						<span>Ocean</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(244, 228, 193)"
						></div>
						<span>Beach</span>
					</div>

					<!-- Cold Biomes -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(220, 225, 240)"
						></div>
						<span>Tundra</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(45, 100, 60)"
						></div>
						<span>Boreal Forest</span>
					</div>

					<!-- Temperate Biomes -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(60, 130, 50)"
						></div>
						<span>Temperate Forest</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(120, 180, 80)"
						></div>
						<span>Grassland</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(90, 140, 70)"
						></div>
						<span>Woodland</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(140, 160, 90)"
						></div>
						<span>Shrubland</span>
					</div>

					<!-- Tropical Biomes -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(50, 140, 70)"
						></div>
						<span>Tropical Forest</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(30, 130, 60)"
						></div>
						<span>Rainforest</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(200, 170, 80)"
						></div>
						<span>Savanna</span>
					</div>

					<!-- Deserts -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(190, 180, 160)"
						></div>
						<span>Cold Desert</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: rgb(230, 200, 140)"
						></div>
						<span>Desert</span>
					</div>

					<!-- Settlement Marker (Player Mode Only) -->
					{#if mode === 'player' && !isPreviewMode}
						<div class="flex items-center gap-2">
							<div
								class="w-3 h-3 bg-warning-400 rounded-full border border-surface-900 shadow-[0_0_3px_rgba(251,191,36,1)]"
							></div>
							<span>Settled Plots</span>
						</div>
					{/if}
				</div>
			</div>
		{/if}

		<!-- Topographical View Legend (Elevation) -->
		{#if viewMode === 'topographical'}
			<div class="space-y-4">
				<h3 class="text-sm font-semibold text-center mb-1">Topographical View - Elevation</h3>
				<div class="text-center text-xs text-surface-600 dark:text-surface-400 mb-3">
					Values range from ~-1.9 (abyssal depths) to ~2.0+ (extreme peaks)
				</div>

				<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
					<!-- Deep Waters -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.ABYSSAL_DEPTHS}"
						></div>
						<span class="flex-1"
							>Abyssal Depths <span class="text-xs text-surface-500">&lt; -0.7</span></span
						>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.ABYSS}"
						></div>
						<span class="flex-1"
							>Abyss <span class="text-xs text-surface-500">-0.7 to -0.5</span></span
						>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.DEEP_OCEAN}"
						></div>
						<span class="flex-1"
							>Deep Ocean <span class="text-xs text-surface-500">-0.5 to -0.3</span></span
						>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.OCEAN}"
						></div>
						<span class="flex-1">Ocean <span class="text-xs text-surface-500">-0.3 to 0</span></span
						>
					</div>

					<!-- Coastal & Lowlands -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.BEACH}"
						></div>
						<span class="flex-1">Beach <span class="text-xs text-surface-500">0 to 0.1</span></span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.PLAINS}"
						></div>
						<span class="flex-1"
							>Plains <span class="text-xs text-surface-500">0.1 to 0.3</span></span
						>
					</div>

					<!-- Mid Elevations -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.FOREST}"
						></div>
						<span class="flex-1"
							>Forest <span class="text-xs text-surface-500">0.3 to 0.5</span></span
						>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.HILLS}"
						></div>
						<span class="flex-1"
							>Hills <span class="text-xs text-surface-500">0.5 to 0.65</span></span
						>
					</div>

					<!-- High Elevations -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.MOUNTAINS}"
						></div>
						<span class="flex-1"
							>Mountains <span class="text-xs text-surface-500">0.65 to 0.8</span></span
						>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.HIGH_MOUNTAINS}"
						></div>
						<span class="flex-1"
							>High Mountains <span class="text-xs text-surface-500">0.8 to 1.0</span></span
						>
					</div>

					<!-- Extreme Elevations -->
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.ALPINE_PEAKS}"
						></div>
						<span class="flex-1"
							>Alpine Peaks <span class="text-xs text-surface-500">1.0 to 1.5</span></span
						>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: {TERRAIN_COLORS.EXTREME_PEAKS}"
						></div>
						<span class="flex-1"
							>Extreme Peaks <span class="text-xs text-surface-500">&gt; 1.5</span></span
						>
					</div>
				</div>
			</div>
		{/if}

		<!-- Temperature View Legend -->
		{#if viewMode === 'temperature'}
			<div class="space-y-4">
				<h3 class="text-sm font-semibold text-center mb-1">Temperature View</h3>
				<div class="text-center text-xs text-surface-600 dark:text-surface-400 mb-3">
					Warmer colors indicate higher temperatures
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #0d1f4d"
						></div>
						<span>Frigid</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #2e5c8a"
						></div>
						<span>Very Cold</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #4a9eff"
						></div>
						<span>Cold</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #90ee90"
						></div>
						<span>Cool</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #ffff00"
						></div>
						<span>Mild</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #ffa500"
						></div>
						<span>Warm</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #ff4500"
						></div>
						<span>Hot</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #8b0000"
						></div>
						<span>Very Hot</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Precipitation View Legend -->
		{#if viewMode === 'precipitation'}
			<div class="space-y-4">
				<h3 class="text-sm font-semibold text-center mb-1">Precipitation View</h3>
				<div class="text-center text-xs text-surface-600 dark:text-surface-400 mb-3">
					Darker greens indicate higher precipitation levels
				</div>

				<div class="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #d4a574"
						></div>
						<span>Arid</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #c9b896"
						></div>
						<span>Dry</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #b8d4a8"
						></div>
						<span>Semi-dry</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #90c878"
						></div>
						<span>Moderate</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #5fb04e"
						></div>
						<span>Moist</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #3a8c3a"
						></div>
						<span>Wet</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #1e5a1e"
						></div>
						<span>Very Wet</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #1e5a5a"
						></div>
						<span>Ocean</span>
					</div>
				</div>
			</div>
		{/if}

		<!-- Political View Legend -->
		{#if viewMode === 'political'}
			<div class="space-y-4">
				<h3 class="text-sm font-semibold text-center mb-1">Political View</h3>
				<div class="text-center text-xs text-surface-600 dark:text-surface-400 mb-3">
					Simplified map for political boundaries and settlements
				</div>

				<div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #b0c4de"
						></div>
						<span>Ocean</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #f5deb3"
						></div>
						<span>Coastal</span>
					</div>
					<div class="flex items-center gap-2">
						<div
							class="w-5 h-5 rounded border border-surface-400"
							style="background-color: #d2b48c"
						></div>
						<span>Land</span>
					</div>
				</div>
			</div>
		{/if}
	</div>
</div>
