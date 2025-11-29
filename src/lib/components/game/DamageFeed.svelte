<script lang="ts">
	import { disasterStore } from '$lib/stores/game/disaster.svelte';

	const damageUpdates = $derived(disasterStore.damageUpdates);

	// Format timestamp as HH:MM:SS
	function formatTime(timestamp: number): string {
		const date = new Date(timestamp);
		return date.toLocaleTimeString('en-US', { hour12: false });
	}

	// Color code health changes
	function getHealthColor(health: number): string {
		if (health >= 80) return 'text-green-600';
		if (health >= 60) return 'text-yellow-600';
		if (health >= 40) return 'text-orange-600';
		if (health >= 20) return 'text-red-600';
		return 'text-purple-600';
	}
</script>

<div class="space-y-2">
	{#if damageUpdates.length === 0}
		<p class="text-sm text-surface-600-300-token text-center py-4">No damage updates yet...</p>
	{:else}
		{#each damageUpdates.slice().reverse() as update}
			<div class="text-sm border-l-2 border-red-600 pl-3 py-1">
				<p class="text-xs text-surface-500-400-token">{formatTime(update.timestamp)}</p>
				<p class="font-medium">
					Structure #{update.structureId} damaged
					<span class={getHealthColor(update.newHealth)}>
						({update.oldHealth}% → {update.newHealth}% health)
					</span>
				</p>
				{#if update.structureName}
					<p class="text-xs text-surface-600-300-token">{update.structureName}</p>
				{/if}
			</div>
		{/each}
	{/if}
</div>

<style>
	/* Auto-scroll to bottom when new updates arrive */
	div {
		scroll-behavior: smooth;
	}
</style>
