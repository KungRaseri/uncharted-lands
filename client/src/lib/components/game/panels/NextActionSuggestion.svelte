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

	// eslint-disable-next-line no-unused-vars
	let { settlementId: _settlementId, suggestions = [], onDismiss, onRefresh }: Props = $props();

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

<section
	class="bg-surface-50 dark:bg-surface-900 rounded-lg overflow-hidden h-full flex flex-col"
	aria-labelledby="suggestions-heading"
>
	<header
		class="bg-surface-100 dark:bg-surface-800 border-b border-surface-300 dark:border-surface-700 p-4 md:px-6 flex items-center justify-between gap-4"
	>
		<h2
			id="suggestions-heading"
			class="text-lg font-semibold text-surface-900 dark:text-surface-100 m-0"
		>
			Suggested Actions
		</h2>
		{#if onRefresh}
			<button
				type="button"
				class="bg-transparent border-none p-2 cursor-pointer rounded transition-colors min-w-11 min-h-11 flex items-center justify-center hover:bg-surface-200 dark:hover:bg-surface-700 focus-visible:outline-3 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
				onclick={onRefresh}
				aria-label="Refresh suggestions"
			>
				<span class="text-xl leading-none" aria-hidden="true">🔄</span>
			</button>
		{/if}
	</header>

	<div class="flex-1 overflow-y-auto p-3 md:p-4 flex flex-col gap-6">
		{#if sortedSuggestions.length === 0}
			<!-- Empty State -->
			<div
				class="flex flex-col items-center justify-center p-12 md:p-16 text-center"
				role="status"
			>
				<span class="text-6xl leading-none mb-4" aria-hidden="true">✅</span>
				<p class="text-lg font-semibold text-surface-700 dark:text-surface-300 m-0 mb-2">
					All caught up!
				</p>
				<p class="text-sm text-surface-500 dark:text-surface-400 m-0 max-w-xs">
					You're managing your settlement well. Check back later for new suggestions.
				</p>
			</div>
		{:else}
			<!-- Top Suggestion (Featured) -->
			{#if topSuggestion}
				<div
					class="rounded-lg p-6 border-2 flex flex-col gap-4 shadow-md"
					style:background={getPriorityBgColor(topSuggestion.priority)}
					style:border-color={getPriorityBorderColor(topSuggestion.priority)}
					role="status"
					aria-live="polite"
				>
					<div class="flex items-center justify-between gap-4">
						<div class="flex items-center gap-2">
							<span class="text-xl leading-none" aria-hidden="true"
								>{getPriorityIcon(topSuggestion.priority)}</span
							>
							<span
								class="text-sm font-bold uppercase tracking-wider"
								style:color={getPriorityColor(topSuggestion.priority)}
								>{getPriorityLabel(topSuggestion.priority)}</span
							>
							<span class="sr-only">Priority level: {topSuggestion.priority}</span>
						</div>
						<button
							type="button"
							class="bg-transparent border-none p-2 cursor-pointer rounded transition-colors min-w-11 min-h-11 flex items-center justify-center text-xl text-surface-600 dark:text-surface-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-surface-900 dark:hover:text-surface-100 focus-visible:outline-3 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
							onclick={() => handleDismiss(topSuggestion.id)}
							aria-label="Dismiss suggestion: {topSuggestion.title}"
						>
							<span aria-hidden="true">✕</span>
						</button>
					</div>

					<div class="flex flex-col gap-3">
						<div class="text-2xl leading-none">
							<span aria-hidden="true">{getCategoryIcon(topSuggestion.category)}</span
							>
							<span class="sr-only">Category: {topSuggestion.category}</span>
						</div>

						<h3 class="text-xl font-bold text-surface-900 dark:text-surface-100 m-0">
							{topSuggestion.title}
						</h3>
						<p
							class="text-base leading-relaxed text-surface-700 dark:text-surface-300 m-0"
						>
							{topSuggestion.reasoning}
						</p>

						{#if topSuggestion.estimatedTime || topSuggestion.impact}
							<div class="flex flex-wrap gap-4">
								{#if topSuggestion.estimatedTime}
									<span
										class="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400"
									>
										<span class="text-base leading-none" aria-hidden="true"
											>⏱️</span
										>
										<span>{topSuggestion.estimatedTime}</span>
									</span>
								{/if}
								{#if topSuggestion.impact}
									<span
										class="flex items-center gap-1.5 text-sm text-surface-600 dark:text-surface-400"
									>
										<span class="text-base leading-none" aria-hidden="true"
											>📈</span
										>
										<span>{topSuggestion.impact}</span>
									</span>
								{/if}
							</div>
						{/if}
					</div>

					<div class="flex gap-3">
						{#if topSuggestion.actionHref}
							<a
								href={topSuggestion.actionHref}
								class="px-6 py-3 rounded-md font-semibold text-base cursor-pointer transition-all min-w-11 min-h-11 inline-flex items-center justify-center no-underline bg-primary-500 text-white border-none hover:bg-primary-600 focus-visible:outline-3 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
								onclick={() => handleAction(topSuggestion)}
							>
								{topSuggestion.actionLabel}
							</a>
						{:else}
							<button
								type="button"
								class="px-6 py-3 rounded-md font-semibold text-base cursor-pointer transition-all min-w-11 min-h-11 inline-flex items-center justify-center bg-primary-500 text-white border-none hover:bg-primary-600 focus-visible:outline-3 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
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
				<div class="flex flex-col gap-3">
					<h3
						class="text-sm font-semibold text-surface-700 dark:text-surface-300 m-0 uppercase tracking-wide"
					>
						Other Suggestions
					</h3>
					<div class="flex flex-col gap-3" role="list">
						{#each sortedSuggestions.slice(1) as suggestion (suggestion.id)}
							<div
								class="bg-surface-100 dark:bg-surface-800 rounded-md p-4 border-l-4 flex flex-col gap-3"
								style:border-left-color={getPriorityColor(suggestion.priority)}
								role="listitem"
							>
								<div class="flex items-center gap-3 flex-wrap md:flex-nowrap">
									<div class="shrink-0">
										<span class="text-base leading-none" aria-hidden="true"
											>{getPriorityIcon(suggestion.priority)}</span
										>
										<span class="sr-only"
											>{getPriorityLabel(suggestion.priority)}</span
										>
									</div>
									<div class="flex items-center gap-2 flex-1 w-full md:w-auto">
										<span class="text-sm leading-none" aria-hidden="true"
											>{getCategoryIcon(suggestion.category)}</span
										>
										<h4
											class="text-base font-semibold text-surface-900 dark:text-surface-100 m-0"
										>
											{suggestion.title}
										</h4>
									</div>
									<button
										type="button"
										class="bg-transparent border-none p-2 cursor-pointer rounded transition-colors min-w-9 min-h-9 flex items-center justify-center text-base text-surface-600 dark:text-surface-400 hover:bg-black/5 dark:hover:bg-white/5 hover:text-surface-900 dark:hover:text-surface-100 focus-visible:outline-3 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
										onclick={() => handleDismiss(suggestion.id)}
										aria-label="Dismiss suggestion: {suggestion.title}"
									>
										<span aria-hidden="true">✕</span>
									</button>
								</div>

								<p
									class="text-sm leading-relaxed text-surface-700 dark:text-surface-300 m-0"
								>
									{suggestion.reasoning}
								</p>

								<div class="flex gap-2">
									{#if suggestion.actionHref}
										<a
											href={suggestion.actionHref}
											class="w-full md:w-auto px-4 py-2 rounded-md font-semibold text-sm cursor-pointer transition-all min-w-11 min-h-11 inline-flex items-center justify-center no-underline bg-transparent text-primary-600 dark:text-primary-400 border-2 border-primary-500 dark:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950 focus-visible:outline-3 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
											onclick={() => handleAction(suggestion)}
										>
											{suggestion.actionLabel}
										</a>
									{:else}
										<button
											type="button"
											class="w-full md:w-auto px-4 py-2 rounded-md font-semibold text-sm cursor-pointer transition-all min-w-11 min-h-11 inline-flex items-center justify-center bg-transparent text-primary-600 dark:text-primary-400 border-2 border-primary-500 dark:border-primary-400 hover:bg-primary-50 dark:hover:bg-primary-950 focus-visible:outline-3 focus-visible:outline-primary-500 focus-visible:outline-offset-2"
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

<!-- Screen Reader Only utility class -->
<style>
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
</style>
