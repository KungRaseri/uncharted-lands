<script lang="ts">
	/**
	 * Resource Panel Component
	 * Displays current resource 				{@const warningLevel = getWarningLevel(percentage)}
				{@const netRate = getNetRate(resource)}

				<li class="resource-item" data-resource="{resource.type}" role="listitem">
					<div class="resource-header">
						<div class="resource-name-group"> with progress bars
	 * WCAG 2.1 AA Compliant
	 */

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

	let { resources = [] }: Props = $props();

	// Resource display configuration
	const resourceConfig = {
		food: { label: 'Food', icon: '🌾', color: 'var(--success-500)' },
		water: { label: 'Water', icon: '💧', color: 'var(--primary-500)' },
		wood: { label: 'Wood', icon: '🪵', color: 'var(--warning-600)' },
		stone: { label: 'Stone', icon: '🪨', color: 'var(--surface-600)' },
		ore: { label: 'Ore', icon: '⛏️', color: 'var(--error-600)' }
	};

	// Calculate percentage for progress bar
	function getPercentage(current: number, capacity: number): number {
		return Math.min(100, Math.max(0, (current / capacity) * 100));
	}

	// Get warning level for resource
	function getWarningLevel(percentage: number): 'critical' | 'warning' | 'normal' {
		if (percentage < 20) return 'critical';
		if (percentage < 40) return 'warning';
		return 'normal';
	}

	// Format number with thousands separator
	function formatNumber(num: number): string {
		return new Intl.NumberFormat('en-US').format(Math.floor(num));
	}

	// Format rate with sign
	function formatRate(rate: number): string {
		const sign = rate >= 0 ? '+' : '';
		return `${sign}${formatNumber(rate)}/hr`;
	}

	// Calculate net rate
	function getNetRate(resource: Resource): number {
		return resource.productionRate - resource.consumptionRate;
	}

	// Get aria-label for resource
	function getResourceLabel(resource: Resource): string {
		const config = resourceConfig[resource.type];
		const percentage = getPercentage(resource.current, resource.capacity);
		const netRate = getNetRate(resource);
		return `${config.label}: ${formatNumber(resource.current)} of ${formatNumber(resource.capacity)}, ${percentage.toFixed(0)}% full, net ${formatRate(netRate)}`;
	}
</script>

<section
	class="bg-surface-50 dark:bg-surface-900 rounded-lg overflow-hidden h-full flex flex-col"
	data-testid="resource-panel"
	aria-labelledby="resources-heading"
>
	<header
		class="bg-surface-100 dark:bg-surface-800 border-b border-surface-300 dark:border-surface-700 px-6 py-4"
	>
		<h2
			id="resources-heading"
			class="text-lg font-semibold text-surface-900 dark:text-surface-100 m-0"
		>
			Resources
		</h2>
	</header>

	<div class="flex-1 overflow-y-auto p-4">
		{#if resources.length === 0}
			<div class="flex items-center justify-center h-full min-h-[150px]" role="status">
				<p class="text-base text-surface-600 dark:text-surface-400 text-center">
					No resource data available
				</p>
			</div>
		{:else}
			<ul class="list-none p-0 m-0 flex flex-col gap-6" role="list">
				{#each resources as resource (resource.type)}
					{@const config = resourceConfig[resource.type]}
					{@const percentage = getPercentage(resource.current, resource.capacity)}
					{@const warningLevel = getWarningLevel(percentage)}
					{@const netRate = getNetRate(resource)}

					<li
						class="bg-surface-100 dark:bg-surface-800 rounded-md p-4 border border-surface-200 dark:border-surface-700"
						data-resource={resource.type}
						role="listitem"
					>
						<div class="flex justify-between items-center mb-3">
							<div class="flex items-center gap-2">
								<span class="text-2xl leading-none" aria-hidden="true">{config.icon}</span>
								<h3 class="text-base font-semibold text-surface-900 dark:text-surface-100 m-0">
									{config.label}
								</h3>
							</div>
							<div
								class="text-base font-semibold text-surface-800 dark:text-surface-200 tabular-nums"
								aria-label={getResourceLabel(resource)}
							>
								<span>{formatNumber(resource.current)}</span>
								<span class="text-surface-400 dark:text-surface-600 mx-1">/</span>
								<span class="text-surface-600 dark:text-surface-400"
									>{formatNumber(resource.capacity)}</span
								>
							</div>
						</div>

						<div
							class="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-md overflow-hidden mb-3"
							role="progressbar"
							aria-valuenow={percentage}
							aria-valuemin="0"
							aria-valuemax="100"
							aria-label="{config.label} storage"
						>
							<div
								class="h-full rounded-md transition-all duration-300 {warningLevel === 'critical'
									? 'animate-pulse'
									: ''}"
								style:width="{percentage}%"
								style:background-color={config.color}
							></div>
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

						{#if warningLevel === 'critical'}
							<div
								class="mt-3 px-2 py-2 rounded bg-error-100 dark:bg-error-900 text-error-900 dark:text-error-100 border border-error-300 dark:border-error-700 text-sm font-medium flex items-center gap-2"
								role="alert"
							>
								⚠️ Critical: Resource nearly depleted!
							</div>
						{:else if warningLevel === 'warning'}
							<div
								class="mt-3 px-2 py-2 rounded bg-warning-100 dark:bg-warning-900 text-warning-900 dark:text-warning-100 border border-warning-300 dark:border-warning-700 text-sm font-medium flex items-center gap-2"
								role="status"
							>
								⚠️ Warning: Resource running low
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
