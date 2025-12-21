<script lang="ts">
	import BottomSheet from '$lib/components/ui/BottomSheet.svelte';
	import type { StructureMetadata } from '$lib/api/structures';
	import { logger } from '$lib/utils/logger';

	interface Props {
		open: boolean;
		onClose: () => void;
		settlementId: string;
		structures: StructureMetadata[];
		currentAreaUsed?: number; // Current area used by settlement
		currentAreaCapacity?: number; // Current area capacity
		townHallLevel?: number; // Current Town Hall level
		existingStructures?: string[]; // Array of structure IDs already built (for unique check)
	}

	let {
		open,
		onClose,
		settlementId,
		structures,
		currentAreaUsed = 0,
		currentAreaCapacity = 500,
		townHallLevel = 0,
		existingStructures = []
	}: Props = $props();

	// Log prop changes
	$effect(() => {
		logger.debug('🔍 [MobileBuildMenu] Props changed:');
		logger.debug('  - open:', { open });
		logger.debug('  - settlementId:', { settlementId });
		logger.debug('  - structures count:', { count: structures.length });
		logger.debug('  - currentAreaUsed:', { currentAreaUsed });
		logger.debug('  - currentAreaCapacity:', { currentAreaCapacity });
		logger.debug('  - townHallLevel:', { townHallLevel });
		logger.debug('  - onClose exists:', { exists: !!onClose });
	});

	// Calculate available area
	const availableArea = $derived(currentAreaCapacity - currentAreaUsed);

	// Check if structure can be built
	function canBuildStructure(structure: StructureMetadata): boolean {
		// Check area constraint
		const areaCost = structure.areaCost ?? 0;
		if (areaCost > availableArea) return false;

		// Check Town Hall level requirement
		const minTH = structure.minTownHallLevel ?? 0;
		if (minTH > townHallLevel) return false;

		// Check unique constraint
		if (structure.unique && existingStructures.includes(structure.id)) return false;

		return true;
	}

	// Get constraint message for disabled structures
	function getConstraintMessage(structure: StructureMetadata): string {
		const areaCost = structure.areaCost ?? 0;
		const minTH = structure.minTownHallLevel ?? 0;

		if (areaCost > availableArea) {
			return `Insufficient area (need ${areaCost - availableArea} more)`;
		}

		if (minTH > townHallLevel) {
			return `Requires Town Hall Lv.${minTH}`;
		}

		if (structure.unique && existingStructures.includes(structure.id)) {
			return 'Already built (unique structure)';
		}

		return '';
	}

	// Filter to only show BUILDING category structures (extractors are built via ExtractorBuildModal)
	const structuresByCategory = $derived.by(() => {
		const categories: Record<string, StructureMetadata[]> = {};

		for (const structure of structures) {
			const category = structure.category || 'Other';
			// Only include non-EXTRACTOR categories
			if (category !== 'EXTRACTOR') {
				if (!categories[category]) {
					categories[category] = [];
				}
				categories[category].push(structure);
			}
		}
		return categories;
	});

	let selectedCategory = $state<string>('BUILDING');

	async function handleBuild(structure: StructureMetadata) {
		logger.debug('Building:', { structure: structure.displayName, settlementId });

		try {
			logger.debug('[MobileBuildMenu] Sending request:', {
				settlementId,
				structureId: structure.id
			});

			// ✅ FIX: Use SvelteKit form action instead of direct API call
			// This avoids cross-origin cookie issues with session authentication
			const formData = new FormData();
			formData.append('structureId', structure.id);

			const response = await fetch('?/buildStructure', {
				method: 'POST',
				body: formData,
				credentials: 'include' // Include session cookie
			});

			logger.debug('[MobileBuildMenu] Response status:', {
				status: response.status,
				statusText: response.statusText
			});

			const result = await response.json();

			if (!result.success && result.success !== undefined) {
				logger.error('[MobileBuildMenu] API Error Response:', { result });
				alert(result.message || 'Failed to create structure');
				return;
			}

			logger.debug('[MobileBuildMenu] Structure created successfully:', result);

			onClose();
		} catch (error) {
			logger.error('[MobileBuildMenu] Network error:', error);
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
				aria-selected={selectedCategory === category ? 'true' : 'false'}
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
		{#each structuresByCategory[selectedCategory] || [] as structure}
			{@const isAvailable = canBuildStructure(structure)}
			{@const constraintMsg = getConstraintMessage(structure)}
			{@const areaCost = structure.areaCost ?? 0}
			{@const minTH = structure.minTownHallLevel ?? 0}

			<button
				class="flex items-center gap-4 p-4 bg-surface-100 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-left transition-all duration-200 min-h-20
					{isAvailable
					? 'cursor-pointer hover:bg-surface-200 dark:hover:bg-surface-700 hover:border-primary-300 dark:hover:border-primary-600 hover:-translate-y-0.5 hover:shadow-md active:translate-y-0'
					: 'opacity-60 cursor-not-allowed'}
					focus-visible:outline-3 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-400 focus-visible:outline-offset-2"
				data-structure-id={structure.id}
				data-structure-name={structure.name}
				data-testid="build-structure-{structure.name.toLowerCase()}"
				onclick={() => isAvailable && handleBuild(structure)}
				disabled={!isAvailable}
				type="button"
			>
				<!-- Icon -->
				<div
					class="shrink-0 w-12 h-12 flex items-center justify-center rounded-lg text-2xl font-bold
						{isAvailable
						? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
						: 'bg-surface-300 dark:bg-surface-700 text-surface-500 dark:text-surface-500'}"
				>
					{structure.displayName.charAt(0)}
				</div>

				<!-- Info -->
				<div class="flex-1 min-w-0">
					<div class="flex items-center gap-2 mb-1">
						<h3 class="text-base font-semibold text-surface-900 dark:text-surface-100">
							{structure.displayName}
						</h3>
						{#if structure.unique}
							<span
								class="text-xs px-2 py-0.5 rounded-full bg-warning-200 dark:bg-warning-900 text-warning-700 dark:text-warning-300 font-medium"
								title="Unique building - only one per settlement"
							>
								⭐ Unique
							</span>
						{/if}
					</div>

					<!-- Resource Costs -->
					<div class="flex flex-wrap gap-2 mb-1">
						{#if structure.costs}
							{#each Object.entries(structure.costs) as [resource, amount]}
								{#if amount > 0}
									<span
										class="bg-surface-200 dark:bg-surface-700 px-2 py-0.5 rounded text-xs"
									>
										{amount}
										{resource}
									</span>
								{/if}
							{/each}
						{/if}
						{#if areaCost > 0}
							<span
								class="bg-primary-200 dark:bg-primary-900 text-primary-700 dark:text-primary-300 px-2 py-0.5 rounded text-xs font-medium"
							>
								📐 {areaCost} area
							</span>
						{/if}
					</div>

					<!-- Requirements & Constraints -->
					<div class="flex flex-wrap gap-2">
						{#if minTH > 0}
							<span
								class="text-xs px-2 py-0.5 rounded {minTH > townHallLevel
									? 'bg-error-200 dark:bg-error-900 text-error-700 dark:text-error-300'
									: 'bg-success-200 dark:bg-success-900 text-success-700 dark:text-success-300'}"
							>
								🏛️ TH Lv.{minTH}
							</span>
						{/if}
						{#if !isAvailable && constraintMsg}
							<span
								class="text-xs px-2 py-0.5 rounded bg-error-200 dark:bg-error-900 text-error-700 dark:text-error-300"
							>
								⚠️ {constraintMsg}
							</span>
						{/if}
					</div>
				</div>

				<!-- Build Button -->
				<div
					class="shrink-0 w-11 h-11 flex items-center justify-center rounded-full text-2xl font-bold
						{isAvailable
						? 'bg-primary-500 dark:bg-primary-600 text-white'
						: 'bg-surface-400 dark:bg-surface-600 text-surface-600 dark:text-surface-400'}"
				>
					<span class="build-icon">{isAvailable ? '+' : '🚫'}</span>
				</div>
			</button>
		{/each}
	</div>
</BottomSheet>
