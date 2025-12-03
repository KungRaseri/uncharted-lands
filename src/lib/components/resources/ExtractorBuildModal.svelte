<script lang="ts">
	import type { TileWithRelations } from '$lib/types/api';
	import {
		getResourceIcon,
		getResourceName,
		getExtractorName
	} from '$lib/utils/resource-production';

	let {
		tile,
		isOpen = false,
		onClose,
		onBuildExtractor
	}: {
		tile: TileWithRelations;
		isOpen?: boolean;
		onClose: () => void;
		onBuildExtractor: (
			_tileId: string,
			_slotPosition: number,
			extractorType: string
		) => Promise<void>;
	} = $props();

	let isBuilding = $state(false);
	let selectedExtractor = $state<string | null>(null);
	let selectedSlotPosition = $state<number>(1); // Default to slot 1
	let error = $state<string | null>(null);

	// Calculate available slots (max 3 per tile)
	const maxSlots = 3;
	let usedSlots = $derived(tile.structures?.length || 0);
	let availableSlots = $derived(maxSlots - usedSlots);

	// Determine available extractors based on tile's resource potential
	let extractorOptions = $derived(() => {
		const options: Array<{
			type: string;
			resourceType: string;
			available: boolean;
			reason?: string;
		}> = [];

		// Food extractors
		if (tile.foodQuality > 0) {
			options.push({
				type: 'BASIC_FARM',
				resourceType: 'FOOD',
				available: true
			});
			if (tile.foodQuality >= 50) {
				options.push({
					type: 'ADVANCED_FARM',
					resourceType: 'FOOD',
					available: true
				});
			}
		} else {
			options.push({
				type: 'BASIC_FARM',
				resourceType: 'FOOD',
				available: false,
				reason: 'Insufficient food quality on this tile'
			});
		}

		// Water extractors
		if (tile.waterQuality > 0) {
			options.push({
				type: 'BASIC_WELL',
				resourceType: 'WATER',
				available: true
			});
		}

		// Wood extractors
		if (tile.woodQuality > 0) {
			options.push({
				type: 'BASIC_LUMBER_MILL',
				resourceType: 'WOOD',
				available: true
			});
		}

		// Stone extractors
		if (tile.stoneQuality > 0) {
			options.push({
				type: 'BASIC_QUARRY',
				resourceType: 'STONE',
				available: true
			});
		}

		// Ore extractors
		if (tile.oreQuality > 0) {
			options.push({
				type: 'BASIC_MINE',
				resourceType: 'ORE',
				available: true
			});
		}

		return options;
	});

	// Get cost for building extractor
	function getExtractorCost(extractorType: string): Record<string, number> {
		const isAdvanced = extractorType.includes('ADVANCED');
		return {
			WOOD: isAdvanced ? 200 : 100,
			STONE: isAdvanced ? 150 : 75,
			ORE: isAdvanced ? 100 : 50
		};
	}

	// Reset state when modal opens
	$effect(() => {
		if (isOpen) {
			selectedExtractor = null;
			selectedSlotPosition = usedSlots + 1; // Next available slot
			error = null;
		}
	});

	async function handleBuild() {
		if (!selectedExtractor) return;

		isBuilding = true;
		error = null;

		try {
			await onBuildExtractor(tile.id, selectedSlotPosition, selectedExtractor);
			onClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to build extractor';
		} finally {
			isBuilding = false;
		}
	}

	function handleClose() {
		if (!isBuilding) {
			onClose();
		}
	}
</script>

