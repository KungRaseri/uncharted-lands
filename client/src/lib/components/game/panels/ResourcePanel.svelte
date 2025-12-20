<!--
	Resource Panel Component
	
	Displays settlement resources in two modes:
	- Compact (default): Single horizontal row with all resources
	- Expanded: Grid layout with detailed cards for each resource
	
	Toggle between modes with "Show/Hide Details" button.
	Hover tooltips provide additional production/consumption breakdown.
	
	WCAG 2.1 AA Compliant
-->

<script lang="ts">
	import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';
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
	}

	let {
		settlementId,
		settlementName = 'Settlement',
		resources = [],
		tiles = []
	}: Props = $props();

	// Local state for toggling between compact and expanded
	let isExpanded = $state(false);

	// Resource configuration
	const resourceConfig = {
		food: { label: 'Food', icon: '🌾', color: 'var(--success-500)' },
		water: { label: 'Water', icon: '💧', color: 'var(--primary-500)' },
		wood: { label: 'Wood', icon: '🪵', color: 'var(--warning-600)' },
		stone: { label: 'Stone', icon: '🪨', color: 'var(--surface-600)' },
		ore: { label: 'Ore', icon: '⛏️', color: 'var(--error-600)' }
	};

	// Toggle expand/collapse
	function toggleExpanded() {
		isExpanded = !isExpanded;
	}

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

	function getWarningClasses(warningLevel: 'critical' | 'warning' | 'normal'): string {
		if (warningLevel === 'critical') {
			return 'border-error-500 dark:border-error-400';
		} else if (warningLevel === 'warning') {
			return 'border-warning-500 dark:border-warning-400';
		}
		return 'border-surface-300 dark:border-surface-700';
	}

	// Keyboard handler
	function handleKeydown(event: KeyboardEvent, callback: () => void) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			callback();
		}
	}
</script>

<section
	class="bg-surface-50 dark:bg-surface-900 rounded-lg border border-surface-200 dark:border-surface-700 overflow-visible"
	data-testid="resource-panel"
	aria-labelledby="resources-heading"
