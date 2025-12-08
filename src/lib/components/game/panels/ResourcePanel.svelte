<!--
	Unified Resource Panel Component
	
	Combines ResourceHeaderBar, ResourcePanel, and ResourceProductionPanel into a single,
	compact, and flexible component with collapsible sections.
	
	Modes:
	- Compact (header): Horizontal icons + values + mini progress bars
	- Expanded: Add production/consumption rates, net rates
	- Full: Add per-tile production details
	
	WCAG 2.1 AA Compliant
-->

<script lang="ts">
	import type { TileWithRelations } from '$lib/types/api';

	interface Resource {
		type: 'food' | 'water' | 'wood' | 'stone' | 'ore';
		current: number;
		capacity: number;
		productionRate: number; // per hour
		consumptionRate: number; // per hour
	}

	interface Props {
		settlementId: string;
		settlementName?: string;
		resources?: Resource[];
		tiles?: TileWithRelations[];
		mode?: 'compact' | 'expanded' | 'full'; // Default: compact
		showTileDetails?: boolean; // Toggle for tile production details
		onHarvestAll?: () => void;
	}

	let {
		settlementId,
		settlementName,
		resources = [],
		tiles = [],
		mode = 'compact',
		showTileDetails = $bindable(false),
		onHarvestAll
	}: Props = $props();

	// Resource configuration
	const resourceConfig = {
		food: { label: 'Food', icon: '🌾', color: 'var(--success-500)' },
		water: { label: 'Water', icon: '💧', color: 'var(--primary-500)' },
		wood: { label: 'Wood', icon: '🪵', color: 'var(--warning-600)' },
		stone: { label: 'Stone', icon: '🪨', color: 'var(--surface-600)' },
		ore: { label: 'Ore', icon: '⛏️', color: 'var(--error-600)' }
	};

	// Helper functions
	function getPercentage(current: number, capacity: number): number {
		if (capacity === 0) return 0;
		return Math.min(100, Math.max(0, (current / capacity) * 100));
	}

	function getWarningLevel(percentage: number): 'critical' | 'warning' | 'normal' {
		if (percentage < 20) return 'critical';
		if (percentage < 40) return 'warning';
		return 'normal';
	}

	function formatNumber(num: number): string {
		return new Intl.NumberFormat('en-US').format(Math.floor(num));
	}

	function formatRate(rate: number): string {
		const sign = rate >= 0 ? '+' : '';
		return `${sign}${formatNumber(rate)}/hr`;
	}

	function getNetRate(resource: Resource): number {
		return resource.productionRate - resource.consumptionRate;
	}

	function getResourceLabel(resource: Resource): string {
		const config = resourceConfig[resource.type];
		const percentage = getPercentage(resource.current, resource.capacity);
		const netRate = getNetRate(resource);
		return `${config.label}: ${formatNumber(resource.current)} of ${formatNumber(resource.capacity)}, ${percentage.toFixed(0)}% full, net ${formatRate(netRate)}`;
	}

	function getWarningClasses(warningLevel: 'critical' | 'warning' | 'normal'): string {
		if (warningLevel === 'critical') {
			return 'border-error-500 dark:border-error-400';
		} else if (warningLevel === 'warning') {
			return 'border-warning-500 dark:border-warning-400';
		}
		return 'border-surface-300 dark:border-surface-700';
	}

	// Tile production calculation
	function getProducingTiles(): TileWithRelations[] {
		if (!tiles) return [];
		return tiles.filter(
			(t) =>
				t.foodQuality > 0 ||
				t.waterQuality > 0 ||
				t.woodQuality > 0 ||
				t.stoneQuality > 0 ||
				t.oreQuality > 0
		);
	}

	let producingTiles = $derived(getProducingTiles());
	let activeTilesCount = $derived(producingTiles.length);

	// Keyboard handler
	function handleKeydown(event: KeyboardEvent, callback: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			callback();
		}
	}
</script>

<section
	class="bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden"
	data-testid="unified-resource-panel"
	aria-labelledby="resources-heading"
