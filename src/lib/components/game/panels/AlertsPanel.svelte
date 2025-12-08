<script lang="ts">
	/**
	 * Alerts Panel Component
	 * Horizontal ticker/banner displaying urgent notifications and warnings
	 * WCAG 2.1 AA Compliant with pause controls for accessibility
	 */

	import { AlertCircle, AlertTriangle, Info, Play, Pause } from 'lucide-svelte';

	type AlertSeverity = 'critical' | 'warning' | 'info';

	interface Alert {
		id: string;
		severity: AlertSeverity;
		title: string;
		message: string;
		timestamp: Date;
		location?: string; // e.g., "Settlement Alpha", "Northern Region"
		actionLabel?: string;
		actionHref?: string;
		dismissed?: boolean;
	}

	interface Props {
		settlementId: string;
		alerts?: Alert[];
	}

	let { alerts = [] }: Props = $props();

	// State for marquee control
	let isPaused = $state(false);
	let hoveredAlertId = $state<string | null>(null);

	// Development: Add test alert
	const testAlerts: Alert[] = [
		{
			id: 'test-alert-1',
			severity: 'critical',
			title: 'Severe Weather Warning',
			message: 'A severe storm is approaching your settlement. Seek shelter immediately.',
			timestamp: new Date(new Date().getTime() - 5 * 60000), // 5 minutes ago
			location: 'Settlement Alpha',
			dismissed: false
		}
	];

	// Filter non-dismissed alerts and sort by severity
	const activeAlerts = $derived(
		[...alerts, ...testAlerts]
			.filter((alert) => !alert.dismissed)
			.sort((a, b) => {
				const severityOrder = { critical: 0, warning: 1, info: 2 };
				return severityOrder[a.severity] - severityOrder[b.severity];
			})
	);

	const alertCount = $derived(activeAlerts.length);
	const shouldAnimate = $derived(activeAlerts.length > 0 && !isPaused && hoveredAlertId === null);

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

	// Format timestamp (compact for ticker)
	function formatTime(date: Date): string {
		const now = new Date();
		const diffMs = now.getTime() - date.getTime();
		const diffMins = Math.floor(diffMs / 60000);

		if (diffMins < 1) return 'now';
		if (diffMins < 60) return `${diffMins}m`;
		const diffHours = Math.floor(diffMins / 60);
		if (diffHours < 24) return `${diffHours}h`;
		const diffDays = Math.floor(diffHours / 24);
		return `${diffDays}d`;
	}

	// Toggle pause
	function togglePause() {
		isPaused = !isPaused;
	}

	// Handle alert click
	function handleAlertClick(alert: Alert) {
		// TODO: Navigate to alert details or map location
		console.log('Alert clicked:', alert.id);
		// Future: Could navigate to /settlements/[id]#alert-[alertId]
		// Or open a modal with full details
	}
</script>

<!-- Single-row alert ticker/banner -->
<section
	class="rounded-lg bg-surface-50 dark:bg-surface-900 shadow-md border border-surface-200 dark:border-surface-700 overflow-hidden"
	aria-labelledby="alerts-heading"
	aria-live="polite"
