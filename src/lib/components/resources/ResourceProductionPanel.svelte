<script lang="ts">
	import type { TileWithRelations } from '$lib/types/api';
	import { getResourceIcon, getResourceName } from '$lib/utils/resource-production';

	let {
		tiles,
		settlementName,
		onHarvestAll
	}: {
		tiles: TileWithRelations[];
		settlementName: string;
		onHarvestAll?: () => void;
	} = $props();

	// Resource types to track
	const resourceTypes = ['FOOD', 'WATER', 'WOOD', 'STONE', 'ORE'];

	// Calculate total production rates for each resource
	async function calculateTotalProduction() {
		const totals: Record<string, { rate: number; accumulated: number }> = {};

		for (const resourceType of resourceTypes) {
			totals[resourceType] = { rate: 0, accumulated: 0 };
		}

		// This is a simplified calculation - in a real app, you'd need to:
		// 1. Get the tile's extractor type
		// 2. Get the tile's biome
		// 3. Get the settlement's structure levels
		// For now, we'll sum up the resource quality values as a proxy
		for (const tile of tiles) {
			// Food production
			if (tile.foodQuality > 0) {
				const rate = tile.foodQuality; // Quality is already 0-100 percentage
				totals['FOOD'].rate += rate;
				// Would need lastHarvested date from tile to calculate accumulated
			}
			// Water production
			if (tile.waterQuality > 0) {
				const rate = tile.waterQuality;
				totals['WATER'].rate += rate;
			}
			// Wood production
			if (tile.woodQuality > 0) {
				const rate = tile.woodQuality;
				totals['WOOD'].rate += rate;
			}
			// Stone production
			if (tile.stoneQuality > 0) {
				const rate = tile.stoneQuality;
				totals['STONE'].rate += rate;
			}
			// Ore production
			if (tile.oreQuality > 0) {
				const rate = tile.oreQuality;
				totals['ORE'].rate += rate;
			}
		}

		return totals;
	}

	// Filter tiles that are actually producing something
	let producingTiles = $derived(
		tiles.filter(
			(t) =>
				t.foodQuality > 0 ||
				t.waterQuality > 0 ||
				t.woodQuality > 0 ||
				t.stoneQuality > 0 ||
				t.oreQuality > 0
		)
	);

	// Count of active tiles
	let activeTilesCount = $derived(producingTiles.length);
	let totalTilesCount = $derived(tiles.length);
</script>

