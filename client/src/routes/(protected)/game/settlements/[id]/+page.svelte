<script lang="ts">
	import type { PageData } from './$types';
	import { logger } from '$lib/utils/logger';
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
		logger.debug('🔍 [SettlementPage] handleOpenBuildMenu CALLED');
		logger.debug('🔍 [SettlementPage] buildMenuOpen BEFORE:', { buildMenuOpen });
		buildMenuOpen = true;
		logger.debug('🔍 [SettlementPage] buildMenuOpen AFTER:', { buildMenuOpen });
	}

	function handleCloseBuildMenu() {
		logger.debug('🔍 [SettlementPage] handleCloseBuildMenu CALLED');
		buildMenuOpen = false;
	}

	// Set up auto-refresh for real-time data updates
	onMount(() => {
		logger.debug('[SETTLEMENT PAGE] Initializing stores from server data...');
		logger.debug('[SETTLEMENT PAGE] Settlement data:', { settlement: data.settlement });

		// Initialize stores from server-side loaded data
		if (data.settlement) {
			// Initialize resources store from storage data
			if (data.settlement.storage) {
				logger.debug('[SETTLEMENT PAGE] Initializing resources from storage:', {
					storage: data.settlement.storage
				});
				resourcesStore.initializeFromServerData(data.settlement.id, {
					storage: data.settlement.storage,
					capacity: data.settlement.storage.capacity || 1000
				});

				// Verify store was populated
				const retrievedResources = resourcesStore.getResources(data.settlement.id);
				logger.debug('[SETTLEMENT PAGE] Retrieved from store after init:', {
					retrievedResources
				});
			} else {
				logger.warn('[SETTLEMENT PAGE] No storage data available in settlement');
			}

			// Initialize population store from population data
			if (data.settlement.population) {
				logger.debug('[SETTLEMENT PAGE] Initializing population:', {
					population: data.settlement.population
				});
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
				logger.warn('[SETTLEMENT PAGE] No population data available in settlement');
			}

			// ✅ NEW: Initialize structures store from structures data
			if (data.settlementStructures) {
				logger.debug('[SETTLEMENT PAGE] Initializing structures:', {
					count: data.settlementStructures.length
				});
				structuresStore.initializeStructures(
					data.settlement.id,
					data.settlementStructures
				);
			} else {
				logger.warn('[SETTLEMENT PAGE] No structures data available in settlementStructures');
			}
		} else {
			logger.error('[SETTLEMENT PAGE] No settlement data available!');
		}

		// Listen for structure:built events to refresh the page data
		const handleStructureBuilt = (eventData: any) => {
			logger.debug('[SETTLEMENT PAGE] structure:built event received:', { eventData });

			// Check if the structure was built in this settlement
			if (eventData.settlementId === data.settlement?.id) {
				logger.debug(
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

			logger.debug('[SETTLEMENT PAGE] Socket state changed:', {
				hasSocket: !!socket,
				connected: socket?.connected,
				listenerAttached
			});

			if (socket && socket.connected && !listenerAttached) {
				logger.debug(
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
			logger.debug('[SETTLEMENT PAGE] Cleaning up Socket.IO listeners...');

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
	{@const _ = logger.debug('[SETTLEMENT PAGE] Passing tile to dashboard:', { tileData })}
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
