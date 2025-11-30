<script lang="ts">
	/**
	 * Settlement Dashboard Component
	 *
	 * Main dashboard for managing a settlement with:
	 * - Responsive layouts (Desktop/Tablet/Mobile)
	 * - Customizable panels
	 * - Quick actions bar
	 * - Keyboard shortcuts
	 */

	import { layoutStore } from '$lib/stores/ui/dashboard-layout';
	import type { PanelConfig } from '$lib/stores/ui/dashboard-layout';
	import QuickActionsBar from './QuickActionsBar.svelte';
	import DesktopLayout from './layouts/DesktopLayout.svelte';
	import TabletLayout from './layouts/TabletLayout.svelte';
	import MobileLayout from './layouts/MobileLayout.svelte';

	interface Props {
		settlementId: string;
	}

	let { settlementId }: Props = $props();

	// Get current layout and viewport from store
	const currentLayout = $derived(layoutStore.getCurrentLayout());
	const viewport = $derived(layoutStore.getViewport());

	// Announcement for screen readers
	let announcement = $state('');

	// Keyboard shortcuts
	function handleKeyboardShortcut(event: KeyboardEvent) {
		// Don't trigger if user is typing in an input
		if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
			return;
		}

		switch (event.key.toLowerCase()) {
			case 'b':
				event.preventDefault();
				announcement = 'Opening build menu';
				// TODO: Open build menu
				break;
			case 'c':
				event.preventDefault();
				announcement = 'Collecting resources';
				// TODO: Collect resources
				break;
			case 'u':
				event.preventDefault();
				announcement = 'Opening upgrade menu';
				// TODO: Open upgrade menu
				break;
			case 'r':
				event.preventDefault();
				announcement = 'Opening repair interface';
				// TODO: Open repair interface
				break;
			case 'a':
				event.preventDefault();
				announcement = 'Opening aid interface';
				// TODO: Open aid interface
				break;
			case 'm':
				event.preventDefault();
				announcement = 'Opening map';
				// TODO: Open map
				break;
		}
	}
</script>

<svelte:window onkeydown={handleKeyboardShortcut} />

{#snippet panelContent(panel: PanelConfig)}
	<div class="panel-placeholder">
		<h3>{panel.id}</h3>
		<p>Panel content for {panel.id}</p>
		<!-- TODO: Replace with actual panel components based on panel.id -->
	</div>
{/snippet}

<div class="settlement-dashboard">
	<!-- Skip to content link for accessibility -->
	<a href="#main-content" class="skip-link">Skip to main content</a>

	<!-- Screen reader announcements -->
	<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
		{announcement}
	</div>

	<!-- Quick Actions Bar (always visible) -->
	<div class="quick-actions-wrapper">
		<QuickActionsBar {settlementId} />
	</div>

	<!-- Main content with responsive layout -->
	<div id="main-content" class="dashboard-content">
		{#if viewport === 'desktop'}
			<DesktopLayout panels={currentLayout.panels} {settlementId} renderPanel={panelContent} />
		{:else if viewport === 'tablet'}
			<TabletLayout panels={currentLayout.panels} {settlementId} renderPanel={panelContent} />
		{:else}
			<MobileLayout panels={currentLayout.panels} {settlementId} renderPanel={panelContent} />
		{/if}
	</div>
</div>

<style>
	.settlement-dashboard {
		display: flex;
		flex-direction: column;
		height: 100vh;
		overflow: hidden;
		background: var(--surface-50, #fafafa);
	}

	/* Skip link for accessibility */
	.skip-link {
		position: absolute;
		top: -40px;
		left: 0;
		background: var(--primary-500, #3b82f6);
		color: white;
		padding: 8px 16px;
		text-decoration: none;
		border-radius: 0 0 4px 0;
		z-index: 1000;
	}

	.skip-link:focus {
		top: 0;
	}

	/* Screen reader only */
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

	.quick-actions-wrapper {
		flex-shrink: 0;
		z-index: 100;
	}

	.dashboard-content {
		flex: 1;
		overflow: hidden;
	}

	/* Placeholder styling (will be replaced with actual panels) */
	.panel-placeholder {
		padding: var(--spacing-md, 1rem);
		background: white;
		border-radius: var(--radius-md, 0.5rem);
		border: 2px dashed var(--surface-300, #d1d5db);
	}

	.panel-placeholder h3 {
		margin: 0 0 var(--spacing-sm, 0.5rem) 0;
		text-transform: capitalize;
		color: var(--text-primary, #111827);
	}

	.panel-placeholder p {
		margin: 0;
		color: var(--text-secondary, #6b7280);
		font-size: 0.875rem;
	}

	/* Mobile specific styles */
	@media (max-width: 767px) {
		.quick-actions-wrapper {
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			background: white;
			box-shadow: 0 -4px 8px rgba(0, 0, 0, 0.1);
			z-index: 200;
		}
	}
</style>
