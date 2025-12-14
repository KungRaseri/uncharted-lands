<script lang="ts">
	import { fade, slide } from 'svelte/transition';
	import { quintOut } from 'svelte/easing';
	import { getBiomeColor } from '$lib/config/biomes';

	/**
	 * ExtractorsGridPanel Component
	 *
	 * Displays settlement extractors grouped by tile in a grid layout with:
	 * - Tile grouping (one section per tile)
	 * - 5-slot grid visualization (filled vs empty slots)
	 * - Tile context (coordinates, biome, resource qualities)
	 * - Extractor cards with name, level, health bars
	 * - Action buttons (upgrade, repair, demolish, build)
	 * - Accessibility features (keyboard navigation, ARIA)
	 */

	interface Tile {
		id: string;
		xCoord: number;
		yCoord: number;
		biome: string;
		foodQuality: number;
		woodQuality: number;
		stoneQuality: number;
		oreQuality: number;
	}

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
		tiles?: Map<string, Tile> | Record<string, Tile>; // Tile data for context (optional)
		totalSlotsPerTile?: number; // Default to 5 if not provided
		settlementId: string;
		onUpgrade?: (extractorId: string) => void;
		onRepair?: (extractorId: string) => void;
		onDemolish?: (extractorId: string) => void;
		onBuildExtractor?: (tileId: string, slotPosition: number) => void;
	}

	let {
		extractorsByTile = {},
		tiles,
		totalSlotsPerTile = 5,
		settlementId,
		onUpgrade,
		onRepair,
		onDemolish,
		onBuildExtractor
	}: Props = $props();

	// Compute tile stats
	const tileIds = $derived(Object.keys(extractorsByTile));
	const totalExtractors = $derived(
		Object.values(extractorsByTile).reduce((sum, extractors) => sum + extractors.length, 0)
	);

	// Utility to get tile data (handles both Map and Record)
	function getTile(tileId: string): Tile | undefined {
		if (!tiles) return undefined;
		if (tiles instanceof Map) {
			return tiles.get(tileId);
		}
		return tiles[tileId];
	}

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

	// Create array of slot positions (0-4) for visualization
	function getSlotArray(): number[] {
		return Array.from({ length: totalSlotsPerTile }, (_, i) => i);
	}

	// Check if a slot is filled
	function isSlotFilled(tileId: string, slotPosition: number): boolean {
		const extractors = extractorsByTile[tileId] ?? [];
		return extractors.some((e) => e.slotPosition === slotPosition);
	}

	// Get extractor in a specific slot
	function getExtractorInSlot(tileId: string, slotPosition: number): Extractor | undefined {
		const extractors = extractorsByTile[tileId] ?? [];
		return extractors.find((e) => e.slotPosition === slotPosition);
	}

	// Resource quality color coding
	function getQualityColor(quality: number): string {
		if (quality >= 80) return 'text-success-500';
		if (quality >= 60) return 'text-primary-500';
		if (quality >= 40) return 'text-warning-500';
		return 'text-error-500';
	}

	// NOTE: getBiomeColor is now imported from $lib/config/biomes.ts

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
					<!-- Tile Header with Enhanced Context -->
					<header class="flex flex-col gap-3 border-b border-surface-300-600-token pb-3">
						<!-- Top Row: Tile ID + Slot Usage -->
						<div class="flex items-center justify-between">
							<div>
								<h4 class="font-semibold">Tile {tileId.slice(0, 8)}...</h4>
								{#if getTile(tileId)}
									{@const tile = getTile(tileId)!}
									<p class="text-xs text-surface-500-400-token mt-0.5">
										📍 ({tile.xCoord}, {tile.yCoord})
									</p>
								{/if}
							</div>
							<div class="text-right">
								<p class={`text-sm font-medium ${getSlotUsageColor(tileId)}`}>
									{getSlotUsageText(tileId)}
								</p>
								<p class="text-xs text-surface-500-400-token mt-1">
									{totalSlotsPerTile - getSlotsUsed(tileId)} available
								</p>
							</div>
						</div>

						<!-- Biome + Resource Qualities -->
						{#if getTile(tileId)}
							{@const tile = getTile(tileId)!}
							<div class="flex flex-wrap items-center gap-2">
								<!-- Biome Badge -->
								<span class="badge {getBiomeColor(tile.biome)} text-xs">
									{tile.biome}
								</span>

								<!-- Resource Quality Badges -->
								<div class="flex items-center gap-1.5 text-xs">
									<span class={getQualityColor(tile.foodQuality)} title="Food Quality">
										🌾 {tile.foodQuality}
									</span>
									<span class={getQualityColor(tile.woodQuality)} title="Wood Quality">
										🪵 {tile.woodQuality}
									</span>
									<span class={getQualityColor(tile.stoneQuality)} title="Stone Quality">
										🪨 {tile.stoneQuality}
									</span>
									<span class={getQualityColor(tile.oreQuality)} title="Ore Quality">
										⛏️ {tile.oreQuality}
									</span>
								</div>
							</div>
						{/if}

						<!-- 5-Slot Grid Visualization -->
						<div class="flex gap-2" role="list" aria-label="Tile slots">
							{#each getSlotArray() as slotPosition}
								{#if isSlotFilled(tileId, slotPosition)}
									{@const extractor = getExtractorInSlot(tileId, slotPosition)}
									{#if extractor}
										<div
											class="flex-1 card variant-ghost-primary p-2 text-center"
											title="Slot {slotPosition}: {extractor.name} (Level {extractor.level})"
											role="listitem"
										>
											<p class="text-xs font-medium">Slot {slotPosition}</p>
											<p class="text-[10px] text-success-500 mt-0.5">
												{extractor.name.split(' ')[0]}
											</p>
										</div>
									{/if}
								{:else}
									<button
										type="button"
										class="flex-1 card variant-ghost p-2 text-center hover:variant-soft-surface transition-colors"
										onclick={() => onBuildExtractor?.(tileId, slotPosition)}
										onkeydown={(e) =>
											handleKeydown(e, () => onBuildExtractor?.(tileId, slotPosition))}
										title="Build extractor in slot {slotPosition}"
										aria-label="Build extractor in slot {slotPosition}"
									>
										<p class="text-xs text-surface-500-400-token">Slot {slotPosition}</p>
										<p class="text-[10px] text-primary-500 mt-0.5">+ Build</p>
									</button>
								{/if}
							{/each}
						</div>
					</header>

					<!-- Extractors Grid -->
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
						{#each extractorsByTile[tileId] as extractor (extractor.id)}
							<div
								data-testid="structure"
								class="card variant-ghost p-3 space-y-2"
								transition:fade={{ duration: 200 }}
							>
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
