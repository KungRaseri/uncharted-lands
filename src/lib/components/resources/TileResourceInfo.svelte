<script lang="ts">
	import { getQualityInfo, getResourceIcon } from '$lib/utils/resource-production';
	import type { Tile } from '$lib/types/game';

	export let tile: Tile;

	// Get quality info for each resource
	async function getResourceQualityDisplay(quality: number | null) {
		if (quality === null || quality === undefined) {
			return { rating: 'None', color: 'text-gray-400', icon: '❌', quality: undefined };
		}
		const info = await getQualityInfo(quality);
		return { rating: info.rating, color: info.color, multiplier: info.multiplier, quality };
	}
</script>

<div class="tile-resource-info card p-4 space-y-3">
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
			<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">
				<div class="text-sm opacity-60">Loading...</div>
			</div>
		{:then qualityInfo}
			{#await getResourceIcon('FOOD')}
				<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">...</div>
			{:then icon}
				<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">
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
			<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">
				<div class="text-sm opacity-60">Loading...</div>
			</div>
		{:then qualityInfo}
			{#await getResourceIcon('WOOD')}
				<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">...</div>
			{:then icon}
				<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">
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
			<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">
				<div class="text-sm opacity-60">Loading...</div>
			</div>
		{:then qualityInfo}
			{#await getResourceIcon('STONE')}
				<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">...</div>
			{:then icon}
				<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">
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
			<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">
				<div class="text-sm opacity-60">Loading...</div>
			</div>
		{:then qualityInfo}
			{#await getResourceIcon('ORE')}
				<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">...</div>
			{:then icon}
				<div class="resource-quality-item p-2 rounded bg-surface-100-800-token">
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
		<div class="flex items-center justify-between pt-2 border-t border-surface-200-700-token">
			<span class="text-sm opacity-70">Available Plot Slots:</span>
			<span class="badge variant-soft-secondary">{tile.plotSlots} slots</span>
		</div>
	{/if}

	<!-- Biome Info -->
	{#if tile.biome}
		<div class="text-xs opacity-60 italic">
			Biome: {tile.biome.name}
		</div>
	{/if}
</div>

<style>
	.tile-resource-info {
		min-width: 280px;
	}

	.resource-quality-item {
		transition: all 0.2s ease;
	}

	.resource-quality-item:hover {
		transform: translateY(-2px);
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}
</style>
