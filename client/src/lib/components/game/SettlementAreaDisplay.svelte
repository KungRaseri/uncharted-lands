<script lang="ts">
	/**
	 * Settlement Area Display Component
	 *
	 * Shows building area capacity and usage for a settlement.
	 * Part of Building Area System implementation (December 2025)
	 *
	 * Features:
	 * - Progress bar with color coding (green/yellow/red based on usage)
	 * - Current area used / total capacity display
	 * - Town Hall level indicator
	 * - Percentage used display
	 * - Real-time updates via Socket.IO
	 */

	interface Props {
		settlementId: string;
		areaUsed?: number;
		areaCapacity?: number;
		townHallLevel?: number;
		loading?: boolean;
	}

	let {
		settlementId,
		areaUsed = 0,
		areaCapacity = 500,
		townHallLevel = 0,
		loading = false
	}: Props = $props();

	// Calculate percentage used
	const percentUsed = $derived(areaCapacity > 0 ? (areaUsed / areaCapacity) * 100 : 0);
	const areaAvailable = $derived(Math.max(0, areaCapacity - areaUsed));

	// Color coding based on usage percentage
	const progressBarClass = $derived.by(() => {
		if (percentUsed >= 95) return 'bg-error-500 dark:bg-error-400';
		if (percentUsed >= 80) return 'bg-warning-500 dark:bg-warning-400';
		return 'bg-success-500 dark:bg-success-400';
	});

	const usageTextClass = $derived.by(() => {
		if (percentUsed >= 95) return 'text-error-700 dark:text-error-400';
		if (percentUsed >= 80) return 'text-warning-700 dark:text-warning-400';
		return 'text-success-700 dark:text-success-400';
	});
</script>

<div class="space-y-2" role="region" aria-label="Building Area Information">
	<!-- Header with Town Hall Level -->
	<div class="flex items-center justify-between">
		<span
			class="text-sm font-medium text-surface-700 dark:text-surface-300 flex items-center gap-1"
		>
			<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
				/>
			</svg>
			Building Area
		</span>
		<span
			class="text-xs px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 font-medium"
		>
			TH Lv.{townHallLevel}
		</span>
	</div>

	{#if loading}
		<!-- Loading State -->
		<div class="flex items-center justify-center h-16 text-surface-400">
			<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
				<circle
					class="opacity-25"
					cx="12"
					cy="12"
					r="10"
					stroke="currentColor"
					stroke-width="4"
				></circle>
				<path
					class="opacity-75"
					fill="currentColor"
					d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
				></path>
			</svg>
		</div>
	{:else}
		<!-- Area Usage Stats -->
		<div class="flex items-center justify-between text-xs">
			<span class="text-surface-600 dark:text-surface-400">
				{areaUsed} / {areaCapacity}
			</span>
			<span class="{usageTextClass} font-semibold">
				{percentUsed.toFixed(0)}%
			</span>
		</div>

		<!-- Progress Bar -->
		<div
			class="w-full bg-surface-200 dark:bg-surface-700 rounded-full h-3 overflow-hidden"
			role="progressbar"
			aria-valuenow={percentUsed}
			aria-valuemin={0}
			aria-valuemax={100}
			aria-label="Building area usage percentage"
		>
			<div
				class="{progressBarClass} h-full transition-all duration-500 ease-in-out"
				style="width: {Math.min(percentUsed, 100)}%"
			></div>
		</div>

		<!-- Available Area -->
		<div class="flex items-center justify-between text-xs">
			<span class="text-surface-600 dark:text-surface-400"> Available </span>
			<span class="text-surface-900 dark:text-surface-100 font-medium">
				{areaAvailable} area
			</span>
		</div>

		<!-- Capacity Info -->
		<div class="text-xs text-surface-500 dark:text-surface-400 italic">
			Base: 500 + (TH Level × 100)
		</div>

		<!-- Warning Messages -->
		{#if percentUsed >= 100}
			<div
				class="mt-2 p-2 rounded bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800"
			>
				<p class="text-xs text-error-700 dark:text-error-400 m-0 flex items-center gap-1">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
							clip-rule="evenodd"
						/>
					</svg>
					<strong>At capacity!</strong> Upgrade Town Hall or demolish buildings to expand.
				</p>
			</div>
		{:else if percentUsed >= 90}
			<div
				class="mt-2 p-2 rounded bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800"
			>
				<p class="text-xs text-warning-700 dark:text-warning-400 m-0">
					<strong>Nearly full!</strong> Consider upgrading Town Hall soon.
				</p>
			</div>
		{/if}

		<!-- Upgrade Hint (when near capacity and TH can be upgraded) -->
		{#if percentUsed >= 80 && townHallLevel < 10}
			<div class="mt-2">
				<button
					type="button"
					class="w-full text-xs py-1.5 px-3 rounded bg-primary-100 hover:bg-primary-200 dark:bg-primary-900/30 dark:hover:bg-primary-900/50 text-primary-700 dark:text-primary-400 font-medium transition-colors flex items-center justify-center gap-1"
					onclick={() => {
						// TODO: Implement navigation to Town Hall upgrade
						console.log('[Area Display] Navigate to Town Hall upgrade');
					}}
				>
					<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M5 10l7-7m0 0l7 7m-7-7v18"
						/>
					</svg>
					Upgrade Town Hall (+100 area)
				</button>
			</div>
		{/if}
	{/if}
</div>