>
	<!-- Hidden heading for screen readers -->
	<h2 id="alerts-heading" class="sr-only">
		{#if alertCount > 0}
			Alerts: {alertCount} active
		{:else}
			Alerts: No active alerts
		{/if}
	</h2>

	<div class="relative h-16 flex items-center">
		{#if activeAlerts.length === 0}
			<!-- No alerts: centered static message -->
			<div class="w-full flex items-center justify-center h-full" role="status">
				<p
					class="text-base font-medium text-surface-600 dark:text-surface-400 flex items-center gap-2"
				>
					<span aria-hidden="true">✅</span>
					All clear! No active alerts.
				</p>
			</div>
		{:else}
			<!-- Active alerts: scrolling ticker -->
			<div class="absolute inset-0 flex items-center">
				<!-- Pause/Play control -->
				<div class="absolute left-4 z-10">
					<button
						type="button"
						class="flex items-center justify-center w-8 h-8 rounded-full bg-surface-200 dark:bg-surface-700 hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-primary-300 dark:focus-visible:outline-primary-600"
						onclick={togglePause}
						aria-label={isPaused ? 'Resume alert ticker' : 'Pause alert ticker'}
						aria-pressed={isPaused}
					>
						{#if isPaused}
							<Play class="w-4 h-4" aria-hidden="true" />
						{:else}
							<Pause class="w-4 h-4" aria-hidden="true" />
						{/if}
					</button>
				</div>

				<!-- Scrolling alerts container -->
				<div class="flex-1 overflow-hidden pl-14 pr-4" role="list">
					<div
						class="flex gap-4 animate-marquee-rtl"
						style="animation-duration: {activeAlerts.length *
							20}s; animation-play-state: {shouldAnimate ? 'running' : 'paused'}"
					>
						<!-- Alert cards -->
						{#each activeAlerts as alert (alert.id)}
							<div
								role="button"
								tabindex="0"
								class="flex-none flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer min-w-80 max-w-96 {alert.severity ===
								'critical'
									? 'bg-error-100 dark:bg-error-950 border border-error-300 dark:border-error-700 hover:bg-error-200 dark:hover:bg-error-900'
									: alert.severity === 'warning'
										? 'bg-warning-100 dark:bg-warning-950 border border-warning-300 dark:border-warning-700 hover:bg-warning-200 dark:hover:bg-warning-900'
										: 'bg-primary-100 dark:bg-primary-950 border border-primary-300 dark:border-primary-700 hover:bg-primary-200 dark:hover:bg-primary-900'} {hoveredAlertId ===
								alert.id
									? 'scale-105 shadow-lg'
									: 'shadow-sm'}"
								onclick={() => handleAlertClick(alert)}
								onkeydown={(e) => {
									if (e.key === 'Enter' || e.key === ' ') {
										e.preventDefault();
										handleAlertClick(alert);
									}
								}}
								onmouseenter={() => (hoveredAlertId = alert.id)}
								onmouseleave={() => (hoveredAlertId = null)}
								aria-label="{getSeverityLabel(alert.severity)}: {alert.title}"
							>
								<!-- Icon -->
								<div class="shrink-0" aria-hidden="true">
									{#if alert.severity === 'critical'}
										<AlertCircle class="w-5 h-5 text-error-600 dark:text-error-400" />
									{:else if alert.severity === 'warning'}
										<AlertTriangle class="w-5 h-5 text-warning-600 dark:text-warning-400" />
									{:else}
										<Info class="w-5 h-5 text-primary-600 dark:text-primary-400" />
									{/if}
								</div>

								<!-- Content -->
								<div class="flex-1 min-w-0 text-left">
									<div class="flex items-center gap-2 mb-1">
										<p
											class="font-semibold text-sm truncate {alert.severity === 'critical'
												? 'text-error-900 dark:text-error-100'
												: alert.severity === 'warning'
													? 'text-warning-900 dark:text-warning-100'
													: 'text-primary-900 dark:text-primary-100'}"
										>
											{alert.title}
										</p>
										<span
											class="text-xs {alert.severity === 'critical'
												? 'text-error-700 dark:text-error-300'
												: alert.severity === 'warning'
													? 'text-warning-700 dark:text-warning-300'
													: 'text-primary-700 dark:text-primary-300'}"
										>
											{formatTime(alert.timestamp)}
										</span>
									</div>

									<!-- Show more details on hover -->
									{#if hoveredAlertId === alert.id}
										<p
											class="text-xs {alert.severity === 'critical'
												? 'text-error-800 dark:text-error-200'
												: alert.severity === 'warning'
													? 'text-warning-800 dark:text-warning-200'
													: 'text-primary-800 dark:text-primary-200'}"
										>
											{alert.message}
											{#if alert.location}
												<span class="font-medium">• {alert.location}</span>
											{/if}
										</p>
									{:else}
										<p
											class="text-xs truncate {alert.severity === 'critical'
												? 'text-error-700 dark:text-error-300'
												: alert.severity === 'warning'
													? 'text-warning-700 dark:text-warning-300'
													: 'text-primary-700 dark:text-primary-300'}"
										>
											{alert.location || alert.message}
										</p>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				</div>
			</div>
		{/if}
	</div>
</section>

<style>
	/* Right-to-left marquee animation starting off-screen */
	@keyframes marquee-rtl {
		from {
			transform: translateX(100%);
		}
		to {
			transform: translateX(-100%);
		}
	}

	.animate-marquee-rtl {
		animation: marquee-rtl linear infinite;
	}
</style>
