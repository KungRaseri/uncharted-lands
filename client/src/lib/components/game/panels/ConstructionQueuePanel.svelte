<script lang="ts">
	/**
	 * Construction Queue Panel Component
	 * Displays building progress with time estimates
	 * WCAG 2.1 AA Compliant
	 */

	type BuildingType = 'HOUSE' | 'FARM' | 'WAREHOUSE' | 'WORKSHOP' | 'TOWN_HALL' | 'OTHER';

	interface ResourceCost {
		wood: number;
		stone: number;
		ore?: number;
	}

	interface ConstructionProject {
		id: string;
		buildingName: string;
		buildingType: BuildingType;
		progress: number; // 0-100 percentage
		timeRemaining: number; // seconds
		resourceCosts: ResourceCost;
		queuePosition: number; // 1-based position in queue
		isActive: boolean; // actively building vs queued
	}

	interface Props {
		settlementId: string;
		constructionQueue?: ConstructionProject[];
	}

	let { settlementId: _settlementId, constructionQueue = [] }: Props = $props();

	// Sort queue by position
	const sortedQueue = $derived(
		[...constructionQueue].sort((a, b) => a.queuePosition - b.queuePosition)
	);

	// Active projects
	const activeProjects = $derived(sortedQueue.filter((p) => p.isActive));

	// Queued projects
	const queuedProjects = $derived(sortedQueue.filter((p) => !p.isActive));

	// Get building emoji
	function getBuildingEmoji(type: BuildingType): string {
		switch (type) {
			case 'HOUSE':
				return '🏠';
			case 'FARM':
				return '🌾';
			case 'WAREHOUSE':
				return '📦';
			case 'WORKSHOP':
				return '🔨';
			case 'TOWN_HALL':
				return '🏛️';
			default:
				return '🏗️';
		}
	}

	// Format time remaining as HH:MM:SS
	function formatTimeRemaining(seconds: number): string {
		const hours = Math.floor(seconds / 3600);
		const minutes = Math.floor((seconds % 3600) / 60);
		const secs = seconds % 60;

		// Zero-pad to 2 digits
		const hh = hours.toString().padStart(2, '0');
		const mm = minutes.toString().padStart(2, '0');
		const ss = secs.toString().padStart(2, '0');

		return `${hh}:${mm}:${ss}`;
	}

	// Format resource costs
	function formatResourceCost(costs: ResourceCost): string {
		const parts = [];
		if (costs.wood > 0) parts.push(`${costs.wood} 🪵`);
		if (costs.stone > 0) parts.push(`${costs.stone} 🪨`);
		if (costs.ore && costs.ore > 0) parts.push(`${costs.ore} ⛏️`);
		return parts.join(', ');
	}

	// Get completion time estimate
	function getEstimatedCompletion(timeRemaining: number): string {
		const now = new Date();
		const completionDate = new Date(now.getTime() + timeRemaining * 1000);

		// If today, show time only
		if (completionDate.toDateString() === now.toDateString()) {
			return completionDate.toLocaleTimeString('en-US', {
				hour: 'numeric',
				minute: '2-digit',
				hour12: true
			});
		}

		// Otherwise show date and time
		return completionDate.toLocaleString('en-US', {
			month: 'short',
			day: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}
</script>

<section
	class="bg-surface-50 dark:bg-surface-900 rounded-lg overflow-hidden h-full flex flex-col"
	aria-labelledby="construction-heading"
>
	<header
		class="bg-surface-100 dark:bg-surface-800 border-b border-surface-300 dark:border-surface-700 px-6 py-4 md:px-4 md:py-3"
	>
		<h2
			id="construction-heading"
			class="text-lg font-semibold text-surface-900 dark:text-surface-100 m-0"
		>
			Construction Queue
		</h2>
	</header>

	<div class="flex-1 overflow-y-auto p-4 md:p-3 flex flex-col gap-6">
		{#if sortedQueue.length === 0}
			<!-- Empty State -->
			<div
				class="flex flex-col items-center justify-center py-12 px-4 text-center"
				role="status"
			>
				<span class="text-6xl leading-none mb-4 opacity-50" aria-hidden="true">🏗️</span>
				<p class="text-lg font-semibold text-surface-700 dark:text-surface-300 m-0 mb-2">
					No construction projects
				</p>
				<p class="text-sm text-surface-500 dark:text-surface-400 m-0">
					Build structures to see progress here
				</p>
			</div>
		{:else}
			<!-- Active Projects -->
			{#if activeProjects.length > 0}
				<div class="flex flex-col gap-3">
					<h3
						class="text-sm font-semibold text-surface-700 dark:text-surface-300 m-0 uppercase tracking-wide"
					>
						Building Now ({activeProjects.length})
					</h3>
					<div role="list" aria-label="Active construction projects">
						{#each activeProjects as project (project.id)}
							<div
								class="bg-primary-50 dark:bg-primary-950 rounded-md p-4 md:p-3 border border-primary-300 dark:border-primary-700 flex flex-col gap-3"
								role="listitem"
								data-testid="construction-queue-item"
								data-status="active"
								data-structure-name="{project.buildingName}"
							>
								<div
									class="flex items-start justify-between gap-4 flex-col md:flex-row"
								>
									<div class="flex items-start gap-3 flex-1">
										<span
											class="text-2xl leading-none shrink-0"
											aria-hidden="true"
											>{getBuildingEmoji(project.buildingType)}</span
										>
										<div class="flex flex-col gap-1">
											<h4
												class="text-base font-semibold text-surface-900 dark:text-surface-100 m-0"
											>
												{project.buildingName}
											</h4>
											<p
												class="text-xs text-surface-600 dark:text-surface-400 m-0"
											>
												Position: #{project.queuePosition}
											</p>
										</div>
									</div>
									<div
										class="flex flex-col items-end gap-1 shrink-0 md:items-start w-full md:w-auto"
									>
										<span
											class="text-lg font-bold text-primary-600 dark:text-primary-400 tabular-nums"
											data-testid="time-remaining"
											>{formatTimeRemaining(project.timeRemaining)}</span
										>
										<span
											class="text-xs text-surface-600 dark:text-surface-400 tabular-nums"
											>{getEstimatedCompletion(project.timeRemaining)}</span
										>
									</div>
								</div>

								<!-- Progress Bar -->
								<div
									class="w-full h-6 bg-surface-200 dark:bg-surface-700 rounded-xl overflow-hidden relative"
									role="progressbar"
									aria-valuenow={project.progress}
									aria-valuemin="0"
									aria-valuemax="100"
								aria-label="{project.buildingName} construction progress: {project.progress}%, {formatTimeRemaining(project.timeRemaining)} remaining"
								data-testid="progress-bar"
								data-progress="{project.progress}"
								>
									<div
										class="h-full bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 rounded-xl transition-all duration-500 ease-out flex items-center justify-center"
										style:width="{project.progress}%"
									>
										<span
											class="text-xs font-semibold text-white shadow-sm tabular-nums"
											>{project.progress}%</span
										>
									</div>
								</div>

								<!-- Resource Costs -->
								<div class="flex items-center gap-2 text-sm">
									<span class="text-surface-600 dark:text-surface-400 font-medium"
										>Cost:</span
									>
									<span
										class="text-surface-800 dark:text-surface-200 font-semibold"
										>{formatResourceCost(project.resourceCosts)}</span
									>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Queued Projects -->
			{#if queuedProjects.length > 0}
				<div class="flex flex-col gap-3">
					<h3
						class="text-sm font-semibold text-surface-700 dark:text-surface-300 m-0 uppercase tracking-wide"
					>
						Queued ({queuedProjects.length})
					</h3>
					<div role="list" aria-label="Queued construction projects">
						{#each queuedProjects as project (project.id)}
							<div
								class="bg-surface-100 dark:bg-surface-800 rounded-md p-4 md:p-3 border border-surface-200 dark:border-surface-700 flex flex-col gap-3"
								role="listitem"								data-testid="construction-queue-item"
								data-status="queued"
								data-structure-name="{project.buildingName}"							>
								<div
									class="flex items-start justify-between gap-4 flex-col md:flex-row"
								>
									<div class="flex items-start gap-3 flex-1">
										<span
											class="text-2xl leading-none shrink-0"
											aria-hidden="true"
											>{getBuildingEmoji(project.buildingType)}</span
										>
										<div class="flex flex-col gap-1">
											<h4
												class="text-base font-semibold text-surface-900 dark:text-surface-100 m-0"
											>
												{project.buildingName}
											</h4>
											<p
												class="text-xs text-surface-600 dark:text-surface-400 m-0"
											>
												Position: #{project.queuePosition}
											</p>
										</div>
									</div>
									<div
										class="flex flex-col items-end gap-1 shrink-0 md:items-start w-full md:w-auto"
									>
										<span
											class="text-sm font-medium text-surface-600 dark:text-surface-400 tabular-nums"
											>Est: {formatTimeRemaining(project.timeRemaining)}</span
										>
									</div>
								</div>

								<!-- Resource Costs -->
								<div class="flex items-center gap-2 text-sm">
									<span class="text-surface-600 dark:text-surface-400 font-medium"
										>Cost:</span
									>
									<span
										class="text-surface-800 dark:text-surface-200 font-semibold"
										>{formatResourceCost(project.resourceCosts)}</span
									>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</section>
