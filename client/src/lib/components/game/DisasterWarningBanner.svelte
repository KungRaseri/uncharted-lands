<script lang="ts">
	import { disasterStore } from '$lib/stores/game/disaster.svelte';

	const disaster = $derived(disasterStore.activeDisaster);
	const visible = $derived(disasterStore.warningBannerVisible);
	const timeRemaining = $derived(disasterStore.timeUntilImpactFormatted);

	let detailsModalOpen = $state(false);

	function dismiss() {
		disasterStore.dismissWarning();
	}

	function showDetails() {
		detailsModalOpen = true;
	}

	// Disaster type styling
	const severityColors = {
		MINOR: 'bg-yellow-600',
		MODERATE: 'bg-orange-600',
		MAJOR: 'bg-red-600',
		CATASTROPHIC: 'bg-purple-600'
	};

	const disasterIcons: Record<string, string> = {
		EARTHQUAKE: '🏔️',
		FLOOD: '🌊',
		DROUGHT: '☀️',
		WILDFIRE: '🔥',
		TSUNAMI: '🌊',
		HURRICANE: '🌀',
		TORNADO: '🌪️',
		BLIZZARD: '❄️',
		PLAGUE: '☣️',
		LOCUST_SWARM: '🦗',
		SANDSTORM: '🏜️',
		VOLCANIC_ERUPTION: '🌋',
		LANDSLIDE: '⛰️',
		AVALANCHE: '🏔️',
		HEATWAVE: '🌡️'
	};

	const severityColor = $derived(
		disaster?.severityLevel
			? severityColors[disaster.severityLevel as keyof typeof severityColors] || 'bg-gray-600'
			: 'bg-gray-600'
	);
	const disasterIcon = $derived(disaster?.type ? disasterIcons[disaster.type] || '⚠️' : '⚠️');
</script>

{#if visible && disaster}
	<div
		class="fixed top-0 left-0 right-0 z-50 {severityColor} text-white shadow-lg"
		data-testid="disaster-warning-banner"
	>
		<div class="container mx-auto px-4 py-3">
			<div class="flex items-center justify-between">
				<!-- Left: Icon + Warning Text -->
				<div class="flex items-center gap-3">
					<span class="text-2xl" aria-hidden="true">{disasterIcon}</span>
					<div>
						<h2 class="font-bold text-lg">
							{disaster.type.replace(/_/g, ' ')} WARNING - SEVERITY: {disaster.severityLevel}
							({disaster.severity})
						</h2>
						<p class="text-sm opacity-90">
							Impact in: <span class="font-semibold">{timeRemaining}</span>
							{#if disaster.affectedRegion}
								| Affected Region: {disaster.affectedRegion}
							{/if}
						</p>
					</div>
				</div>

				<!-- Right: Action Buttons -->
				<div class="flex items-center gap-2">
					<button
						type="button"
						onclick={showDetails}
						class="btn variant-filled-surface text-sm px-4 py-2 hover:variant-filled-primary"
					>
						View Details
					</button>
					<button
						type="button"
						onclick={() => {
							/* TODO: Prepare defenses action */
						}}
						class="btn variant-filled text-sm px-4 py-2 bg-white text-gray-900 hover:bg-gray-200"
					>
						Prepare Defenses
					</button>
					<button
						type="button"
						onclick={() => {
							/* TODO: Request aid action */
						}}
						class="btn variant-filled text-sm px-4 py-2 bg-white text-gray-900 hover:bg-gray-200"
					>
						Request Aid
					</button>
					<button
						type="button"
						onclick={dismiss}
						class="btn btn-icon variant-filled-surface text-white hover:bg-white hover:text-gray-900"
						aria-label="Dismiss warning"
					>
						✕
					</button>
				</div>
			</div>
		</div>
	</div>

	<!-- Spacer to prevent content from being hidden behind fixed banner -->
	<div class="h-20" aria-hidden="true"></div>
{/if}

<!-- Details Modal (simplified for now, will be expanded in DisasterWarningModal.svelte) -->
{#if detailsModalOpen}
	<div class="fixed inset-0 z-100 bg-black bg-opacity-50 flex items-center justify-center">
		<div class="bg-surface-100-800-token p-6 rounded-lg shadow-xl max-w-2xl w-full mx-4">
			<div class="flex justify-between items-center mb-4">
				<h3 class="h3">Disaster Warning Details</h3>
				<button
					type="button"
					onclick={() => (detailsModalOpen = false)}
					class="btn btn-icon variant-filled-surface"
				>
					✕
				</button>
			</div>

			{#if disaster}
				<div class="space-y-4">
					<p><strong>Type:</strong> {disaster.type.replace(/_/g, ' ')}</p>
					<p><strong>Severity:</strong> {disaster.severityLevel} ({disaster.severity})</p>
					<p><strong>Time Until Impact:</strong> {timeRemaining}</p>
					{#if disaster.affectedRegion}
						<p><strong>Affected Region:</strong> {disaster.affectedRegion}</p>
					{/if}
					<p><strong>Affected Biomes:</strong> {disaster.affectedBiomes.join(', ')}</p>
				</div>
			{/if}

			<div class="mt-6">
				<button
					type="button"
					onclick={() => (detailsModalOpen = false)}
					class="btn variant-filled-primary w-full"
				>
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
