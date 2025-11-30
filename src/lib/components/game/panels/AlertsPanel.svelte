<script lang="ts">
	/**
	 * Alerts Panel Component
	 * Displays urgent notifications and warnings
	 * WCAG 2.1 AA Compliant
	 */

	type AlertSeverity = 'critical' | 'warning' | 'info';

	interface Alert {
		id: string;
		severity: AlertSeverity;
		title: string;
		message: string;
		timestamp: Date;
		actionLabel?: string;
		actionHref?: string;
		dismissed?: boolean;
	}

	interface Props {
		settlementId: string;
		alerts?: Alert[];
	}

	let { settlementId, alerts = [] }: Props = $props();

	// Filter non-dismissed alerts and sort by severity
	const activeAlerts = $derived(
		alerts
			.filter((alert) => !alert.dismissed)
			.sort((a, b) => {
				const severityOrder = { critical: 0, warning: 1, info: 2 };
				return severityOrder[a.severity] - severityOrder[b.severity];
			})
	);

	const alertCount = $derived(activeAlerts.length);

	// Severity icon mapping
	function getSeverityIcon(severity: AlertSeverity): string {
		switch (severity) {
			case 'critical':
				return '🔴';
			case 'warning':
				return '⚠️';
			case 'info':
				return 'ℹ️';
		}
	}

	// Severity label for screen readers
	function getSeverityLabel(severity: AlertSeverity): string {
		switch (severity) {
			case 'critical':
				return 'Critical alert';
			case 'warning':
				return 'Warning';
			case 'info':
				return 'Information';
		}
	}

	// Format timestamp
	function formatTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'Just now';
		if (diffMins < 60) return `${diffMins}m ago`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h ago`;
		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays}d ago`;
	}

	// Dismiss alert
	function dismissAlert(alertId: string) {
		// In production, this would call an API
		console.log(`Dismissing alert: ${alertId}`);
	}
</script>

<section class="alerts-panel" aria-labelledby="alerts-heading">
	<header class="panel-header">
		<h2 id="alerts-heading" class="panel-title">
			Alerts
			{#if alertCount > 0}
				<span class="alert-count" aria-label="{alertCount} active alerts">({alertCount})</span>
			{/if}
		</h2>
	</header>

	<div class="alerts-content">
		{#if activeAlerts.length === 0}
			<div class="no-alerts" role="status">
				<p class="no-alerts-text">✅ All clear! No active alerts.</p>
			</div>
		{:else}
			<ul class="alerts-list" role="list">
				{#each activeAlerts as alert (alert.id)}
					<li
						class="alert-item alert-{alert.severity}"
						role="listitem"
						aria-labelledby="alert-title-{alert.id}"
						aria-describedby="alert-message-{alert.id}"
					>
						<div class="alert-icon" aria-hidden="true">
							{getSeverityIcon(alert.severity)}
						</div>

						<div class="alert-content">
							<div class="alert-header">
								<h3 id="alert-title-{alert.id}" class="alert-title">
									<span class="sr-only">{getSeverityLabel(alert.severity)}:</span>
									{alert.title}
								</h3>
								<time class="alert-time" datetime={alert.timestamp.toISOString()}>
									{formatTime(alert.timestamp)}
								</time>
							</div>

							<p id="alert-message-{alert.id}" class="alert-message">
								{alert.message}
							</p>

							<div class="alert-actions">
								{#if alert.actionLabel && alert.actionHref}
									<a href={alert.actionHref} class="alert-action-button">
										{alert.actionLabel}
									</a>
								{/if}
								<button
									type="button"
									class="dismiss-button"
									onclick={() => dismissAlert(alert.id)}
									aria-label="Dismiss {alert.title}"
								>
									Dismiss
								</button>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>

<style>
	.alerts-panel {
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
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.alert-count {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--surface-600);
	}

	.alerts-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
	}

	.no-alerts {
		display: flex;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 150px;
	}

	.no-alerts-text {
		font-size: 1rem;
		color: var(--surface-600);
		text-align: center;
	}

	.alerts-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.alert-item {
		display: flex;
		gap: 1rem;
		padding: 1rem;
		border-radius: 6px;
		border-left: 4px solid;
		background: var(--surface-100);
		transition: transform 0.15s ease;
	}

	.alert-item:hover {
		transform: translateX(2px);
	}

	.alert-critical {
		border-left-color: var(--error-500);
		background: var(--error-50);
	}

	.alert-warning {
		border-left-color: var(--warning-500);
		background: var(--warning-50);
	}

	.alert-info {
		border-left-color: var(--primary-500);
		background: var(--primary-50);
	}

	.alert-icon {
		font-size: 1.5rem;
		flex-shrink: 0;
		line-height: 1;
	}

	.alert-content {
		flex: 1;
		min-width: 0;
	}

	.alert-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
		margin-bottom: 0.5rem;
	}

	.alert-title {
		font-size: 1rem;
		font-weight: 600;
		color: var(--surface-900);
		margin: 0;
		line-height: 1.4;
	}

	.alert-time {
		font-size: 0.75rem;
		color: var(--surface-600);
		white-space: nowrap;
		flex-shrink: 0;
	}

	.alert-message {
		font-size: 0.875rem;
		color: var(--surface-700);
		margin: 0 0 1rem 0;
		line-height: 1.5;
	}

	.alert-actions {
		display: flex;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.alert-action-button,
	.dismiss-button {
		padding: 0.5rem 1rem;
		border-radius: 4px;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: background-color 0.15s ease;
		min-height: 44px;
		min-width: 44px;
	}

	.alert-action-button {
		background: var(--primary-500);
		color: white;
		border: none;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
		justify-content: center;
	}

	.alert-action-button:hover {
		background: var(--primary-600);
	}

	.alert-action-button:focus-visible {
		outline: 3px solid var(--primary-300);
		outline-offset: 2px;
	}

	.dismiss-button {
		background: var(--surface-200);
		color: var(--surface-700);
		border: 1px solid var(--surface-300);
	}

	.dismiss-button:hover {
		background: var(--surface-300);
	}

	.dismiss-button:focus-visible {
		outline: 3px solid var(--surface-400);
		outline-offset: 2px;
	}

	/* Screen reader only text */
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

	/* Responsive Design */
	@media (max-width: 767px) {
		.panel-header {
			padding: 0.75rem 1rem;
		}

		.alerts-content {
			padding: 0.75rem;
		}

		.alert-item {
			padding: 0.75rem;
			gap: 0.75rem;
		}

		.alert-header {
			flex-direction: column;
			gap: 0.25rem;
		}
	}

	/* High Contrast Mode */
	@media (prefers-contrast: high) {
		.alert-item {
			border-left-width: 6px;
		}
	}

	/* Reduced Motion */
	@media (prefers-reduced-motion: reduce) {
		.alert-item {
			transition: none;
		}

		.alert-action-button,
		.dismiss-button {
			transition: none;
		}
	}
</style>