>
	<!-- Header -->
	<header
		class="bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-2"
	>
		<div class="flex items-center justify-between">
			<h2
				id="resources-heading"
				class="text-sm font-semibold text-surface-900 dark:text-surface-100 m-0"
			>
				Resources
			</h2>

			<!-- Toggle Button (always visible) -->
			<button
				type="button"
				class="btn btn-sm variant-ghost-surface text-xs"
				onclick={toggleExpanded}
				onkeydown={(e) => handleKeydown(e, toggleExpanded)}
				aria-label="{isExpanded ? 'Hide' : 'Show'} resource details"
				aria-expanded={isExpanded}
			>
				{isExpanded ? '📊 Hide Details' : '📊 Show Details'}
			</button>
		</div>
	</header>

	<!-- Resource Display -->
	{#if resources.length === 0}
		<div class="text-center py-2" role="status">
			<p class="text-xs text-surface-600 dark:text-surface-400">No resource data</p>
		</div>
	{:else if !isExpanded}
		<!-- COMPACT MODE: Single horizontal row -->
		<div class="px-4 py-3">
			<div
				class="flex items-center gap-4 justify-between"
				role="list"
				aria-label="Resource levels for {settlementName}"
			>
				{#each resources as resource (resource.type)}
					{@const config = resourceConfig[resource.type]}
					{@const percentage = getPercentage(resource.current, resource.capacity)}
					{@const warningLevel = getWarningLevel(percentage)}
					{@const netRate = getNetRate(resource)}

					<Tooltip positioning={{ placement: 'bottom' }} openDelay={0}>
						<Tooltip.Trigger>
							<div
								class="flex items-center gap-2 flex-1 relative group"
								data-resource={resource.type}
								role="listitem"
							>
								<!-- Icon -->
								<span class="text-xl leading-none" aria-hidden="true"
									>{config.icon}</span
								>

								<!-- Name + Values -->
								<div class="flex flex-col gap-0.5 min-w-0">
									<span
										class="text-xs font-semibold text-surface-900 dark:text-surface-100 truncate"
									>
										{config.label}
									</span>
									<div class="flex items-baseline gap-1">
										<span
											class="text-xs font-bold text-surface-800 dark:text-surface-200 tabular-nums"
										>
											{formatNumber(resource.current)}
										</span>
										<span
											class="text-[10px] text-surface-500 dark:text-surface-500"
											>/</span
										>
										<span
											class="text-[10px] text-surface-600 dark:text-surface-400 tabular-nums"
										>
											{formatNumber(resource.capacity)}
										</span>
									</div>
								</div>

								<!-- Net Rate -->
								<div class="flex flex-col items-end gap-0.5">
									<span
										class="text-xs font-semibold tabular-nums {netRate > 0
											? 'text-success-600 dark:text-success-400'
											: netRate < 0
												? 'text-error-600 dark:text-error-400'
												: 'text-surface-700 dark:text-surface-300'}"
									>
										{formatRate(netRate)}
									</span>
									{#if warningLevel === 'critical'}
										<span
											class="text-[10px] font-bold text-error-700 dark:text-error-300"
										>
											⚠️ Critical
										</span>
									{/if}
								</div>
							</div>
						</Tooltip.Trigger>

						<Portal>
							<Tooltip.Positioner class="z-9999">
								<Tooltip.Content
									class="card bg-surface-800 dark:bg-surface-950 border border-surface-700 dark:border-surface-600 rounded-lg shadow-xl p-3 w-64"
								>
									<div class="flex items-center gap-2 mb-2">
										<span class="text-2xl" aria-hidden="true"
											>{config.icon}</span
										>
										<h3 class="text-sm font-semibold text-surface-100 m-0">
											{config.label}
										</h3>
									</div>

									<!-- Storage Info -->
									<div class="mb-3">
										<div class="flex justify-between text-xs mb-1">
											<span class="text-surface-300">Storage:</span>
											<span class="text-surface-100 font-semibold">
												{formatNumber(resource.current)} / {formatNumber(
													resource.capacity
												)}
											</span>
										</div>
										<div
											class="w-full h-2 bg-surface-700 rounded-full overflow-hidden"
											role="meter"
											aria-valuenow={percentage}
											aria-valuemin="0"
											aria-valuemax="100"
											aria-label="{config.label} storage at {percentage.toFixed(
												0
											)}%"
										>
											<div
												class="h-full rounded-full"
												style:width="{percentage}%"
												style:background-color={config.color}
											></div>
										</div>
									</div>

									<!-- Production Breakdown -->
									<div class="space-y-1.5 text-xs">
										<div class="flex justify-between">
											<span class="text-surface-400">Production:</span>
											<span
												class="text-success-400 font-semibold tabular-nums"
											data-testid="{resource.type}-production-rate"
										>
											{formatRate(resource.productionRate)}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-surface-400">Consumption:</span>
										<span class="text-error-400 font-semibold tabular-nums" data-testid="{resource.type}-consumption-rate">
												{formatRate(-resource.consumptionRate)}
											</span>
										</div>
										<div
											class="flex justify-between pt-1.5 border-t border-surface-700 dark:border-surface-600"
										>
											<span class="text-surface-300 font-semibold">Net:</span>
											<span
												class="font-bold tabular-nums {netRate > 0
													? 'text-success-400'
													: netRate < 0
														? 'text-error-400'
														: 'text-surface-300'}"
											>
												{formatRate(netRate)}
											</span>
										</div>
									</div>
								</Tooltip.Content>
							</Tooltip.Positioner>
						</Portal>
					</Tooltip>
				{/each}
			</div>
		</div>
	{:else}
		<!-- EXPANDED MODE: Grid layout with detailed cards -->
		<div class="p-4">
			<div
				class="grid grid-cols-5 gap-3"
				role="list"
				aria-label="Resource details for {settlementName}"
			>
				{#each resources as resource (resource.type)}
					{@const config = resourceConfig[resource.type]}
					{@const percentage = getPercentage(resource.current, resource.capacity)}
					{@const warningLevel = getWarningLevel(percentage)}
					{@const netRate = getNetRate(resource)}

					<Tooltip positioning={{ placement: 'bottom' }} openDelay={0}>
						<Tooltip.Trigger>
							<div
								class="bg-surface-50 dark:bg-surface-900 rounded border {getWarningClasses(
									warningLevel
								)} p-2 flex flex-col gap-1.5 relative group"
								data-resource={resource.type}
								role="listitem"
							>
								<!-- Icon + Label -->
								<div class="flex items-center gap-1.5">
									<span class="text-lg leading-none" aria-hidden="true"
										>{config.icon}</span
									>
									<h3
										class="text-xs font-semibold text-surface-900 dark:text-surface-100 m-0 truncate"
									>
										{config.label}
									</h3>
								</div>

								<!-- Current/Capacity -->
								<div
									class="text-xs font-semibold text-surface-800 dark:text-surface-200 tabular-nums"
								>
									<span>{formatNumber(resource.current)}</span>
									<span class="text-surface-400 dark:text-surface-600 mx-0.5"
										>/</span
									>
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
										class="h-full rounded-full transition-all duration-300 {warningLevel ===
										'critical'
											? 'animate-pulse'
											: ''}"
										style:width="{percentage}%"
										style:background-color={config.color}
									></div>
								</div>

								<!-- Production & Consumption Rates -->
								<div class="space-y-0.5 text-[10px]">
									<div class="flex items-center justify-between">
										<span
											class="text-surface-600 dark:text-surface-400 font-medium"
											>Production:</span
										>
										<span
											class="text-success-600 dark:text-success-400 font-semibold tabular-nums"
										>
											{formatRate(resource.productionRate)}
										</span>
									</div>
									<div class="flex items-center justify-between">
										<span
											class="text-surface-600 dark:text-surface-400 font-medium"
											>Consumption:</span
										>
										<span
											class="text-error-600 dark:text-error-400 font-semibold tabular-nums"
										>
											{formatRate(-resource.consumptionRate)}
										</span>
									</div>
								</div>

								<!-- Net Rate -->
								<div
									class="flex items-center justify-between text-[10px] pt-1 border-t border-surface-200 dark:border-surface-700"
								>
									<span
										class="text-surface-700 dark:text-surface-300 font-semibold"
										>Net:</span
									>
									<span
										class="font-bold tabular-nums {netRate > 0
											? 'text-success-600 dark:text-success-400'
											: netRate < 0
												? 'text-error-600 dark:text-error-400'
												: 'text-surface-700 dark:text-surface-300'}"
									>
										{formatRate(netRate)}
									</span>
								</div>
								<!-- Critical warning -->
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
						</Tooltip.Trigger>

						<Portal>
							<Tooltip.Positioner class="z-9999">
								<Tooltip.Content
									class="card bg-surface-800 dark:bg-surface-950 border border-surface-700 dark:border-surface-600 rounded-lg shadow-xl p-3 w-64"
								>
									<div class="flex items-center gap-2 mb-2">
										<span class="text-2xl" aria-hidden="true"
											>{config.icon}</span
										>
										<h3 class="text-sm font-semibold text-surface-100 m-0">
											{config.label}
										</h3>
									</div>

									<!-- Storage Info -->
									<div class="mb-3">
										<div class="flex justify-between text-xs mb-1">
											<span class="text-surface-300">Storage:</span>
											<span class="text-surface-100 font-semibold">
												{formatNumber(resource.current)} / {formatNumber(
													resource.capacity
												)}
											</span>
										</div>
										<div
											class="w-full h-2 bg-surface-700 rounded-full overflow-hidden"
											role="meter"
											aria-valuenow={percentage}
											aria-valuemin="0"
											aria-valuemax="100"
											aria-label="{config.label} storage at {percentage.toFixed(
												0
											)}%"
										>
											<div
												class="h-full rounded-full"
												style:width="{percentage}%"
												style:background-color={config.color}
											></div>
										</div>
									</div>

									<!-- Production Breakdown -->
									<div class="space-y-1.5 text-xs">
										<div class="flex justify-between">
											<span class="text-surface-400">Production:</span>
											<span
												class="text-success-400 font-semibold tabular-nums"
											data-testid="{resource.type}-production-rate"
										>
											{formatRate(resource.productionRate)}
										</span>
									</div>
									<div class="flex justify-between">
										<span class="text-surface-400">Consumption:</span>
										<span class="text-error-400 font-semibold tabular-nums" data-testid="{resource.type}-consumption-rate">
												{formatRate(-resource.consumptionRate)}
											</span>
										</div>
										<div
											class="flex justify-between pt-1.5 border-t border-surface-700 dark:border-surface-600"
										>
											<span class="text-surface-300 font-semibold">Net:</span>
											<span
												class="font-bold tabular-nums {netRate > 0
													? 'text-success-400'
													: netRate < 0
														? 'text-error-400'
														: 'text-surface-300'}"
											>
												{formatRate(netRate)}
											</span>
										</div>
									</div>
								</Tooltip.Content>
							</Tooltip.Positioner>
						</Portal>
					</Tooltip>
				{/each}
			</div>
		</div>
	{/if}
</section>
