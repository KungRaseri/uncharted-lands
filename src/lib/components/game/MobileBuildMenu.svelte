<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { structures, type StructureType } from '$lib/game/structures';

	interface Props {
		open: boolean;
		onClose: () => void;
		settlementId: string;
	}

	let { open, onClose, settlementId }: Props = $props();

	// Group structures by category
	const structuresByCategory = $derived.by(() => {
		const categories: Record<string, typeof structures> = {};

		for (const [key, structure] of Object.entries(structures)) {
			if (key === null || key === 'null') continue; // Skip null keys
			const category = structure.category || 'Other';
			if (!categories[category]) {
				categories[category] = {};
			}
			categories[category][key as StructureType] = structure;
		}
		return categories;
	});

	let selectedCategory = $state<string>('EXTRACTOR');

	function handleBuild(structureType: StructureType) {
		// TODO: Call build API
		console.log('Building:', structureType, 'at settlement:', settlementId);
		onClose();
	}
</script>

<BottomSheet {open} {onClose} title="Build Structure" height="full">
	<!-- Category Tabs -->
	<div class="category-tabs" role="tablist" aria-label="Structure categories">
		{#each Object.keys(structuresByCategory) as category}
			<button
				class="category-tab"
				class:active={selectedCategory === category}
				onclick={() => (selectedCategory = category)}
				role="tab"
				aria-selected={selectedCategory === category}
				aria-controls="category-{category}"
				type="button"
			>
				{category}
			</button>
		{/each}
	</div>

	<!-- Structure Grid -->
	<div
		id="category-{selectedCategory}"
		class="structure-grid"
		role="tabpanel"
		aria-labelledby="category-{selectedCategory}"
	>
		{#each Object.entries(structuresByCategory[selectedCategory] || {}) as [key, structure]}
			<button
				class="structure-card"
				onclick={() => handleBuild(key as StructureType)}
				type="button"
			>
				<!-- Icon -->
				<div class="structure-icon">
					{structure.name.charAt(0)}
				</div>

				<!-- Info -->
				<div class="structure-info">
					<h3 class="structure-name">{structure.name}</h3>
					<p class="structure-cost">
						{#if structure.cost}
							{#each Object.entries(structure.cost) as [resource, amount]}
								<span class="cost-item">
									{amount}
									{resource}
								</span>
							{/each}
						{/if}
					</p>
				</div>

				<!-- Build Button -->
				<div class="build-action">
					<span class="build-icon">+</span>
				</div>
			</button>
		{/each}
	</div>
</BottomSheet>

<style>
	.category-tabs {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.5rem;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		scrollbar-width: none;
	}

	.category-tabs::-webkit-scrollbar {
		display: none;
	}

	.category-tab {
		flex-shrink: 0;
		padding: 0.75rem 1.5rem;
		background: rgb(var(--color-surface-200));
		border: none;
		border-radius: 2rem;
		font-size: 0.875rem;
		font-weight: 500;
		color: rgb(var(--color-surface-700));
		cursor: pointer;
		transition: all 0.2s;
		min-height: 44px;
	}

	.category-tab.active {
		background: rgb(var(--color-primary-500));
		color: white;
	}

	.category-tab:hover:not(.active) {
		background: rgb(var(--color-surface-300));
	}

	.category-tab:focus-visible {
		outline: 3px solid rgb(var(--color-primary-300));
		outline-offset: 2px;
	}

	.structure-grid {
		display: grid;
		gap: 1rem;
		grid-template-columns: 1fr;
	}

	.structure-card {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem;
		background: rgb(var(--color-surface-100));
		border: 1px solid rgb(var(--color-surface-200));
		border-radius: 0.75rem;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
		min-height: 80px;
	}

	.structure-card:hover {
		background: rgb(var(--color-surface-200));
		border-color: rgb(var(--color-primary-300));
		transform: translateY(-2px);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
	}

	.structure-card:active {
		transform: translateY(0);
	}

	.structure-card:focus-visible {
		outline: 3px solid rgb(var(--color-primary-300));
		outline-offset: 2px;
	}

	.structure-icon {
		flex-shrink: 0;
		width: 48px;
		height: 48px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgb(var(--color-primary-100));
		color: rgb(var(--color-primary-700));
		border-radius: 0.5rem;
		font-size: 1.5rem;
		font-weight: 700;
	}

	.structure-info {
		flex: 1;
		min-width: 0;
	}

	.structure-name {
		font-size: 1rem;
		font-weight: 600;
		margin: 0 0 0.25rem 0;
		color: rgb(var(--color-surface-900));
	}

	.structure-cost {
		margin: 0;
		font-size: 0.875rem;
		color: rgb(var(--color-surface-600));
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}

	.cost-item {
		background: rgb(var(--color-surface-200));
		padding: 0.125rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
	}

	.build-action {
		flex-shrink: 0;
		width: 44px;
		height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: rgb(var(--color-primary-500));
		color: white;
		border-radius: 50%;
		font-size: 1.5rem;
		font-weight: 700;
	}

	/* Dark mode */
	:global(.dark) .category-tab {
		background: rgb(var(--color-surface-800));
		color: rgb(var(--color-surface-300));
	}

	:global(.dark) .category-tab.active {
		background: rgb(var(--color-primary-500));
		color: white;
	}

	:global(.dark) .structure-card {
		background: rgb(var(--color-surface-800));
		border-color: rgb(var(--color-surface-700));
	}

	:global(.dark) .structure-card:hover {
		background: rgb(var(--color-surface-700));
	}

	:global(.dark) .structure-name {
		color: rgb(var(--color-surface-100));
	}

	:global(.dark) .cost-item {
		background: rgb(var(--color-surface-700));
	}
</style>
