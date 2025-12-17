<script lang="ts">
	/**
	 * Production Overview Panel Component
	 *
	 * Displays comprehensive resource production information:
	 * - Resource production breakdown (all 5 resources)
	 * - Active extractor list with locations
	 * - Production rates (per hour/day)
	 * - Resource quality indicators
	 * - Structure health status
	 */

	interface ResourceRates {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	}

	interface Props {
		settlementId: string;
		production?: {
			rates: ResourceRates;
			extractors: Array<{
				id: string;
				type: 'FARM' | 'WELL' | 'LUMBER_MILL' | 'QUARRY' | 'MINE';
				name: string;
				level: number;
				health: number;
				quality: number; // 0-100
				production: number; // per hour
				location?: { x: number; y: number };
			}>;
		};
	}

	let { settlementId, production }: Props = $props();

	// Calculate total production per resource type
	const totalProduction = $derived.by((): ResourceRates => {
		if (!production?.rates) return { food: 0, water: 0, wood: 0, stone: 0, ore: 0 };
		return production.rates;
	});

	// Calculate per-day rates (multiply hourly by 24)
	const dailyProduction = $derived.by(
		(): ResourceRates => ({
			food: totalProduction.food * 24,
			water: totalProduction.water * 24,
			wood: totalProduction.wood * 24,
			stone: totalProduction.stone * 24,
			ore: totalProduction.ore * 24
		})
	);

	// Group extractors by type
	const extractorsByType = $derived.by(() => {
		if (!production?.extractors) return {};

		const grouped: Record<
			string,
			Array<{
				id: string;
				type: string;
				name: string;
				level: number;
				health: number;
				quality: number;
				production: number;
				location?: { x: number; y: number };
			}>
		> = {};

		production.extractors.forEach((extractor) => {
			const type = extractor.type;
			if (!grouped[type]) grouped[type] = [];
			grouped[type].push(extractor);
		});

		return grouped;
	});

	// Get health color class
	function getHealthColor(health: number): string {
		if (health >= 80) return 'text-success-600 dark:text-success-400';
		if (health >= 50) return 'text-warning-600 dark:text-warning-400';
		return 'text-error-600 dark:text-error-400';
	}

	// Get quality color class
	function getQualityColor(quality: number): string {
		if (quality >= 70) return 'text-success-600 dark:text-success-400';
		if (quality >= 40) return 'text-warning-600 dark:text-warning-400';
		return 'text-error-600 dark:text-error-400';
	}

	// Get resource icon
	function getResourceIcon(resource: string): string {
		switch (resource) {
			case 'food':
				return '🌾';
			case 'water':
				return '💧';
			case 'wood':
				return '🪵';
			case 'stone':
				return '🪨';
			case 'ore':
				return '⛏️';
			default:
				return '📦';
		}
	}

	// Get extractor type display name
	function getExtractorTypeName(type: string): string {
		switch (type) {
			case 'FARM':
				return 'Farms';
			case 'WELL':
				return 'Wells';
			case 'LUMBER_MILL':
				return 'Lumber Mills';
			case 'QUARRY':
				return 'Quarries';
			case 'MINE':
				return 'Mines';
			default:
				return type;
		}
	}

	// Format number with commas
	function formatNumber(num: number): string {
		return Math.round(num).toLocaleString();
	}
</script>

<div
	class="flex flex-col h-full bg-white dark:bg-surface-800 rounded-lg border border-surface-200 dark:border-surface-700 overflow-hidden"
