<script lang="ts">
	/**
	 * Resource Panel Component
	 * Displays current resource levels with progress bars
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

<section class="resource-panel" aria-labelledby="resources-heading">
	<header class="panel-header">
		<h2 id="resources-heading" class="panel-title">Resources</h2>
	</header>

	<div class="resources-content">
		{#if resources.length === 0}
			<div class="no-resources" role="status">
				<p class="no-resources-text">No resource data available</p>
			</div>
		{:else}
			<ul class="resources-list" role="list">
				{#each resources as resource (resource.type)}
					{@const config = resourceConfig[resource.type]}
					{@const percentage = getPercentage(resource.current, resource.capacity)}
					{@const warningLevel = getWarningLevel(percentage)}
					{@const netRate = getNetRate(resource)}

					<li class="resource-item" role="listitem">
						<div class="resource-header">
							<div class="resource-name-group">
								<span class="resource-icon" aria-hidden="true">{config.icon}</span>
								<h3 class="resource-name">{config.label}</h3>
							</div>

							<div class="resource-amount" aria-label={getResourceLabel(resource)}>
								<span class="current">{formatNumber(resource.current)}</span>
								<span class="separator">/</span>
								<span class="capacity">{formatNumber(resource.capacity)}</span>
							</div>
						</div>

						<div
							class="progress-bar-container"
							role="progressbar"
							aria-valuenow={percentage}
							aria-valuemin="0"
							aria-valuemax="100"
							aria-label="{config.label} storage"
						>
							<div
								class="progress-bar progress-{warningLevel}"
								style:width="{percentage}%"
								style:background-color={config.color}
							></div>
						</div>

						<div class="resource-rates">
							<div class="rate-item">
								<span class="rate-label">Production:</span>
								<span class="rate-value rate-positive">
									{formatRate(resource.productionRate)}
								</span>
							</div>

							<div class="rate-item">
								<span class="rate-label">Consumption:</span>
								<span class="rate-value rate-negative">
									{formatRate(-resource.consumptionRate)}
								</span>
							</div>

							<div class="rate-item net-rate">
								<span class="rate-label">Net:</span>
								<span
									class="rate-value"
									class:rate-positive={netRate > 0}
									class:rate-negative={netRate < 0}
								>
									{formatRate(netRate)}
								</span>
							</div>
						</div>

						{#if warningLevel === 'critical'}
							<div class="warning-message critical" role="alert">
								⚠️ Critical: Resource nearly depleted!
							</div>
						{:else if warningLevel === 'warning'}
							<div class="warning-message warning" role="status">
								⚠️ Warning: Resource running low
							</div>
						{/if}
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.resource-panel {
		background: var(--surface-50);
		border-radius: 8px;
		overflow: hidden;
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.panel-header {
		background: var(--surface-100);
		border-bottom: 1px solid var(--surface-300);
		padding: 1rem 1.5rem;
	}

	.panel-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--surface-900);
		margin: 0;
	}

	.resources-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.no-resources {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 150px;
	}

	.no-resources-text {
		font-size: 1rem;
		color: var(--surface-600);
		text-align: center;
	}

	.resources-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	.resource-item {
		background: var(--surface-100);
		border-radius: 6px;
		padding: 1rem;
		border: 1px solid var(--surface-200);
	}

	.resource-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.resource-name-group {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.resource-icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.resource-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--surface-900);
		margin: 0;
	}

	.resource-amount {
		font-size: 1rem;
		font-weight: 600;
		color: var(--surface-800);
		font-variant-numeric: tabular-nums;
	}

	.separator {
		color: var(--surface-400);
		margin: 0 0.25rem;
	}

	.capacity {
		color: var(--surface-600);
	}

	.progress-bar-container {
		width: 100%;
		height: 12px;
		background: var(--surface-200);
		border-radius: 6px;
		overflow: hidden;
		margin-bottom: 0.75rem;
	}

	.progress-bar {
		height: 100%;
		transition: width 0.3s ease;
		border-radius: 6px;
	}

	.progress-critical {
		animation: pulse-critical 1.5s ease-in-out infinite;
	}

	@keyframes pulse-critical {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.7;
		}
	}

	.resource-rates {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 0.5rem;
		font-size: 0.75rem;
	}

	.rate-item {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.rate-label {
		color: var(--surface-600);
		font-weight: 500;
	}

	.rate-value {
		font-weight: 600;
		font-variant-numeric: tabular-nums;
	}

	.rate-positive {
		color: var(--success-600);
	}

	.rate-negative {
		color: var(--error-600);
	}

	.net-rate {
		border-left: 1px solid var(--surface-300);
		padding-left: 0.5rem;
	}

	.warning-message {
		margin-top: 0.75rem;
		padding: 0.5rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.warning-message.critical {
		background: var(--error-100);
		color: var(--error-900);
		border: 1px solid var(--error-300);
	}

	.warning-message.warning {
		background: var(--warning-100);
		color: var(--warning-900);
		border: 1px solid var(--warning-300);
	}

	/* Responsive Design */
	@media (max-width: 767px) {
		.panel-header {
			padding: 0.75rem 1rem;
		}

		.resources-content {
			padding: 0.75rem;
		}

		.resource-item {
			padding: 0.75rem;
		}

		.resource-rates {
			grid-template-columns: 1fr;
			gap: 0.25rem;
		}

		.net-rate {
			border-left: none;
			border-top: 1px solid var(--surface-300);
			padding-left: 0;
			padding-top: 0.25rem;
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.progress-bar-container {
			border: 2px solid var(--surface-800);
		}

		.resource-item {
			border-width: 2px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.progress-bar {
			transition: none;
		}

		.progress-critical {
			animation: none;
		}
	}
</style>
