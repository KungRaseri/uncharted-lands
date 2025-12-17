<script lang="ts">
	import { getQualityInfo, getResourceIcon } from '$lib/utils/resource-production';
	import type { Tile } from '@uncharted-lands/shared';

	let { tile }: { tile: Tile } = $props();

	// Handle both biome and Biome property names for compatibility
	let biomeName = $derived(
		'biome' in tile ? tile.biome?.name : 'Biome' in tile ? (tile as any).Biome?.name : undefined
	);

	// Get quality info for each resource
	async function getResourceQualityDisplay(quality: number | null) {
		if (quality === null || quality === undefined) {
			return { rating: 'None', color: 'text-gray-400', icon: '❌', quality: undefined };
		}
		const info = await getQualityInfo(quality);
		return { rating: info.rating, color: info.color, multiplier: info.multiplier, quality };
	}
</script>

<div class="card p-4 space-y-3 min-w-[280px]">
	<div class="flex items-center justify-between">
		<h3 class="h4 font-semibold">Resource Quality</h3>
		{#if tile.specialResource}
			<span class="badge variant-filled-primary" title="Special resource available!">
				✨ {tile.specialResource}
			</span>
		{/if}
	</div>

	<!-- Resource Quality Grid -->
	<div class="grid grid-cols-2 gap-2">
		<!-- Food -->
		{#await getResourceQualityDisplay(tile.foodQuality)}
			<div
				class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
			>
				<div class="text-sm opacity-60">Loading...</div>
			</div>
		{:then qualityInfo}
			{#await getResourceIcon('FOOD')}
				<div
					class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				>
					...
				</div>
			{:then icon}
				<div
					class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				>
					<div class="flex items-center gap-2">
						<span class="text-2xl">{icon}</span>
						<div class="flex-1">
							<div class="text-xs opacity-60">Food</div>
							{#if qualityInfo.quality !== undefined}
								<div class="font-semibold {qualityInfo.color}">{qualityInfo.rating}</div>
								<div class="text-xs opacity-70">{qualityInfo.quality}/100</div>
							{:else}
								<div class="text-sm {qualityInfo.color}">{qualityInfo.rating}</div>
							{/if}
						</div>
					</div>
				</div>
			{/await}
		{/await}

		<!-- Wood -->
		{#await getResourceQualityDisplay(tile.woodQuality)}
			<div
				class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
			>
				<div class="text-sm opacity-60">Loading...</div>
			</div>
		{:then qualityInfo}
			{#await getResourceIcon('WOOD')}
				<div
					class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				>
					...
				</div>
			{:then icon}
				<div
					class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				>
					<div class="flex items-center gap-2">
						<span class="text-2xl">{icon}</span>
						<div class="flex-1">
							<div class="text-xs opacity-60">Wood</div>
							{#if qualityInfo.quality !== undefined}
								<div class="font-semibold {qualityInfo.color}">{qualityInfo.rating}</div>
								<div class="text-xs opacity-70">{qualityInfo.quality}/100</div>
							{:else}
								<div class="text-sm {qualityInfo.color}">{qualityInfo.rating}</div>
							{/if}
						</div>
					</div>
				</div>
			{/await}
		{/await}

		<!-- Stone -->
		{#await getResourceQualityDisplay(tile.stoneQuality)}
			<div
				class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
			>
				<div class="text-sm opacity-60">Loading...</div>
			</div>
		{:then qualityInfo}
			{#await getResourceIcon('STONE')}
				<div
					class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				>
					...
				</div>
			{:then icon}
				<div
					class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				>
					<div class="flex items-center gap-2">
						<span class="text-2xl">{icon}</span>
						<div class="flex-1">
							<div class="text-xs opacity-60">Stone</div>
							{#if qualityInfo.quality !== undefined}
								<div class="font-semibold {qualityInfo.color}">{qualityInfo.rating}</div>
								<div class="text-xs opacity-70">{qualityInfo.quality}/100</div>
							{:else}
								<div class="text-sm {qualityInfo.color}">{qualityInfo.rating}</div>
							{/if}
						</div>
					</div>
				</div>
			{/await}
		{/await}

		<!-- Ore -->
		{#await getResourceQualityDisplay(tile.oreQuality)}
			<div
				class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
			>
				<div class="text-sm opacity-60">Loading...</div>
			</div>
		{:then qualityInfo}
			{#await getResourceIcon('ORE')}
				<div
					class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				>
					...
				</div>
			{:then icon}
				<div
					class="p-2 rounded bg-surface-100 dark:bg-surface-800 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
				>
					<div class="flex items-center gap-2">
						<span class="text-2xl">{icon}</span>
						<div class="flex-1">
							<div class="text-xs opacity-60">Ore</div>
							{#if qualityInfo.quality !== undefined}
								<div class="font-semibold {qualityInfo.color}">{qualityInfo.rating}</div>
								<div class="text-xs opacity-70">{qualityInfo.quality}/100</div>
							{:else}
								<div class="text-sm {qualityInfo.color}">{qualityInfo.rating}</div>
							{/if}
						</div>
					</div>
				</div>
			{/await}
		{/await}
	</div>

	<!-- Plot Slots -->
	{#if tile.plotSlots}
		<div
			class="flex items-center justify-between pt-2 border-t border-surface-200 dark:border-surface-700"
		>
			<span class="text-sm opacity-70">Available Plot Slots:</span>
			<span class="badge variant-soft-secondary">{tile.plotSlots} slots</span>
		</div>
	{/if}

	<!-- Biome Info -->
	{#if biomeName}
		<div class="text-xs opacity-60 italic">
			Biome: {biomeName}
		</div>
	{/if}
</div>
