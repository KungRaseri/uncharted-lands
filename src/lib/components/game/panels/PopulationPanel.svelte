<script lang="ts">
	/**
	 * Population Panel Component
	 * Displays population status and happiness metrics
	 * WCAG 2.1 AA Compliant
	 */

	type HappinessLevel = 'very-happy' | 'happy' | 'content' | 'unhappy' | 'very-unhappy';

	interface PopulationData {
		current: number;
		capacity: number;
		growthRate: number; // percentage per hour
		happiness: number; // 0-100 scale
		immigrants: number; // last 24h
		emigrants: number; // last 24h
	}

	interface Props {
		settlementId: string;
		population?: PopulationData;
	}

	let {
		settlementId,
		population = {
			current: 0,
			capacity: 0,
			growthRate: 0,
			happiness: 50,
			immigrants: 0,
			emigrants: 0
		}
	}: Props = $props();

	// Calculate percentage for capacity bar
	const capacityPercentage = $derived(
		Math.min(100, Math.max(0, (population.current / population.capacity) * 100))
	);

	// Determine happiness level
	const happinessLevel = $derived.by((): HappinessLevel => {
		if (population.happiness >= 80) return 'very-happy';
		if (population.happiness >= 60) return 'happy';
		if (population.happiness >= 40) return 'content';
		if (population.happiness >= 20) return 'unhappy';
		return 'very-unhappy';
	});

	// Happiness emoji
	const happinessEmoji = $derived.by(() => {
		switch (happinessLevel) {
			case 'very-happy':
				return '😄';
			case 'happy':
				return '🙂';
			case 'content':
				return '😐';
			case 'unhappy':
				return '😟';
			case 'very-unhappy':
				return '😢';
		}
	});

	// Happiness label for screen readers
	const happinessLabel = $derived.by(() => {
		switch (happinessLevel) {
			case 'very-happy':
				return 'Very happy';
			case 'happy':
				return 'Happy';
			case 'content':
				return 'Content';
			case 'unhappy':
				return 'Unhappy';
			case 'very-unhappy':
				return 'Very unhappy';
		}
	});

	// Format number with thousands separator
	function formatNumber(num: number): string {
		return new Intl.NumberFormat('en-US').format(Math.floor(num));
	}

	// Format growth rate with sign
	function formatGrowthRate(rate: number): string {
		const sign = rate >= 0 ? '+' : '';
		return `${sign}${rate.toFixed(1)}%`;
	}

	// Get capacity warning level
	const capacityWarning = $derived.by(() => {
		if (capacityPercentage >= 95) return 'critical';
		if (capacityPercentage >= 80) return 'warning';
		return 'normal';
	});
</script>

