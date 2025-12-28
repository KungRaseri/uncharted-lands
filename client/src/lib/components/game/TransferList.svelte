<script lang="ts">
	/**
	 * Transfer List Component (ARTIFACT-05 Phase 3)
	 * 
	 * Displays active and completed resource transfers for a settlement
	 * - Shows in-transit transfers with progress bars and ETA
	 * - Displays completed transfer history
	 * - Color-coded by direction (incoming/outgoing)
	 */
	
	import { transferStore, type Transfer } from '$lib/stores/game/transfers.svelte';
	import { ArrowRight, ArrowLeft, Clock, CheckCircle, TrendingDown } from 'lucide-svelte';
	
	interface Props {
		settlementId: string;
	}
	
	let { settlementId }: Props = $props();
	
	// Get active and completed transfers for this settlement
	let activeTransfers = $derived(transferStore.getActiveSettlementTransfers(settlementId));
	let completedTransfers = $derived(
		transferStore.completedTransfers
			.filter(t => t.fromSettlementId === settlementId || t.toSettlementId === settlementId)
			.slice(0, 10) // Show only last 10 completed
	);
	
	// Calculate progress percentage
	function getProgress(transfer: Transfer): number {
		if (transfer.status === 'completed') return 100;
		
		const timeRemaining = transferStore.getTimeRemaining(transfer.id);
		const totalTime = transfer.transportTime;
		
		if (totalTime === 0) return 100;
		
		const elapsed = totalTime - timeRemaining;
		return Math.min(Math.max((elapsed / totalTime) * 100, 0), 100);
	}
	
	// Get resource display name
	function getResourceLabel(resourceType: string): string {
		const labels: Record<string, string> = {
			FOOD: 'Food',
			WOOD: 'Wood',
			STONE: 'Stone',
			ORE: 'Ore',
			CLAY: 'Clay',
			HERBS: 'Herbs',
			PELTS: 'Pelts',
			GEMS: 'Gems',
			EXOTIC_WOOD: 'Exotic Wood'
		};
		return labels[resourceType] || resourceType;
	}
	
	// Format date/time
	function formatDateTime(date: Date): string {
		return new Date(date).toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}
</script>

<div class="card preset-filled-surface-100-900 p-4">
	<h3 class="text-lg font-semibold mb-4 flex items-center gap-2">
		<Clock size={20} class="text-primary-500" />
		Resource Transfers
	</h3>

	<!-- Active Transfers -->
	{#if activeTransfers.length > 0}
		<div class="mb-6">
			<h4 class="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-2">
				In Transit ({activeTransfers.length})
			</h4>
			<div class="space-y-3">
				{#each activeTransfers as transfer (transfer.id)}
					{@const progress = getProgress(transfer)}
					{@const timeRemaining = transferStore.formatTimeRemaining(transfer.id)}
					{@const isOutgoing = transfer.direction === 'outgoing'}
					
					<div class="p-3 rounded border-2 {isOutgoing ? 'border-warning-500 bg-warning-50 dark:bg-warning-900/10' : 'border-success-500 bg-success-50 dark:bg-success-900/10'}">
						<!-- Header -->
						<div class="flex items-center justify-between mb-2">
							<div class="flex items-center gap-2">
								{#if isOutgoing}
									<ArrowRight size={16} class="text-warning-600 dark:text-warning-400" />
									<span class="text-sm font-semibold text-warning-700 dark:text-warning-300">
										Outgoing
									</span>
								{:else}
									<ArrowLeft size={16} class="text-success-600 dark:text-success-400" />
									<span class="text-sm font-semibold text-success-700 dark:text-success-300">
										Incoming
									</span>
								{/if}
							</div>
							<span class="text-xs text-surface-600 dark:text-surface-400">
								ETA: {timeRemaining}
							</span>
						</div>

						<!-- Transfer Details -->
						<div class="text-sm mb-2">
							<p class="font-medium">
								{transfer.amountSent.toLocaleString()} {getResourceLabel(transfer.resourceType)}
							</p>
							<p class="text-surface-600 dark:text-surface-400">
								{isOutgoing 
									? `To: ${transfer.toSettlementName}` 
									: `From: ${transfer.fromSettlementName}`}
							</p>
						</div>

						<!-- Loss Info -->
						{#if transfer.lossPercentage > 0}
							<div class="flex items-center gap-1 text-xs text-error-600 dark:text-error-400 mb-2">
								<TrendingDown size={12} />
								<span>
									{transfer.lossPercentage}% loss ({(transfer.amountSent - transfer.amountReceived).toLocaleString()} lost)
								</span>
							</div>
						{/if}

						<!-- Progress Bar -->
						<div class="w-full bg-surface-300 dark:bg-surface-700 rounded-full h-2">
							<div
								class="h-2 rounded-full transition-all duration-1000 {isOutgoing ? 'bg-warning-500' : 'bg-success-500'}"
								style="width: {progress}%"
							></div>
						</div>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Completed Transfers -->
	{#if completedTransfers.length > 0}
		<div>
			<h4 class="text-sm font-semibold text-surface-600 dark:text-surface-400 mb-2">
				Completed (Last 10)
			</h4>
			<div class="space-y-2">
				{#each completedTransfers as transfer (transfer.id)}
					{@const isOutgoing = transfer.direction === 'outgoing'}
					
					<div class="p-2 rounded bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors">
						<!-- Header -->
						<div class="flex items-center justify-between mb-1">
							<div class="flex items-center gap-2">
								<CheckCircle size={14} class="text-success-500" />
								{#if isOutgoing}
									<ArrowRight size={14} class="text-surface-500" />
								{:else}
									<ArrowLeft size={14} class="text-surface-500" />
								{/if}
								<span class="text-sm font-medium">
									{transfer.amountReceived.toLocaleString()} {getResourceLabel(transfer.resourceType)}
								</span>
							</div>
							<span class="text-xs text-surface-500">
								{transfer.completedAt ? formatDateTime(transfer.completedAt) : 'Unknown'}
							</span>
						</div>

						<!-- Details -->
						<p class="text-xs text-surface-600 dark:text-surface-400 pl-8">
							{isOutgoing 
								? `Sent to ${transfer.toSettlementName}` 
								: `Received from ${transfer.fromSettlementName}`}
							{#if transfer.lossPercentage > 0}
								<span class="text-error-600 dark:text-error-400">
									• {transfer.lossPercentage}% lost
								</span>
							{/if}
						</p>
					</div>
				{/each}
			</div>
		</div>
	{:else if activeTransfers.length === 0}
		<div class="text-center py-8 text-surface-500">
			<Clock size={32} class="mx-auto mb-2 opacity-50" />
			<p class="text-sm">No transfers yet</p>
			<p class="text-xs mt-1">Transfer resources between your settlements to see them here</p>
		</div>
	{/if}
</div>
