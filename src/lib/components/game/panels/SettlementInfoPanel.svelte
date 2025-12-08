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

	import { populationStore } from '$lib/stores/game/population.svelte';

	interface Settlement {
		id: string;
		name: string;
		tileId: string;
		playerProfileId: string;
		worldId: string;
		resilience: number | null;
		createdAt: string | Date;
		Tile?: {
			xCoord: number;
			yCoord: number;
		} | null;
	}

	interface Props {
		settlementId: string;
		settlement: Settlement;
		collapsed?: boolean;
		onToggleCollapse?: () => void;
	}

	let { settlementId, settlement, collapsed = false, onToggleCollapse }: Props = $props();

	// Get real population data from store
	const populationData = $derived(populationStore.getSettlement(settlementId));

	// Calculate population capacity from structures (simplified for now)
	// In reality, this should come from settlement structures
	const populationCapacity = $derived(populationData?.capacity ?? 100);
	const currentPopulation = $derived(populationData?.current ?? 0);
	const happiness = $derived(populationData?.happiness ?? 50);

	// Derive settlement type based on population (simplified)
	const settlementType = $derived.by(() => {
		if (currentPopulation >= 500) return 'CITY';
		if (currentPopulation >= 200) return 'TOWN';
		if (currentPopulation >= 50) return 'VILLAGE';
		return 'OUTPOST';
	});

	// Derive settlement type label
	const typeLabel = $derived.by(() => {
		switch (settlementType) {
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
		if (happiness >= 75) return { label: 'Happy', color: 'text-success-600 dark:text-success-400' };
		if (happiness >= 50)
			return { label: 'Content', color: 'text-primary-600 dark:text-primary-400' };
		if (happiness >= 25)
			return { label: 'Unhappy', color: 'text-warning-600 dark:text-warning-400' };
		return { label: 'Distressed', color: 'text-error-600 dark:text-error-400' };
	});

	// Format date as "X days ago"
	function formatDaysAgo(dateInput: string | Date): string {
		const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
		if (diffDays === 0) return 'Today';
		if (diffDays === 1) return '1 day ago';
		return `${diffDays} days ago`;
	}

	// Calculate settlement level based on population (simplified)
	const settlementLevel = $derived(Math.floor(currentPopulation / 50) + 1);
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
		{#if !settlement}
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
					{settlement.name}
				</h3>
				<div class="flex items-center gap-2">
					<span
						class="inline-block px-2 py-0.5 text-xs font-medium rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
					>
						{typeLabel}
					</span>
					<span class="text-sm text-surface-600 dark:text-surface-400">
						Level {settlementLevel}
					</span>
				</div>
			</div>

			<!-- Population Summary -->
			<div class="space-y-1">
				<div class="flex items-center justify-between">
					<span class="text-sm font-medium text-surface-700 dark:text-surface-300">Population</span>
					<span class="text-sm font-semibold text-surface-900 dark:text-surface-100">
						{currentPopulation}/{populationCapacity}
					</span>
				</div>
				<div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
					<div
						class="h-full bg-primary-500 dark:bg-primary-400 transition-all duration-300"
						style="width: {Math.min(100, (currentPopulation / populationCapacity) * 100)}%"
						role="progressbar"
						aria-valuenow={currentPopulation}
						aria-valuemin={0}
						aria-valuemax={populationCapacity}
						aria-label="Population capacity"
					></div>
				</div>
				<p class="text-xs text-surface-500 dark:text-surface-400 m-0">
					{Math.round((currentPopulation / populationCapacity) * 100)}% capacity
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
						class:bg-success-500={happiness >= 75}
						class:dark:bg-success-400={happiness >= 75}
						class:bg-primary-500={happiness >= 50 && happiness < 75}
						class:dark:bg-primary-400={happiness >= 50 && happiness < 75}
						class:bg-warning-500={happiness >= 25 && happiness < 50}
						class:dark:bg-warning-400={happiness >= 25 && happiness < 50}
						class:bg-error-500={happiness < 25}
						class:dark:bg-error-400={happiness < 25}
						style="width: {happiness}%"
						role="progressbar"
						aria-valuenow={happiness}
						aria-valuemin={0}
						aria-valuemax={100}
						aria-label="Settlement happiness"
					></div>
				</div>
				<p class="text-xs text-surface-500 dark:text-surface-400 m-0">
					{happiness}% happiness
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
					<span>({settlement.Tile?.xCoord ?? 0}, {settlement.Tile?.yCoord ?? 0})</span>
				</div>
			</div>

			<!-- Founded Date -->
			<div class="space-y-1">
				<span class="block text-sm font-medium text-surface-700 dark:text-surface-300">Founded</span
				>
				<p class="text-sm text-surface-600 dark:text-surface-400 m-0">
					{formatDaysAgo(settlement.createdAt)}
				</p>
			</div>

			<!-- Resilience (if available) -->
			{#if settlement.resilience !== undefined && settlement.resilience !== null}
				<div class="space-y-1">
					<div class="flex items-center justify-between">
						<span class="text-sm font-medium text-surface-700 dark:text-surface-300">
							Disaster Resilience
						</span>
						<span class="text-sm font-semibold text-surface-900 dark:text-surface-100">
							{settlement.resilience}%
						</span>
					</div>
					<div class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-2 overflow-hidden">
						<div
							class="h-full bg-secondary-500 dark:bg-secondary-400 transition-all duration-300"
							style="width: {settlement.resilience}%"
							role="progressbar"
							aria-valuenow={settlement.resilience}
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