<div class="resource-production-panel variant-glass-surface p-6 rounded-lg space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-bold">{settlementName} Production</h2>
			<p class="text-sm text-surface-600-300-token">
				{activeTilesCount} of {totalTilesCount} tiles producing resources
			</p>
		</div>
		{#if onHarvestAll && activeTilesCount > 0}
			<button class="btn variant-filled-primary" onclick={onHarvestAll} type="button">
				🌾 Harvest All
			</button>
		{/if}
	</div>

	<!-- Total Production Summary -->
	<div class="production-summary">
		<h3 class="text-lg font-semibold mb-3">Total Production Rates</h3>
		{#await calculateTotalProduction()}
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
				{#each resourceTypes as resourceType}
					<div class="resource-total-card variant-ghost-surface p-3 rounded-lg">
						<div class="text-center">
							<div class="text-2xl mb-1">⏳</div>
							<div class="text-sm text-surface-600-300-token">Loading...</div>
						</div>
					</div>
				{/each}
			</div>
		{:then totals}
			<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
				{#each resourceTypes as resourceType}
					{@const total = totals[resourceType]}
					{#if total.rate > 0}
						<div class="resource-total-card variant-ghost-surface p-3 rounded-lg">
							{#await getResourceIcon(resourceType)}
								<div class="text-center">
									<div class="text-2xl mb-1">⏳</div>
								</div>
							{:then icon}
								<div class="text-center">
									<div class="text-2xl mb-1">{icon}</div>
									{#await getResourceName(resourceType)}
										<div class="text-xs text-surface-600-300-token">...</div>
									{:then name}
										<div class="text-xs text-surface-600-300-token">{name}</div>
									{/await}
									<div class="text-lg font-bold">{total.rate.toFixed(1)}/h</div>
								</div>
							{/await}
						</div>
					{/if}
				{/each}
			</div>
		{:catch error}
			<div class="text-error-500">Error calculating production: {error.message}</div>
		{/await}
	</div>

	<!-- Individual Tile Cards -->
	{#if producingTiles.length > 0}
		<div class="tiles-section">
			<h3 class="text-lg font-semibold mb-3">Active Tiles ({producingTiles.length})</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each producingTiles as tile (tile.id)}
					<div class="tile-card variant-ghost-surface p-4 rounded-lg">
						<div class="flex justify-between items-start mb-3">
							<div>
								<h4 class="font-semibold">Tile ({tile.x}, {tile.y})</h4>
								<p class="text-xs text-surface-600-300-token">
									Biome: {tile.biome}
								</p>
							</div>
						</div>

						<!-- Resource Production -->
						<div class="space-y-2">
							{#if tile.foodQuality > 0}
								<div class="flex items-center justify-between text-sm">
									{#await getResourceIcon('FOOD')}
										<span>⏳</span>
									{:then icon}
										<span class="flex items-center gap-1">
											{icon}
											{#await getResourceName('FOOD')}
												<span>...</span>
											{:then name}
												<span>{name}</span>
											{/await}
										</span>
									{/await}
									<span class="font-medium">{tile.foodQuality.toFixed(1)}%</span>
								</div>
							{/if}
							{#if tile.waterQuality > 0}
								<div class="flex items-center justify-between text-sm">
									{#await getResourceIcon('WATER')}
										<span>⏳</span>
									{:then icon}
										<span class="flex items-center gap-1">
											{icon}
											{#await getResourceName('WATER')}
												<span>...</span>
											{:then name}
												<span>{name}</span>
											{/await}
										</span>
									{/await}
									<span class="font-medium">{tile.waterQuality.toFixed(1)}%</span>
								</div>
							{/if}
							{#if tile.woodQuality > 0}
								<div class="flex items-center justify-between text-sm">
									{#await getResourceIcon('WOOD')}
										<span>⏳</span>
									{:then icon}
										<span class="flex items-center gap-1">
											{icon}
											{#await getResourceName('WOOD')}
												<span>...</span>
											{:then name}
												<span>{name}</span>
											{/await}
										</span>
									{/await}
									<span class="font-medium">{tile.woodQuality.toFixed(1)}%</span>
								</div>
							{/if}
							{#if tile.stoneQuality > 0}
								<div class="flex items-center justify-between text-sm">
									{#await getResourceIcon('STONE')}
										<span>⏳</span>
									{:then icon}
										<span class="flex items-center gap-1">
											{icon}
											{#await getResourceName('STONE')}
												<span>...</span>
											{:then name}
												<span>{name}</span>
											{/await}
										</span>
									{/await}
									<span class="font-medium">{tile.stoneQuality.toFixed(1)}%</span>
								</div>
							{/if}
							{#if tile.oreQuality > 0}
								<div class="flex items-center justify-between text-sm">
									{#await getResourceIcon('ORE')}
										<span>⏳</span>
									{:then icon}
										<span class="flex items-center gap-1">
											{icon}
											{#await getResourceName('ORE')}
												<span>...</span>
											{:then name}
												<span>{name}</span>
											{/await}
										</span>
									{/await}
									<span class="font-medium">{tile.oreQuality.toFixed(1)}%</span>
								</div>
							{/if}
						</div>

						<div class="text-xs text-surface-500-400-token mt-3">
							Created: {new Date(tile.createdAt).toLocaleDateString()}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="text-center py-8 text-surface-600-300-token">
			<p class="text-lg mb-2">No active tiles</p>
			<p class="text-sm">Tiles with resource quality will produce resources</p>
		</div>
	{/if}

	<!-- Idle Tiles Section -->
	{#if tiles.length > producingTiles.length}
		{@const idleTiles = tiles.filter(
			(t) =>
				!(
					t.foodQuality > 0 ||
					t.waterQuality > 0 ||
					t.woodQuality > 0 ||
					t.stoneQuality > 0 ||
					t.oreQuality > 0
				)
		)}
		<div class="idle-tiles-section">
			<h3 class="text-lg font-semibold mb-3">Idle Tiles ({idleTiles.length})</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each idleTiles as tile (tile.id)}
					<div class="variant-ghost-surface p-4 rounded-lg text-center">
						<p class="text-sm text-surface-600-300-token">
							Tile at ({tile.x}, {tile.y})
						</p>
						<p class="text-xs text-surface-500-400-token mt-1">No resources available</p>
						<button class="btn variant-soft-primary btn-sm mt-2" type="button">
							Add Extractor
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.resource-production-panel {
		max-width: 1400px;
		margin: 0 auto;
	}

	.resource-total-card {
		transition: all 0.2s ease;
	}

	.resource-total-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.production-summary {
		border-bottom: 1px solid rgb(var(--color-surface-300) / 0.3);
		padding-bottom: 1.5rem;
	}

	.tile-card {
		transition: all 0.2s ease;
	}

	.tile-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
</style>
