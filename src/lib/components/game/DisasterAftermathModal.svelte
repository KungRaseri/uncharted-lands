<!--
  Disaster Aftermath Modal
  
  Displays a polished post-disaster summary with:
  - Casualties and population impact
  - Structure damage (damaged/destroyed counts)
  - Resources lost from damaged storage
  - Resilience gained
  - Emergency repair discount countdown (48 hours)
  
  Uses Svelte 5 runes syntax with transitions and animations.
-->
<script lang="ts">
	import { fade, fly, scale } from 'svelte/transition';
	import { disasterStore } from '$lib/stores/game/disaster.svelte';

	interface Props {
		open?: boolean;
		onClose?: () => void;
	}

	let { open = $bindable(false), onClose }: Props = $props();

	// Reactive state from disaster store
	const aftermathSummary = $derived(disasterStore.aftermathSummary);
	const emergencyRepairTimeRemaining = $derived(disasterStore.emergencyRepairTimeRemaining);
	const emergencyRepairWindowActive = $derived(disasterStore.emergencyRepairWindowActive);

	// Computed values
	const casualtyRate = $derived(
		aftermathSummary && aftermathSummary.populationSheltered > 0
			? (
					(aftermathSummary.casualties /
						(aftermathSummary.casualties + aftermathSummary.populationSheltered)) *
					100
				).toFixed(1)
			: '0'
	);

	const totalStructuresAffected = $derived(
		aftermathSummary ? aftermathSummary.structuresDamaged + aftermathSummary.structuresDestroyed : 0
	);

	// Format emergency repair countdown
	const emergencyRepairFormatted = $derived(() => {
		if (!emergencyRepairTimeRemaining) return '0h 0m';

		const hours = Math.floor(emergencyRepairTimeRemaining / (1000 * 60 * 60));
		const minutes = Math.floor((emergencyRepairTimeRemaining % (1000 * 60 * 60)) / (1000 * 60));

		return `${hours}h ${minutes}m`;
	});

	function handleClose() {
		open = false;
		disasterStore.closeAftermathModal();
		onClose?.();
	}
</script>

