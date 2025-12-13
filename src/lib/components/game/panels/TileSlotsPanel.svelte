<script lang="ts">
	/**
	 * Tile Slots Panel Component
	 * Displays the 5 extractor slots for the settlement's founding tile
	 * Shows tile resource quality and allows building extractors
	 * WCAG 2.1 AA Compliant
	 */

	interface Tile {
		id: string;
		plotSlots: number; // Default 5
		foodQuality: number; // 0-100
		waterQuality: number; // 0-100
		woodQuality: number; // 0-100
		stoneQuality: number; // 0-100
		oreQuality: number; // 0-100
		baseProductionModifier: number; // 1.0 = normal, 0.4 = 60% drought penalty
		biomeId: string;
	}

	interface ExtractorStructure {
		id: string;
		structureId: string;
		tileId: string;
		slotPosition: number; // 0-4
		level: number; // 1-5
		health: number; // 0-100
		category: 'EXTRACTOR';
	}

	interface Props {
		settlementId: string;
		tile?: Tile;
		extractors?: ExtractorStructure[];
		onBuildExtractor?: (slotPosition: number) => void;
		onViewExtractor?: (extractor: ExtractorStructure) => void;
	}

	let {
		settlementId,
		tile = {
			id: '',
			plotSlots: 5,
			foodQuality: 0,
			waterQuality: 0,
			woodQuality: 0,
			stoneQuality: 0,
			oreQuality: 0,
			baseProductionModifier: 1.0,
			biomeId: ''
		},
		extractors = [],
		onBuildExtractor,
		onViewExtractor
	}: Props = $props();

	// Resource quality configuration
	const resourceQualityConfig = {
		food: { label: 'Food', icon: '🌾', color: 'var(--success-500)' },
		water: { label: 'Water', icon: '💧', color: 'var(--primary-500)' },
		wood: { label: 'Wood', icon: '🪵', color: 'var(--warning-600)' },
		stone: { label: 'Stone', icon: '🪨', color: 'var(--surface-600)' },
		ore: { label: 'Ore', icon: '⛏️', color: 'var(--error-600)' }
	};

	// Get extractor in specific slot
	function getExtractorInSlot(slotPosition: number): ExtractorStructure | undefined {
		return extractors.find((e) => e.slotPosition === slotPosition);
	}

	// Check if slot is occupied
	function isSlotOccupied(slotPosition: number): boolean {
		return extractors.some((e) => e.slotPosition === slotPosition);
	}

	// Format quality percentage
	function formatQuality(quality: number): string {
		return `${Math.round(quality)}%`;
	}

	// Get quality warning level
	function getQualityLevel(quality: number): 'excellent' | 'good' | 'fair' | 'poor' {
		if (quality >= 75) return 'excellent';
		if (quality >= 50) return 'good';
		if (quality >= 25) return 'fair';
		return 'poor';
	}

	// Get disaster modifier description
	function getDisasterModifierText(modifier: number): string {
		if (modifier >= 0.9) return 'Normal production';
		if (modifier >= 0.6) return `${Math.round((1 - modifier) * 100)}% reduced (disaster impact)`;
		return `Severe reduction (${Math.round((1 - modifier) * 100)}% penalty)`;
	}

	// Handle slot click
	function handleSlotClick(slotPosition: number) {
		const extractor = getExtractorInSlot(slotPosition);
		if (extractor && onViewExtractor) {
			onViewExtractor(extractor);
		} else if (!extractor && onBuildExtractor) {
			onBuildExtractor(slotPosition);
		}
	}

	// Get aria-label for slot
	function getSlotLabel(slotPosition: number): string {
		const extractor = getExtractorInSlot(slotPosition);
		if (extractor) {
			return `Slot ${slotPosition + 1}: Occupied, Level ${extractor.level}, ${extractor.health}% health. Click to view or upgrade.`;
		}
		return `Slot ${slotPosition + 1}: Empty. Click to build extractor.`;
	}

	// Resource qualities as array for display
	const resourceQualities = $derived([
		{ type: 'food' as const, quality: tile.foodQuality },
		{ type: 'water' as const, quality: tile.waterQuality },
		{ type: 'wood' as const, quality: tile.woodQuality },
		{ type: 'stone' as const, quality: tile.stoneQuality },
		{ type: 'ore' as const, quality: tile.oreQuality }
	]);
</script>

<section
	class="bg-surface-50 dark:bg-surface-900 rounded-lg overflow-hidden h-full flex flex-col"
	data-testid="tile-slots-panel"
	aria-labelledby="tile-slots-heading"
