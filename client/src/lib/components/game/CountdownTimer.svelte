<script lang="ts">
	import { disasterStore } from '$lib/stores/game/disaster.svelte';

	const disaster = $derived(disasterStore.activeDisaster);
	const timeRemaining = $derived(disasterStore.timeUntilImpactFormatted);
	const warningActive = $derived(disasterStore.warningActive);

	let minimized = $state(false);

	function toggleMinimize() {
		minimized = !minimized;
	}

	// Severity colors
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

{#if warningActive && disaster}
	<div
		class="fixed top-20 right-4 z-40 {severityColor} text-white rounded-lg shadow-xl transition-all duration-300"
		class:w-64={!minimized}
		class:w-12={minimized}
	>
		{#if !minimized}
			<!-- Full Widget -->
			<div class="p-4">
				<div class="flex justify-between items-start mb-2">
					<h4 class="font-bold text-sm uppercase">
						⚠️ {disaster.type.replace(/_/g, ' ')}
					</h4>
					<button
						type="button"
						onclick={toggleMinimize}
						class="btn btn-sm btn-icon variant-filled-surface"
						aria-label="Minimize"
					>
						−
					</button>
				</div>

				<div class="space-y-2">
					<div>
						<p class="text-xs opacity-80">Impact in:</p>
						<p class="text-2xl font-bold" data-testid="disaster-countdown">
							{timeRemaining}
						</p>
					</div>

					<div class="border-t border-white border-opacity-30 pt-2">
						<p class="text-xs opacity-80">Severity:</p>
						<p class="text-sm font-semibold">
							{disaster.severityLevel} ({disaster.severity})
						</p>
					</div>
				</div>
			</div>
		{:else}
			<!-- Minimized Widget -->
			<button
				type="button"
				onclick={toggleMinimize}
				class="w-full h-12 flex items-center justify-center"
				aria-label="Expand countdown timer"
			>
				⚠️
			</button>
		{/if}
	</div>
{/if}
