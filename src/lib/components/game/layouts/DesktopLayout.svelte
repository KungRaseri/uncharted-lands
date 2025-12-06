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

	let { panels, renderPanel }: Props = $props();

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

<div
	class="grid grid-cols-[300px_1fr_350px] 2xl:grid-cols-[350px_1fr_400px] gap-6 p-6 max-w-[1920px] mx-auto h-full"
	role="main"
>
	<!-- Left Column: Information Panels -->
	<div
		class="flex flex-col gap-4 overflow-y-auto overflow-x-hidden min-w-[280px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-surface-100 [&::-webkit-scrollbar-track]:dark:bg-surface-800 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-surface-400 [&::-webkit-scrollbar-thumb]:dark:bg-surface-600 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-surface-500 [&::-webkit-scrollbar-thumb:hover]:dark:bg-surface-500"
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
		class="flex flex-col gap-4 overflow-y-auto overflow-x-hidden min-w-[300px] [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-surface-100 [&::-webkit-scrollbar-track]:dark:bg-surface-800 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-surface-400 [&::-webkit-scrollbar-thumb]:dark:bg-surface-600 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-surface-500 [&::-webkit-scrollbar-thumb:hover]:dark:bg-surface-500"
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