>
	<!-- Header (always visible in all modes) -->
	<header
		class="bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-4 py-3"
	>
		<div class="flex items-center justify-between mb-3">
			<h2
				id="resources-heading"
				class="text-sm font-semibold text-surface-900 dark:text-surface-100 m-0"
			>
				Resources
			</h2>

			<!-- Mode toggle buttons -->
			<div class="flex items-center gap-2">
				{#if mode !== 'compact'}
					<button
						type="button"
						class="btn btn-sm variant-ghost-surface text-xs"
						onclick={() => (showTileDetails = !showTileDetails)}
						onkeydown={(e) => handleKeydown(e, () => (showTileDetails = !showTileDetails))}
						aria-label="Toggle tile production details"
						aria-expanded={showTileDetails}
					>
						{showTileDetails ? '📊 Hide Details' : '📊 Show Details'}
					</button>
				{/if}
			</div>
		</div>

		<!-- Resource Grid (Compact Horizontal View) -->
		{#if resources.length === 0}
			<div class="text-center py-2" role="status">
				<p class="text-xs text-surface-600 dark:text-surface-400">No resource data</p>
			</div>
		{:else}
			<div
				class="grid grid-cols-5 gap-3"
				role="list"
				aria-label="Resource levels for {settlementName}"
			>
				{#each resources as resource (resource.type)}
					{@const config = resourceConfig[resource.type]}
					{@const percentage = getPercentage(resource.current, resource.capacity)}
					{@const warningLevel = getWarningLevel(percentage)}
					{@const netRate = getNetRate(resource)}

					<div
						class="bg-surface-50 dark:bg-surface-900 rounded border {getWarningClasses(
							warningLevel
						)} p-2 flex flex-col gap-1.5"
						data-resource={resource.type}
						role="listitem"
					>
						<!-- Icon + Label -->
						<div class="flex items-center gap-1.5">
							<span class="text-lg leading-none" aria-hidden="true">{config.icon}</span>
							<h3 class="text-xs font-semibold text-surface-900 dark:text-surface-100 m-0 truncate">
								{config.label}
							</h3>
						</div>

						<!-- Current/Capacity -->
						<div
							class="text-xs font-semibold text-surface-800 dark:text-surface-200 tabular-nums"
							aria-label={getResourceLabel(resource)}
						>
							<span>{formatNumber(resource.current)}</span>
							<span class="text-surface-400 dark:text-surface-600 mx-0.5">/</span>
							<span class="text-surface-600 dark:text-surface-400"
								>{formatNumber(resource.capacity)}</span
							>
						</div>

						<!-- Progress Bar -->
						<div
							class="w-full h-1.5 bg-surface-200 dark:bg-surface-700 rounded-full overflow-hidden"
							role="meter"
							aria-valuenow={percentage}
							aria-valuemin="0"
							aria-valuemax="100"
							aria-label="{config.label} storage level"
						>
							<div
								class="h-full rounded-full transition-all duration-300 {warningLevel === 'critical'
									? 'animate-pulse'
									: ''}"
								style:width="{percentage}%"
								style:background-color={config.color}
							></div>
						</div>

						<!-- Net Rate (compact mode shows only this) -->
						{#if mode === 'compact'}
							<div class="flex items-center justify-between text-[10px]">
								<span class="text-surface-600 dark:text-surface-400 font-medium">Net:</span>
								<span
									class="font-semibold tabular-nums {netRate > 0
										? 'text-success-600 dark:text-success-400'
										: netRate < 0
											? 'text-error-600 dark:text-error-400'
											: 'text-surface-700 dark:text-surface-300'}"
								>
									{formatRate(netRate)}
								</span>
							</div>
						{/if}

						<!-- Critical warning (all modes) -->
						{#if warningLevel === 'critical'}
							<div
								class="text-[10px] font-semibold text-error-700 dark:text-error-300 text-center"
								role="alert"
								aria-live="assertive"
							>
								⚠️ Critical
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</header>

	<!-- Expanded Details (mode: expanded or full) -->
	{#if mode !== 'compact' && resources.length > 0}
		<div class="p-4 space-y-4">
			<!-- Production/Consumption Breakdown -->
			<div class="space-y-3">
				<h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
					Production Breakdown
				</h3>
				{#each resources as resource (resource.type)}
					{@const config = resourceConfig[resource.type]}
					{@const netRate = getNetRate(resource)}

					<div class="bg-surface-100 dark:bg-surface-800 rounded p-3 space-y-2">
						<div class="flex items-center gap-2 mb-2">
							<span class="text-xl" aria-hidden="true">{config.icon}</span>
							<h4 class="text-sm font-semibold text-surface-900 dark:text-surface-100 m-0">
								{config.label}
							</h4>
						</div>

						<div class="grid grid-cols-3 gap-2 text-xs">
							<div class="flex flex-col gap-0.5">
								<span class="text-surface-600 dark:text-surface-400 font-medium">Production:</span>
								<span class="font-semibold text-success-600 dark:text-success-400 tabular-nums">
									{formatRate(resource.productionRate)}
								</span>
							</div>

							<div class="flex flex-col gap-0.5">
								<span class="text-surface-600 dark:text-surface-400 font-medium">Consumption:</span>
								<span class="font-semibold text-error-600 dark:text-error-400 tabular-nums">
									{formatRate(-resource.consumptionRate)}
								</span>
							</div>

							<div
								class="flex flex-col gap-0.5 border-l border-surface-300 dark:border-surface-600 pl-2"
							>
								<span class="text-surface-600 dark:text-surface-400 font-medium">Net:</span>
								<span
									class="font-semibold tabular-nums {netRate > 0
										? 'text-success-600 dark:text-success-400'
										: netRate < 0
											? 'text-error-600 dark:text-error-400'
											: 'text-surface-700 dark:text-surface-300'}"
								>
									{formatRate(netRate)}
								</span>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- Tile Production Details (mode: full or toggled in expanded) -->
			{#if (mode === 'full' || showTileDetails) && tiles.length > 0}
				<div class="space-y-3 border-t border-surface-200 dark:border-surface-700 pt-4">
					<div class="flex items-center justify-between">
						<h3 class="text-sm font-semibold text-surface-900 dark:text-surface-100">
							Tile Production ({activeTilesCount} active)
						</h3>
						{#if onHarvestAll && activeTilesCount > 0}
							<button
								type="button"
								class="btn btn-sm variant-filled-primary"
								onclick={onHarvestAll}
								onkeydown={(e) => handleKeydown(e, () => onHarvestAll?.())}
							>
								🌾 Harvest All
							</button>
						{/if}
					</div>

					{#if producingTiles.length > 0}
						<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
							{#each producingTiles as tile (tile.id)}
								<div
									class="bg-surface-100 dark:bg-surface-800 rounded p-3 border border-surface-200 dark:border-surface-700"
								>
									<div class="flex justify-between items-start mb-2">
										<div>
											<h4 class="text-xs font-semibold text-surface-900 dark:text-surface-100">
												Tile ({tile.x}, {tile.y})
											</h4>
											<p class="text-[10px] text-surface-600 dark:text-surface-400">
												{tile.biome}
											</p>
										</div>
									</div>

									<div class="space-y-1.5">
										{#if tile.foodQuality > 0}
											<div class="flex items-center justify-between text-xs">
												<span class="flex items-center gap-1">
													🌾 <span>Food</span>
												</span>
												<span class="font-medium">{tile.foodQuality.toFixed(1)}%</span>
											</div>
										{/if}
										{#if tile.waterQuality > 0}
											<div class="flex items-center justify-between text-xs">
												<span class="flex items-center gap-1">
													💧 <span>Water</span>
												</span>
												<span class="font-medium">{tile.waterQuality.toFixed(1)}%</span>
											</div>
										{/if}
										{#if tile.woodQuality > 0}
											<div class="flex items-center justify-between text-xs">
												<span class="flex items-center gap-1">
													🪵 <span>Wood</span>
												</span>
												<span class="font-medium">{tile.woodQuality.toFixed(1)}%</span>
											</div>
										{/if}
										{#if tile.stoneQuality > 0}
											<div class="flex items-center justify-between text-xs">
												<span class="flex items-center gap-1">
													🪨 <span>Stone</span>
												</span>
												<span class="font-medium">{tile.stoneQuality.toFixed(1)}%</span>
											</div>
										{/if}
										{#if tile.oreQuality > 0}
											<div class="flex items-center justify-between text-xs">
												<span class="flex items-center gap-1">
													⛏️ <span>Ore</span>
												</span>
												<span class="font-medium">{tile.oreQuality.toFixed(1)}%</span>
											</div>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<p class="text-xs text-surface-600 dark:text-surface-400 text-center py-4">
							No active tiles producing resources
						</p>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</section>
