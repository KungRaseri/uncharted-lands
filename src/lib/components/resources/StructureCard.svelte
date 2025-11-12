<script lang="ts">
	import type { StructureWithRelations } from '$lib/types/api';
	import { getResourceIcon, getBuildingName } from '$lib/utils/resource-production';

	let {
		structure,
		onUpgrade
	}: { structure: StructureWithRelations; onUpgrade?: (structureId: string) => void } = $props();

	// Get structure display info
	async function getStructureDisplay() {
		const name = await getBuildingName(structure.type);
		const descriptions: Record<string, string> = {
			house: 'Increases population capacity and provides basic shelter',
			farm: 'Produces food through agriculture',
			well: 'Provides fresh water for the settlement',
			lumber_mill: 'Processes wood from forests',
			quarry: 'Extracts stone from rocky terrain',
			mine: 'Extracts valuable ores from underground deposits'
		};
		return {
			name,
			description: descriptions[structure.type] || 'A structure in your settlement'
		};
	}

	// Get upgrade requirements if structure can be upgraded
	let canUpgrade = $derived(structure.level < 10); // Max level assumption
	let upgradeCost = $derived(calculateUpgradeCost(structure.level));

	function calculateUpgradeCost(currentLevel: number): Record<string, number> {
		// Base costs that scale with level
		const multiplier = Math.pow(1.5, currentLevel);
		return {
			WOOD: Math.floor(100 * multiplier),
			STONE: Math.floor(75 * multiplier),
			ORE: Math.floor(50 * multiplier)
		};
	}

	async function handleUpgrade() {
		if (onUpgrade && canUpgrade) {
			onUpgrade(structure.id);
		}
	}
</script>

<div class="structure-card variant-glass-surface p-4 rounded-lg">
	<div class="flex justify-between items-start mb-3">
		<div>
			{#await getStructureDisplay()}
				<h3 class="text-lg font-semibold">Loading...</h3>
			{:then display}
				<h3 class="text-lg font-semibold">{display.name}</h3>
				<p class="text-sm text-surface-600-300-token">{display.description}</p>
			{/await}
		</div>
		<div class="badge variant-filled-primary">
			Level {structure.level}
		</div>
	</div>

	<!-- Production Multiplier -->
	<div class="mb-3">
		<div class="flex items-center gap-2">
			<span class="text-sm font-medium">Production Multiplier:</span>
			<span class="badge variant-filled-success">
				{((1 + structure.level * 0.1) * 100).toFixed(0)}%
			</span>
		</div>
	</div>

	<!-- Settlement Info -->
	{#if structure.settlement}
		<div class="text-sm text-surface-600-300-token mb-3">
			Settlement: <span class="font-medium">{structure.settlement.name}</span>
		</div>
	{/if}

	<!-- Upgrade Section -->
	{#if canUpgrade}
		<div class="border-t border-surface-300-600-token pt-3 mt-3">
			<div class="flex justify-between items-center mb-2">
				<span class="text-sm font-medium">Upgrade to Level {structure.level + 1}</span>
				<span class="badge variant-filled-secondary">
					+{(10).toFixed(0)}% Production
				</span>
			</div>

			<!-- Resource Costs -->
			<div class="grid grid-cols-3 gap-2 mb-3">
				{#each Object.entries(upgradeCost) as [resource, cost]}
					<div class="flex items-center gap-1 text-sm">
						{#await getResourceIcon(resource)}
							<span>...</span>
						{:then icon}
							<span>{icon}</span>
						{/await}
						<span>{cost}</span>
					</div>
				{/each}
			</div>

			<!-- Upgrade Button -->
			{#if onUpgrade}
				<button class="btn variant-filled-primary w-full" onclick={handleUpgrade} type="button">
					Upgrade Structure
				</button>
			{/if}
		</div>
	{:else}
		<div class="text-sm text-surface-600-300-token italic text-center py-2">
			Maximum level reached
		</div>
	{/if}

	<!-- Timestamps -->
	<div class="text-xs text-surface-500-400-token mt-3 pt-2 border-t border-surface-300-600-token">
		<div>Built: {new Date(structure.createdAt).toLocaleDateString()}</div>
		{#if structure.updatedAt !== structure.createdAt}
			<div>Last Upgraded: {new Date(structure.updatedAt).toLocaleDateString()}</div>
		{/if}
	</div>
</div>

<style>
	.structure-card {
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
	}

	.structure-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}
</style>
