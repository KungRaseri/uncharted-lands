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

	let { alerts = [] }: Props = $props();

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

<section
	class="rounded-lg bg-surface-50 dark:bg-surface-900 shadow-md border border-surface-200 dark:border-surface-700 p-4"
	aria-labelledby="alerts-heading"
>
	<header class="mb-4 border-b border-surface-200 dark:border-surface-700 pb-3">
		<h2
			id="alerts-heading"
			class="text-lg font-semibold text-surface-900 dark:text-surface-50 flex items-center gap-2"
		>
			Alerts
			{#if alertCount > 0}
				<span
					class="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold rounded-full bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-300 min-w-7"
					aria-label="{alertCount} active alerts"
				>
					({alertCount})
				</span>
			{/if}
		</h2>
	</header>

	<div class="flex flex-col gap-3">
		{#if activeAlerts.length === 0}
			<div class="text-center py-8" role="status">
				<p class="text-base text-surface-600 dark:text-surface-400">
					✅ All clear! No active alerts.
				</p>
			</div>
		{:else}
			<ul class="flex flex-col gap-3" role="list">
				{#each activeAlerts as alert (alert.id)}
					<li
						class="rounded-lg shadow-sm hover:translate-x-0.5 transition-transform duration-150 {alert.severity ===
						'critical'
							? 'border-l-4 border-error-500 dark:border-error-400 bg-error-50 dark:bg-error-950'
							: alert.severity === 'warning'
								? 'border-l-4 border-warning-500 dark:border-warning-400 bg-warning-50 dark:bg-warning-950'
								: 'border-l-4 border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-950'}"
						role="listitem"
						aria-labelledby="alert-title-{alert.id}"
						aria-describedby="alert-message-{alert.id}"
					>
						<div class="flex gap-3 p-4">
							<div class="shrink-0 text-2xl pt-1" aria-hidden="true">
								{getSeverityIcon(alert.severity)}
							</div>

							<div class="flex-1 min-w-0">
								<div class="flex items-start justify-between gap-2 mb-2">
									<h3
										id="alert-title-{alert.id}"
										class="text-base font-semibold {alert.severity === 'critical'
											? 'text-error-900 dark:text-error-100'
											: alert.severity === 'warning'
												? 'text-warning-900 dark:text-warning-100'
												: 'text-primary-900 dark:text-primary-100'}"
									>
										<span class="sr-only">{getSeverityLabel(alert.severity)}:</span>
										{alert.title}
									</h3>
									<time
										class="text-xs text-surface-600 dark:text-surface-400 whitespace-nowrap shrink-0"
										datetime={alert.timestamp.toISOString()}
									>
										{formatTime(alert.timestamp)}
									</time>
								</div>

								<p
									id="alert-message-{alert.id}"
									class="text-sm mb-3 {alert.severity === 'critical'
										? 'text-error-800 dark:text-error-200'
										: alert.severity === 'warning'
											? 'text-warning-800 dark:text-warning-200'
											: 'text-primary-800 dark:text-primary-200'}"
								>
									{alert.message}
								</p>

								<div class="flex items-center gap-2 flex-wrap">
									{#if alert.actionLabel && alert.actionHref}
										<a
											href={alert.actionHref}
											class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-11 focus-visible:outline-3 focus-visible:outline-offset-2 {alert.severity ===
											'critical'
												? 'bg-error-600 hover:bg-error-700 dark:bg-error-700 dark:hover:bg-error-600 text-white focus-visible:outline-error-300 dark:focus-visible:outline-error-600'
												: alert.severity === 'warning'
													? 'bg-warning-600 hover:bg-warning-700 dark:bg-warning-700 dark:hover:bg-warning-600 text-white focus-visible:outline-warning-300 dark:focus-visible:outline-warning-600'
													: 'bg-primary-600 hover:bg-primary-700 dark:bg-primary-700 dark:hover:bg-primary-600 text-white focus-visible:outline-primary-300 dark:focus-visible:outline-primary-600'}"
										>
											{alert.actionLabel}
										</a>
									{/if}
									<button
										type="button"
										class="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-surface-200 hover:bg-surface-300 dark:bg-surface-700 dark:hover:bg-surface-600 text-surface-900 dark:text-surface-50 transition-colors min-h-11 min-w-11 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-600"
										onclick={() => dismissAlert(alert.id)}
										aria-label="Dismiss {alert.title}"
									>
										Dismiss
									</button>
								</div>
							</div>
						</div>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</section>
