<script lang="ts">
	import { onMount } from 'svelte';
	import { formatDistanceToNow, format } from 'date-fns';
	import type {
		DisasterHistory,
		DisasterHistoryFilters,
		DisasterHistorySort,
		DisasterHistorySortBy
	} from '$lib/types/disaster';
	import { API_URL } from '$lib/config';

	interface Props {
		settlementId: string;
	}

	let { settlementId }: Props = $props();

	// State
	let disasters = $state<DisasterHistory[]>([]);
	let loading = $state(true);
	let error = $state<string | null>(null);

	// Filtering state
	let filters = $state<DisasterHistoryFilters>({
		type: undefined,
		severityLevel: undefined,
		fromDate: undefined,
		toDate: undefined
	});

	// Sorting state
	let sort = $state<DisasterHistorySort>({
		by: 'timestamp',
		direction: 'desc'
	});

	// Expanded disaster state (for detail view)
	let expandedId = $state<string | null>(null);

	// Disaster type options for filter dropdown
	const DISASTER_TYPES = [
		'EARTHQUAKE',
		'FLOOD',
		'DROUGHT',
		'WILDFIRE',
		'TSUNAMI',
		'HURRICANE',
		'TORNADO',
		'BLIZZARD',
		'HEATWAVE',
		'PLAGUE',
		'LOCUST_SWARM',
		'BLIGHT',
		'VOLCANIC_ERUPTION',
		'LANDSLIDE',
		'SINKHOLE'
	];

	const SEVERITY_LEVELS = ['MILD', 'MODERATE', 'MAJOR', 'CATASTROPHIC'];

	// Derived: Filtered and sorted disasters
	const filteredDisasters = $derived(() => {
		let result = [...disasters];

		// Apply type filter
		if (filters.type) {
			result = result.filter((d) => d.type === filters.type);
		}

		// Apply severity filter
		if (filters.severityLevel) {
			result = result.filter((d) => d.severityLevel === filters.severityLevel);
		}

		// Apply date range filters
		if (filters.fromDate) {
			const fromTime = new Date(filters.fromDate).getTime();
			result = result.filter((d) => new Date(d.timestamp).getTime() >= fromTime);
		}
		if (filters.toDate) {
			const toTime = new Date(filters.toDate).getTime();
			result = result.filter((d) => new Date(d.timestamp).getTime() <= toTime);
		}

		// Apply sorting
		result.sort((a, b) => {
			let aVal: any, bVal: any;

			switch (sort.by) {
				case 'timestamp':
					aVal = new Date(a.timestamp).getTime();
					bVal = new Date(b.timestamp).getTime();
					break;
				case 'severity':
					aVal = a.severity;
					bVal = b.severity;
					break;
				case 'casualties':
					aVal = a.casualties;
					bVal = b.casualties;
					break;
				case 'type':
					aVal = a.type;
					bVal = b.type;
					break;
			}

			if (sort.direction === 'asc') {
				return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
			} else {
				return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
			}
		});

		return result;
	});

	// Fetch disaster history from API
	async function fetchDisasterHistory() {
		loading = true;
		error = null;

		try {
			const response = await fetch(`${API_URL}/settlements/${settlementId}/disaster-history`, {
				credentials: 'include' // Include session cookie
			});

			if (!response.ok) {
				if (response.status === 401) {
					throw new Error('Authentication required');
				} else if (response.status === 403) {
					throw new Error('You do not have permission to view this settlement');
				} else if (response.status === 404) {
					throw new Error('Settlement not found');
				} else {
					throw new Error('Failed to fetch disaster history');
				}
			}

			const data = await response.json();
			disasters = data;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Unknown error occurred';
			console.error('[DisasterHistoryPanel] Fetch error:', err);
		} finally {
			loading = false;
		}
	}

	// Load disaster history on mount
	onMount(() => {
		fetchDisasterHistory();
	});

	// Helper: Get disaster type emoji
	function getDisasterEmoji(type: string): string {
		const emojiMap: Record<string, string> = {
			EARTHQUAKE: '🌍',
			FLOOD: '🌊',
			DROUGHT: '🏜️',
			WILDFIRE: '🔥',
			TSUNAMI: '🌊',
			HURRICANE: '🌀',
			TORNADO: '🌪️',
			BLIZZARD: '❄️',
			HEATWAVE: '🌡️',
			PLAGUE: '🦠',
			LOCUST_SWARM: '🦗',
			BLIGHT: '🍂',
			VOLCANIC_ERUPTION: '🌋',
			LANDSLIDE: '⛰️',
			SINKHOLE: '🕳️'
		};
		return emojiMap[type] || '⚠️';
	}

	// Helper: Get severity badge color
	function getSeverityColor(severityLevel: string): string {
		const colorMap: Record<string, string> = {
			MILD: 'variant-ghost-success',
			MODERATE: 'variant-ghost-warning',
			MAJOR: 'variant-ghost-error',
			CATASTROPHIC: 'variant-filled-error'
		};
		return colorMap[severityLevel] || 'variant-ghost-surface';
	}

	// Helper: Format disaster type for display
	function formatDisasterType(type: string): string {
		return type
			.split('_')
			.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
			.join(' ');
	}

	// Helper: Calculate total resource loss
	function getTotalResourceLoss(disaster: DisasterHistory): number {
		const resources = disaster.resourcesLost;
		return (
			(resources.food || 0) +
			(resources.water || 0) +
			(resources.wood || 0) +
			(resources.stone || 0) +
			(resources.ore || 0)
		);
	}

	// Toggle expanded view
	function toggleExpanded(id: string) {
		expandedId = expandedId === id ? null : id;
	}

	// Reset filters
	function resetFilters() {
		filters = {
			type: undefined,
			severityLevel: undefined,
			fromDate: undefined,
			toDate: undefined
		};
	}

	// Change sort
	function changeSort(field: DisasterHistorySortBy) {
		if (sort.by === field) {
			// Toggle direction if same field
			sort = { by: field, direction: sort.direction === 'asc' ? 'desc' : 'asc' };
		} else {
			// Default to desc for new field
			sort = { by: field, direction: 'desc' };
		}
	}
