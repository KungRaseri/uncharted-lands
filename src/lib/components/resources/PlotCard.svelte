<script lang="ts">
	import {
		calculateProductionRate,
		calculateAccumulatedResources,
		getResourceIcon,
		getResourceName,
		getExtractorName,
		formatHarvestTime,
	} from '$lib/utils/resource-production';

	export let plot: {
		id: string;
		resourceType: string;
		resourceQuality: number;
		extractorType: string | null;
		structureLevel: number;
		lastHarvested: string | null;
		tileId: string;
		tile?: {
			biome?: {
				name: string;
			};
		};
	};

	export let onHarvest: (() => void) | null = null;

	// Calculate production details
	let productionRate = 0;
	let accumulated = 0;
	let harvestTimeText = '';

	async function updateProduction() {
		if (!plot.extractorType || !plot.tile?.biome?.name) {
			productionRate = 0;
			accumulated = 0;
			harvestTimeText = 'No extractor';
			return;
		}

		productionRate = await calculateProductionRate({
			resourceType: plot.resourceType,
			extractorType: plot.extractorType,
			biomeName: plot.tile.biome.name,
			structureLevel: plot.structureLevel,
		});

		const lastHarvestedDate = plot.lastHarvested ? new Date(plot.lastHarvested) : null;
		accumulated = await calculateAccumulatedResources(productionRate, lastHarvestedDate);
		harvestTimeText = await formatHarvestTime(lastHarvestedDate, productionRate);
	}

	// Update on mount and when plot changes
	$: if (plot) {
		updateProduction();
	}
</script>

<div class="plot-card card p-4 space-y-3">
	<!-- Header -->
	<div class="flex items-center justify-between">
		{#await getResourceIcon(plot.resourceType)}
			<div class="text-2xl">...</div>
		{:then icon}
			<div class="flex items-center gap-2">
				<span class="text-2xl">{icon}</span>
				{#await getResourceName(plot.resourceType)}
					<span class="font-semibold">...</span>
				{:then name}
					<span class="font-semibold">{name}</span>
				{/await}
			</div>
		{/await}
		<span class="badge variant-soft">Level {plot.structureLevel}</span>
	</div>

	<!-- Quality -->
	<div class="flex items-center justify-between text-sm">
		<span class="opacity-70">Quality:</span>
		<span class="font-semibold">{plot.resourceQuality}/100</span>
	</div>

	<!-- Extractor -->
	{#if plot.extractorType}
		<div class="flex items-center justify-between text-sm">
			<span class="opacity-70">Extractor:</span>
			{#await getExtractorName(plot.extractorType)}
				<span>...</span>
			{:then name}
				<span class="font-medium">{name}</span>
			{/await}
		</div>

		<!-- Production Rate -->
		<div class="flex items-center justify-between text-sm">
			<span class="opacity-70">Production:</span>
			<span class="font-medium text-green-600">{productionRate.toFixed(2)}/hr</span>
		</div>

		<!-- Accumulated Resources -->
		<div class="p-3 rounded bg-surface-100-800-token space-y-2">
			<div class="flex items-center justify-between">
				<span class="text-sm opacity-70">Accumulated:</span>
				<span class="font-bold text-lg">{accumulated}</span>
			</div>
			<div class="text-xs opacity-60">{harvestTimeText}</div>
		</div>

		<!-- Harvest Button -->
		{#if accumulated > 0 && onHarvest}
			<button class="btn variant-filled-primary w-full" on:click={onHarvest}>
				Harvest {accumulated} Resources
			</button>
		{:else if accumulated === 0}
			<button class="btn variant-soft w-full" disabled>No Resources to Harvest</button>
		{/if}
	{:else}
		<div class="p-3 rounded bg-surface-100-800-token text-center text-sm opacity-70">
			No extractor built yet
		</div>
	{/if}
</div>

<style>
	.plot-card {
		min-width: 250px;
		max-width: 320px;
	}
</style>
