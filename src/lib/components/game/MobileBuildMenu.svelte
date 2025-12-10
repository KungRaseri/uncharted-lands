<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import { structures, type StructureType } from '$lib/game/structures';
	import { PUBLIC_API_URL } from '$env/static/public';

	interface Props {
		open: boolean;
		onClose: () => void;
		settlementId: string;
	}

	let { open, onClose, settlementId }: Props = $props();

	// Log prop changes
	$effect(() => {
		console.log('🔍 [MobileBuildMenu] Props changed:');
		console.log('  - open:', open);
		console.log('  - settlementId:', settlementId);
		console.log('  - onClose exists:', !!onClose);
	});

	// Group structures by category
	const structuresByCategory = $derived.by(() => {
		const categories: Record<string, typeof structures> = {};

		for (const [key, structure] of Object.entries(structures)) {
			if (!key || key === 'null') continue; // Skip null/undefined keys
			const category = structure.category || 'Other';
			const structureKey = key as Exclude<StructureType, null>; // Exclude null from type
			if (!category) continue; // Skip if category is somehow null
			if (!categories[category]) {
				categories[category] = {};
			}
			// Type assertion needed because TS doesn't recognize the null check above
			const categoryMap = categories[category]!;
			categoryMap[structureKey] = structure;
		}
		return categories;
	});

	let selectedCategory = $state<string>('EXTRACTOR');

	async function handleBuild(structureType: StructureType) {
		console.log('Building:', structureType, 'at settlement:', settlementId);

		try {
			const response = await fetch(`${PUBLIC_API_URL}/structures/create`, {
				method: 'POST',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					settlementId,
					structureName: structureType
				})
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('[MobileBuildMenu] Failed to create structure:', error);
				alert(error.error || 'Failed to create structure');
				return;
			}

			console.log('[MobileBuildMenu] Structure created successfully');

			onClose();
		} catch (error) {
			console.error('[MobileBuildMenu] Failed to create structure:', error);
			alert('Network error - could not create structure');
		}
	}
</script>

<BottomSheet {open} {onClose} title="Build Structure" height="full">
	<!-- Category Tabs -->
	<div
		class="flex gap-2 mb-6 overflow-x-auto touch-pan-x scrollbar-hide"
		role="tablist"
		aria-label="Structure categories"
	>
		{#each Object.keys(structuresByCategory) as category}
			<button
				class="shrink-0 px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 min-h-11
					{selectedCategory === category
					? 'bg-primary-500 dark:bg-primary-600 text-white'
					: 'bg-surface-200 dark:bg-surface-800 text-surface-700 dark:text-surface-300 hover:bg-surface-300 dark:hover:bg-surface-700'}
					focus-visible:outline-3 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-400 focus-visible:outline-offset-2"
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
		class="grid gap-4 grid-cols-1"
		role="tabpanel"
		aria-labelledby="category-{selectedCategory}"
	>
		{#each Object.entries(structuresByCategory[selectedCategory] || {}) as [key, structure]}
			<button
				class="flex items-center gap-4 p-4 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-left cursor-pointer transition-all duration-200 min-h-20
					hover:bg-surface-200 dark:hover:bg-surface-700 hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-0.5 hover:shadow-md
					active:translate-y-0
					focus-visible:outline-3 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-400 focus-visible:outline-offset-2"
				data-structure-type={key}
				onclick={() => handleBuild(key as StructureType)}
				type="button"
			>
				<!-- Icon -->
				<div
					class="shrink-0 w-12 h-12 flex items-center justify-center bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg text-2xl font-bold"
				>
					{structure.name.charAt(0)}
				</div>

				<!-- Info -->
				<div class="flex-1 min-w-0">
					<h3 class="text-base font-semibold mb-1 text-surface-900 dark:text-surface-100">
						{structure.name}
					</h3>
					<p class="m-0 text-sm text-surface-600 dark:text-surface-400 flex flex-wrap gap-2">
						{#if structure.cost}
							{#each Object.entries(structure.cost) as [resource, amount]}
								<span class="bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded text-xs">
									{amount}
									{resource}
								</span>
							{/each}
						{/if}
					</p>
				</div>

				<!-- Build Button -->
				<div
					class="shrink-0 w-11 h-11 flex items-center justify-center bg-primary-500 dark:bg-primary-600 text-white rounded-full text-2xl font-bold"
				>
					<span class="build-icon">+</span>
				</div>
			</button>
		{/each}
	</div>
</BottomSheet>
