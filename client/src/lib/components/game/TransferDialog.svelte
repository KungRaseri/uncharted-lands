<script lang="ts">
	/**
	 * Transfer Dialog Component (ARTIFACT-05 Phase 3)
	 * 
	 * Modal for initiating resource transfers between settlements
	 * - Select destination settlement from list
	 * - Choose resource type and amount
	 * - Show estimated transport time and loss percentage
	 * - Validate available resources before submission
	 */
	
	import { transferStore, type ResourceType } from '$lib/stores/game/transfers.svelte';
	import { X, ArrowRight, AlertCircle, Package } from 'lucide-svelte';
	
	interface Props {
		fromSettlementId: string;
		fromSettlementName: string;
		availableSettlements: Array<{ id: string; name: string }>;
		currentResources: Record<string, number>;
		sessionToken: string;
		onClose?: () => void;
	}
	
	let {
		fromSettlementId,
		fromSettlementName,
		availableSettlements,
		currentResources,
		sessionToken,
		onClose
	}: Props = $props();
	
	// Close modal
	function close() {
		if (onClose) {
			onClose();
		}
	}
	let selectedSettlementId = $state('');
	let selectedResourceType = $state<ResourceType>('FOOD');
	let amount = $state(0);
	let isSubmitting = $state(false);
	let errorMessage = $state('');
	
	// Resource types with display names
	const resourceTypes: Array<{ value: ResourceType; label: string }> = [
		{ value: 'FOOD', label: 'Food' },
		{ value: 'WOOD', label: 'Wood' },
		{ value: 'STONE', label: 'Stone' },
		{ value: 'ORE', label: 'Ore' },
		{ value: 'CLAY', label: 'Clay' },
		{ value: 'HERBS', label: 'Herbs' },
		{ value: 'PELTS', label: 'Pelts' },
		{ value: 'GEMS', label: 'Gems' },
		{ value: 'EXOTIC_WOOD', label: 'Exotic Wood' }
	];
	
	// Get available amount for selected resource
	let availableAmount = $derived(
		currentResources[selectedResourceType.toLowerCase()] || 0
	);
	
	// Check if form is valid
	let isValid = $derived(
		selectedSettlementId !== '' &&
		amount > 0 &&
		amount <= availableAmount
	);
	
	// Close modal
	function close() {
		if (modalStore) {
			modalStore.close();
		}
	}
	
	// Handle form submission
	async function handleSubmit() {
		if (!isValid || isSubmitting) return;
		
		errorMessage = '';
		isSubmitting = true;
		
		try {
			const result = await transferStore.initiateTransfer(
				fromSettlementId,
				selectedSettlementId,
				selectedResourceType,
				amount,
				sessionToken
			);
			
			if (result.success) {
				close();
			} else {
				errorMessage = result.error || 'Failed to initiate transfer';
			}
		} catch (error) {
			errorMessage = error instanceof Error ? error.message : 'Unknown error';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<div class="card preset-filled-surface-50-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
	<!-- Header -->
	<header class="card-header flex items-center justify-between">
		<div class="flex items-center gap-2">
			<Package size={24} class="text-primary-500" />
			<h3 class="text-xl font-bold">Transfer Resources</h3>
		</div>
		<button
			type="button"
			class="btn-icon btn-icon-sm hover:preset-filled-error-500"
			onclick={close}
			aria-label="Close"
		>
			<X size={20} />
		</button>
	</header>

	<!-- Body -->
	<section class="card-body space-y-4">
		<!-- Source Settlement -->
		<div class="p-3 bg-surface-100 dark:bg-surface-800 rounded">
			<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">From Settlement</p>
			<p class="font-semibold">{fromSettlementName}</p>
		</div>

		<!-- Destination Settlement -->
		<div>
			<label for="destination" class="label">
				<span>Destination Settlement</span>
			</label>
			<select
				id="destination"
				class="select"
				bind:value={selectedSettlementId}
				disabled={isSubmitting}
			>
				<option value="">Select a settlement...</option>
				{#each availableSettlements as settlement}
					{#if settlement.id !== fromSettlementId}
						<option value={settlement.id}>{settlement.name}</option>
					{/if}
				{/each}
			</select>
		</div>

		<!-- Arrow Indicator -->
		{#if selectedSettlementId}
			<div class="flex items-center justify-center py-2">
				<ArrowRight size={24} class="text-primary-500" />
			</div>
			
			<div class="p-3 bg-primary-100 dark:bg-primary-900/30 rounded">
				<p class="text-sm text-surface-600 dark:text-surface-400 mb-1">To Settlement</p>
				<p class="font-semibold">
					{availableSettlements.find(s => s.id === selectedSettlementId)?.name || 'Unknown'}
				</p>
			</div>
		{/if}

		<!-- Resource Type -->
		<div>
			<label for="resourceType" class="label">
				<span>Resource Type</span>
			</label>
			<select
				id="resourceType"
				class="select"
				bind:value={selectedResourceType}
				disabled={isSubmitting}
			>
				{#each resourceTypes as resource}
					<option value={resource.value}>{resource.label}</option>
				{/each}
			</select>
			<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
				Available: {availableAmount.toLocaleString()}
			</p>
		</div>

		<!-- Amount -->
		<div>
			<label for="amount" class="label">
				<span>Amount</span>
			</label>
			<input
				id="amount"
				type="number"
				class="input"
				bind:value={amount}
				min="1"
				max={availableAmount}
				disabled={isSubmitting}
				placeholder="Enter amount to transfer"
			/>
			{#if amount > availableAmount}
				<p class="text-sm text-error-500 mt-1">
					Insufficient resources. You have {availableAmount} available.
				</p>
			{/if}
		</div>

		<!-- Info Box -->
		{#if amount > 0}
			<div class="alert preset-outlined-warning">
				<div class="alert-icon">
					<AlertCircle size={20} />
				</div>
				<div class="alert-message">
					<p class="text-sm">
						Resources will be deducted immediately from your settlement.
						Transport time and losses depend on distance between settlements.
						Active disasters may increase losses by up to 10%.
					</p>
				</div>
			</div>
		{/if}

		<!-- Error Message -->
		{#if errorMessage}
			<div class="alert preset-filled-error-500">
				<div class="alert-icon">
					<AlertCircle size={20} />
				</div>
				<div class="alert-message">
					<p class="font-semibold">Error</p>
					<p class="text-sm">{errorMessage}</p>
				</div>
			</div>
		{/if}
	</section>

	<!-- Footer -->
	<footer class="card-footer flex justify-end gap-2">
		<button
			type="button"
			class="btn preset-outlined"
			onclick={close}
			disabled={isSubmitting}
		>
			Cancel
		</button>
		<button
			type="button"
			class="btn preset-filled-primary"
			onclick={handleSubmit}
			disabled={!isValid || isSubmitting}
		>
			{#if isSubmitting}
				<span class="animate-pulse">Initiating Transfer...</span>
			{:else}
				Initiate Transfer
			{/if}
		</button>
	</footer>
</div>
