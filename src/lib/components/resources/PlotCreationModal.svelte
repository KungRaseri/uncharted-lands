<script lang="ts">
	import type { Tile } from '$lib/types/game';
	import type { CreatePlotRequest } from '$lib/types/api';
	import TileResourceInfo from './TileResourceInfo.svelte';

	let {
		tile,
		isOpen = false,
		onClose,
		onCreatePlot
	}: {
		tile: Tile | null;
		isOpen?: boolean;
		onClose: () => void;
		onCreatePlot: (plotData: CreatePlotRequest) => Promise<void>;
	} = $props();

	// Form state
	let x = $state(0);
	let y = $state(0);
	let area = $state(100);
	let isCreating = $state(false);
	let error = $state<string | null>(null);

	// Get tile resource qualities for preview
	let tileInfo = $derived(() => {
		if (!tile) return null;

		return {
			foodQuality: tile.foodQuality || 0,
			woodQuality: tile.woodQuality || 0,
			stoneQuality: tile.stoneQuality || 0,
			oreQuality: tile.oreQuality || 0,
			plotSlots: tile.plotSlots || 1,
			specialResource: tile.specialResource
		};
	});

	// Calculate resource values based on area and quality
	let calculatedResources = $derived(() => {
		const info = tileInfo();
		if (!info) return null;

		// Simple calculation: (quality / 100) * area
		return {
			solar: Math.round((area / 100) * 50),
			wind: Math.round((area / 100) * 30),
			food: Math.round((info.foodQuality / 100) * area),
			water: Math.round(area * 0.5),
			wood: Math.round((info.woodQuality / 100) * area),
			stone: Math.round((info.stoneQuality / 100) * area),
			ore: Math.round((info.oreQuality / 100) * area)
		};
	});

	// Reset form when modal opens
	$effect(() => {
		if (isOpen && tile) {
			x = 0;
			y = 0;
			area = 100;
			error = null;
		}
	});

	async function handleSubmit() {
		if (!tile) return;

		isCreating = true;
		error = null;

		try {
			const resources = calculatedResources();
			if (!resources) {
				throw new Error('Could not calculate resources');
			}

			const plotData: CreatePlotRequest = {
				tileId: tile.id,
				x,
				y,
				area,
				solar: resources.solar,
				wind: resources.wind,
				food: resources.food,
				water: resources.water,
				wood: resources.wood,
				stone: resources.stone,
				ore: resources.ore
			};

			await onCreatePlot(plotData);
			onClose();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create plot';
		} finally {
			isCreating = false;
		}
	}

	function handleClose() {
		if (!isCreating) {
			onClose();
		}
	}
</script>

{#if isOpen && tile}
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
				<h2 class="text-2xl font-bold">Create New Plot</h2>
				<button
					class="btn-icon variant-filled"
					onclick={handleClose}
					disabled={isCreating}
					type="button"
					aria-label="Close"
				>
					✕
				</button>
			</div>

			<div class="mb-6">
				<h3 class="text-lg font-semibold mb-3">Tile Information</h3>
				<TileResourceInfo {tile} />
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handleSubmit();
				}}
				class="space-y-4"
			>
				<div class="grid grid-cols-2 gap-4">
					<label class="label">
						<span>X Coordinate</span>
						<input
							class="input"
							type="number"
							bind:value={x}
							min="0"
							max="100"
							required
							disabled={isCreating}
						/>
					</label>
					<label class="label">
						<span>Y Coordinate</span>
						<input
							class="input"
							type="number"
							bind:value={y}
							min="0"
							max="100"
							required
							disabled={isCreating}
						/>
					</label>
				</div>

				<label class="label">
					<span>Plot Area (units)</span>
					<input
						class="input"
						type="range"
						bind:value={area}
						min="50"
						max="500"
						step="10"
						disabled={isCreating}
					/>
					<div class="text-sm text-surface-600-300-token mt-1">
						{area} units (affects resource production)
					</div>
				</label>

				{#if calculatedResources()}
					{@const resources = calculatedResources()}
					{#if resources}
						<div class="variant-ghost-surface p-4 rounded-lg">
							<h4 class="font-semibold mb-2">Expected Resource Production</h4>
							<div class="grid grid-cols-2 gap-2 text-sm">
								{#if resources.food > 0}
									<div>🌾 Food: {resources.food}/day</div>
								{/if}
								{#if resources.water > 0}
									<div>💧 Water: {resources.water}/day</div>
								{/if}
								{#if resources.wood > 0}
									<div>🪵 Wood: {resources.wood}/day</div>
								{/if}
								{#if resources.stone > 0}
									<div>🪨 Stone: {resources.stone}/day</div>
								{/if}
								{#if resources.ore > 0}
									<div>⛏️ Ore: {resources.ore}/day</div>
								{/if}
								<div>☀️ Solar: {resources.solar}</div>
								<div>💨 Wind: {resources.wind}</div>
							</div>
							<p class="text-xs text-surface-500-400-token mt-2">
								* Production rates are estimates based on tile quality
							</p>
						</div>
					{/if}
				{/if}

				{#if error}
					<div class="alert variant-filled-error">
						<span>⚠️ {error}</span>
					</div>
				{/if}

				<div class="flex justify-end gap-3 pt-4">
					<button
						class="btn variant-ghost-surface"
						type="button"
						onclick={handleClose}
						disabled={isCreating}
					>
						Cancel
					</button>
					<button class="btn variant-filled-primary" type="submit" disabled={isCreating}>
						{#if isCreating}
							Creating...
						{:else}
							Create Plot
						{/if}
					</button>
				</div>
			</form>
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
		align-items: center;
		margin-bottom: 1.5rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid rgb(var(--color-surface-300) / 0.3);
	}

	:global(.dark) .modal-header {
		border-bottom-color: rgb(var(--color-surface-700) / 0.3);
	}
</style>
