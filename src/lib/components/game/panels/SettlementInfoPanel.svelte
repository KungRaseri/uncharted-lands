<script lang="ts">
	/**
	 * Settlement Info Panel Component
	 *
	 * Displays high-level settlement information including:
	 * - Settlement name and level
	 * - Population summary (current/capacity)
	 * - Happiness overview
	 * - Location coordinates
	 * - Settlement type/tier
	 *
	 * Part of left sidebar (position 1, 300px width)
	 */

	interface SettlementInfo {
		name: string;
		level: number;
		type: 'OUTPOST' | 'VILLAGE' | 'TOWN' | 'CITY';
		location: {
			x: number;
			y: number;
		};
		population: {
			current: number;
			capacity: number;
		};
		happiness: number; // 0-100
		founded: Date;
		resilience?: number; // 0-100, optional disaster resilience score
	}

	interface Props {
		settlementId: string;
		info?: SettlementInfo;
		collapsed?: boolean;
		onToggleCollapse?: () => void;
	}

	let { settlementId, info, collapsed = false, onToggleCollapse }: Props = $props();

	// Derive settlement type label
	const typeLabel = $derived.by(() => {
		if (!info) return 'Settlement';
		switch (info.type) {
			case 'OUTPOST':
				return 'Outpost';
			case 'VILLAGE':
				return 'Village';
			case 'TOWN':
				return 'Town';
			case 'CITY':
				return 'City';
			default:
				return 'Settlement';
		}
	});

	// Derive happiness status and color
	const happinessStatus = $derived.by(() => {
		if (!info) return { label: 'Unknown', color: 'text-surface-500' };
		const happiness = info.happiness;
		if (happiness >= 75) return { label: 'Happy', color: 'text-success-600 dark:text-success-400' };
		if (happiness >= 50)
			return { label: 'Content', color: 'text-primary-600 dark:text-primary-400' };
		if (happiness >= 25)
			return { label: 'Unhappy', color: 'text-warning-600 dark:text-warning-400' };
		return { label: 'Distressed', color: 'text-error-600 dark:text-error-400' };
	});

	// Format date as "X days ago"
	function formatDaysAgo(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return '1 day ago';
		return `${diffDays} days ago`;
	}
</script>

<div
	class="h-full flex flex-col bg-white dark:bg-surface-800 rounded-lg shadow-md transition-all duration-300 ease-in-out"
	class:max-h-12={collapsed}
	class:overflow-hidden={collapsed}
	role="region"
	aria-label="Settlement Information"
>
	<!-- Panel Header -->
	<button
		type="button"
		class="flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors rounded-t-lg w-full text-left border-b border-surface-200 dark:border-surface-700"
		onclick={onToggleCollapse}
		aria-expanded={!collapsed}
		aria-controls="settlement-info-content"
	>
		<h2 class="m-0 text-lg font-semibold text-surface-900 dark:text-surface-100">
			Settlement Info
		</h2>
		<svg
			class="w-5 h-5 text-surface-600 dark:text-surface-400 transition-transform duration-300"
			class:rotate-180={collapsed}
			fill="none"
			stroke="currentColor"
			viewBox="0 0 24 24"
			aria-hidden="true"
		>
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
		</svg>
	</button>

	<!-- Panel Content -->
	<div id="settlement-info-content" class="flex-1 overflow-y-auto p-4 space-y-4">
		{#if !info}
			<!-- Loading State -->
			<div
				class="flex flex-col items-center justify-center h-full text-surface-500 dark:text-surface-400"
			>
				<svg class="w-8 h-8 mb-2 animate-spin" fill="none" viewBox="0 0 24 24">
					<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"
					></circle>
					<path
						class="opacity-75"
						fill="currentColor"
						d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
					></path>
				</svg>
				<p class="text-sm">Loading settlement info...</p>
			</div>
		{:else}
			<!-- Settlement Name and Type -->
			<div>
				<h3 class="m-0 text-xl font-bold text-surface-900 dark:text-surface-100 mb-1">
					{info.name}
				</h3>
				<div class="flex items-center gap-2">
					<span
						class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
					>
						{typeLabel}
					</span>
					<span class="text-sm text-surface-600 dark:text-surface-400">
						Level {info.level}
					</span>
				</div>
			</div>

			<!-- Population Summary -->
			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-surface-700 dark:text-surface-300">Population</span>
					<span class="text-sm font-semibold text-surface-900 dark:text-surface-100">
						{info.population.current}/{info.population.capacity}
					</span>
				</div>
				<div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
					<div
						class="h-full bg-primary-500 dark:bg-primary-400 transition-all duration-300"
						style="width: {Math.min(
							100,
							(info.population.current / info.population.capacity) * 100
						)}%"
						role="progressbar"
						aria-valuenow={info.population.current}
						aria-valuemin={0}
						aria-valuemax={info.population.capacity}
						aria-label="Population capacity"
					></div>
				</div>
				<p class="text-xs text-surface-500 dark:text-surface-400 m-0">
					{Math.round((info.population.current / info.population.capacity) * 100)}% capacity
				</p>
			</div>

			<!-- Happiness Overview -->
			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-surface-700 dark:text-surface-300">Happiness</span>
					<span class="text-sm font-semibold {happinessStatus.color}">
						{happinessStatus.label}
					</span>
				</div>
				<div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
					<div
						class="h-full transition-all duration-300"
						class:bg-success-500={info.happiness >= 75}
						class:dark:bg-success-400={info.happiness >= 75}
						class:bg-primary-500={info.happiness >= 50 && info.happiness < 75}
						class:dark:bg-primary-400={info.happiness >= 50 && info.happiness < 75}
						class:bg-warning-500={info.happiness >= 25 && info.happiness < 50}
						class:dark:bg-warning-400={info.happiness >= 25 && info.happiness < 50}
						class:bg-error-500={info.happiness < 25}
						class:dark:bg-error-400={info.happiness < 25}
						style="width: {info.happiness}%"
						role="progressbar"
						aria-valuenow={info.happiness}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label="Settlement happiness"
					></div>
				</div>
				<p class="text-xs text-surface-500 dark:text-surface-400 m-0">
					{info.happiness}% happiness
				</p>
			</div>

			<!-- Location -->
			<div class="space-y-1">
				<span class="block text-sm font-medium text-surface-700 dark:text-surface-300"
					>Location</span
				>
				<div class="flex items-center gap-1 text-sm text-surface-600 dark:text-surface-400">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
						/>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
						/>
					</svg>
					<span>({info.location.x}, {info.location.y})</span>
				</div>
			</div>

			<!-- Founded Date -->
			<div class="space-y-1">
				<span class="block text-sm font-medium text-surface-700 dark:text-surface-300">Founded</span
				>
				<p class="text-sm text-surface-600 dark:text-surface-400 m-0">
					{formatDaysAgo(info.founded)}
				</p>
			</div>

			<!-- Resilience (if available) -->
			{#if info.resilience !== undefined}
				<div class="space-y-1">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-surface-700 dark:text-surface-300">
							Disaster Resilience
						</span>
						<span class="text-sm font-semibold text-surface-900 dark:text-surface-100">
							{info.resilience}%
						</span>
					</div>
					<div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
						<div
							class="h-full bg-secondary-500 dark:bg-secondary-400 transition-all duration-300"
							style="width: {info.resilience}%"
							role="progressbar"
							aria-valuenow={info.resilience}
							aria-valuemin={0}
							aria-valuemax={100}
							aria-label="Disaster resilience score"
						></div>
					</div>
				</div>
			{/if}
		{/if}
	</div>
</div>
