<script lang="ts">
	/**
	 * Desktop Layout Component
	 *
	 * Grid-based 2-row layout for desktop viewports (≥1024px)
	 * - Row 1 (Header): Full-width resource header bar
	 * - Rows 2 (Body): 3-column grid
	 *   - Left column: Settlement info, Population, Alerts
	 *   - Center column: Tile Slots, Structure List, Production Overview
	 *   - Right column: Construction Queue, Quick Actions
	 */

	import type { PanelConfig } from '$lib/stores/ui/dashboard-layout.svelte';
	import type { Snippet } from 'svelte';

	interface Props {
		panels: PanelConfig[];
		settlementId: string;
		renderPanel: Snippet<[PanelConfig]>;
	}

	let { panels, renderPanel }: Props = $props();

	// Group panels by position
	// Position -1: Header bar (full width)
	// Position 0-2: Left column
	// Position 3-5: Center column
	// Position 6+: Right column
	const headerPanels = $derived(
		panels.filter((p) => p.visible && p.position === -1).toSorted((a, b) => a.position - b.position)
	);
	const leftPanels = $derived(
		panels
			.filter((p) => p.visible && p.position >= 0 && p.position <= 2)
			.toSorted((a, b) => a.position - b.position)
	);
	const centerPanels = $derived(
		panels
			.filter((p) => p.visible && p.position >= 3 && p.position <= 5)
			.toSorted((a, b) => a.position - b.position)
	);
	const rightPanels = $derived(
		panels.filter((p) => p.visible && p.position >= 6).toSorted((a, b) => a.position - b.position)
	);
</script>

<div
	class="grid h-full max-w-[1920px] mx-auto"
	style="grid-template-rows: auto 1fr; grid-template-columns: 300px 1fr 350px;"
	role="main"
>
	<!-- Header Row: Full-width header bar spanning all columns -->
	<div
		class="flex flex-col gap-4"
		style="grid-column: 1 / -1; grid-row: 1 / 2;"
		role="region"
		aria-label="Header bar"
	>
		{#each headerPanels as panel (panel.id)}
			<div
				class="transition-all duration-300"
				class:max-h-12={panel.collapsed}
				class:overflow-hidden={panel.collapsed}
				data-panel-id={panel.id}
				style="order: {panel.position};"
			>
				{@render renderPanel(panel)}
			</div>
		{/each}
	</div>

	<!-- Left Column: Information Panels -->
	<div
		class="flex flex-col gap-4 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-surface-100 [&::-webkit-scrollbar-track]:dark:bg-surface-800 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-surface-400 [&::-webkit-scrollbar-thumb]:dark:bg-surface-600 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-surface-500 [&::-webkit-scrollbar-thumb:hover]:dark:bg-surface-500"
		style="grid-column: 1 / 2; grid-row: 2 / 3;"
		role="region"
		aria-label="Information panels"
	>
		{#each leftPanels as panel (panel.id)}
			<div
				class="transition-all duration-300"
				class:max-h-12={panel.collapsed}
				class:overflow-hidden={panel.collapsed}
				data-panel-id={panel.id}
				style="order: {panel.position};"
			>
				{@render renderPanel(panel)}
			</div>
		{/each}
	</div>

	<!-- Center Column: Main Content -->
	<div
		class="flex flex-col gap-4 overflow-y-auto overflow-x-hidden min-w-0 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-surface-100 [&::-webkit-scrollbar-track]:dark:bg-surface-800 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-surface-400 [&::-webkit-scrollbar-thumb]:dark:bg-surface-600 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-surface-500 [&::-webkit-scrollbar-thumb:hover]:dark:bg-surface-500"
		style="grid-column: 2 / 3; grid-row: 2 / 3;"
		role="region"
		aria-label="Main content"
	>
		{#each centerPanels as panel (panel.id)}
			<div
				class="transition-all duration-300"
				class:max-h-12={panel.collapsed}
				class:overflow-hidden={panel.collapsed}
				data-panel-id={panel.id}
				style="order: {panel.position};"
			>
				{@render renderPanel(panel)}
			</div>
		{/each}
	</div>

	<!-- Right Column: Actions & Suggestions -->
	<div
		class="flex flex-col gap-4 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-surface-100 [&::-webkit-scrollbar-track]:dark:bg-surface-800 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-surface-400 [&::-webkit-scrollbar-thumb]:dark:bg-surface-600 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-surface-500 [&::-webkit-scrollbar-thumb:hover]:dark:bg-surface-500"
		style="grid-column: 3 / 4; grid-row: 2 / 3;"
		role="region"
		aria-label="Actions and suggestions"
	>
		{#each rightPanels as panel (panel.id)}
			<div
				class="transition-all duration-300"
				class:max-h-12={panel.collapsed}
				class:overflow-hidden={panel.collapsed}
				data-panel-id={panel.id}
				style="order: {panel.position};"
			>
				{@render renderPanel(panel)}
			</div>
		{/each}
	</div>
</div>
