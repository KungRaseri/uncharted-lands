<!--
	Resource Header Bar Component
	Displays resources horizontally in compact header bar format
	Optimized for top-of-dashboard placement with minimal vertical space
	WCAG 2.1 AA Compliant
-->

<script lang="ts">
	interface Resource {
		type: 'food' | 'water' | 'wood' | 'stone' | 'ore';
		current: number;
		capacity: number;
		productionRate: number; // per hour
		consumptionRate: number; // per hour
	}

	interface Props {
		settlementId: string;
		resources?: Resource[];
	}

	let { settlementId, resources = [] }: Props = $props();

	// Resource configuration with icons and colors
	const resourceConfig = {
		food: { label: 'Food', icon: '🌾', color: 'var(--success-500)' },
		water: { label: 'Water', icon: '💧', color: 'var(--primary-500)' },
		wood: { label: 'Wood', icon: '🪵', color: 'var(--warning-600)' },
		stone: { label: 'Stone', icon: '🪨', color: 'var(--surface-600)' },
		ore: { label: 'Ore', icon: '⛏️', color: 'var(--error-600)' }
	};

	// Helper functions

	// Calculate percentage for progress bar (0-100)
	function getPercentage(current: number, capacity: number): number {
		if (capacity === 0) return 0;
		return Math.min(100, Math.max(0, (current / capacity) * 100));
	}

	// Get warning level based on percentage
	function getWarningLevel(percentage: number): 'critical' | 'warning' | 'normal' {
		if (percentage < 20) return 'critical';
		if (percentage < 40) return 'warning';
		return 'normal';
	}

	// Format number with thousands separator
	function formatNumber(num: number): string {
		return new Intl.NumberFormat('en-US').format(Math.floor(num));
	}

	// Format rate with sign and /hr suffix
	function formatRate(rate: number): string {
		const sign = rate >= 0 ? '+' : '';
		return `${sign}${formatNumber(rate)}/hr`;
	}

	// Calculate net rate (production - consumption)
	function getNetRate(resource: Resource): number {
		return resource.productionRate - resource.consumptionRate;
	}

	// Get accessible label for resource
	function getResourceLabel(resource: Resource): string {
		const config = resourceConfig[resource.type];
		const percentage = getPercentage(resource.current, resource.capacity);
		const netRate = getNetRate(resource);
		return `${config.label}: ${formatNumber(resource.current)} of ${formatNumber(resource.capacity)}, ${percentage.toFixed(0)}% full, net ${formatRate(netRate)}`;
	}

	// Get warning color classes for borders/text
	function getWarningClasses(warningLevel: 'critical' | 'warning' | 'normal'): string {
		if (warningLevel === 'critical') {
			return 'border-error-500 dark:border-error-400';
		} else if (warningLevel === 'warning') {
			return 'border-warning-500 dark:border-warning-400';
		}
		return 'border-surface-300 dark:border-surface-700';
	}
</script>

<header
	class="bg-surface-100 dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 px-4 py-3"
	data-testid="resource-header-bar"
	aria-labelledby="resources-heading"
	role="region"
>
	<div class="flex items-center justify-between mb-2">
		<h2
			id="resources-heading"
			class="text-sm font-semibold text-surface-900 dark:text-surface-100 m-0"
		>
			Resources
		</h2>
	</div>

	{#if resources.length === 0}
		<div class="flex items-center justify-center py-2" role="status">
			<p class="text-xs text-surface-600 dark:text-surface-400 text-center">
				No resource data available
			</p>
		</div>
	{:else}
		<div class="grid grid-cols-5 gap-3" role="list" aria-label="Resource levels for {settlementId}">
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
					<!-- Icon + Label Row -->
					<div class="flex items-center gap-1.5">
						<span class="text-lg leading-none" aria-hidden="true">{config.icon}</span>
						<h3 class="text-xs font-semibold text-surface-900 dark:text-surface-100 m-0 truncate">
							{config.label}
						</h3>
					</div>

					<!-- Current/Capacity Row -->
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

					<!-- Net Rate Row -->
					<div class="flex items-center justify-between text-xs">
						<span class="text-surface-600 dark:text-surface-400 font-medium">Net:</span>
						<span
							class="font-semibold tabular-nums {netRate > 0
								? 'text-success-600 dark:text-success-400'
								: netRate < 0
									? 'text-error-600 dark:text-error-400'
									: 'text-surface-700 dark:text-surface-300'}"
							title="Production: {formatRate(resource.productionRate)}, Consumption: {formatRate(
								-resource.consumptionRate
							)}"
						>
							{formatRate(netRate)}
						</span>
					</div>

					<!-- Warning Indicator (only for critical) -->
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
