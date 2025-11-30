<script lang="ts">
	/**
	 * Quick Actions Bar Component
	 *
	 * Provides 1-click access to common settlement actions:
	 * - Build (B): Open build menu
	 * - Collect (C): Manual resource collection
	 * - Upgrade (U): Upgrade next eligible structure
	 * - Repair (R): Repair damaged structures
	 * - Aid (A): Send aid to allies
	 */

	import { goto } from '$app/navigation';

	interface Props {
		settlementId: string;
	}

	let { settlementId }: Props = $props();

	// State for modals
	let buildMenuOpen = $state(false);
	let aidModalOpen = $state(false);

	// TODO: Replace with actual store calls when stores are available
	// These are placeholders for now
	const canBuild = $derived(true); // settlementStore.hasAvailableResources(settlementId)
	const canUpgrade = $derived(true); // structureStore.hasUpgradeableStructures(settlementId)
	const canRepair = $derived(false); // structureStore.hasDamagedStructures(settlementId)
	const canSendAid = $derived(false); // disasterStore.hasAlliesInDistress()
	const recentBuild = $derived(null as string | null); // structureStore.getMostRecentBuild(settlementId)

	// Action handlers
	async function handleBuild() {
		// Open build menu
		buildMenuOpen = true;
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

	async function handleAid() {
		// Send aid to allies
		aidModalOpen = true;
	}
</script>

<nav class="quick-actions-bar" aria-label="Quick actions">
	<button
		onclick={handleBuild}
		disabled={!canBuild}
		aria-label="Build structure (keyboard shortcut: B)"
		title="Build structure (B)"
		class="quick-action"
	>
		<span class="icon" aria-hidden="true">🏗️</span>
		<span class="label">Build</span>
		{#if recentBuild}
			<span class="recent">({recentBuild})</span>
		{/if}
	</button>

	<button
		onclick={handleCollect}
		aria-label="Collect resources (keyboard shortcut: C)"
		title="Collect resources (C)"
		class="quick-action"
	>
		<span class="icon" aria-hidden="true">📦</span>
		<span class="label">Collect</span>
	</button>

	<button
		onclick={handleUpgrade}
		disabled={!canUpgrade}
		aria-label="Upgrade next structure (keyboard shortcut: U)"
		title="Upgrade next structure (U)"
		class="quick-action"
	>
		<span class="icon" aria-hidden="true">⬆️</span>
		<span class="label">Upgrade</span>
		{#if canUpgrade}
			<span class="badge">1</span>
		{/if}
	</button>

	<button
		onclick={handleRepair}
		disabled={!canRepair}
		aria-label="Repair damaged structures (keyboard shortcut: R)"
		title="Repair damaged structures (R)"
		class="quick-action"
	>
		<span class="icon" aria-hidden="true">🔧</span>
		<span class="label">Repair</span>
		{#if canRepair}
			<span class="badge critical">2</span>
		{/if}
	</button>

	<button
		onclick={handleAid}
		disabled={!canSendAid}
		aria-label="Send aid to allies (keyboard shortcut: A)"
		title="Send aid to allies (A)"
		class="quick-action"
	>
		<span class="icon" aria-hidden="true">🤝</span>
		<span class="label">Aid</span>
	</button>
</nav>

<style>
	.quick-actions-bar {
		display: flex;
		gap: var(--spacing-sm, 0.5rem);
		padding: var(--spacing-md, 1rem);
		background: var(--surface-200, #e5e7eb);
		border-radius: var(--radius-lg, 0.75rem);
		flex-wrap: wrap;
	}

	.quick-action {
		display: flex;
		align-items: center;
		gap: var(--spacing-xs, 0.25rem);
		padding: var(--spacing-sm, 0.5rem) var(--spacing-md, 1rem);
		background: var(--primary-500, #3b82f6);
		color: white;
		border: none;
		border-radius: var(--radius-md, 0.5rem);
		cursor: pointer;
		font-weight: 600;
		min-height: 44px; /* Touch target size */
		transition: all 0.2s;
		font-size: 0.875rem;
	}

	.quick-action:hover:not(:disabled) {
		background: var(--primary-600, #2563eb);
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	.quick-action:active:not(:disabled) {
		transform: translateY(0);
	}

	.quick-action:disabled {
		background: var(--surface-300, #d1d5db);
		color: var(--text-disabled, #9ca3af);
		cursor: not-allowed;
	}

	.quick-action:focus-visible {
		outline: 3px solid var(--primary-300, #93c5fd);
		outline-offset: 2px;
	}

	.icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.label {
		font-size: 0.875rem;
	}

	.recent {
		font-size: 0.75rem;
		opacity: 0.8;
	}

	.badge {
		background: white;
		color: var(--primary-500, #3b82f6);
		padding: 2px 6px;
		border-radius: 12px;
		font-size: 0.75rem;
		font-weight: 700;
		margin-left: var(--spacing-xs, 0.25rem);
	}

	.badge.critical {
		background: var(--error-500, #ef4444);
		color: white;
	}

	/* Mobile adjustments */
	@media (max-width: 767px) {
		.quick-actions-bar {
			padding: var(--spacing-sm, 0.5rem);
			gap: var(--spacing-xs, 0.25rem);
		}

		.quick-action {
			flex: 1 1 calc(50% - var(--spacing-xs, 0.25rem));
			justify-content: center;
		}

		.label {
			display: none; /* Show icons only on mobile */
		}

		.recent {
			display: none;
		}
	}
</style>
