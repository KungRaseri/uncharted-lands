<script lang="ts">
	/**
	 * Quick Actions Bar Component
	 *
	 * Provides 1-click access to common settlement actions with real-time badge updates:
	 * - Build (B): Open build menu
	 * - Collect (C): Manual resource collection
	 * - Upgrade (U): Upgrade next eligible structure
	 * - Repair (R): Repair damaged structures
	 * - Alerts (⚠️): View active alerts/warnings
	 *
	 * Real-time updates:
	 * - Alert badges update via alertsStore (Socket.IO)
	 * - Construction badges update via constructionStore (Socket.IO)
	 */

	import { alertsStore } from '$lib/stores/game/alerts.svelte';
	import { constructionStore } from '$lib/stores/game/construction.svelte';

	interface Props {
		settlementId: string;
		onOpenBuildMenu?: () => void; // Handler to open build menu modal
	}

	let { settlementId, onOpenBuildMenu }: Props = $props();

	// Real-time badge counts from stores
	const alertCount = $derived(alertsStore.getAlertCount(settlementId));
	const criticalAlertCount = $derived(alertsStore.getAlertCount(settlementId, 'critical'));
	const constructionQueueLength = $derived(constructionStore.getTotalCount(settlementId));
	const activeConstructionCount = $derived(constructionStore.getActiveCount(settlementId));

	// Action availability (keeping placeholders until other stores implemented)
	const canBuild = $derived(true); // settlementStore.hasAvailableResources(settlementId)
	const canUpgrade = $derived(true); // structureStore.hasUpgradeableStructures(settlementId)
	const canRepair = $derived(false); // structureStore.hasDamagedStructures(settlementId)
	const recentBuild = $derived(null as string | null); // structureStore.getMostRecentBuild(settlementId)

	// Action handlers
	async function handleBuild() {
		console.log('🔍 [QuickActionsBar] Build button clicked');
		console.log('🔍 [QuickActionsBar] onOpenBuildMenu exists?', !!onOpenBuildMenu);
		console.log('🔍 [QuickActionsBar] onOpenBuildMenu type:', typeof onOpenBuildMenu);

		// Open build menu modal via parent handler
		if (onOpenBuildMenu) {
			console.log('🔍 [QuickActionsBar] Calling onOpenBuildMenu...');
			onOpenBuildMenu();
			console.log('🔍 [QuickActionsBar] onOpenBuildMenu called successfully');
		} else {
			console.warn('❌ [QuickActionsBar] Build menu handler not provided');
		}
	}

	async function handleCollect() {
		// Manual resource collection
		// await settlementStore.collectResources(settlementId);
		console.log('Collect resources:', settlementId);
	}

	async function handleUpgrade() {
		// Upgrade next eligible structure
		// const nextUpgrade = structureStore.getNextUpgradeable(settlementId);
		// if (nextUpgrade) {
		//   await structureStore.upgradeStructure(nextUpgrade.id);
		// }
		console.log('Upgrade structure:', settlementId);
	}

	async function handleRepair() {
		// Repair all damaged structures
		// const damaged = structureStore.getDamagedStructures(settlementId);
		// for (const structure of damaged) {
		//   await structureStore.repairStructure(structure.id);
		// }
		console.log('Repair structures:', settlementId);
	}

	async function handleAlerts() {
		// TODO: Open alerts panel when UI is implemented
		console.log('Open alerts panel:', settlementId);
	}
</script>

<nav
	class="flex gap-2 p-4 md:p-4 bg-surface-200 dark:bg-surface-800 rounded-xl flex-wrap md:gap-2 md:rounded-xl p-2 gap-1"
	aria-label="Quick actions"