{#if open && aftermathSummary}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 bg-surface-900/80 backdrop-blur-sm"
		transition:fade={{ duration: 200 }}
		onclick={handleClose}
		onkeydown={(e) => e.key === 'Escape' && handleClose()}
		role="button"
		tabindex="-1"
		aria-label="Close modal backdrop"
	></div>

	<!-- Modal -->
	<div
		class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl pointer-events-auto"
			transition:fly={{ y: -50, duration: 300 }}
			role="dialog"
			aria-labelledby="aftermath-title"
			aria-describedby="aftermath-description"
		>
			<!-- Header -->
			<header class="flex items-center justify-between mb-6">
				<h2 id="aftermath-title" class="h2 text-warning-400">⚠️ Disaster Aftermath Report</h2>
				<button
					type="button"
					class="btn-icon btn-icon-sm variant-ghost-surface"
					onclick={handleClose}
					aria-label="Close modal"
				>
					<span class="text-2xl">✕</span>
				</button>
			</header>

			<!-- Summary Description -->
			<p id="aftermath-description" class="text-surface-300 mb-6">
				The disaster has ended. Review the damage and begin recovery efforts.
			</p>

			<!-- Stats Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
				<!-- Casualties Card -->
				<div class="card variant-ghost-error p-4" transition:scale={{ delay: 100, duration: 300 }}>
					<h3 class="h4 text-error-400 mb-2 flex items-center gap-2">
						<span aria-hidden="true">💀</span>
						<span>Casualties</span>
					</h3>
					<div class="flex items-baseline gap-2">
						<span class="text-4xl font-bold">{aftermathSummary.casualties}</span>
						<span class="text-surface-400">people lost</span>
					</div>
					{#if aftermathSummary.populationSheltered > 0}
						<p class="text-sm text-surface-400 mt-2">
							Casualty rate: <span class="text-error-300">{casualtyRate}%</span>
							<br />
							Sheltered:
							<span class="text-success-300">{aftermathSummary.populationSheltered}</span> people
						</p>
					{/if}
				</div>

				<!-- Structures Damaged Card -->
				<div
					class="card variant-ghost-warning p-4"
					transition:scale={{ delay: 150, duration: 300 }}
				>
					<h3 class="h4 text-warning-400 mb-2 flex items-center gap-2">
						<span aria-hidden="true">🏚️</span>
						<span>Structures Damaged</span>
					</h3>
					<div class="flex items-baseline gap-2">
						<span class="text-4xl font-bold">{totalStructuresAffected}</span>
						<span class="text-surface-400">total</span>
					</div>
					<p class="text-sm text-surface-400 mt-2">
						Damaged: <span class="text-warning-300">{aftermathSummary.structuresDamaged}</span>
						<br />
						Destroyed: <span class="text-error-300">{aftermathSummary.structuresDestroyed}</span>
					</p>
				</div>

				<!-- Resources Lost Card -->
				<div
					class="card variant-ghost-tertiary p-4"
					transition:scale={{ delay: 200, duration: 300 }}
				>
					<h3 class="h4 text-tertiary-400 mb-2 flex items-center gap-2">
						<span aria-hidden="true">📦</span>
						<span>Resources Lost</span>
					</h3>
					<div class="text-sm space-y-1">
						<div class="flex justify-between">
							<span>Food:</span>
							<span class="text-error-300">-{Math.floor(aftermathSummary.totalDamage * 1.5)}</span>
						</div>
						<div class="flex justify-between">
							<span>Water:</span>
							<span class="text-error-300">-{Math.floor(aftermathSummary.totalDamage * 2)}</span>
						</div>
						<div class="flex justify-between">
							<span>Wood:</span>
							<span class="text-error-300">-{Math.floor(aftermathSummary.totalDamage * 0.5)}</span>
						</div>
					</div>
				</div>

				<!-- Resilience Gained Card -->
				<div
					class="card variant-ghost-success p-4"
					transition:scale={{ delay: 250, duration: 300 }}
				>
					<h3 class="h4 text-success-400 mb-2 flex items-center gap-2">
						<span aria-hidden="true">🛡️</span>
						<span>Resilience Gained</span>
					</h3>
					<div class="flex items-baseline gap-2">
						<span class="text-4xl font-bold text-success-400">+5</span>
						<span class="text-surface-400">points</span>
					</div>
					<p class="text-sm text-surface-400 mt-2">
						Your settlement becomes stronger through adversity.
					</p>
				</div>
			</div>

			<!-- Emergency Repair Discount Banner -->
			{#if emergencyRepairWindowActive}
				<div
					class="card variant-filled-warning p-4 mb-6"
					transition:scale={{ delay: 300, duration: 300 }}
				>
					<div class="flex items-start gap-3">
						<span class="text-3xl" aria-hidden="true">⚡</span>
						<div class="flex-1">
							<h3 class="h4 text-warning-900 mb-1">Emergency Repair Discount Active!</h3>
							<p class="text-warning-900 mb-2">
								Repair all damaged structures for <strong>50% off</strong> during the emergency window.
							</p>
							<div class="flex items-center gap-2 text-warning-900">
								<span class="font-bold text-lg">⏱️ {emergencyRepairFormatted()}</span>
								<span>remaining</span>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- Estimated Repair Costs -->
			<div class="card variant-ghost-surface p-4 mb-6">
				<h3 class="h4 mb-3 flex items-center gap-2">
					<span aria-hidden="true">🔧</span>
					<span>Estimated Repair Costs</span>
				</h3>
				<div class="grid grid-cols-3 gap-4 text-center">
					<div>
						<div class="text-3xl font-bold text-primary-400">
							{aftermathSummary.estimatedRepairCost.wood}
						</div>
						<div class="text-sm text-surface-400">🪵 Wood</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-primary-400">
							{aftermathSummary.estimatedRepairCost.stone}
						</div>
						<div class="text-sm text-surface-400">🪨 Stone</div>
					</div>
					<div>
						<div class="text-3xl font-bold text-primary-400">
							{aftermathSummary.estimatedRepairCost.ore}
						</div>
						<div class="text-sm text-surface-400">⛏️ Ore</div>
					</div>
				</div>
				{#if emergencyRepairWindowActive}
					<div class="text-center mt-3 text-success-400 font-semibold">
						With 50% discount: {Math.floor(aftermathSummary.estimatedRepairCost.wood / 2)} Wood,
						{Math.floor(aftermathSummary.estimatedRepairCost.stone / 2)} Stone,
						{Math.floor(aftermathSummary.estimatedRepairCost.ore / 2)} Ore
					</div>
				{/if}
			</div>

			<!-- Population Impact -->
			<div class="card variant-ghost-surface p-4 mb-6">
				<h3 class="h4 mb-3 flex items-center gap-2">
					<span aria-hidden="true">👥</span>
					<span>Population Impact</span>
				</h3>
				<div class="space-y-2 text-sm">
					<div class="flex justify-between">
						<span>Happiness Loss:</span>
						<span class="text-error-400">-{aftermathSummary.happinessLoss} points</span>
					</div>
					<div class="flex justify-between">
						<span>Emigration Risk Increase:</span>
						<span class="text-warning-400"
							>+{(aftermathSummary.emigrationIncrease * 100).toFixed(1)}%</span
						>
					</div>
					<p class="text-xs text-surface-400 mt-3">
						💡 Tip: Build a Relief Center to distribute emergency supplies and stabilize happiness
						faster.
					</p>
				</div>
			</div>

			<!-- Actions -->
			<footer class="flex flex-col sm:flex-row gap-3 justify-end">
				<button
					type="button"
					class="btn variant-ghost-surface"
					onclick={handleClose}
					aria-label="Close aftermath report"
				>
					Close Report
				</button>
				<button
					type="button"
					class="btn variant-filled-warning"
					onclick={() => {
						// TODO: Navigate to repair interface
						handleClose();
					}}
					disabled={!emergencyRepairWindowActive}
					aria-label="Begin emergency repairs"
				>
					{#if emergencyRepairWindowActive}
						⚡ Repair Now (50% Off)
					{:else}
						View Repairs
					{/if}
				</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	/* Smooth animations for GPU acceleration */
	.card {
		transform: translateZ(0);
		will-change: transform, opacity;
	}

	/* Mobile-friendly scrolling */
	@media (max-width: 768px) {
		.overflow-y-auto {
			-webkit-overflow-scrolling: touch;
		}

		/* Full-screen modal on mobile */
		.card {
			max-height: 100vh;
			border-radius: 0;
		}
	}

	/* High contrast focus indicators for accessibility */
	button:focus-visible {
		outline: 3px solid var(--color-primary-500);
		outline-offset: 2px;
	}
</style>
