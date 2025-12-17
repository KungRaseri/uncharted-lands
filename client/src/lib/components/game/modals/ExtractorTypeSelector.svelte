<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import type { StructureMetadata } from '$lib/api/structures';
	import { getExtractorIcon } from '$lib/utils/resource-production';

	/**
	 * ExtractorTypeSelector Modal
	 *
	 * Modal for selecting which type of extractor to build on a plot slot:
	 * - Shows all extractor types with resource quality heatmap colors
	 * - Green (high quality), Yellow (medium), Red (low quality)
	 * - Displays resource requirements and production info from database
	 * - Handles build action with actual structure IDs
	 */

	type ResourceQuality = {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};

	type Props = {
		open: boolean;
		tileId: string;
		slotPosition: number;
		resourceQuality: ResourceQuality;
		structures: StructureMetadata[]; // ✅ Structures from database
		onClose: () => void;
		onBuild: (tileId: string, slotPosition: number, structureId: string) => void; // ✅ Pass structureId instead of type
	};

	let {
		open = $bindable(),
		tileId,
		slotPosition,
		resourceQuality,
		structures,
		onClose,
		onBuild
	}: Props = $props();

	// Cache extractor icons (loaded async from server config)
	let extractorIcons = $state<Record<string, string>>({});

	// Load extractor icons for all extractors
	$effect(() => {
		if (!structures) return;

		const extractorTypes = new Set<string>();
		for (const structure of structures) {
			if (structure.category === 'EXTRACTOR' && structure.extractorType) {
				extractorTypes.add(structure.extractorType);
			}
		}

		// Load icon for each extractor type
		for (const extractorType of extractorTypes) {
			getExtractorIcon(extractorType).then((icon) => {
				extractorIcons[extractorType] = icon;
			});
		}
	});

	// Map extractor types to resource types (minimal local mapping until server provides this)
	function getExtractorResourceType(extractorType: string): string {
		const mapping: Record<string, string> = {
			FARM: 'FOOD',
			WELL: 'WATER',
			LUMBER_MILL: 'WOOD',
			QUARRY: 'STONE',
			MINE: 'ORE',
			FISHING_DOCK: 'FOOD',
			HUNTING_LODGE: 'FOOD',
			HERB_GARDEN: 'HERBS'
		};
		return mapping[extractorType] || 'FOOD';
	}

	// Format resource type for display (converts FOOD → Food)
	function formatResourceName(resourceType: string): string {
		return resourceType.charAt(0) + resourceType.slice(1).toLowerCase();
	}

	// ✅ Filter extractors from structure metadata
	const extractorStructures = $derived(
		structures
			.filter((s) => s.category === 'EXTRACTOR' && s.extractorType)
			.map((structure) => {
				const extractorType = structure.extractorType!;

				// Get icon from cached async data (with fallback)
				const icon = extractorIcons[extractorType] || '🏗️';

				// Get resource type mapping
				const resourceType = getExtractorResourceType(extractorType);
				const resourceKey = resourceType.toLowerCase() as keyof ResourceQuality;
				const quality = resourceQuality[resourceKey];

				return {
					...structure,
					icon, // Use cached icon from server config
					resourceType, // From local mapping
					produces: formatResourceName(resourceType), // Human-readable: FOOD → Food
					type: extractorType, // Add type field for compatibility
					quality,
					qualityColor: getQualityColor(quality),
					qualityLabel: getQualityLabel(quality)
				};
			})
	);

	// ✅ Sort by quality (best first)
	const sortedExtractors = $derived(
		[...extractorStructures].sort((a, b) => b.quality - a.quality)
	);

	// Get quality color based on resource quality (heatmap: green > yellow > red)
	function getQualityColor(quality: number): string {
		if (quality >= 70) return 'text-success-500'; // Green
		if (quality >= 40) return 'text-warning-500'; // Yellow
		return 'text-error-500'; // Red
	}

	// Get quality label
	function getQualityLabel(quality: number): string {
		if (quality >= 70) return 'Excellent';
		if (quality >= 40) return 'Moderate';
		return 'Poor';
	}

	function handleBuild(structureId: string) {
		onBuild(tileId, slotPosition, structureId); // ✅ FIXED: Pass structureId instead of type
		onClose();
	}

	function handleKeydown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}

	// Close on Escape key
	function handleEscape(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			onClose();
		}
	}
