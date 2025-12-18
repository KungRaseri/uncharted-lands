<script lang="ts">
	import type { PageData } from './$types';
	import SettlementDashboard from '$lib/components/game/SettlementDashboard.svelte';
	// Disaster UI Components (Global overlays - keep these)
	import DisasterWarningBanner from '$lib/components/game/DisasterWarningBanner.svelte';
	import CountdownTimer from '$lib/components/game/CountdownTimer.svelte';
	import DisasterImpactBanner from '$lib/components/game/DisasterImpactBanner.svelte';
	import AftermathSummaryModal from '$lib/components/game/AftermathSummaryModal.svelte';
	// Build UI Component (Global modal)
	import MobileBuildMenu from '$lib/components/game/MobileBuildMenu.svelte';
	import { createGameRefreshInterval } from '$lib/stores/game/gameState.svelte';
	import { resourcesStore } from '$lib/stores/game/resources.svelte';
	import { populationStore } from '$lib/stores/game/population.svelte';
	import { structuresStore } from '$lib/stores/game/structures.svelte';
	import { disasterStore } from '$lib/stores/game/disaster.svelte';
	import { socketStore } from '$lib/stores/game/socket';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	// Build menu state
	let buildMenuOpen = $state(false);

	function handleOpenBuildMenu() {
		console.log('🔍 [SettlementPage] handleOpenBuildMenu CALLED');
		console.log('🔍 [SettlementPage] buildMenuOpen BEFORE:', buildMenuOpen);
		buildMenuOpen = true;
		console.log('🔍 [SettlementPage] buildMenuOpen AFTER:', buildMenuOpen);
	}

	function handleCloseBuildMenu() {
		console.log('🔍 [SettlementPage] handleCloseBuildMenu CALLED');
		buildMenuOpen = false;
	}

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

				// Verify store was populated
				const retrievedResources = resourcesStore.getResources(data.settlement.id);
				console.log(
					'[SETTLEMENT PAGE] Retrieved from store after init:',
					retrievedResources
				);
			} else {
				console.warn('[SETTLEMENT PAGE] No storage data available in settlement');
			}

			// Initialize population store from population data
			if (data.settlement.population) {
				console.log(
					'[SETTLEMENT PAGE] Initializing population:',
					data.settlement.population
				);
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

			// ✅ NEW: Initialize structures store from structures data
			if (data.settlement.structures) {
				console.log(
					'[SETTLEMENT PAGE] Initializing structures:',
					data.settlement.structures.length
				);
				structuresStore.initializeStructures(
					data.settlement.id,
					data.settlement.structures
				);
			} else {
				console.warn('[SETTLEMENT PAGE] No structures data available in settlement');
			}
		} else {
			console.error('[SETTLEMENT PAGE] No settlement data available!');
		}

		// Listen for structure:built events to refresh the page data
		const handleStructureBuilt = (eventData: any) => {
			console.log('[SETTLEMENT PAGE] structure:built event received:', eventData);

			// Check if the structure was built in this settlement
			if (eventData.settlementId === data.settlement?.id) {
				console.log(
					'[SETTLEMENT PAGE] Structure built in current settlement, refreshing data...'
				);

				// Invalidate the page data to trigger a reload
				invalidate('game:settlement');
			}
		};

		// Track if listener is already attached to prevent duplicates
		let listenerAttached = false;

		// Subscribe to socketStore and set up listener when socket connects
		const unsubscribe = socketStore.subscribe((state) => {
			const socket = state.socket;

			console.log('[SETTLEMENT PAGE] Socket state changed:', {
				hasSocket: !!socket,
				connected: socket?.connected,
				listenerAttached
			});

			if (socket && socket.connected && !listenerAttached) {
				console.log(
					'[SETTLEMENT PAGE] Socket connected, setting up structure:built listener'
				);
				socket.on('structure:built', handleStructureBuilt);
				listenerAttached = true;

				// Initialize store socket listeners now that socket is connected
				structuresStore.initialize();
				disasterStore.initialize();
			}
		});

		// Auto-refresh every minute to catch tick updates (fallback if Socket.IO fails)
		const gameRefreshCleanup = createGameRefreshInterval('game:settlement');

		// Cleanup function
		return () => {
			console.log('[SETTLEMENT PAGE] Cleaning up Socket.IO listeners...');

			// Get current socket for cleanup
			const currentSocket = socketStore.getSocket();
			if (currentSocket) {
				currentSocket.off('structure:built', handleStructureBuilt);
			}

			unsubscribe();
			gameRefreshCleanup?.();
		};
	});
</script>

<!-- Disaster UI Components (Global overlays) -->
<DisasterWarningBanner />
<CountdownTimer />
<DisasterImpactBanner />
<AftermathSummaryModal />

<!-- Build Menu (Global modal) -->
{#if data.settlement}
	<MobileBuildMenu
		open={buildMenuOpen}
		onClose={handleCloseBuildMenu}
		settlementId={data.settlement.id}
		structures={data.structures}
	/>
{/if}

<!-- Main Settlement Dashboard -->
{#if data.settlement}
	{@const tileData = (data as any).tile}
	{@const _ = console.log('[SETTLEMENT PAGE] Passing tile to dashboard:', tileData)}
	<SettlementDashboard
		settlementId={data.settlement.id}
		settlementName={data.settlement.name}
		settlement={data.settlement}
		structures={data.structures}
		tile={tileData}
		onOpenBuildMenu={handleOpenBuildMenu}
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