>
	<!-- Panel Header -->
	<div
		class="flex items-center justify-between px-4 py-3 border-b border-surface-200 dark:border-surface-700 bg-surface-50 dark:bg-surface-900"
	>
		<h2 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-100">
			⚡ Production Overview
		</h2>
		<button
			type="button"
			class="px-3 py-1.5 text-sm rounded-md bg-primary-500 text-white hover:bg-primary-600 transition-colors"
			aria-label="Optimize production"
		>
			Optimize
		</button>
	</div>

	<!-- Panel Content -->
	<div class="flex-1 overflow-y-auto p-4">
		{#if !production?.rates}
			<!-- Loading/Empty State -->
			<div
				class="flex flex-col items-center justify-center h-full text-surface-500 dark:text-surface-400"
			>
				<p class="m-0 text-sm">No production data available</p>
				<p class="mt-2 text-xs">Start building extractors to see production rates</p>
			</div>
		{:else}
			<!-- Resource Production Summary -->
			<div class="mb-6">
				<h3
					class="m-0 mb-3 text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide"
				>
					Resource Production
				</h3>
				<div class="grid grid-cols-1 gap-3">
					{#each Object.entries(totalProduction) as [resource, hourlyRate]}
						{@const resourceKey = resource as keyof ResourceRates}
						<div
							class="flex items-center justify-between p-3 rounded-lg bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700"
						>
							<div class="flex items-center gap-2">
								<span class="text-2xl" role="img" aria-label={resource}>
									{getResourceIcon(resource)}
								</span>
								<div>
									<p
										class="m-0 text-sm font-medium text-surface-900 dark:text-surface-100 capitalize"
									>
										{resource}
									</p>
									<p class="m-0 text-xs text-surface-600 dark:text-surface-400">
										Per Day: {formatNumber(dailyProduction[resourceKey])}
									</p>
								</div>
							</div>
							<div class="text-right">
								<p
									class="m-0 text-lg font-bold text-primary-600 dark:text-primary-400"
								>
									+{formatNumber(hourlyRate)}
								</p>
								<p class="m-0 text-xs text-surface-600 dark:text-surface-400">
									per hour
								</p>
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Active Extractors -->
			{#if production.extractors && production.extractors.length > 0}
				<div class="mb-6">
					<h3
						class="m-0 mb-3 text-sm font-semibold text-surface-700 dark:text-surface-300 uppercase tracking-wide"
					>
						Active Extractors ({production.extractors.length})
					</h3>

					<!-- Group by type -->
					{#each Object.entries(extractorsByType) as [type, extractors]}
						<div class="mb-4">
							<h4
								class="m-0 mb-2 text-xs font-semibold text-surface-600 dark:text-surface-400"
							>
								{getExtractorTypeName(type)} ({extractors.length})
							</h4>
							<div class="space-y-2">
								{#each extractors as extractor}
									<div
										class="flex items-center justify-between p-2 rounded-md bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 hover:border-primary-500 dark:hover:border-primary-400 transition-colors"
									>
										<div class="flex-1">
											<div class="flex items-center gap-2">
												<p
													class="m-0 text-sm font-medium text-surface-900 dark:text-surface-100"
												>
													{extractor.name}
												</p>
												<span
													class="px-1.5 py-0.5 text-[0.625rem] font-semibold rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300"
												>
													Lv {extractor.level}
												</span>
											</div>
											{#if extractor.location}
												<p
													class="m-0 mt-0.5 text-xs text-surface-600 dark:text-surface-400"
												>
													Location: ({extractor.location.x}, {extractor
														.location.y})
												</p>
											{/if}
										</div>
										<div class="flex items-center gap-4">
											<!-- Health -->
											<div class="text-center">
												<p
													class="m-0 text-xs text-surface-600 dark:text-surface-400"
												>
													Health
												</p>
												<p
													class="m-0 text-sm font-semibold {getHealthColor(
														extractor.health
													)}"
												>
													{extractor.health}%
												</p>
											</div>
											<!-- Quality -->
											<div class="text-center">
												<p
													class="m-0 text-xs text-surface-600 dark:text-surface-400"
												>
													Quality
												</p>
												<p
													class="m-0 text-sm font-semibold {getQualityColor(
														extractor.quality
													)}"
												>
													{extractor.quality}%
												</p>
											</div>
											<!-- Production -->
											<div class="text-center">
												<p
													class="m-0 text-xs text-surface-600 dark:text-surface-400"
												>
													Output
												</p>
												<p
													class="m-0 text-sm font-semibold text-success-600 dark:text-success-400"
												>
													+{formatNumber(extractor.production)}/hr
												</p>
											</div>
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/each}
				</div>
			{/if}

			<!-- Production Efficiency Metrics -->
			<div
				class="mt-6 p-4 rounded-lg bg-primary-50 dark:bg-primary-950 border border-primary-200 dark:border-primary-800"
			>
				<h3 class="m-0 mb-2 text-sm font-semibold text-primary-900 dark:text-primary-100">
					💡 Production Tips
				</h3>
				<ul class="m-0 pl-5 space-y-1 text-xs text-primary-800 dark:text-primary-200">
					<li>Upgrade extractors to increase production rates</li>
					<li>Repair damaged structures to restore full production</li>
					<li>Build on high-quality tiles for better yields</li>
					<li>Monitor resource consumption to avoid shortages</li>
				</ul>
			</div>
		{/if}
	</div>
</div>
