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
		onSettings?: () => void;
		onOpenBuildMenu?: () => void;
	}

	let {
		settlementName,
		settlementId,
		currentTime = new Date(),
		onSettings,
		onOpenBuildMenu
	}: Props = $props();

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

<header
	class="bg-surface-100 dark:bg-surface-800 border-b-2 border-surface-300 dark:border-surface-700 px-6 py-4 min-h-20"
>
	<div class="flex justify-between items-center flex-wrap gap-4 max-w-screen-2xl mx-auto">
		<div class="flex flex-col gap-1">
			<h1 class="text-2xl font-bold text-surface-900 dark:text-surface-100">
				{settlementName}
			</h1>
			<p class="text-sm text-surface-600 dark:text-surface-400" aria-label="Settlement ID">
				<span class="font-medium">ID:</span>
				<span class="font-mono ml-1">{settlementId.slice(0, 8)}</span>
			</p>
		</div>

		<div class="flex flex-col gap-2">
			<time
				class="text-lg font-mono font-semibold text-surface-700 dark:text-surface-300 tabular-nums"
				datetime={currentTime.toISOString()}
				aria-live="off"
			>
				{formattedTime}
			</time>
			<div
				class="flex items-center gap-2 text-sm px-4 py-2 bg-primary-100 dark:bg-primary-900 border-l-4 border-primary-500 rounded max-w-md"
				role="status"
				aria-live="polite"
			>
				<span
					class="font-semibold text-primary-700 dark:text-primary-300 uppercase text-xs tracking-wide"
				>
					Next:
				</span>
				<span class="text-surface-800 dark:text-surface-200 font-medium">
					{nextAction}
				</span>
			</div>
		</div>

		<div class="flex items-center gap-2">
			{#if onOpenBuildMenu}
				<button
					type="button"
					class="flex items-center gap-2 px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-md focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md"
					onclick={onOpenBuildMenu}
					aria-label="Open build menu (B)"
					title="Build new structures (B)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
						class="w-5 h-5"
					>
						<path d="M12 2v20M2 12h20" />
					</svg>
					<span>Build</span>
				</button>
			{/if}

			{#if onSettings}
				<button
					type="button"
					class="flex items-center justify-center min-w-11 min-h-11 p-2.5 bg-transparent border border-surface-300 dark:border-surface-600 rounded-md text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-700 hover:text-surface-800 dark:hover:text-surface-200 hover:border-surface-400 dark:hover:border-surface-500 focus-visible:outline-2 focus-visible:outline-primary-500 focus-visible:outline-offset-2 active:scale-95 transition-all duration-200 shrink-0 group"
					onclick={onSettings}
					aria-label="Open dashboard settings"
					title="Customize dashboard (Ctrl+,)"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						aria-hidden="true"
						class="w-5 h-5 transition-transform duration-300 group-hover:rotate-45"
					>
						<circle cx="12" cy="12" r="3" />
						<path
							d="M12 1v6m0 6v6m-9-9h6m6 0h6m-16.97 6.97l4.24-4.24m5.46 0l4.24 4.24m-16.97-10.18l4.24 4.24m5.46 0l4.24-4.24"
						/>
					</svg>
				</button>
			{/if}
		</div>
	</div>
</header>
