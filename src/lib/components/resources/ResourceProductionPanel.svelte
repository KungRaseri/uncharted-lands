<script lang="ts">
	import type { PlotWithRelations } from '$lib/types/api';
	import { getResourceIcon, getResourceName } from '$lib/utils/resource-production';

	let {
		plots,
		settlementName,
		onHarvestAll
	}: {
		plots: PlotWithRelations[];
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
		// 1. Get the plot's extractor type
		// 2. Get the tile's biome
		// 3. Get the settlement's structure levels
		// For now, we'll sum up the resource quality values as a proxy
		for (const plot of plots) {
			// Food production
			if (plot.food > 0) {
				const rate = plot.food * 10; // Simplified: quality * 10 = base rate
				totals['FOOD'].rate += rate;
				// Would need lastHarvested date from plot to calculate accumulated
			}
			// Water production
			if (plot.water > 0) {
				const rate = plot.water * 10;
				totals['WATER'].rate += rate;
			}
			// Wood production
			if (plot.wood > 0) {
				const rate = plot.wood * 10;
				totals['WOOD'].rate += rate;
			}
			// Stone production
			if (plot.stone > 0) {
				const rate = plot.stone * 10;
				totals['STONE'].rate += rate;
			}
			// Ore production
			if (plot.ore > 0) {
				const rate = plot.ore * 10;
				totals['ORE'].rate += rate;
			}
		}

		return totals;
	}

	// Filter plots that are actually producing something
	let producingPlots = $derived(
		plots.filter((p) => p.food > 0 || p.water > 0 || p.wood > 0 || p.stone > 0 || p.ore > 0)
	);

	// Count of active plots
	let activePlotsCount = $derived(producingPlots.length);
	let totalPlotsCount = $derived(plots.length);
</script>

<div class="resource-production-panel variant-glass-surface p-6 rounded-lg space-y-6">
	<!-- Header -->
	<div class="flex justify-between items-center">
		<div>
			<h2 class="text-2xl font-bold">{settlementName} Production</h2>
			<p class="text-sm text-surface-600-300-token">
				{activePlotsCount} of {totalPlotsCount} plots producing resources
			</p>
		</div>
		{#if onHarvestAll && activePlotsCount > 0}
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

	<!-- Individual Plot Cards -->
	{#if producingPlots.length > 0}
		<div class="plots-section">
			<h3 class="text-lg font-semibold mb-3">Active Plots ({producingPlots.length})</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each producingPlots as plot (plot.id)}
					<div class="plot-card variant-ghost-surface p-4 rounded-lg">
						<div class="flex justify-between items-start mb-3">
							<div>
								<h4 class="font-semibold">Plot ({plot.x}, {plot.y})</h4>
								<p class="text-xs text-surface-600-300-token">
									Area: {plot.area} units
								</p>
							</div>
						</div>

						<!-- Resource Production -->
						<div class="space-y-2">
							{#if plot.food > 0}
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
									<span class="font-medium">{(plot.food * 10).toFixed(1)}/h</span>
								</div>
							{/if}
							{#if plot.water > 0}
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
									<span class="font-medium">{(plot.water * 10).toFixed(1)}/h</span>
								</div>
							{/if}
							{#if plot.wood > 0}
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
									<span class="font-medium">{(plot.wood * 10).toFixed(1)}/h</span>
								</div>
							{/if}
							{#if plot.stone > 0}
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
									<span class="font-medium">{(plot.stone * 10).toFixed(1)}/h</span>
								</div>
							{/if}
							{#if plot.ore > 0}
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
									<span class="font-medium">{(plot.ore * 10).toFixed(1)}/h</span>
								</div>
							{/if}
						</div>

						<div class="text-xs text-surface-500-400-token mt-3">
							Created: {new Date(plot.createdAt).toLocaleDateString()}
						</div>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="text-center py-8 text-surface-600-300-token">
			<p class="text-lg mb-2">No active plots</p>
			<p class="text-sm">Create plots on tiles to start producing resources</p>
		</div>
	{/if}

	<!-- Idle Plots Section -->
	{#if plots.length > producingPlots.length}
		{@const idlePlots = plots.filter(
			(p) => !(p.food > 0 || p.water > 0 || p.wood > 0 || p.stone > 0 || p.ore > 0)
		)}
		<div class="idle-plots-section">
			<h3 class="text-lg font-semibold mb-3">Idle Plots ({idlePlots.length})</h3>
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each idlePlots as plot (plot.id)}
					<div class="variant-ghost-surface p-4 rounded-lg text-center">
						<p class="text-sm text-surface-600-300-token">
							Plot at ({plot.x}, {plot.y})
						</p>
						<p class="text-xs text-surface-500-400-token mt-1">No resources being produced</p>
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

	.plot-card {
		transition: all 0.2s ease;
	}

	.plot-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
</style>
