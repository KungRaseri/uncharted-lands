<script lang="ts">
	/**
	 * Desktop Layout Component
	 *
	 * Grid-based 3-column layout for desktop viewports (≥1024px)
	 * - Left column: Resources, Population, Alerts
	 * - Center column: Construction Queue, Structures (main content)
	 * - Right column: Quick Actions, Next Action Suggestion
	 */

	import type { PanelConfig } from '$lib/stores/ui/dashboard-layout.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		panels: PanelConfig[];
		settlementId: string;
		renderPanel: Snippet<[PanelConfig]>;
	}

	let { panels, settlementId: _settlementId, renderPanel }: Props = $props();

	// Group panels by position (0-2: left, 3-4: center, 5+: right)
	const leftPanels = $derived(
		panels
			.filter((p) => p.visible && p.position >= 0 && p.position <= 2)
			.toSorted((a, b) => a.position - b.position)
	);
	const centerPanels = $derived(
		panels
			.filter((p) => p.visible && p.position >= 3 && p.position <= 4)
			.toSorted((a, b) => a.position - b.position)
	);
	const rightPanels = $derived(
		panels.filter((p) => p.visible && p.position >= 5).toSorted((a, b) => a.position - b.position)
	);
</script>

<div class="desktop-layout" role="main">
	<!-- Left Column: Information Panels -->
	<div class="column column-left" role="region" aria-label="Information panels">
		{#each leftPanels as panel (panel.id)}
			<div
				class="panel-container"
				data-panel-id={panel.id}
				class:collapsed={panel.collapsed}
				style="order: {panel.position};"
			>
				{@render renderPanel(panel)}
			</div>
		{/each}
	</div>

	<!-- Center Column: Main Content -->
	<div class="column column-center" role="region" aria-label="Main content">
		{#each centerPanels as panel (panel.id)}
			<div
				class="panel-container"
				data-panel-id={panel.id}
				class:collapsed={panel.collapsed}
				style="order: {panel.position};"
			>
				{@render renderPanel(panel)}
			</div>
		{/each}
	</div>

	<!-- Right Column: Actions & Suggestions -->
	<div class="column column-right" role="region" aria-label="Actions and suggestions">
		{#each rightPanels as panel (panel.id)}
			<div
				class="panel-container"
				data-panel-id={panel.id}
				class:collapsed={panel.collapsed}
				style="order: {panel.position};"
			>
				{@render renderPanel(panel)}
			</div>
		{/each}
	</div>
</div>

<style>
	.desktop-layout {
		display: grid;
		grid-template-columns: 300px 1fr 350px;
		gap: var(--spacing-lg, 1.5rem);
		padding: var(--spacing-lg, 1.5rem);
		max-width: 1920px;
		margin: 0 auto;
		height: 100%;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md, 1rem);
		overflow-y: auto;
		overflow-x: hidden;
	}

	.column-left {
		/* Fixed width sidebar for info panels */
		min-width: 280px;
	}

	.column-center {
		/* Main content area takes remaining space */
		min-width: 0; /* Prevent grid blowout */
	}

	.column-right {
		/* Fixed width sidebar for actions */
		min-width: 300px;
	}

	.panel-container {
		transition: all 0.3s ease;
	}

	.panel-container.collapsed {
		max-height: 48px; /* Show header only */
		overflow: hidden;
	}

	/* Scrollbar styling */
	.column::-webkit-scrollbar {
		width: 8px;
	}

	.column::-webkit-scrollbar-track {
		background: var(--surface-100, #f3f4f6);
		border-radius: 4px;
	}

	.column::-webkit-scrollbar-thumb {
		background: var(--surface-400, #9ca3af);
		border-radius: 4px;
	}

	.column::-webkit-scrollbar-thumb:hover {
		background: var(--surface-500, #6b7280);
	}

	/* Ultrawide screens (≥1920px) */
	@media (min-width: 1920px) {
		.desktop-layout {
			grid-template-columns: 350px 1fr 400px;
		}
	}
</style>