>
	<header
		class="bg-surface-100 dark:bg-surface-800 border-b border-surface-300 dark:border-surface-700 px-6 py-4"
	>
		<h2
			id="tile-slots-heading"
			class="text-lg font-semibold text-surface-900 dark:text-surface-100 m-0"
		>
			Extractor Slots
		</h2>
	</header>

	<div class="flex-1 overflow-y-auto p-4">
		<!-- Disaster Impact Warning -->
		{#if tile.baseProductionModifier < 0.9}
			<div
				class="bg-warning-100 dark:bg-warning-900 border border-warning-300 dark:border-warning-700 rounded-md p-3 mb-4"
				role="alert"
			>
				<div class="flex items-start gap-2">
					<span class="text-lg leading-none" aria-hidden="true">⚠️</span>
					<div class="flex-1">
						<p class="text-sm font-medium text-warning-900 dark:text-warning-100 m-0 mb-1">
							Disaster Impact Active
						</p>
						<p class="text-xs text-warning-800 dark:text-warning-200 m-0">
							{getDisasterModifierText(tile.baseProductionModifier)}
						</p>
					</div>
				</div>
			</div>
		{/if}

		<!-- Tile Resource Quality -->
		<div class="bg-surface-100 dark:bg-surface-800 rounded-md p-4 mb-4">
			<h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3 mt-0">
				Tile Resource Quality
			</h3>
			<div class="grid grid-cols-5 gap-2">
				{#each resourceQualities as { type, quality } (type)}
					{@const config = resourceQualityConfig[type]}
					{@const qualityLevel = getQualityLevel(quality)}

					<div
						class="flex flex-col items-center gap-1"
						title="{config.label}: {formatQuality(quality)}"
					>
						<span class="text-xl leading-none" aria-hidden="true">{config.icon}</span>
						<div
							class="w-full h-2 bg-surface-200 dark:bg-surface-700 rounded-sm overflow-hidden"
							role="meter"
							aria-label="{config.label} quality"
							aria-valuenow={quality}
							aria-valuemin="0"
							aria-valuemax="100"
						>
							<div
								class="h-full rounded-sm"
								style:width="{quality}%"
								style:background-color={config.color}
							></div>
						</div>
						<span
							class="text-xs font-medium tabular-nums {qualityLevel === 'excellent'
								? 'text-success-700 dark:text-success-400'
								: qualityLevel === 'good'
									? 'text-primary-700 dark:text-primary-400'
									: qualityLevel === 'fair'
										? 'text-warning-700 dark:text-warning-400'
										: 'text-error-700 dark:text-error-400'}"
						>
							{formatQuality(quality)}
						</span>
					</div>
				{/each}
			</div>
		</div>

		<!-- Extractor Slots Grid -->
		<div class="bg-surface-100 dark:bg-surface-800 rounded-md p-4">
			<h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100 mb-3 mt-0">
				Building Slots ({tile.plotSlots} available)
			</h3>
			<ul class="grid grid-cols-5 gap-3 list-none p-0 m-0" role="list">
				{#each Array(tile.plotSlots) as _, slotPosition (slotPosition)}
					{@const extractor = getExtractorInSlot(slotPosition)}
					{@const occupied = isSlotOccupied(slotPosition)}

					<li role="listitem">
						<button
							type="button"
							class="w-full aspect-square rounded-md border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-surface-900 {occupied
								? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-950 hover:bg-primary-100 dark:hover:bg-primary-900'
								: 'border-surface-300 dark:border-surface-600 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 border-dashed'}"
							onclick={() => handleSlotClick(slotPosition)}
							aria-label={getSlotLabel(slotPosition)}
							data-slot={slotPosition}
						>
							<div class="flex flex-col items-center justify-center h-full p-2">
								{#if extractor}
									<!-- Occupied Slot -->
									<div class="flex flex-col items-center gap-1">
										<span class="text-2xl leading-none" aria-hidden="true">🏭</span>
										<span
											class="text-xs font-semibold text-primary-700 dark:text-primary-300 tabular-nums"
										>
											Lv {extractor.level}
										</span>
										{#if extractor.health < 100}
											<div
												class="w-full h-1 bg-surface-200 dark:bg-surface-700 rounded-sm overflow-hidden"
												role="meter"
												aria-label="Structure health"
												aria-valuenow={extractor.health}
												aria-valuemin="0"
												aria-valuemax="100"
											>
												<div
													class="h-full rounded-sm {extractor.health < 40
														? 'bg-error-500'
														: extractor.health < 70
															? 'bg-warning-500'
															: 'bg-success-500'}"
													style:width="{extractor.health}%"
												></div>
											</div>
										{/if}
									</div>
								{:else}
									<!-- Empty Slot -->
									<div class="flex flex-col items-center gap-1">
										<span class="text-2xl leading-none opacity-40" aria-hidden="true">➕</span>
										<span class="text-xs font-medium text-surface-600 dark:text-surface-400">
											Slot {slotPosition + 1}
										</span>
									</div>
								{/if}
							</div>
						</button>
					</li>
				{/each}
			</ul>

			<!-- Help Text -->
			<p class="text-xs text-surface-600 dark:text-surface-400 mt-3 mb-0">
				Click an empty slot to build an extractor, or click an existing extractor to view details
				and upgrade.
			</p>
		</div>
	</div>
</section>
