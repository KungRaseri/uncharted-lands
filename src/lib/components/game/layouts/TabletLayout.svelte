<script lang="ts">
	/**
	 * Tablet Layout Component
	 *
	 * 2-column layout for tablet viewports (768px-1023px)
	 * - Left column: Quick Actions, Resources, Population
	 * - Right column: Construction, Structures, Alerts
	 */

	import type { PanelConfig } from '$lib/stores/ui/dashboard-layout.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		panels: PanelConfig[];
		settlementId: string;
		renderPanel: Snippet<[PanelConfig]>;
	}

	let { panels, renderPanel }: Props = $props();

	// Group panels by position (even: left, odd: right)
	const leftPanels = $derived(
		panels
			.filter((p) => p.visible && p.position % 2 === 0)
			.toSorted((a, b) => a.position - b.position)
	);
	const rightPanels = $derived(
		panels
			.filter((p) => p.visible && p.position % 2 === 1)
			.toSorted((a, b) => a.position - b.position)
	);
</script>

<div class="tablet-layout" role="main">
	<!-- Left Column -->
	<div class="column column-left" role="region" aria-label="Primary panels">
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

	<!-- Right Column -->
	<div class="column column-right" role="region" aria-label="Secondary panels">
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
	.tablet-layout {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: var(--spacing-md, 1rem);
		padding: var(--spacing-md, 1rem);
		height: 100%;
	}

	.column {
		display: flex;
		flex-direction: column;
		gap: var(--spacing-md, 1rem);
		overflow-y: auto;
		overflow-x: hidden;
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
		width: 6px;
	}

	.column::-webkit-scrollbar-track {
		background: var(--surface-100, #f3f4f6);
		border-radius: 3px;
	}

	.column::-webkit-scrollbar-thumb {
		background: var(--surface-400, #9ca3af);
		border-radius: 3px;
	}

	.column::-webkit-scrollbar-thumb:hover {
		background: var(--surface-500, #6b7280);
	}
</style>
