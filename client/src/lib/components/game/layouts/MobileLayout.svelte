<script lang="ts">
	/**
	 * Mobile Layout Component
	 *
	 * Single-column stacked layout for mobile viewports (<768px)
	 * Panels can override their order with `mobileColumn` property (stacked vertically)
	 *
	 * Features:
	 * - Vertical scrolling
	 * - Collapsible panels to save space
	 * - Swipe-to-dismiss for alerts
	 * - Bottom-fixed quick actions
	 */

	import type { PanelConfig } from '$lib/stores/ui/dashboard-layout.svelte';
	import { logger } from '$lib/utils/logger';
	import type { Snippet } from 'svelte';

	interface Props {
		panels: PanelConfig[];
		settlementId: string;
		renderPanel: Snippet<[PanelConfig]>;
	}

	let { panels, renderPanel }: Props = $props();

	// Sort all visible panels by order (mobile ignores column, just stacks vertically)
	// If mobileColumn is undefined, panel is hidden on mobile
	const sortedPanels = $derived(
		panels
			.filter((p) => p.visible && p.mobileColumn !== undefined)
			.toSorted((a, b) => a.order - b.order)
	);

	// Touch gesture handling for swipe-to-dismiss
	let touchStartX = $state(0);
	let touchStartY = $state(0);

	function handleTouchStart(event: TouchEvent, panelId: string) {
		const touch = event.touches[0];
		if (touch) {
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
		}
		// TODO: Use panelId when implementing swipe-to-dismiss
		logger.debug('Touch start on panel:', { panelId });
	}

	function handleTouchEnd(event: TouchEvent, panelId: string) {
		const touch = event.changedTouches[0];
		if (touch) {
			const deltaX = touch.clientX - touchStartX;
			const deltaY = touch.clientY - touchStartY;

			// Swipe right to dismiss (for alerts panel only)
			if (panelId === 'alerts' && deltaX > 100 && Math.abs(deltaY) < 50) {
				// TODO: Dispatch dismiss event
				logger.debug('Swipe to dismiss alert:', { panelId });
			}
		}
	}
</script>

<div class="flex flex-col h-full overflow-hidden" role="main">
	<!-- Main scrollable content -->
	<div
		class="flex-1 overflow-y-auto overflow-x-hidden p-2 xs:p-1 flex flex-col gap-2 xs:gap-1 pb-[calc(0.5rem+68px)] xs:pb-[calc(0.25rem+68px)] [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-surface-100 dark:[&::-webkit-scrollbar-track]:bg-surface-800 [&::-webkit-scrollbar-thumb]:bg-surface-300 dark:[&::-webkit-scrollbar-thumb]:bg-surface-600 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:hover:bg-surface-400 dark:[&::-webkit-scrollbar-thumb:hover]:bg-surface-500"
		role="region"
		aria-label="Settlement information"
	>
		{#each sortedPanels as panel (panel.id)}
			<div
				class="transition-all duration-300 rounded-lg bg-surface-50 dark:bg-surface-900 motion-reduce:transition-none"
				class:max-h-12={panel.collapsed}
				class:overflow-hidden={panel.collapsed}
				class:touch-pan-y={panel.id === 'alerts'}
				data-panel-id={panel.id}
				style="order: {panel.order};"
				ontouchstart={(e) => handleTouchStart(e, panel.id)}
				ontouchend={(e) => handleTouchEnd(e, panel.id)}
			>
				{@render renderPanel(panel)}
			</div>
		{/each}
	</div>
</div>