</script>

{#if open}
	<!-- Modal Backdrop -->
	<div
		class="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4"
		onclick={onClose}
		onkeydown={handleEscape}
		role="presentation"
		transition:fade={{ duration: 200 }}
	>
		<!-- Modal Content -->
		<div
			class="bg-white dark:bg-surface-900 rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-labelledby="extractor-selector-title"
			aria-modal="true"
			tabindex="-1"
			transition:fly={{ y: 50, duration: 300, easing: quintOut }}
		>
			<!-- Header -->
			<header class="flex items-center justify-between mb-6">
				<div>
					<h3
						id="extractor-selector-title"
						class="text-2xl font-bold text-surface-900 dark:text-surface-100"
					>
						Select Extractor Type
					</h3>
					<p class="text-sm text-surface-600 dark:text-surface-400 mt-1">
						Building in Slot {slotPosition}
					</p>
				</div>
				<button
					type="button"
					class="btn-icon btn-icon-sm variant-ghost-surface hover:variant-soft-error"
					onclick={onClose}
					aria-label="Close modal"
				>
					<span class="text-xl">✕</span>
				</button>
			</header>

			<!-- Extractor Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				{#each sortedExtractors as extractor (extractor.id)}
					<button
						type="button"
						data-structure-type={extractor.type}
						data-testid="extractor-option"
						class="p-4 text-left rounded-lg border-2 border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
						onclick={() => handleBuild(extractor.id)}
						onkeydown={(e) => handleKeydown(e, () => handleBuild(extractor.id))}
						transition:fade={{ duration: 200 }}
					>
						<!-- Extractor Header -->
						<div class="flex items-start gap-3 mb-2">
							<span class="text-3xl" role="img" aria-label={extractor.name}>
								{extractor.icon}
							</span>
							<div class="flex-1 min-w-0">
								<h4 class="font-semibold text-surface-900 dark:text-surface-100">
									{extractor.name}
								</h4>
								<p
									class="text-xs text-surface-600 dark:text-surface-400 line-clamp-2"
								>
									{extractor.description}
								</p>
							</div>
						</div>

						<!-- Quality Badge -->
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs text-surface-500 dark:text-surface-400"
								>Quality:</span
							>
							<span class={`text-sm font-semibold ${extractor.qualityColor}`}>
								{extractor.quality}% ({extractor.qualityLabel})
							</span>
						</div>

						<!-- Cost -->
						<div
							class="flex items-center gap-2 text-xs text-surface-600 dark:text-surface-400 mb-1"
						>
							<span>Cost:</span>
							<div class="flex items-center gap-1.5">
								{#if extractor.costs.wood}
									<span>🪵 {extractor.costs.wood}</span>
								{/if}
								{#if extractor.costs.stone}
									<span>🪨 {extractor.costs.stone}</span>
								{/if}
								{#if extractor.costs.ore}
									<span>⛏️ {extractor.costs.ore}</span>
								{/if}
							</div>
						</div>
						<!-- Produces -->
						<div class="flex items-center gap-2 text-xs">
							<span class="text-surface-500 dark:text-surface-400">Produces:</span>
							<span class="font-medium text-primary-600 dark:text-primary-400"
								>{extractor.produces}</span
							>
						</div>
					</button>
				{/each}
			</div>

			<!-- Footer -->
			<footer
				class="flex justify-end gap-2 mt-6 pt-4 border-t border-surface-300 dark:border-surface-600"
			>
				<button type="button" class="btn variant-ghost-surface" onclick={onClose}
					>Cancel</button
				>
			</footer>
		</div>
	</div>
{/if}
