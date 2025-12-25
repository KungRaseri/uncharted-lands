<script lang="ts">
	import { logger } from '$lib/utils/logger';
	import type { TileWithRelations } from '@uncharted-lands/shared';
	import { fade } from 'svelte/transition';

	/**
	 * TilePlotsPanel Component
	 *
	 * Displays the plot slots for a settlement's founding tile:
	 * - Horizontal row of plotSlots (5 by default, but uses actual tile value)
	 * - Shows occupied slots with extractor info
	 * - Shows empty slots with "+" button to build
	 * - Opens ExtractorTypeSelector modal when clicking empty slot
	 */

	type Tile = {
		id: string;
		xCoord: number;
		yCoord: number;
		biome: any;
		foodQuality: number;
		waterQuality: number;
		woodQuality: number;
		stoneQuality: number;
		oreQuality: number;
		plotSlots: number;
	};

	type Extractor = {
		id: string;
		structureId: string;
		name: string;
		level: number;
		health: number;
		tileId: string | null;
		slotPosition: number | null;
		extractorType: string | null;
	};

	type QueuedConstruction = {
		tileId: string | null;
		slotPosition: number | null;
		structureType: string;
		status: string;
	};

	type Props = {
		tile: TileWithRelations;
		extractors: Extractor[]; // Extractors on this tile
		constructionQueue?: QueuedConstruction[];
		onBuildExtractor?: (tileId: string, slotPosition: number) => void;
		onSelectExtractor?: (extractorId: string) => void;
	};

	let { tile, extractors = [], constructionQueue = [], onBuildExtractor, onSelectExtractor }: Props = $props();

	// ✅ DEBUG: Log when component renders
	$effect(() => {
		logger.debug('[TilePlotsPanel] Component rendering with:', {
			tile,
			extractorsCount: extractors.length,
			plotSlots: tile.plotSlots
		});
	});

	// Create array of slot positions based on tile's plotSlots
	const slots = $derived(Array.from({ length: tile.plotSlots }, (_, i) => i));

	// Get extractor in a specific slot
	function getExtractorInSlot(slotPosition: number): Extractor | undefined {
		return extractors.find((e) => e.slotPosition === slotPosition);
	}

	// Check if slot is occupied
	function isSlotOccupied(slotPosition: number): boolean {
		return extractors.some((e) => e.slotPosition === slotPosition);
	}

	// Check if slot is reserved by a queued construction
	function isSlotReserved(slotPosition: number): boolean {
		return constructionQueue.some(
			(item) =>
				item.tileId === tile.id &&
				item.slotPosition === slotPosition &&
				item.status !== 'COMPLETE' &&
				item.status !== 'CANCELLED'
		);
	}

	// Get resource icon and color for extractor type
	function getResourceInfo(extractorType: string | null): {
		icon: string;
		color: string;
		name: string;
	} {
		const resourceMap: Record<string, { icon: string; color: string; name: string }> = {
			FARM: { icon: '🌾', color: 'text-success-500', name: 'Food' },
			WELL: { icon: '💧', color: 'text-primary-500', name: 'Water' },
			LUMBER_MILL: { icon: '🪵', color: 'text-warning-700', name: 'Wood' },
			QUARRY: { icon: '🪨', color: 'text-surface-500', name: 'Stone' },
			MINE: { icon: '⛏️', color: 'text-warning-500', name: 'Ore' },
			FISHING_DOCK: { icon: '🎣', color: 'text-primary-400', name: 'Food' },
			HUNTING_LODGE: { icon: '🏹', color: 'text-error-500', name: 'Food' },
			HERB_GARDEN: { icon: '🌿', color: 'text-tertiary-500', name: 'Herbs' }
		};
		return (
			resourceMap[extractorType || ''] || {
				icon: '❓',
				color: 'text-surface-400',
				name: 'Unknown'
			}
		);
	}

	// Health color for extractor
	function getHealthColor(health: number): string {
		if (health >= 80) return 'text-success-500';
		if (health >= 60) return 'text-warning-500';
		if (health >= 40) return 'text-warning-700';
		return 'text-error-500';
	}

	function handleKeydown(event: KeyboardEvent, action: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			action();
		}
	}
</script>

<section
	class="card variant-glass-surface p-4 space-y-3"
	aria-labelledby="tile-plots-heading"
	transition:fade={{ duration: 200 }}
