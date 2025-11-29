<script lang="ts">
	import { disasterStore } from '$lib/stores/game/disaster.svelte';
	import StructureHealthBar from './StructureHealthBar.svelte';

	const aftermathSummary = $derived(disasterStore.aftermathSummary);
	const modalOpen = $derived(disasterStore.aftermathModalOpen);
	const emergencyRepairActive = $derived(disasterStore.emergencyRepairWindowActive);
	const emergencyTimeRemaining = $derived(disasterStore.emergencyRepairTimeFormatted);

	function closeModal() {
		disasterStore.closeAftermathModal();
	}

	function repairAll() {
		// TODO: Implement repair all action
		console.log('[AFTERMATH] Repair all clicked');
	}

	function requestAid() {
		// TODO: Implement request aid action
		console.log('[AFTERMATH] Request aid clicked');
	}
</script>

{#if modalOpen && aftermathSummary}
	<div class="fixed inset-0 z-100 bg-black bg-opacity-50 flex items-center justify-center">
		<div
			class="bg-surface-100-800-token p-6 rounded-lg shadow-xl max-w-3xl w-full mx-4 max-h-screen overflow-y-auto"
		>
			<div class="flex justify-between items-center mb-6">
				<h2 class="h2">Disaster Aftermath Report</h2>
				<button type="button" onclick={closeModal} class="btn btn-icon variant-filled-surface">
					✕
				</button>
			</div>

			<!-- Summary Stats -->
			<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
				<div class="card p-4">
					<p class="text-xs text-surface-600-300-token">Total Damage</p>
					<p class="text-2xl font-bold text-red-600">{aftermathSummary.totalDamage}%</p>
				</div>
				<div class="card p-4">
					<p class="text-xs text-surface-600-300-token">Structures Damaged</p>
					<p class="text-2xl font-bold">{aftermathSummary.structuresDamaged}</p>
				</div>
				<div class="card p-4">
					<p class="text-xs text-surface-600-300-token">Structures Destroyed</p>
					<p class="text-2xl font-bold text-purple-600">{aftermathSummary.structuresDestroyed}</p>
				</div>
				<div class="card p-4">
					<p class="text-xs text-surface-600-300-token">Casualties</p>
					<p class="text-2xl font-bold text-red-600">{aftermathSummary.casualties}</p>
				</div>
			</div>

			<!-- Repair Costs -->
			<div class="card p-4 mb-6">
				<h3 class="h4 mb-4">Estimated Repair Costs</h3>

				{#if emergencyRepairActive}
					<div class="bg-yellow-600 text-white p-3 rounded mb-4">
						<p class="font-bold">🚨 Emergency Repair Discount Active!</p>
						<p class="text-sm">50% off all repairs for: {emergencyTimeRemaining}</p>
					</div>
				{/if}

				<div class="grid grid-cols-3 gap-4">
					<div>
						<p class="text-sm font-medium">Wood</p>
						<p class="text-xl font-bold">
							{emergencyRepairActive
								? Math.floor(aftermathSummary.estimatedRepairCost.wood / 2)
								: aftermathSummary.estimatedRepairCost.wood}
						</p>
						{#if emergencyRepairActive}
							<p class="text-xs text-surface-600-300-token line-through">
								{aftermathSummary.estimatedRepairCost.wood}
							</p>
						{/if}
					</div>
					<div>
						<p class="text-sm font-medium">Stone</p>
						<p class="text-xl font-bold">
							{emergencyRepairActive
								? Math.floor(aftermathSummary.estimatedRepairCost.stone / 2)
								: aftermathSummary.estimatedRepairCost.stone}
						</p>
						{#if emergencyRepairActive}
							<p class="text-xs text-surface-600-300-token line-through">
								{aftermathSummary.estimatedRepairCost.stone}
							</p>
						{/if}
					</div>
					<div>
						<p class="text-sm font-medium">Ore</p>
						<p class="text-xl font-bold">
							{emergencyRepairActive
								? Math.floor(aftermathSummary.estimatedRepairCost.ore / 2)
								: aftermathSummary.estimatedRepairCost.ore}
						</p>
						{#if emergencyRepairActive}
							<p class="text-xs text-surface-600-300-token line-through">
								{aftermathSummary.estimatedRepairCost.ore}
							</p>
						{/if}
					</div>
				</div>
			</div>

			<!-- Additional Impact -->
			<div class="card p-4 mb-6">
				<h3 class="h4 mb-4">Additional Impact</h3>
				<div class="space-y-2">
					<p class="text-sm">
						<span class="font-medium">Happiness Loss:</span> -{aftermathSummary.happinessLoss}
					</p>
					<p class="text-sm">
						<span class="font-medium">Emigration Increase:</span> +{(
							aftermathSummary.emigrationIncrease * 100
						).toFixed(1)}%
					</p>
					<p class="text-sm">
						<span class="font-medium">Population Sheltered:</span>
						{aftermathSummary.populationSheltered}
					</p>
				</div>
			</div>

			<!-- Actions -->
			<div class="flex gap-4">
				<button type="button" onclick={repairAll} class="btn variant-filled-primary flex-1">
					{emergencyRepairActive ? 'Repair All (Emergency)' : 'Repair All'}
				</button>
				<button type="button" onclick={requestAid} class="btn variant-filled-surface flex-1">
					Request Aid from Allies
				</button>
				<button type="button" onclick={closeModal} class="btn variant-filled-surface">
					Close
				</button>
			</div>
		</div>
	</div>
{/if}
