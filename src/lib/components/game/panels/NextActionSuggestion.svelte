<script lang="ts">
	/**
	 * Next Action Suggestion Panel Component
	 * Displays AI-powered recommendations for settlement management
	 * WCAG 2.1 AA Compliant
	 */

	type SuggestionPriority = 'critical' | 'high' | 'medium' | 'low';
	type SuggestionCategory = 'resources' | 'population' | 'construction' | 'defense' | 'expansion';

	interface ActionSuggestion {
		id: string;
		priority: SuggestionPriority;
		category: SuggestionCategory;
		title: string;
		reasoning: string;
		actionLabel: string;
		actionHref?: string;
		actionCallback?: () => void;
		dismissed?: boolean;
		estimatedTime?: string; // e.g., "2 minutes", "5 hours"
		impact?: string; // e.g., "High impact", "Critical"
	}

	interface Props {
		settlementId: string;
		suggestions?: ActionSuggestion[];
		onDismiss?: (suggestionId: string) => void;
		onRefresh?: () => void;
	}

	let { settlementId, suggestions = [], onDismiss, onRefresh }: Props = $props();

	// Filter out dismissed suggestions
	const activeSuggestions = $derived(suggestions.filter((s) => !s.dismissed));

	// Sort by priority
	const sortedSuggestions = $derived(
		[...activeSuggestions].sort((a, b) => {
			const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
			return priorityOrder[a.priority] - priorityOrder[b.priority];
		})
	);

	// Top suggestion (highest priority)
	const topSuggestion = $derived(sortedSuggestions[0]);

	// Get priority color
	function getPriorityColor(priority: SuggestionPriority): string {
		switch (priority) {
			case 'critical':
				return 'var(--error-500)';
			case 'high':
				return 'var(--warning-500)';
			case 'medium':
				return 'var(--primary-500)';
			case 'low':
				return 'var(--surface-600)';
		}
	}

	// Get priority background color
	function getPriorityBgColor(priority: SuggestionPriority): string {
		switch (priority) {
			case 'critical':
				return 'var(--error-50)';
			case 'high':
				return 'var(--warning-50)';
			case 'medium':
				return 'var(--primary-50)';
			case 'low':
				return 'var(--surface-100)';
		}
	}

	// Get priority border color
	function getPriorityBorderColor(priority: SuggestionPriority): string {
		switch (priority) {
			case 'critical':
				return 'var(--error-300)';
			case 'high':
				return 'var(--warning-300)';
			case 'medium':
				return 'var(--primary-300)';
			case 'low':
				return 'var(--surface-300)';
		}
	}

	// Get priority label
	function getPriorityLabel(priority: SuggestionPriority): string {
		switch (priority) {
			case 'critical':
				return 'Critical';
			case 'high':
				return 'High Priority';
			case 'medium':
				return 'Medium Priority';
			case 'low':
				return 'Low Priority';
		}
	}

	// Get priority icon
	function getPriorityIcon(priority: SuggestionPriority): string {
		switch (priority) {
			case 'critical':
				return '🚨';
			case 'high':
				return '⚠️';
			case 'medium':
				return '💡';
			case 'low':
				return 'ℹ️';
		}
	}

	// Get category icon
	function getCategoryIcon(category: SuggestionCategory): string {
		switch (category) {
			case 'resources':
				return '📦';
			case 'population':
				return '👥';
			case 'construction':
				return '🏗️';
			case 'defense':
				return '🛡️';
			case 'expansion':
				return '🗺️';
		}
	}

	// Handle dismiss
	function handleDismiss(suggestionId: string) {
		onDismiss?.(suggestionId);
	}

	// Handle action click
	function handleAction(suggestion: ActionSuggestion) {
		if (suggestion.actionCallback) {
			suggestion.actionCallback();
		}
		// Navigation handled by actionHref if present
	}
</script>