>
	<header class="flex items-center justify-between">
		<div>
			<h3 id="tile-plots-heading" class="h5 flex items-center gap-2">
				<span>Plot Slots</span>
				<span class="badge variant-soft text-xs">{tile.biome?.name}</span>
			</h3>
			<p class="text-xs text-surface-600-300-token mt-1">
				📍 Tile ({tile.xCoord}, {tile.yCoord}) • {extractors.length}/{tile.plotSlots} occupied
			</p>
		</div>
	</header>

	<!-- Horizontal Plot Slots -->
	<div class="flex gap-3" role="list" aria-label="Plot slots">
		{#each slots as slotPosition (slotPosition)}
			{@const extractor = getExtractorInSlot(slotPosition)}
			{@const isOccupied = isSlotOccupied(slotPosition)}
			{@const reserved = isSlotReserved(slotPosition)}

			{#if isOccupied && extractor}
				<!-- Occupied Slot: Show extractor -->
				<button
					type="button"
					class="flex-1 card variant-soft-primary p-3 hover:variant-filled-primary transition-all"
					onclick={() => onSelectExtractor?.(extractor.id)}
					onkeydown={(e) => handleKeydown(e, () => onSelectExtractor?.(extractor.id))}
					aria-label="Slot {slotPosition}: {extractor.name} - Click for details"
					transition:fade={{ duration: 200 }}
				>
					<div class="flex flex-col items-center gap-1.5">
						<!-- Resource Icon -->
						<span
							class="text-3xl"
							role="img"
							aria-label={getResourceInfo(extractor.extractorType).name}
						>
							{getResourceInfo(extractor.extractorType).icon}
						</span>

						<!-- Extractor Name -->
						<p class="text-xs font-medium text-center line-clamp-1">
							{extractor.name.split(' ')[0]}
						</p>

						<!-- Level & Health -->
						<div class="flex items-center gap-2 text-[10px]">
							<span class="text-surface-600-300-token">Lv.{extractor.level}</span>
							<span class={getHealthColor(extractor.health)}>{extractor.health}%</span
							>
						</div>

						<!-- Slot Number -->
						<span class="text-[10px] text-surface-500-400-token"
							>Slot {slotPosition}</span
						>
					</div>
				</button>
			{:else if reserved}
				<!-- Reserved Slot: Show locked state -->
				<div
					class="flex-1 card variant-soft-warning border-2 border-warning-400 dark:border-warning-500 p-3 opacity-70 cursor-not-allowed"
					role="button"
					aria-label="Slot {slotPosition}: Reserved for construction in progress"
					aria-disabled="true"
					transition:fade={{ duration: 200 }}
				>
					<div class="flex flex-col items-center gap-1.5">
						<!-- Lock Icon -->
						<span class="text-3xl" aria-hidden="true">🔒</span>

						<!-- Label -->
						<p class="text-xs text-warning-700 dark:text-warning-400 font-medium">
							Queued
						</p>

						<!-- Slot Number -->
						<span class="text-[10px] text-surface-500-400-token"
							>Slot {slotPosition}</span
						>
					</div>
				</div>
			{:else}
				<!-- Empty Slot: Show build button -->
				<button
					type="button"
					class="flex-1 card variant-ghost border-2 border-dashed border-surface-300-600-token p-3 hover:variant-soft-primary hover:border-primary-500 transition-all"
					onclick={() => onBuildExtractor?.(tile.id, slotPosition)}
					onkeydown={(e) =>
						handleKeydown(e, () => onBuildExtractor?.(tile.id, slotPosition))}
					aria-label="Build extractor in slot {slotPosition}"
					transition:fade={{ duration: 200 }}
				>
					<div class="flex flex-col items-center gap-1.5">
						<!-- Plus Icon -->
						<span class="text-4xl text-primary-500 font-light" aria-hidden="true"
							>+</span
						>

						<!-- Label -->
						<p class="text-xs text-surface-600-300-token">Build</p>

						<!-- Slot Number -->
						<span class="text-[10px] text-surface-500-400-token"
							>Slot {slotPosition}</span
						>
					</div>
				</button>
			{/if}
		{/each}
	</div>
</section>

<style>
	/* Dark mode adjustments */
	:global(.dark) .card.variant-glass-surface {
		background: rgba(15, 23, 42, 0.8);
		backdrop-filter: blur(10px);
	}

	:global(.dark) .card.variant-soft-primary {
		background: rgba(59, 130, 246, 0.1);
	}

	:global(.dark) .card.variant-soft-primary:hover {
		background: rgba(59, 130, 246, 0.2);
	}

	:global(.dark) .card.variant-ghost {
		background: rgba(51, 65, 85, 0.1);
	}

	:global(.dark) .border-surface-300-600-token {
		border-color: rgb(71 85 105 / 0.5);
	}
</style>
