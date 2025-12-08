<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';

	/**
	 * ExtractorsGridPanel Component
	 *
	 * Displays settlement extractors grouped by tile in a grid layout with:
	 * - Tile grouping (one section per tile)
	 * - Slot usage display (X/Y slots used per tile)
	 * - Extractor cards with name, level, health bars
	 * - Action buttons (upgrade, repair, demolish)
	 * - Production rate display
	 * - Accessibility features (keyboard navigation, ARIA)
	 */

	interface Extractor {
		id: string;
		structureId: string;
		name: string;
		description: string;
		level: number;
		maxLevel: number;
		health: number;
		tileId: string | null;
		slotPosition: number | null;
		buildingType: string | null;
	}

	interface Props {
		extractorsByTile: Record<string, Extractor[]>;
		totalSlotsPerTile?: number; // Default to 5 if not provided
		settlementId: string;
		onUpgrade?: (extractorId: string) => void;
		onRepair?: (extractorId: string) => void;
		onDemolish?: (extractorId: string) => void;
	}

	let {
		extractorsByTile = {},
		totalSlotsPerTile = 5,
		settlementId,
		onUpgrade,
		onRepair,
		onDemolish
	}: Props = $props();

	// Compute tile stats
	const tileIds = $derived(Object.keys(extractorsByTile));
	const totalExtractors = $derived(
		Object.values(extractorsByTile).reduce((sum, extractors) => sum + extractors.length, 0)
	);

	function getSlotsUsed(tileId: string): number {
		return extractorsByTile[tileId]?.length ?? 0;
	}

	function getSlotUsageText(tileId: string): string {
		const used = getSlotsUsed(tileId);
		return `${used}/${totalSlotsPerTile} slots used`;
	}

	function getSlotUsageColor(tileId: string): string {
		const used = getSlotsUsed(tileId);
		const percentage = (used / totalSlotsPerTile) * 100;
		if (percentage >= 100) return 'text-error-500';
		if (percentage >= 80) return 'text-warning-500';
		return 'text-success-500';
	}

	function getHealthColor(health: number): string {
		if (health >= 80) return 'text-success-500';
		if (health >= 60) return 'text-warning-500';
		if (health >= 40) return 'text-warning-700';
		return 'text-error-500';
	}

	function getHealthLabel(health: number): string {
		if (health >= 95) return 'Pristine';
		if (health >= 80) return 'Excellent';
		if (health >= 60) return 'Good';
		if (health >= 40) return 'Damaged';
		if (health >= 20) return 'Poor';
		if (health > 0) return 'Critical';
		return 'Destroyed';
	}

	function canUpgrade(extractor: Extractor): boolean {
		return extractor.level < extractor.maxLevel && extractor.health > 0;
	}

	function needsRepair(extractor: Extractor): boolean {
		return extractor.health < 100;
	}

	function handleKeydown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}
</script>

