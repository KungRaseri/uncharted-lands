<script lang="ts">
	import { disasterStore } from '$lib/stores/game/disaster.svelte';
	import DamageFeed from './DamageFeed.svelte';

	const disaster = $derived(disasterStore.activeDisaster);
	const visible = $derived(disasterStore.impactBannerVisible);
	const damageCount = $derived(disasterStore.structuresDamaged);

	let showDamageFeed = $state(false);

	// Disaster type styling
	const severityColors = {
		MINOR: 'bg-yellow-600',
		MODERATE: 'bg-orange-600',
		MAJOR: 'bg-red-600',
		CATASTROPHIC: 'bg-purple-600'
	};

	const severityColor = $derived(
		disaster?.severityLevel
			? severityColors[disaster.severityLevel as keyof typeof severityColors] || 'bg-gray-600'
			: 'bg-gray-600'
	);
</script>

{#if visible && disaster}
	<div class="fixed top-0 left-0 right-0 z-50 {severityColor} text-white shadow-lg animate-pulse">
		<div class="container mx-auto px-4 py-3">
			<div class="flex items-center justify-between">
				<!-- Left: Status Text -->
				<div class="flex items-center gap-3">
					<span class="text-2xl" aria-hidden="true">🔴</span>
					<div>
						<h2 class="font-bold text-lg uppercase">
							{disaster.type.replace(/_/g, ' ')} IN PROGRESS - DO NOT PANIC
						</h2>
						<p class="text-sm opacity-90">
							Duration: {Math.floor(disaster.duration / 60000)} minutes remaining | Current Damage: {damageCount}
							structures affected
						</p>
					</div>
				</div>

				<!-- Right: Action Buttons -->
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={() => (showDamageFeed = !showDamageFeed)}
						class="btn variant-filled-surface text-sm px-4 py-2 hover:variant-filled-primary"
					>
						{showDamageFeed ? 'Hide' : 'View'} Real-Time Updates
					</button>
					<button
						type="button"
						onclick={() => {
							/* TODO: Send emergency aid action */
						}}
						class="btn variant-filled text-sm px-4 py-2 bg-white text-gray-900 hover:bg-gray-200"
					>
						Send Emergency Aid to Allies
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Spacer to prevent content from being hidden behind fixed banner -->
	<div class="h-20" aria-hidden="true"></div>

	<!-- Damage Feed Overlay -->
	{#if showDamageFeed}
		<div
			class="fixed top-20 right-4 z-40 bg-surface-100-800-token rounded-lg shadow-xl w-96 max-h-96 overflow-hidden"
		>
			<div class="p-4 border-b border-surface-300-600-token flex justify-between items-center">
				<h3 class="h4">Disaster Impact Feed</h3>
				<button
					type="button"
					onclick={() => (showDamageFeed = false)}
					class="btn btn-icon btn-sm variant-filled-surface"
				>
					✕
				</button>
			</div>
			<div class="p-4 overflow-y-auto max-h-80">
				<DamageFeed />
			</div>
		</div>
	{/if}
{/if}
