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

	// Format time remaining
	function formatTimeRemaining(seconds: number): string {
		if (seconds < 60) {
			return `${seconds}s`;
		}

		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);

		if (days > 0) {
			const remainingHours = hours % 24;
			return `${days}d ${remainingHours}h`;
		}

		if (hours > 0) {
			const remainingMinutes = minutes % 60;
			return `${hours}h ${remainingMinutes}m`;
		}

		return `${minutes}m`;
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

<section class="construction-queue-panel" aria-labelledby="construction-heading">
	<header class="panel-header">
		<h2 id="construction-heading" class="panel-title">Construction Queue</h2>
	</header>

	<div class="queue-content">
		{#if sortedQueue.length === 0}
			<!-- Empty State -->
			<div class="empty-state" role="status">
				<span class="empty-icon" aria-hidden="true">🏗️</span>
				<p class="empty-message">No construction projects</p>
				<p class="empty-hint">Build structures to see progress here</p>
			</div>
		{:else}
			<!-- Active Projects -->
			{#if activeProjects.length > 0}
				<div class="queue-section">
					<h3 class="section-title">Building Now ({activeProjects.length})</h3>
					<div role="list" aria-label="Active construction projects">
						{#each activeProjects as project (project.id)}
							<div class="project-card active" role="listitem">
								<div class="project-header">
									<div class="project-info">
										<span class="project-icon" aria-hidden="true"
											>{getBuildingEmoji(project.buildingType)}</span
										>
										<div class="project-details">
											<h4 class="project-name">{project.buildingName}</h4>
											<p class="project-position">
												Position: #{project.queuePosition}
											</p>
										</div>
									</div>
									<div class="project-time">
										<span class="time-remaining">{formatTimeRemaining(project.timeRemaining)}</span>
										<span class="completion-time"
											>{getEstimatedCompletion(project.timeRemaining)}</span
										>
									</div>
								</div>

								<!-- Progress Bar -->
								<div
									class="progress-bar-container"
									role="progressbar"
									aria-valuenow={project.progress}
									aria-valuemin="0"
									aria-valuemax="100"
									aria-label="{project.buildingName} construction progress: {project.progress}%, {formatTimeRemaining(
										project.timeRemaining
									)} remaining"
								>
									<div class="progress-bar active" style:width="{project.progress}%">
										<span class="progress-text">{project.progress}%</span>
									</div>
								</div>

								<!-- Resource Costs -->
								<div class="project-costs">
									<span class="costs-label">Cost:</span>
									<span class="costs-value">{formatResourceCost(project.resourceCosts)}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Queued Projects -->
			{#if queuedProjects.length > 0}
				<div class="queue-section">
					<h3 class="section-title">Queued ({queuedProjects.length})</h3>
					<div role="list" aria-label="Queued construction projects">
						{#each queuedProjects as project (project.id)}
							<div class="project-card queued" role="listitem">
								<div class="project-header">
									<div class="project-info">
										<span class="project-icon" aria-hidden="true"
											>{getBuildingEmoji(project.buildingType)}</span
										>
										<div class="project-details">
											<h4 class="project-name">{project.buildingName}</h4>
											<p class="project-position">
												Position: #{project.queuePosition}
											</p>
										</div>
									</div>
									<div class="project-time">
										<span class="time-estimate"
											>Est: {formatTimeRemaining(project.timeRemaining)}</span
										>
									</div>
								</div>

								<!-- Resource Costs -->
								<div class="project-costs">
									<span class="costs-label">Cost:</span>
									<span class="costs-value">{formatResourceCost(project.resourceCosts)}</span>
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}
		{/if}
	</div>
</section>

<style>
	.construction-queue-panel {
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

	.queue-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Empty State */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 3rem 1rem;
		text-align: center;
	}

	.empty-icon {
		font-size: 4rem;
		line-height: 1;
		margin-bottom: 1rem;
		opacity: 0.5;
	}

	.empty-message {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--surface-700);
		margin: 0 0 0.5rem 0;
	}

	.empty-hint {
		font-size: 0.875rem;
		color: var(--surface-500);
		margin: 0;
	}

	/* Section */
	.queue-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.section-title {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--surface-700);
		margin: 0;
		text-transform: uppercase;
		letter-spacing: 0.025em;
	}

	/* Project Card */
	.project-card {
		background: var(--surface-100);
		border-radius: 6px;
		padding: 1rem;
		border: 1px solid var(--surface-200);
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.project-card.active {
		border-color: var(--primary-300);
		background: var(--primary-50);
	}

	.project-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 1rem;
	}

	.project-info {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		flex: 1;
	}

	.project-icon {
		font-size: 1.5rem;
		line-height: 1;
		flex-shrink: 0;
	}

	.project-details {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.project-name {
		font-size: 1rem;
		font-weight: 600;
		color: var(--surface-900);
		margin: 0;
	}

	.project-position {
		font-size: 0.75rem;
		color: var(--surface-600);
		margin: 0;
	}

	.project-time {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.25rem;
		flex-shrink: 0;
	}

	.time-remaining {
		font-size: 1.125rem;
		font-weight: 700;
		color: var(--primary-600);
		font-variant-numeric: tabular-nums;
	}

	.completion-time {
		font-size: 0.75rem;
		color: var(--surface-600);
		font-variant-numeric: tabular-nums;
	}

	.time-estimate {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--surface-600);
		font-variant-numeric: tabular-nums;
	}

	/* Progress Bar */
	.progress-bar-container {
		width: 100%;
		height: 24px;
		background: var(--surface-200);
		border-radius: 12px;
		overflow: hidden;
		position: relative;
	}

	.progress-bar {
		height: 100%;
		background: var(--primary-500);
		border-radius: 12px;
		transition: width 0.5s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.progress-bar.active {
		background: linear-gradient(90deg, var(--primary-500), var(--primary-600));
		animation: shimmer 2s infinite;
	}

	@keyframes shimmer {
		0% {
			background-position: -100% 0;
		}
		100% {
			background-position: 200% 0;
		}
	}

	.progress-text {
		font-size: 0.75rem;
		font-weight: 600;
		color: white;
		text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
		font-variant-numeric: tabular-nums;
	}

	/* Resource Costs */
	.project-costs {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
	}

	.costs-label {
		color: var(--surface-600);
		font-weight: 500;
	}

	.costs-value {
		color: var(--surface-800);
		font-weight: 600;
	}

	/* Responsive Design */
	@media (max-width: 767px) {
		.panel-header {
			padding: 0.75rem 1rem;
		}

		.queue-content {
			padding: 0.75rem;
		}

		.project-card {
			padding: 0.75rem;
		}

		.project-header {
			flex-direction: column;
		}

		.project-time {
			align-items: flex-start;
			width: 100%;
		}
	}

	@media (max-width: 480px) {
		.project-icon {
			font-size: 1.25rem;
		}

		.project-name {
			font-size: 0.875rem;
		}

		.time-remaining {
			font-size: 1rem;
		}

		.progress-bar-container {
			height: 20px;
		}

		.progress-text {
			font-size: 0.625rem;
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.progress-bar-container {
			border: 2px solid var(--surface-800);
		}

		.project-card {
			border-width: 2px;
		}

		.project-card.active {
			border-width: 3px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.progress-bar {
			transition: none;
		}

		.progress-bar.active {
			animation: none;
		}
	}
</style>