<section class="card variant-glass-surface p-4 space-y-4" aria-labelledby="extractors-heading">
	<header class="flex items-center justify-between">
		<h3 id="extractors-heading" class="h4">
			Extractors ({totalExtractors})
		</h3>
		<p class="text-sm text-surface-600-300-token">Resource production facilities</p>
	</header>

	{#if tileIds.length === 0}
		<div class="text-center py-8 text-surface-500-400-token" role="status" aria-live="polite">
			<p class="text-lg">No extractors yet</p>
			<p class="text-sm">Build extractors on resource tiles to start production</p>
		</div>
	{:else}
		<div class="space-y-6" role="list">
			{#each tileIds as tileId (tileId)}
				<article
					class="card variant-soft p-4 space-y-3"
					transition:slide={{ duration: 300, easing: quintOut }}
				>
					<!-- Tile Header -->
					<header
						class="flex items-center justify-between border-b border-surface-300-600-token pb-2"
					>
						<div>
							<h4 class="font-semibold">Tile {tileId.slice(0, 8)}...</h4>
							<p class="text-xs text-surface-500-400-token mt-1">
								{getSlotsUsed(tileId)} extractor{getSlotsUsed(tileId) !== 1 ? 's' : ''}
							</p>
						</div>
						<div class="text-right">
							<p class={`text-sm font-medium ${getSlotUsageColor(tileId)}`}>
								{getSlotUsageText(tileId)}
							</p>
							<p class="text-xs text-surface-500-400-token mt-1">
								{totalSlotsPerTile - getSlotsUsed(tileId)} available
							</p>
						</div>
					</header>

					<!-- Extractors Grid -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each extractorsByTile[tileId] as extractor (extractor.id)}
							<div class="card variant-ghost p-3 space-y-2" transition:fade={{ duration: 200 }}>
								<!-- Extractor Header -->
								<div class="flex items-start justify-between gap-2">
									<div class="flex-1 min-w-0">
										<h5 class="font-medium text-sm truncate">
											{extractor.name}
										</h5>
										<p class="text-xs text-surface-600-300-token">
											Slot {extractor.slotPosition} • Level {extractor.level}/{extractor.maxLevel}
										</p>
									</div>

									<!-- Health Badge -->
									<div
										class="flex items-center gap-1 shrink-0"
										title="Structure health: {extractor.health}%"
									>
										<span class={`text-xs ${getHealthColor(extractor.health)}`}>
											{extractor.health}%
										</span>
									</div>
								</div>

								<!-- Health Bar -->
								<div class="w-full bg-surface-300-600-token rounded-full h-1.5">
									<div
										class="h-1.5 rounded-full transition-all duration-300 {getHealthColor(
											extractor.health
										).replace('text-', 'bg-')}"
										style="width: {extractor.health}%"
										role="progressbar"
										aria-valuenow={extractor.health}
										aria-valuemin={0}
										aria-valuemax={100}
										aria-label="Structure health: {extractor.health}%"
									></div>
								</div>

								<!-- Description -->
								<p class="text-xs text-surface-600-300-token line-clamp-2">
									{extractor.description}
								</p>

								<!-- Action Buttons -->
								<div class="flex gap-1.5 pt-1">
									{#if canUpgrade(extractor)}
										<button
											type="button"
											class="btn btn-sm variant-soft-primary flex-1 text-xs"
											onclick={() => onUpgrade?.(extractor.id)}
											onkeydown={(e) => handleKeydown(e, () => onUpgrade?.(extractor.id))}
											aria-label="Upgrade {extractor.name} to level {extractor.level + 1}"
										>
											Upgrade
										</button>
									{/if}

									{#if needsRepair(extractor)}
										<button
											type="button"
											class="btn btn-sm variant-soft-warning flex-1 text-xs"
											onclick={() => onRepair?.(extractor.id)}
											onkeydown={(e) => handleKeydown(e, () => onRepair?.(extractor.id))}
											aria-label="Repair {extractor.name} to 100% health"
										>
											Repair
										</button>
									{/if}

									<button
										type="button"
										class="btn btn-sm variant-soft-error flex-1 text-xs"
										onclick={() => onDemolish?.(extractor.id)}
										onkeydown={(e) => handleKeydown(e, () => onDemolish?.(extractor.id))}
										aria-label="Demolish {extractor.name}"
									>
										Demolish
									</button>
								</div>
							</div>
						{/each}
					</div>
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	/* Dark mode adjustments */
	:global(.dark) .card.variant-glass-surface {
		background: rgba(15, 23, 42, 0.8);
		backdrop-filter: blur(10px);
	}

	:global(.dark) .card.variant-soft {
		background: rgba(30, 41, 59, 0.5);
	}

	:global(.dark) .card.variant-ghost {
		background: rgba(51, 65, 85, 0.3);
	}

	:global(.dark) .border-surface-300-600-token {
		border-color: rgb(71 85 105 / 0.5);
	}
</style>
