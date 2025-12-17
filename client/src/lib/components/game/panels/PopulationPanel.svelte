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

<section
	class="bg-surface-50 dark:bg-surface-900 rounded-lg overflow-hidden h-full flex flex-col"
	aria-labelledby="population-heading"
>
	<header
		class="bg-surface-100 dark:bg-surface-800 border-b border-surface-300 dark:border-surface-700 px-6 py-4"
	>
		<h2
			id="population-heading"
			class="text-lg font-semibold text-surface-900 dark:text-surface-100 m-0"
		>
			Population
		</h2>
	</header>

	<div class="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
		<!-- Population Overview -->
		<div
			class="bg-primary-50 dark:bg-primary-950 rounded-md p-4 border border-primary-200 dark:border-primary-800"
		>
			<div class="flex items-center gap-2 mb-3">
				<span class="text-2xl leading-none" aria-hidden="true">👥</span>
				<h3
					class="text-sm font-semibold text-surface-700 dark:text-surface-300 m-0 uppercase tracking-wider"
				>
					Total Population
				</h3>
			</div>
			<div
				class="text-3xl font-bold text-surface-900 dark:text-surface-100 tabular-nums leading-none mb-3"
				data-testid="current-population"
				aria-label="{formatNumber(population.current)} of {formatNumber(
					population.capacity
				)} capacity"
			>
				<span>{formatNumber(population.current)}</span>
				<span class="text-surface-400 dark:text-surface-600 mx-1">/</span>
				<span class="text-2xl text-surface-600 dark:text-surface-400"
					>{formatNumber(population.capacity)}</span
				>
			</div>
			<!-- Capacity Progress Bar -->
			<div
				class="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-md overflow-hidden"
				role="progressbar"
				aria-valuenow={capacityPercentage}
				aria-valuemin="0"
				aria-valuemax="100"
				aria-label="Population capacity usage"
			>
				<div
					class="h-full transition-all duration-300 rounded-md {capacityWarning ===
					'normal'
						? 'bg-success-500 dark:bg-success-400'
						: capacityWarning === 'warning'
							? 'bg-warning-500 dark:bg-warning-400'
							: 'bg-error-500 dark:bg-error-400 animate-pulse'}"
					style:width="{capacityPercentage}%"
				></div>
			</div>

			{#if capacityWarning === 'critical'}
				<div
					class="mt-3 px-2 py-2 rounded bg-error-100 dark:bg-error-900 text-error-900 dark:text-error-100 border border-error-300 dark:border-error-700 text-sm font-medium flex items-center gap-2"
					role="alert"
				>
					⚠️ Critical: Build more housing immediately!
				</div>
			{:else if capacityWarning === 'warning'}
				<div
					class="mt-3 px-2 py-2 rounded bg-warning-100 dark:bg-warning-900 text-warning-900 dark:text-warning-100 border border-warning-300 dark:border-warning-700 text-sm font-medium flex items-center gap-2"
					role="status"
				>
					⚠️ Warning: Population nearing capacity
				</div>
			{/if}
		</div>

		<!-- Happiness -->
		<div
			class="bg-surface-100 dark:bg-surface-800 rounded-md p-4 border border-surface-200 dark:border-surface-700"
		>
			<div class="flex items-center gap-2 mb-3">
				<span class="text-2xl leading-none" aria-hidden="true">{happinessEmoji}</span>
				<h3
					class="text-sm font-semibold text-surface-700 dark:text-surface-300 m-0 uppercase tracking-wider"
				>
					Happiness
				</h3>
			</div>
			<div
				class="flex flex-col gap-1 mb-3"
				data-testid="happiness"
				aria-label="{happinessLabel}, {population.happiness}%"
			>
				<span
					class="text-3xl font-bold tabular-nums leading-none {happinessLevel ===
					'very-happy'
						? 'text-success-600 dark:text-success-400'
						: happinessLevel === 'happy'
							? 'text-success-500 dark:text-success-400'
							: happinessLevel === 'content'
								? 'text-surface-700 dark:text-surface-300'
								: happinessLevel === 'unhappy'
									? 'text-warning-500 dark:text-warning-400'
									: 'text-error-500 dark:text-error-400'}"
				>
					{population.happiness}%
				</span>
				<span class="text-sm font-medium text-surface-600 dark:text-surface-400">
					{happinessLabel}
				</span>
			</div>
			<!-- Happiness Bar -->
			<div
				class="w-full h-3 bg-surface-200 dark:bg-surface-700 rounded-md overflow-hidden"
				role="progressbar"
				aria-valuenow={population.happiness}
				aria-valuemin="0"
				aria-valuemax="100"
				aria-label="Happiness level"
			>
				<div
					class="h-full transition-all duration-300 rounded-md {happinessLevel ===
					'very-happy'
						? 'bg-success-600 dark:bg-success-400'
						: happinessLevel === 'happy'
							? 'bg-success-500 dark:bg-success-400'
							: happinessLevel === 'content'
								? 'bg-surface-500 dark:bg-surface-400'
								: happinessLevel === 'unhappy'
									? 'bg-warning-500 dark:bg-warning-400'
									: 'bg-error-500 dark:bg-error-400'}"
					style:width="{population.happiness}%"
				></div>
			</div>
		</div>

		<!-- Growth Rate -->
		<div
			class="bg-surface-100 dark:bg-surface-800 rounded-md p-4 border border-surface-200 dark:border-surface-700"
		>
			<div class="flex items-center gap-2 mb-3">
				<span class="text-2xl leading-none" aria-hidden="true">📈</span>
				<h3
					class="text-sm font-semibold text-surface-700 dark:text-surface-300 m-0 uppercase tracking-wider"
				>
					Growth Rate
				</h3>
			</div>
			<div
				class="text-3xl font-bold tabular-nums leading-none {population.growthRate > 0
					? 'text-success-600 dark:text-success-400'
					: population.growthRate < 0
						? 'text-error-600 dark:text-error-400'
						: 'text-surface-700 dark:text-surface-300'}"
				aria-label="Growth rate {formatGrowthRate(population.growthRate)} per hour"
			>
				{formatGrowthRate(population.growthRate)}/hr
			</div>
		</div>

		<!-- Migration Stats -->
		<div
			class="bg-surface-100 dark:bg-surface-800 rounded-md p-4 border border-surface-200 dark:border-surface-700"
		>
			<h3
				class="text-sm font-semibold text-surface-700 dark:text-surface-300 m-0 mb-3 uppercase tracking-wider"
			>
				24-Hour Migration
			</h3>
			<div class="grid grid-cols-2 gap-4">
				<div
					class="flex items-center gap-3 px-3 py-3 rounded bg-surface-50 dark:bg-surface-900 border-l-[3px] border-success-500 dark:border-success-400"
				>
					<span class="text-xl leading-none" aria-hidden="true">➡️</span>
					<div class="flex flex-col gap-0.5">
						<span class="text-xs font-medium text-surface-600 dark:text-surface-400">
							Immigrants
						</span>
						<span
							class="text-xl font-bold text-surface-900 dark:text-surface-100 tabular-nums"
						>
							{formatNumber(population.immigrants)}
						</span>
					</div>
				</div>

				<div
					class="flex items-center gap-3 px-3 py-3 rounded bg-surface-50 dark:bg-surface-900 border-l-[3px] border-error-500 dark:border-error-400"
				>
					<span class="text-xl leading-none" aria-hidden="true">⬅️</span>
					<div class="flex flex-col gap-0.5">
						<span class="text-xs font-medium text-surface-600 dark:text-surface-400"
							>Emigrants</span
						>
						<span
							class="text-xl font-bold text-surface-900 dark:text-surface-100 tabular-nums"
						>
							{formatNumber(population.emigrants)}
						</span>
					</div>
				</div>
			</div>
		</div>
	</div>
</section>
