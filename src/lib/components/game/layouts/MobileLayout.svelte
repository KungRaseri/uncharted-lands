<script lang="ts">
	/**
	 * Mobile Layout Component
	 *
	 * Single-column stacked layout for mobile viewports (<768px)
	 * Features:
	 * - Vertical scrolling
	 * - Collapsible panels to save space
	 * - Swipe-to-dismiss for alerts
	 * - Bottom-fixed quick actions
	 */

	import type { PanelConfig } from '$lib/stores/ui/dashboard-layout.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		panels: PanelConfig[];
		settlementId: string;
		renderPanel: Snippet<[PanelConfig]>;
	}

	let { panels, renderPanel }: Props = $props();

	// Sort all visible panels by position
	const sortedPanels = $derived(
		panels.filter((p) => p.visible).toSorted((a, b) => a.position - b.position)
	);

	// Touch gesture handling for swipe-to-dismiss
	let touchStartX = $state(0);
	let touchStartY = $state(0);

	function handleTouchStart(event: TouchEvent, _panelId: string) {
		const touch = event.touches[0];
		if (touch) {
			touchStartX = touch.clientX;
			touchStartY = touch.clientY;
		}
	}

	function handleTouchEnd(event: TouchEvent, _panelId: string) {
		const touch = event.changedTouches[0];
		if (touch) {
			const deltaX = touch.clientX - touchStartX;
			const deltaY = touch.clientY - touchStartY;

			// Swipe right to dismiss (for alerts panel only)
			if (_panelId === 'alerts' && deltaX > 100 && Math.abs(deltaY) < 50) {
				// TODO: Dispatch dismiss event
				console.log('Swipe to dismiss alert:', _panelId);
			}
		}
	}
</script>

<div class="mobile-layout" role="main">
	<!-- Main scrollable content -->
	<div class="panel-stack" role="region" aria-label="Settlement information">
		{#each sortedPanels as panel (panel.id)}
			<div
				class="panel-container"
				data-panel-id={panel.id}
				class:collapsed={panel.collapsed}
				class:dismissible={panel.id === 'alerts'}
				style="order: {panel.position};"
				ontouchstart={(e) => handleTouchStart(e, panel.id)}
				ontouchend={(e) => handleTouchEnd(e, panel.id)}
			>
				{@render renderPanel(panel)}
			</div>
		{/each}
	</div>
</div>

<style>
	.mobile-layout {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.panel-stack {
		flex: 1;
		overflow-y: auto;
		overflow-x: hidden;
		padding: var(--spacing-sm, 0.5rem);
		display: flex;
		flex-direction: column;
		gap: var(--spacing-sm, 0.5rem);
		padding-bottom: calc(var(--spacing-sm, 0.5rem) + 68px); /* Space for fixed quick actions bar */
	}

	.panel-container {
		transition: all 0.3s ease;
		border-radius: var(--radius-md, 0.5rem);
		background: var(--surface-50, #fafafa);
	}

	.panel-container.collapsed {
		max-height: 48px; /* Show header only */
		overflow: hidden;
	}

	.panel-container.dismissible {
		/* Enable swipe gestures */
		touch-action: pan-y;
	}

	/* Pull-to-refresh area (visual feedback) */
	.panel-stack::before {
		content: '';
		display: block;
		height: 60px;
		margin-top: -60px;
		background: linear-gradient(to bottom, transparent, var(--surface-100, #f3f4f6));
		opacity: 0;
		transition: opacity 0.2s;
	}

	/* Reduce motion for accessibility */
	@media (prefers-reduced-motion: reduce) {
		.panel-container {
			transition: none;
		}
	}

	/* Smaller screens (≤375px) */
	@media (max-width: 375px) {
		.panel-stack {
			padding: var(--spacing-xs, 0.25rem);
			gap: var(--spacing-xs, 0.25rem);
		}
	}
</style>