{#if isOpen}
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div class="modal-backdrop" onclick={handleClose} role="presentation">
		<div
			class="modal-content"
			onclick={(e) => e.stopPropagation()}
			role="dialog"
			aria-modal="true"
			tabindex="-1"
		>
			<div class="modal-header">
				<div>
					<h2 class="text-2xl font-bold">Build Extractor</h2>
					<p class="text-sm text-surface-600-300-token">
						Tile at ({tile.x}, {tile.y}) - Slots Used: {usedSlots} / {maxSlots}
					</p>
				</div>
				<button
					class="btn-icon variant-filled"
					onclick={handleClose}
					disabled={isBuilding}
					type="button"
					aria-label="Close"
				>
					✕
				</button>
			</div>

			{#if availableSlots === 0}
				<div class="alert variant-filled-error mb-4">
					<span>⚠️ No available slots on this tile. Maximum 3 extractors per tile.</span>
				</div>
			{/if}

			<div class="variant-ghost-surface p-4 rounded-lg mb-6">
				<h3 class="font-semibold mb-2">Tile Resource Quality</h3>
				<div class="grid grid-cols-2 gap-2 text-sm">
					{#if tile.foodQuality > 0}
						<div class="flex items-center gap-1">
							{#await getResourceIcon('FOOD') then icon}
								<span>{icon}</span>
							{/await}
							Food: {tile.foodQuality}%
						</div>
					{/if}
					{#if tile.waterQuality > 0}
						<div class="flex items-center gap-1">
							{#await getResourceIcon('WATER') then icon}
								<span>{icon}</span>
							{/await}
							Water: {tile.waterQuality}%
						</div>
					{/if}
					{#if tile.woodQuality > 0}
						<div class="flex items-center gap-1">
							{#await getResourceIcon('WOOD') then icon}
								<span>{icon}</span>
							{/await}
							Wood: {tile.woodQuality}%
						</div>
					{/if}
					{#if tile.stoneQuality > 0}
						<div class="flex items-center gap-1">
							{#await getResourceIcon('STONE') then icon}
								<span>{icon}</span>
							{/await}
							Stone: {tile.stoneQuality}%
						</div>
					{/if}
					{#if tile.oreQuality > 0}
						<div class="flex items-center gap-1">
							{#await getResourceIcon('ORE') then icon}
								<span>{icon}</span>
							{/await}
							Ore: {tile.oreQuality}%
						</div>
					{/if}
				</div>
			</div>

			<div class="space-y-3 mb-6">
				<h3 class="font-semibold">Select Extractor Type</h3>
				{#each extractorOptions() as option (option.type)}
					<button
						class="extractor-option"
						class:selected={selectedExtractor === option.type}
						class:disabled={!option.available}
						onclick={() => option.available && (selectedExtractor = option.type)}
						disabled={!option.available || isBuilding}
						type="button"
					>
						<div class="flex items-center gap-3 flex-1">
							{#await getResourceIcon(option.resourceType)}
								<span class="text-2xl">⏳</span>
							{:then icon}
								<span class="text-2xl">{icon}</span>
							{/await}
							<div class="text-left">
								{#await getExtractorName(option.type)}
									<div class="font-semibold">Loading...</div>
								{:then name}
									<div class="font-semibold">{name}</div>
								{/await}
								{#await getResourceName(option.resourceType)}
									<div class="text-sm text-surface-600-300-token">...</div>
								{:then resourceName}
									<div class="text-sm text-surface-600-300-token">
										Produces {resourceName}
									</div>
								{/await}
								{#if !option.available && option.reason}
									<div class="text-xs text-error-500">{option.reason}</div>
								{/if}
							</div>
						</div>
						{#if selectedExtractor === option.type}
							<span class="text-success-500">✓</span>
						{/if}
					</button>
				{/each}
			</div>

			{#if selectedExtractor}
				{@const cost = getExtractorCost(selectedExtractor)}
				<div class="variant-ghost-surface p-4 rounded-lg mb-6">
					<h4 class="font-semibold mb-2">Build Cost</h4>
					<div class="grid grid-cols-3 gap-2">
						{#each Object.entries(cost) as [resource, amount]}
							<div class="flex items-center gap-1 text-sm">
								{#await getResourceIcon(resource)}
									<span>⏳</span>
								{:then icon}
									<span>{icon}</span>
								{/await}
								{amount}
							</div>
						{/each}
					</div>
				</div>
			{/if}

			{#if error}
				<div class="alert variant-filled-error mb-4">
					<span>⚠️ {error}</span>
				</div>
			{/if}

			<div class="flex justify-end gap-3">
				<button
					class="btn variant-ghost-surface"
					type="button"
					onclick={handleClose}
					disabled={isBuilding}
				>
					Cancel
				</button>
				<button
					class="btn variant-filled-primary"
					type="button"
					onclick={handleBuild}
					disabled={!selectedExtractor || isBuilding}
				>
					{#if isBuilding}
						Building...
					{:else}
						Build Extractor
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-backdrop {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
		backdrop-filter: blur(4px);
	}

	.modal-content {
		background: rgb(var(--color-surface-50));
		border-radius: var(--theme-rounded-container);
		padding: 2rem;
		max-width: 600px;
		width: 100%;
		max-height: 90vh;
		overflow-y: auto;
		box-shadow: var(--shadow-xl);
	}

	:global(.dark) .modal-content {
		background: rgb(var(--color-surface-900));
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: start;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgb(var(--color-surface-300) / 0.3);
	}

	:global(.dark) .modal-header {
		border-bottom-color: rgb(var(--color-surface-700) / 0.3);
	}

	.extractor-option {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1rem;
		border: 2px solid rgb(var(--color-surface-300));
		border-radius: var(--theme-rounded-base);
		background: rgb(var(--color-surface-50));
		cursor: pointer;
		transition: all 0.2s ease;
	}

	:global(.dark) .extractor-option {
		background: rgb(var(--color-surface-800));
		border-color: rgb(var(--color-surface-600));
	}

	.extractor-option:hover:not(.disabled) {
		border-color: rgb(var(--color-primary-500));
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}

	.extractor-option.selected {
		border-color: rgb(var(--color-primary-500));
		background: rgb(var(--color-primary-50));
	}

	:global(.dark) .extractor-option.selected {
		background: rgb(var(--color-primary-900) / 0.3);
	}

	.extractor-option.disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