<section class="population-panel" aria-labelledby="population-heading">
	<header class="panel-header">
		<h2 id="population-heading" class="panel-title">Population</h2>
	</header>

	<div class="population-content">
		<!-- Population Overview -->
		<div class="stat-card primary">
			<div class="stat-header">
				<span class="stat-icon" aria-hidden="true">👥</span>
				<h3 class="stat-label">Total Population</h3>
			</div>
			<div
				class="stat-value"
				aria-label="{formatNumber(population.current)} of {formatNumber(
					population.capacity
				)} capacity"
			>
				<span class="current">{formatNumber(population.current)}</span>
				<span class="separator">/</span>
				<span class="capacity">{formatNumber(population.capacity)}</span>
			</div>

			<!-- Capacity Progress Bar -->
			<div
				class="progress-bar-container"
				role="progressbar"
				aria-valuenow={capacityPercentage}
				aria-valuemin="0"
				aria-valuemax="100"
				aria-label="Population capacity usage"
			>
				<div
					class="progress-bar capacity-{capacityWarning}"
					style:width="{capacityPercentage}%"
				></div>
			</div>

			{#if capacityWarning === 'critical'}
				<div class="warning-message critical" role="alert">
					⚠️ Critical: Build more housing immediately!
				</div>
			{:else if capacityWarning === 'warning'}
				<div class="warning-message warning" role="status">
					⚠️ Warning: Population nearing capacity
				</div>
			{/if}
		</div>

		<!-- Happiness -->
		<div class="stat-card happiness happiness-{happinessLevel}">
			<div class="stat-header">
				<span class="stat-icon" aria-hidden="true">{happinessEmoji}</span>
				<h3 class="stat-label">Happiness</h3>
			</div>
			<div class="happiness-value" aria-label="{happinessLabel}, {population.happiness}%">
				<span class="happiness-percentage">{population.happiness}%</span>
				<span class="happiness-text">{happinessLabel}</span>
			</div>

			<!-- Happiness Bar -->
			<div
				class="progress-bar-container"
				role="progressbar"
				aria-valuenow={population.happiness}
				aria-valuemin="0"
				aria-valuemax="100"
				aria-label="Happiness level"
			>
				<div
					class="progress-bar happiness-bar happiness-{happinessLevel}"
					style:width="{population.happiness}%"
				></div>
			</div>
		</div>

		<!-- Growth Rate -->
		<div class="stat-card">
			<div class="stat-header">
				<span class="stat-icon" aria-hidden="true">📈</span>
				<h3 class="stat-label">Growth Rate</h3>
			</div>
			<div
				class="stat-value growth-rate"
				class:positive={population.growthRate > 0}
				class:negative={population.growthRate < 0}
				aria-label="Growth rate {formatGrowthRate(population.growthRate)} per hour"
			>
				{formatGrowthRate(population.growthRate)}/hr
			</div>
		</div>

		<!-- Migration Stats -->
		<div class="migration-stats">
			<h3 class="section-title">24-Hour Migration</h3>
			<div class="migration-grid">
				<div class="migration-item immigrants">
					<span class="migration-icon" aria-hidden="true">➡️</span>
					<div class="migration-info">
						<span class="migration-label">Immigrants</span>
						<span class="migration-value">{formatNumber(population.immigrants)}</span>
					</div>
				</div>

				<div class="migration-item emigrants">
					<span class="migration-icon" aria-hidden="true">⬅️</span>
					<div class="migration-info">
						<span class="migration-label">Emigrants</span>
						<span class="migration-value">{formatNumber(population.emigrants)}</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>

<style>
	.population-panel {
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

	.population-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.stat-card {
		background: var(--surface-100);
		border-radius: 6px;
		padding: 1rem;
		border: 1px solid var(--surface-200);
	}

	.stat-card.primary {
		border-color: var(--primary-200);
		background: var(--primary-50);
	}

	.stat-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.75rem;
	}

	.stat-icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.stat-label {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--surface-700);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.stat-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--surface-900);
		font-variant-numeric: tabular-nums;
		line-height: 1;
		margin-bottom: 0.75rem;
	}

	.separator {
		color: var(--surface-400);
		margin: 0 0.25rem;
	}

	.capacity {
		font-size: 1.5rem;
		color: var(--surface-600);
	}

	.progress-bar-container {
		width: 100%;
		height: 12px;
		background: var(--surface-200);
		border-radius: 6px;
		overflow: hidden;
	}

	.progress-bar {
		height: 100%;
		transition: width 0.3s ease;
		border-radius: 6px;
		background: var(--primary-500);
	}

	.capacity-normal {
		background: var(--success-500);
	}

	.capacity-warning {
		background: var(--warning-500);
	}

	.capacity-critical {
		background: var(--error-500);
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

	/* Happiness Styling */
	.happiness-value {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		margin-bottom: 0.75rem;
	}

	.happiness-percentage {
		font-size: 2rem;
		font-weight: 700;
		font-variant-numeric: tabular-nums;
		line-height: 1;
	}

	.happiness-text {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--surface-600);
	}

	.happiness-very-happy .happiness-percentage {
		color: var(--success-600);
	}

	.happiness-happy .happiness-percentage {
		color: var(--success-500);
	}

	.happiness-content .happiness-percentage {
		color: var(--surface-700);
	}

	.happiness-unhappy .happiness-percentage {
		color: var(--warning-500);
	}

	.happiness-very-unhappy .happiness-percentage {
		color: var(--error-500);
	}

	.happiness-bar.happiness-very-happy {
		background: var(--success-600);
	}

	.happiness-bar.happiness-happy {
		background: var(--success-500);
	}

	.happiness-bar.happiness-content {
		background: var(--surface-500);
	}

	.happiness-bar.happiness-unhappy {
		background: var(--warning-500);
	}

	.happiness-bar.happiness-very-unhappy {
		background: var(--error-500);
	}

	/* Growth Rate */
	.growth-rate.positive {
		color: var(--success-600);
	}

	.growth-rate.negative {
		color: var(--error-600);
	}

	/* Migration */
	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--surface-700);
		margin: 0 0 0.75rem 0;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	.migration-stats {
		background: var(--surface-100);
		border-radius: 6px;
		padding: 1rem;
		border: 1px solid var(--surface-200);
	}

	.migration-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	.migration-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 4px;
		background: var(--surface-50);
	}

	.migration-item.immigrants {
		border-left: 3px solid var(--success-500);
	}

	.migration-item.emigrants {
		border-left: 3px solid var(--error-500);
	}

	.migration-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.migration-info {
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.migration-label {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--surface-600);
	}

	.migration-value {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--surface-900);
		font-variant-numeric: tabular-nums;
	}

	/* Responsive Design */
	@media (max-width: 767px) {
		.panel-header {
			padding: 0.75rem 1rem;
		}

		.population-content {
			padding: 0.75rem;
		}

		.stat-card {
			padding: 0.75rem;
		}

		.stat-value {
			font-size: 1.75rem;
		}

		.migration-grid {
			grid-template-columns: 1fr;
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.progress-bar-container {
			border: 2px solid var(--surface-800);
		}

		.stat-card {
			border-width: 2px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.progress-bar {
			transition: none;
		}

		.capacity-critical {
			animation: none;
		}
	}
</style>