</script>

<div class="disaster-history-panel card p-4 space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<h3 class="h3">📜 Disaster History</h3>
		<button
			class="btn btn-sm variant-ghost-surface"
			onclick={fetchDisasterHistory}
			disabled={loading}
		>
			🔄 Refresh
		</button>
	</div>

	<!-- Filters -->
	<div class="filters card variant-ghost-surface p-3 space-y-2">
		<div class="flex items-center justify-between">
			<h4 class="h4 text-sm">Filters</h4>
			<button class="btn btn-sm variant-ghost-primary" onclick={resetFilters}> Clear All </button>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
			<!-- Type Filter -->
			<label class="label">
				<span class="text-xs">Type</span>
				<select class="select" bind:value={filters.type}>
					<option value={undefined}>All Types</option>
					{#each DISASTER_TYPES as type}
						<option value={type}>
							{getDisasterEmoji(type)}
							{formatDisasterType(type)}
						</option>
					{/each}
				</select>
			</label>

			<!-- Severity Filter -->
			<label class="label">
				<span class="text-xs">Severity</span>
				<select class="select" bind:value={filters.severityLevel}>
					<option value={undefined}>All Severities</option>
					{#each SEVERITY_LEVELS as level}
						<option value={level}>{level}</option>
					{/each}
				</select>
			</label>

			<!-- From Date Filter -->
			<label class="label">
				<span class="text-xs">From Date</span>
				<input type="date" class="input" bind:value={filters.fromDate} />
			</label>

			<!-- To Date Filter -->
			<label class="label">
				<span class="text-xs">To Date</span>
				<input type="date" class="input" bind:value={filters.toDate} />
			</label>
		</div>
	</div>

	<!-- Sorting -->
	<div class="sorting flex items-center gap-2 text-sm">
		<span class="font-semibold">Sort by:</span>
		<button
			class="btn btn-sm {sort.by === 'timestamp'
				? 'variant-filled-primary'
				: 'variant-ghost-surface'}"
			onclick={() => changeSort('timestamp')}
		>
			Time {sort.by === 'timestamp' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
		</button>
		<button
			class="btn btn-sm {sort.by === 'severity'
				? 'variant-filled-primary'
				: 'variant-ghost-surface'}"
			onclick={() => changeSort('severity')}
		>
			Severity {sort.by === 'severity' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
		</button>
		<button
			class="btn btn-sm {sort.by === 'casualties'
				? 'variant-filled-primary'
				: 'variant-ghost-surface'}"
			onclick={() => changeSort('casualties')}
		>
			Casualties {sort.by === 'casualties' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
		</button>
		<button
			class="btn btn-sm {sort.by === 'type' ? 'variant-filled-primary' : 'variant-ghost-surface'}"
			onclick={() => changeSort('type')}
		>
			Type {sort.by === 'type' ? (sort.direction === 'asc' ? '↑' : '↓') : ''}
		</button>
	</div>

	<!-- Loading State -->
	{#if loading}
		<div class="loading card variant-ghost-surface p-8 text-center">
			<div class="animate-pulse space-y-2">
				<p class="text-lg">⏳ Loading disaster history...</p>
				<p class="text-sm opacity-70">Fetching records from database</p>
			</div>
		</div>
	{/if}

	<!-- Error State -->
	{#if error}
		<div class="error card variant-filled-error p-4 text-center space-y-2">
			<p class="font-semibold">❌ Error Loading History</p>
			<p class="text-sm">{error}</p>
			<button class="btn variant-ghost-surface" onclick={fetchDisasterHistory}> Try Again </button>
		</div>
	{/if}

	<!-- Empty State -->
	{#if !loading && !error && filteredDisasters().length === 0}
		<div class="empty card variant-ghost-surface p-8 text-center space-y-2">
			{#if disasters.length === 0}
				<p class="text-lg">🎉 No Disasters Yet</p>
				<p class="text-sm opacity-70">Your settlement has not experienced any disasters.</p>
			{:else}
				<p class="text-lg">🔍 No Results</p>
				<p class="text-sm opacity-70">No disasters match your current filters.</p>
				<button class="btn btn-sm variant-ghost-primary" onclick={resetFilters}>
					Clear Filters
				</button>
			{/if}
		</div>
	{/if}

	<!-- Disaster List -->
	{#if !loading && !error && filteredDisasters().length > 0}
		<div class="disaster-list space-y-3">
			<p class="text-sm opacity-70">
				Showing {filteredDisasters().length} of {disasters.length} disaster{disasters.length === 1
					? ''
					: 's'}
			</p>

			<!-- Disaster Cards (Virtual Scrolling Container) -->
			<div class="disaster-cards max-h-[600px] overflow-y-auto space-y-2 pr-2">
				{#each filteredDisasters() as disaster (disaster.id)}
					<div
						class="disaster-card card variant-ghost-surface hover:variant-ghost-primary transition-all cursor-pointer"
						onclick={() => toggleExpanded(disaster.id)}
						role="button"
						tabindex="0"
						onkeydown={(e) => e.key === 'Enter' && toggleExpanded(disaster.id)}
					>
						<!-- Card Header (Always Visible) -->
						<div class="card-header p-3 flex items-start justify-between gap-3">
							<!-- Left: Icon + Type + Time -->
							<div class="flex items-start gap-2 flex-1 min-w-0">
								<span class="text-2xl flex-shrink-0">{getDisasterEmoji(disaster.type)}</span>
								<div class="flex-1 min-w-0">
									<h4 class="h4 text-sm font-semibold truncate">
										{formatDisasterType(disaster.type)}
									</h4>
									<p
										class="text-xs opacity-70"
										title={format(new Date(disaster.timestamp), 'PPpp')}
									>
										{formatDistanceToNow(new Date(disaster.timestamp), { addSuffix: true })}
									</p>
								</div>
							</div>

							<!-- Right: Severity Badge -->
							<div class="flex-shrink-0">
								<span class="badge {getSeverityColor(disaster.severityLevel)} text-xs">
									{disaster.severityLevel}
								</span>
							</div>
						</div>

						<!-- Card Body (Compact Stats - Always Visible) -->
						<div class="card-body p-3 pt-0 grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
							<div class="stat">
								<span class="opacity-70">Casualties:</span>
								<span class="font-semibold text-error-500">{disaster.casualties}</span>
							</div>
							<div class="stat">
								<span class="opacity-70">Structures:</span>
								<span class="font-semibold text-warning-500"
									>{disaster.structuresDamaged + disaster.structuresDestroyed}</span
								>
							</div>
							<div class="stat">
								<span class="opacity-70">Resources:</span>
								<span class="font-semibold text-primary-500">{getTotalResourceLoss(disaster)}</span>
							</div>
							<div class="stat">
								<span class="opacity-70">Resilience:</span>
								<span class="font-semibold text-success-500">+{disaster.resilienceGained}</span>
							</div>
						</div>

						<!-- Expanded Details (Toggled) -->
						{#if expandedId === disaster.id}
							<div class="card-footer p-3 pt-0 border-t border-surface-300-600-token mt-2">
								<div class="space-y-3">
									<!-- Severity Meter -->
									<div>
										<div class="flex justify-between text-xs mb-1">
											<span>Severity</span>
											<span class="font-semibold">{disaster.severity}/100</span>
										</div>
										<div class="w-full bg-surface-300-600-token rounded-full h-2">
											<div
												class="h-2 rounded-full transition-all {disaster.severity >= 75
													? 'bg-error-500'
													: disaster.severity >= 50
														? 'bg-warning-500'
														: disaster.severity >= 25
															? 'bg-primary-500'
															: 'bg-success-500'}"
												style="width: {disaster.severity}%"
											></div>
										</div>
									</div>

									<!-- Detailed Impact -->
									<div class="grid grid-cols-1 md:grid-cols-2 gap-3">
										<!-- Population Impact -->
										<div class="impact-section space-y-1">
											<h5 class="font-semibold text-xs">👥 Population Impact</h5>
											<p class="text-xs">
												<span class="opacity-70">Casualties:</span>
												<span class="text-error-500 font-semibold">{disaster.casualties}</span>
											</p>
										</div>

										<!-- Structure Impact -->
										<div class="impact-section space-y-1">
											<h5 class="font-semibold text-xs">🏗️ Structure Impact</h5>
											<p class="text-xs">
												<span class="opacity-70">Damaged:</span>
												<span class="text-warning-500 font-semibold"
													>{disaster.structuresDamaged}</span
												>
											</p>
											<p class="text-xs">
												<span class="opacity-70">Destroyed:</span>
												<span class="text-error-500 font-semibold"
													>{disaster.structuresDestroyed}</span
												>
											</p>
										</div>

										<!-- Resource Loss -->
										<div class="impact-section space-y-1">
											<h5 class="font-semibold text-xs">📦 Resources Lost</h5>
											{#if disaster.resourcesLost.food}
												<p class="text-xs">🌾 Food: {disaster.resourcesLost.food}</p>
											{/if}
											{#if disaster.resourcesLost.water}
												<p class="text-xs">💧 Water: {disaster.resourcesLost.water}</p>
											{/if}
											{#if disaster.resourcesLost.wood}
												<p class="text-xs">🪵 Wood: {disaster.resourcesLost.wood}</p>
											{/if}
											{#if disaster.resourcesLost.stone}
												<p class="text-xs">🪨 Stone: {disaster.resourcesLost.stone}</p>
											{/if}
											{#if disaster.resourcesLost.ore}
												<p class="text-xs">⛏️ Ore: {disaster.resourcesLost.ore}</p>
											{/if}
											{#if getTotalResourceLoss(disaster) === 0}
												<p class="text-xs opacity-50">No resources lost</p>
											{/if}
										</div>

										<!-- Recovery -->
										<div class="impact-section space-y-1">
											<h5 class="font-semibold text-xs">💪 Recovery</h5>
											<p class="text-xs">
												<span class="opacity-70">Resilience Gained:</span>
												<span class="text-success-500 font-semibold"
													>+{disaster.resilienceGained}</span
												>
											</p>
											<p class="text-xs opacity-70">
												Survived: {format(new Date(disaster.timestamp), 'PP')}
											</p>
										</div>
									</div>

									<!-- Click to Collapse -->
									<p class="text-xs text-center opacity-50 italic">Click to collapse</p>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	/* Custom scrollbar for disaster list */
	.disaster-cards::-webkit-scrollbar {
		width: 8px;
	}

	.disaster-cards::-webkit-scrollbar-track {
		background: rgba(var(--color-surface-300) / 0.3);
		border-radius: 4px;
	}

	.disaster-cards::-webkit-scrollbar-thumb {
		background: rgba(var(--color-primary-500) / 0.5);
		border-radius: 4px;
	}

	.disaster-cards::-webkit-scrollbar-thumb:hover {
		background: rgba(var(--color-primary-500) / 0.7);
	}

	/* Smooth expand/collapse animation */
	.card-footer {
		animation: slideDown 0.2s ease-out;
	}

	@keyframes slideDown {
		from {
			opacity: 0;
			transform: translateY(-10px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	/* Responsive grid adjustments */
	@media (max-width: 768px) {
		.disaster-cards {
			max-height: 400px;
		}
	}
</style>