<section class="suggestions-panel" aria-labelledby="suggestions-heading">
	<header class="panel-header">
		<h2 id="suggestions-heading" class="panel-title">Suggested Actions</h2>
		{#if onRefresh}
			<button
				type="button"
				class="refresh-button"
				onclick={onRefresh}
				aria-label="Refresh suggestions"
			>
				<span class="refresh-icon" aria-hidden="true">🔄</span>
			</button>
		{/if}
	</header>

	<div class="suggestions-content">
		{#if sortedSuggestions.length === 0}
			<!-- Empty State -->
			<div class="empty-state" role="status">
				<span class="empty-icon" aria-hidden="true">✅</span>
				<p class="empty-message">All caught up!</p>
				<p class="empty-hint">
					You're managing your settlement well. Check back later for new suggestions.
				</p>
			</div>
		{:else}
			<!-- Top Suggestion (Featured) -->
			{#if topSuggestion}
				<div
					class="suggestion-card featured"
					style:background={getPriorityBgColor(topSuggestion.priority)}
					style:border-color={getPriorityBorderColor(topSuggestion.priority)}
					role="status"
					aria-live="polite"
				>
					<div class="suggestion-header">
						<div class="suggestion-priority">
							<span class="priority-icon" aria-hidden="true"
								>{getPriorityIcon(topSuggestion.priority)}</span
							>
							<span class="priority-label">{getPriorityLabel(topSuggestion.priority)}</span>
							<span class="sr-only">Priority level: {topSuggestion.priority}</span>
						</div>
						<button
							type="button"
							class="dismiss-button"
							onclick={() => handleDismiss(topSuggestion.id)}
							aria-label="Dismiss suggestion: {topSuggestion.title}"
						>
							<span aria-hidden="true">✕</span>
						</button>
					</div>

					<div class="suggestion-body">
						<div class="suggestion-category">
							<span class="category-icon" aria-hidden="true"
								>{getCategoryIcon(topSuggestion.category)}</span
							>
							<span class="sr-only">Category: {topSuggestion.category}</span>
						</div>

						<h3 class="suggestion-title">{topSuggestion.title}</h3>
						<p class="suggestion-reasoning">{topSuggestion.reasoning}</p>

						{#if topSuggestion.estimatedTime || topSuggestion.impact}
							<div class="suggestion-meta">
								{#if topSuggestion.estimatedTime}
									<span class="meta-item">
										<span class="meta-icon" aria-hidden="true">⏱️</span>
										<span class="meta-text">{topSuggestion.estimatedTime}</span>
									</span>
								{/if}
								{#if topSuggestion.impact}
									<span class="meta-item">
										<span class="meta-icon" aria-hidden="true">📈</span>
										<span class="meta-text">{topSuggestion.impact}</span>
									</span>
								{/if}
							</div>
						{/if}
					</div>

					<div class="suggestion-actions">
						{#if topSuggestion.actionHref}
							<a
								href={topSuggestion.actionHref}
								class="action-button primary"
								onclick={() => handleAction(topSuggestion)}
							>
								{topSuggestion.actionLabel}
							</a>
						{:else}
							<button
								type="button"
								class="action-button primary"
								onclick={() => handleAction(topSuggestion)}
							>
								{topSuggestion.actionLabel}
							</button>
						{/if}
					</div>
				</div>
			{/if}

			<!-- Other Suggestions -->
			{#if sortedSuggestions.length > 1}
				<div class="other-suggestions">
					<h3 class="section-title">Other Suggestions</h3>
					<div class="suggestions-list" role="list">
						{#each sortedSuggestions.slice(1) as suggestion (suggestion.id)}
							<div
								class="suggestion-item"
								style:border-left-color={getPriorityColor(suggestion.priority)}
								role="listitem"
							>
								<div class="item-header">
									<div class="item-priority">
										<span class="priority-icon small" aria-hidden="true"
											>{getPriorityIcon(suggestion.priority)}</span
										>
										<span class="sr-only">{getPriorityLabel(suggestion.priority)}</span>
									</div>
									<div class="item-info">
										<span class="category-icon small" aria-hidden="true"
											>{getCategoryIcon(suggestion.category)}</span
										>
										<h4 class="item-title">{suggestion.title}</h4>
									</div>
									<button
										type="button"
										class="dismiss-button small"
										onclick={() => handleDismiss(suggestion.id)}
										aria-label="Dismiss suggestion: {suggestion.title}"
									>
										<span aria-hidden="true">✕</span>
									</button>
								</div>

								<p class="item-reasoning">{suggestion.reasoning}</p>

								<div class="item-actions">
									{#if suggestion.actionHref}
										<a
											href={suggestion.actionHref}
											class="action-button secondary small"
											onclick={() => handleAction(suggestion)}
										>
											{suggestion.actionLabel}
										</a>
									{:else}
										<button
											type="button"
											class="action-button secondary small"
											onclick={() => handleAction(suggestion)}
										>
											{suggestion.actionLabel}
										</button>
									{/if}
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
	.suggestions-panel {
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
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.panel-title {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--surface-900);
		margin: 0;
	}

	.refresh-button {
		background: transparent;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		border-radius: 4px;
		transition: background-color 0.2s;
		min-width: 44px;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.refresh-button:hover {
		background: var(--surface-200);
	}

	.refresh-button:focus-visible {
		outline: 3px solid var(--primary-500);
		outline-offset: 2px;
	}

	.refresh-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.suggestions-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}

	/* Screen Reader Only */
	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border-width: 0;
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
		max-width: 300px;
	}

	/* Featured Suggestion Card */
	.suggestion-card {
		border-radius: 8px;
		padding: 1.5rem;
		border: 2px solid;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.suggestion-card.featured {
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
	}

	.suggestion-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 1rem;
	}

	.suggestion-priority {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.priority-icon {
		font-size: 1.25rem;
		line-height: 1;
	}

	.priority-label {
		font-size: 0.875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.dismiss-button {
		background: transparent;
		border: none;
		padding: 0.5rem;
		cursor: pointer;
		border-radius: 4px;
		transition: background-color 0.2s;
		min-width: 44px;
		min-height: 44px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.25rem;
		color: var(--surface-600);
	}

	.dismiss-button:hover {
		background: rgba(0, 0, 0, 0.05);
		color: var(--surface-900);
	}

	.dismiss-button:focus-visible {
		outline: 3px solid var(--primary-500);
		outline-offset: 2px;
	}

	.suggestion-body {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.suggestion-category {
		font-size: 1.5rem;
		line-height: 1;
	}

	.suggestion-title {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--surface-900);
		margin: 0;
	}

	.suggestion-reasoning {
		font-size: 0.9375rem;
		line-height: 1.5;
		color: var(--surface-700);
		margin: 0;
	}

	.suggestion-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 0.375rem;
		font-size: 0.875rem;
		color: var(--surface-600);
	}

	.meta-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.suggestion-actions {
		display: flex;
		gap: 0.75rem;
	}

	.action-button {
		padding: 0.75rem 1.5rem;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.9375rem;
		cursor: pointer;
		transition: all 0.2s;
		min-width: 44px;
		min-height: 44px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
	}

	.action-button.primary {
		background: var(--primary-500);
		color: white;
		border: none;
	}

	.action-button.primary:hover {
		background: var(--primary-600);
	}

	.action-button.primary:focus-visible {
		outline: 3px solid var(--primary-500);
		outline-offset: 2px;
	}

	.action-button.secondary {
		background: transparent;
		color: var(--primary-600);
		border: 2px solid var(--primary-500);
	}

	.action-button.secondary:hover {
		background: var(--primary-50);
	}

	.action-button.secondary:focus-visible {
		outline: 3px solid var(--primary-500);
		outline-offset: 2px;
	}

	/* Other Suggestions */
	.other-suggestions {
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

	.suggestions-list {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.suggestion-item {
		background: var(--surface-100);
		border-radius: 6px;
		padding: 1rem;
		border-left: 4px solid;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.item-header {
		display: flex;
		align-items: center;
		gap: 0.75rem;
	}

	.item-priority {
		flex-shrink: 0;
	}

	.priority-icon.small {
		font-size: 1rem;
	}

	.item-info {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex: 1;
	}

	.category-icon {
		font-size: 1rem;
		line-height: 1;
	}

	.category-icon.small {
		font-size: 0.875rem;
	}

	.item-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--surface-900);
		margin: 0;
	}

	.dismiss-button.small {
		min-width: 36px;
		min-height: 36px;
		font-size: 1rem;
	}

	.item-reasoning {
		font-size: 0.875rem;
		line-height: 1.4;
		color: var(--surface-700);
		margin: 0;
	}

	.item-actions {
		display: flex;
		gap: 0.5rem;
	}

	.action-button.small {
		padding: 0.5rem 1rem;
		font-size: 0.875rem;
	}

	/* Responsive Design */
	@media (max-width: 767px) {
		.panel-header {
			padding: 0.75rem 1rem;
		}

		.suggestions-content {
			padding: 0.75rem;
		}

		.suggestion-card {
			padding: 1rem;
		}

		.suggestion-title {
			font-size: 1.125rem;
		}

		.action-button {
			width: 100%;
		}

		.item-header {
			flex-wrap: wrap;
		}

		.item-info {
			width: 100%;
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.suggestion-card {
			border-width: 3px;
		}

		.suggestion-item {
			border-left-width: 6px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.refresh-button,
		.dismiss-button,
		.action-button {
			transition: none;
		}
	}
</style>
