<script lang="ts">
	import type { PageData } from './$types';
	import SettlementDashboard from '$lib/components/game/SettlementDashboard.svelte';
	// Disaster UI Components (Global overlays - keep these)
	import DisasterWarningBanner from '$lib/components/game/DisasterWarningBanner.svelte';
	import CountdownTimer from '$lib/components/game/CountdownTimer.svelte';
	import DisasterImpactBanner from '$lib/components/game/DisasterImpactBanner.svelte';
	import AftermathSummaryModal from '$lib/components/game/AftermathSummaryModal.svelte';
	import { createGameRefreshInterval } from '$lib/stores/game/gameState.svelte';
	import { resourcesStore } from '$lib/stores/game/resources.svelte';
	import { populationStore } from '$lib/stores/game/population.svelte';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Set up auto-refresh for real-time data updates
	onMount(() => {
		console.log('[SETTLEMENT PAGE] Initializing stores from server data...');
		console.log('[SETTLEMENT PAGE] Settlement data:', data.settlement);

		// Initialize stores from server-side loaded data
		if (data.settlement) {
			// Initialize resources store from storage data
			if (data.settlement.storage) {
				console.log(
					'[SETTLEMENT PAGE] Initializing resources from storage:',
					data.settlement.storage
				);
				resourcesStore.initializeFromServerData(data.settlement.id, {
					storage: data.settlement.storage,
					capacity: data.settlement.storage.capacity || 1000
				});
			} else {
				console.warn('[SETTLEMENT PAGE] No storage data available in settlement');
			}

			// Initialize population store from population data
			if (data.settlement.population) {
				console.log('[SETTLEMENT PAGE] Initializing population:', data.settlement.population);
				populationStore.initializeFromServerData(data.settlement.id, {
					current: data.settlement.population.currentPopulation || 0,
					capacity: 100, // TODO: Calculate from houses
					happiness: data.settlement.population.happiness || 50,
					growthRate: 0,
					immigrationChance: 0,
					emigrationChance: 0,
					lastGrowthTick: Date.now()
				});
			} else {
				console.warn('[SETTLEMENT PAGE] No population data available in settlement');
			}
		} else {
			console.error('[SETTLEMENT PAGE] No settlement data available!');
		}

		// Auto-refresh every minute to catch tick updates (fallback if Socket.IO fails)
		const cleanup = createGameRefreshInterval('game:settlement');
		return cleanup;
	});
</script>

<!-- Disaster UI Components (Global overlays) -->
<DisasterWarningBanner />
<CountdownTimer />
<DisasterImpactBanner />
<AftermathSummaryModal />

<!-- Main Settlement Dashboard -->
{#if data.settlement}
	<SettlementDashboard
		settlementId={data.settlement.id}
		settlementName={data.settlement.name}
		settlement={data.settlement}
	/>
{:else}
	<div class="max-w-7xl mx-auto p-6">
		<div class="card preset-filled-surface-100-900 p-12 text-center">
			<h3 class="text-xl font-semibold mb-2 text-surface-900 dark:text-surface-100">
				Settlement not found
			</h3>
			<p class="text-surface-600 dark:text-surface-400 mb-4">
				{data.error || 'Unable to load settlement data'}
			</p>
			<a href="/game/settlements" class="btn preset-filled-primary-500 rounded-md">
				Back to Settlements
			</a>
		</div>
	</div>
{/if}