>
	<!-- Alerts Button (replaced Aid) -->
	<button
		onclick={handleAlerts}
		aria-label="View alerts and warnings (keyboard shortcut: A)"
		title="View alerts (A)"
		class="flex items-center gap-1 px-4 py-2 bg-primary-500 dark:bg-primary-600 text-white border-none rounded-lg cursor-pointer font-semibold min-h-11 transition-all duration-200 text-sm hover:bg-primary-600 dark:hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:bg-surface-300 dark:disabled:bg-surface-700 disabled:text-surface-500 dark:disabled:text-surface-500 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-500 focus-visible:outline-offset-2 md:flex-initial md:justify-start flex-1 basis-[calc(50%-0.25rem)] justify-center {criticalAlertCount >
		0
			? 'bg-error-500 dark:bg-error-600 hover:bg-error-600 dark:hover:bg-error-700 animate-pulse-critical'
			: ''}"
	>
		<span class="text-xl leading-none" aria-hidden="true">⚠️</span>
		<span class="text-sm md:inline hidden">Alerts</span>
		{#if alertCount > 0}
			<span
				class="px-1.5 py-0.5 rounded-xl text-xs font-bold ml-1 {criticalAlertCount > 0
					? 'bg-error-500 dark:bg-error-600 text-white'
					: 'bg-white dark:bg-surface-100 text-primary-500 dark:text-primary-600'}"
			>
				{alertCount}
			</span>
		{/if}
	</button>

	<!-- Build Button -->
	<button
		onclick={handleBuild}
		disabled={!canBuild}
		data-testid="build-structure-btn"
		aria-label="Build structure (keyboard shortcut: B)"
		title="Build structure (B)"
		class="flex items-center gap-1 px-4 py-2 bg-primary-500 dark:bg-primary-600 text-white border-none rounded-lg cursor-pointer font-semibold min-h-11 transition-all duration-200 text-sm hover:bg-primary-600 dark:hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:bg-surface-300 dark:disabled:bg-surface-700 disabled:text-surface-500 dark:disabled:text-surface-500 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-500 focus-visible:outline-offset-2 md:flex-initial md:justify-start flex-1 basis-[calc(50%-0.25rem)] justify-center"
	>
		<span class="text-xl leading-none" aria-hidden="true">🏗️</span>
		<span class="text-sm md:inline hidden">Build</span>
		{#if recentBuild}
			<span class="text-xs opacity-80 md:inline hidden">({recentBuild})</span>
		{/if}
		{#if constructionQueueLength > 0}
			<span
				class="bg-white dark:bg-surface-100 text-primary-500 dark:text-primary-600 px-1.5 py-0.5 rounded-xl text-xs font-bold ml-1"
			>
				{activeConstructionCount}/{constructionQueueLength}
			</span>
		{/if}
	</button>

	<!-- Collect Button -->
	<button
		onclick={handleCollect}
		aria-label="Collect resources (keyboard shortcut: C)"
		title="Collect resources (C)"
		class="flex items-center gap-1 px-4 py-2 bg-primary-500 dark:bg-primary-600 text-white border-none rounded-lg cursor-pointer font-semibold min-h-11 transition-all duration-200 text-sm hover:bg-primary-600 dark:hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:bg-surface-300 dark:disabled:bg-surface-700 disabled:text-surface-500 dark:disabled:text-surface-500 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-500 focus-visible:outline-offset-2 md:flex-initial md:justify-start flex-1 basis-[calc(50%-0.25rem)] justify-center"
	>
		<span class="text-xl leading-none" aria-hidden="true">📦</span>
		<span class="text-sm md:inline hidden">Collect</span>
	</button>

	<!-- Upgrade Button -->
	<button
		onclick={handleUpgrade}
		disabled={!canUpgrade}
		aria-label="Upgrade next structure (keyboard shortcut: U)"
		title="Upgrade next structure (U)"
		class="flex items-center gap-1 px-4 py-2 bg-primary-500 dark:bg-primary-600 text-white border-none rounded-lg cursor-pointer font-semibold min-h-11 transition-all duration-200 text-sm hover:bg-primary-600 dark:hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:bg-surface-300 dark:disabled:bg-surface-700 disabled:text-surface-500 dark:disabled:text-surface-500 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-500 focus-visible:outline-offset-2 md:flex-initial md:justify-start flex-1 basis-[calc(50%-0.25rem)] justify-center"
	>
		<span class="text-xl leading-none" aria-hidden="true">⬆️</span>
		<span class="text-sm md:inline hidden">Upgrade</span>
		{#if canUpgrade}
			<span
				class="bg-white dark:bg-surface-100 text-primary-500 dark:text-primary-600 px-1.5 py-0.5 rounded-xl text-xs font-bold ml-1"
			>
				1
			</span>
		{/if}
	</button>

	<!-- Repair Button -->
	<button
		onclick={handleRepair}
		disabled={!canRepair}
		aria-label="Repair damaged structures (keyboard shortcut: R)"
		title="Repair damaged structures (R)"
		class="flex items-center gap-1 px-4 py-2 bg-primary-500 dark:bg-primary-600 text-white border-none rounded-lg cursor-pointer font-semibold min-h-11 transition-all duration-200 text-sm hover:bg-primary-600 dark:hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-[0_4px_8px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_4px_8px_rgba(0,0,0,0.4)] active:translate-y-0 disabled:bg-surface-300 dark:disabled:bg-surface-700 disabled:text-surface-500 dark:disabled:text-surface-500 disabled:cursor-not-allowed focus-visible:outline-3 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-500 focus-visible:outline-offset-2 md:flex-initial md:justify-start flex-1 basis-[calc(50%-0.25rem)] justify-center"
	>
		<span class="text-xl leading-none" aria-hidden="true">🔧</span>
		<span class="text-sm md:inline hidden">Repair</span>
		{#if canRepair}
			<span
				class="bg-error-500 dark:bg-error-600 text-white px-1.5 py-0.5 rounded-xl text-xs font-bold ml-1"
			>
				2
			</span>
		{/if}
	</button>
</nav>
