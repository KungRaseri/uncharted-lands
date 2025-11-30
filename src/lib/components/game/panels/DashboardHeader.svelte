<script lang="ts">
	/**
	 * Dashboard Header Component
	 * Displays settlement name, current time, and next suggested action
	 * WCAG 2.1 AA Compliant
	 */

	interface Props {
		settlementName: string;
		settlementId: string;
		currentTime?: Date;
	}

	let { settlementName, settlementId, currentTime = new Date() }: Props = $props();

	// Format time for display
	const formattedTime = $derived(
		currentTime.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit',
			hour12: true
		})
	);

	// Next action suggestion (simplified - will be enhanced later)
	const nextAction = $derived.by(() => {
		const hour = currentTime.getHours();
		if (hour < 12) return 'Review resource production rates';
		if (hour < 18) return 'Check construction queue status';
		return 'Prepare for overnight resource collection';
	});
</script>

<header class="dashboard-header" role="banner">
	<div class="header-content">
		<div class="settlement-info">
			<h1 class="settlement-name">{settlementName}</h1>
			<p class="settlement-id" aria-label="Settlement ID">
				<span class="label">ID:</span>
				<span class="value">{settlementId.slice(0, 8)}</span>
			</p>
		</div>

		<div class="time-and-action">
			<time class="current-time" datetime={currentTime.toISOString()} aria-live="off">
				{formattedTime}
			</time>
			<div class="next-action" role="status" aria-live="polite">
				<span class="action-label">Next:</span>
				<span class="action-text">{nextAction}</span>
			</div>
		</div>
	</div>
</header>

<style>
	.dashboard-header {
		background: var(--surface-100);
		border-bottom: 2px solid var(--surface-300);
		padding: 1rem 1.5rem;
		min-height: 80px;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		max-width: 1920px;
		margin: 0 auto;
	}

	.settlement-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
	}

	.settlement-name {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--surface-900);
		margin: 0;
		line-height: 1.2;
	}

	.settlement-id {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		color: var(--surface-600);
		margin: 0;
	}

	.settlement-id .label {
		font-weight: 500;
	}

	.settlement-id .value {
		font-family: 'Monaco', 'Courier New', monospace;
		background: var(--surface-200);
		padding: 0.125rem 0.5rem;
		border-radius: 4px;
	}

	.time-and-action {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 0.5rem;
	}

	.current-time {
		font-size: 1.125rem;
		font-weight: 600;
		color: var(--surface-800);
		font-variant-numeric: tabular-nums;
	}

	.next-action {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.875rem;
		padding: 0.5rem 1rem;
		background: var(--primary-100);
		border-left: 3px solid var(--primary-500);
		border-radius: 4px;
		max-width: 400px;
	}

	.action-label {
		font-weight: 600;
		color: var(--primary-700);
		text-transform: uppercase;
		font-size: 0.75rem;
		letter-spacing: 0.05em;
	}

	.action-text {
		color: var(--surface-800);
		font-weight: 500;
	}

	/* Responsive Design */
	@media (max-width: 767px) {
		.dashboard-header {
			padding: 0.75rem 1rem;
			min-height: auto;
		}

		.header-content {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.settlement-name {
			font-size: 1.5rem;
		}

		.time-and-action {
			width: 100%;
			flex-direction: row;
			justify-content: space-between;
			align-items: center;
		}

		.current-time {
			font-size: 1rem;
		}

		.next-action {
			flex: 1;
			max-width: none;
		}
	}

	@media (max-width: 480px) {
		.settlement-name {
			font-size: 1.25rem;
		}

		.time-and-action {
			flex-direction: column;
			align-items: flex-start;
		}

		.next-action {
			width: 100%;
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.dashboard-header {
			border-bottom-width: 3px;
		}

		.next-action {
			border-left-width: 4px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		* {
			transition: none !important;
		}
	}
</style>
