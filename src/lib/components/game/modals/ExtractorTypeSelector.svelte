<script lang="ts">
	import { fade, fly } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	/**
	 * ExtractorTypeSelector Modal
	 *
	 * Modal for selecting which type of extractor to build on a plot slot:
	 * - Shows all extractor types with resource quality heatmap colors
	 * - Green (high quality), Yellow (medium), Red (low quality)
	 * - Displays resource requirements and production info
	 * - Handles build action
	 */

	type ExtractorType =
		| 'FARM'
		| 'WELL'
		| 'LUMBER_MILL'
		| 'QUARRY'
		| 'MINE'
		| 'FISHING_DOCK'
		| 'HUNTERS_LODGE'
		| 'HERB_GARDEN';

	type ResourceQuality = {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};

	type ExtractorDefinition = {
		type: ExtractorType;
		name: string;
		description: string;
		icon: string;
		resourceType: keyof ResourceQuality;
		cost: {
			wood?: number;
			stone?: number;
			ore?: number;
		};
		produces: string;
	};

	type Props = {
		open: boolean;
		tileId: string;
		slotPosition: number;
		resourceQuality: ResourceQuality;
		onClose: () => void;
		onBuild: (tileId: string, slotPosition: number, extractorType: ExtractorType) => void;
	};

	let {
		open = $bindable(),
		tileId,
		slotPosition,
		resourceQuality,
		onClose,
		onBuild
	}: Props = $props();

	// Extractor type definitions
	const extractorTypes: ExtractorDefinition[] = [
		{
			type: 'FARM',
			name: 'Farm',
			description: 'Cultivates crops for food production',
			icon: '🌾',
			resourceType: 'food',
			cost: { wood: 50, stone: 20 },
			produces: 'Food'
		},
		{
			type: 'WELL',
			name: 'Well',
			description: 'Extracts fresh water from underground',
			icon: '💧',
			resourceType: 'water',
			cost: { wood: 30, stone: 50 },
			produces: 'Water'
		},
		{
			type: 'LUMBER_MILL',
			name: 'Lumber Mill',
			description: 'Harvests and processes timber',
			icon: '🪵',
			resourceType: 'wood',
			cost: { wood: 20, stone: 30 },
			produces: 'Wood'
		},
		{
			type: 'QUARRY',
			name: 'Quarry',
			description: 'Extracts stone from the earth',
			icon: '🪨',
			resourceType: 'stone',
			cost: { wood: 40, stone: 10 },
			produces: 'Stone'
		},
		{
			type: 'MINE',
			name: 'Mine',
			description: 'Digs deep for valuable ores',
			icon: '⛏️',
			resourceType: 'ore',
			cost: { wood: 60, stone: 40 },
			produces: 'Ore'
		},
		{
			type: 'FISHING_DOCK',
			name: 'Fishing Dock',
			description: 'Catches fish from nearby waters',
			icon: '🎣',
			resourceType: 'food',
			cost: { wood: 80, stone: 20 },
			produces: 'Food'
		},
		{
			type: 'HUNTERS_LODGE',
			name: "Hunter's Lodge",
			description: 'Hunts game in nearby forests',
			icon: '🏹',
			resourceType: 'food',
			cost: { wood: 70, stone: 30 },
			produces: 'Food'
		},
		{
			type: 'HERB_GARDEN',
			name: 'Herb Garden',
			description: 'Grows medicinal and special herbs',
			icon: '🌿',
			resourceType: 'food', // Using food as proxy for herbs
			cost: { wood: 40, stone: 20 },
			produces: 'Herbs'
		}
	];

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

	// Get extractor with quality info
	const extractorsWithQuality = $derived(
		extractorTypes.map((ext) => ({
			...ext,
			quality: resourceQuality[ext.resourceType],
			qualityColor: getQualityColor(resourceQuality[ext.resourceType]),
			qualityLabel: getQualityLabel(resourceQuality[ext.resourceType])
		}))
	);

	// Sort by quality (best first)
	const sortedExtractors = $derived(
		[...extractorsWithQuality].sort((a, b) => b.quality - a.quality)
	);

	function handleBuild(extractorType: ExtractorType) {
		onBuild(tileId, slotPosition, extractorType);
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
		class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
		onclick={onClose}
		onkeydown={handleEscape}
		role="presentation"
		transition:fade={{ duration: 200 }}
	>
		<!-- Modal Content -->
		<div
			class="card variant-filled-surface p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => e.stopPropagation()}
			role="dialog"
			aria-labelledby="extractor-selector-title"
			aria-modal="true"
			tabindex="-1"
			transition:fly={{ y: 50, duration: 300, easing: quintOut }}
		>
			<!-- Header -->
			<header class="flex items-center justify-between mb-4">
				<div>
					<h3 id="extractor-selector-title" class="h4">Select Extractor Type</h3>
					<p class="text-sm text-surface-600-300-token mt-1">
						Building in Slot {slotPosition}
					</p>
				</div>
				<button
					type="button"
					class="btn-icon btn-icon-sm variant-soft"
					onclick={onClose}
					aria-label="Close modal"
				>
					<span class="text-xl">✕</span>
				</button>
			</header>

			<!-- Extractor Grid -->
			<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
				{#each sortedExtractors as extractor (extractor.type)}
					<button
						type="button"
						class="card variant-ghost p-4 text-left hover:variant-soft-primary transition-all"
						onclick={() => handleBuild(extractor.type)}
						onkeydown={(e) => handleKeydown(e, () => handleBuild(extractor.type))}
						transition:fade={{ duration: 200 }}
					>
						<!-- Extractor Header -->
						<div class="flex items-start gap-3 mb-2">
							<span class="text-3xl" role="img" aria-label={extractor.name}>
								{extractor.icon}
							</span>
							<div class="flex-1 min-w-0">
								<h4 class="font-semibold">{extractor.name}</h4>
								<p class="text-xs text-surface-600-300-token line-clamp-2">
									{extractor.description}
								</p>
							</div>
						</div>

						<!-- Quality Badge -->
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xs text-surface-500-400-token">Quality:</span>
							<span class={`text-sm font-semibold ${extractor.qualityColor}`}>
								{extractor.quality}% ({extractor.qualityLabel})
							</span>
						</div>

						<!-- Cost -->
						<div class="flex items-center gap-2 text-xs text-surface-600-300-token">
							<span>Cost:</span>
							<div class="flex items-center gap-1.5">
								{#if extractor.cost.wood}
									<span>🪵 {extractor.cost.wood}</span>
								{/if}
								{#if extractor.cost.stone}
									<span>🪨 {extractor.cost.stone}</span>
								{/if}
								{#if extractor.cost.ore}
									<span>⛏️ {extractor.cost.ore}</span>
								{/if}
							</div>
						</div>

						<!-- Produces -->
						<div class="flex items-center gap-2 text-xs mt-1">
							<span class="text-surface-500-400-token">Produces:</span>
							<span class="font-medium text-primary-500">{extractor.produces}</span>
						</div>
					</button>
				{/each}
			</div>

			<!-- Footer -->
			<footer class="flex justify-end gap-2 mt-4 pt-4 border-t border-surface-300-600-token">
				<button type="button" class="btn variant-soft" onclick={onClose}>Cancel</button>
			</footer>
		</div>
	</div>
{/if}

<style>
	/* Dark mode adjustments */
	:global(.dark) .card.variant-filled-surface {
		background: rgb(15, 23, 42);
	}

	:global(.dark) .card.variant-ghost {
		background: rgba(51, 65, 85, 0.3);
	}

	:global(.dark) .card.variant-ghost:hover {
		background: rgba(59, 130, 246, 0.2);
	}

	:global(.dark) .border-surface-300-600-token {
		border-color: rgb(71 85 105 / 0.5);
	}
</style>
