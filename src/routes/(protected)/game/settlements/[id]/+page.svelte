<script lang="ts">
	import type { PageData } from './$types';
	import SettlementDashboard from '$lib/components/game/SettlementDashboard.svelte';
	// Disaster UI Components (Global overlays - keep these)
	import DisasterWarningBanner from '$lib/components/game/DisasterWarningBanner.svelte';
	import CountdownTimer from '$lib/components/game/CountdownTimer.svelte';
	import DisasterImpactBanner from '$lib/components/game/DisasterImpactBanner.svelte';
	import AftermathSummaryModal from '$lib/components/game/AftermathSummaryModal.svelte';
	import { createGameRefreshInterval } from '$lib/stores/game/gameState.svelte';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Set up auto-refresh for real-time data updates
	onMount(() => {
		// Auto-refresh every minute to catch tick updates
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
	<SettlementDashboard settlementId={data.settlement.id} settlementName={data.settlement.name} />
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
