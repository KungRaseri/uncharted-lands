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

<div class="grid grid-cols-2 gap-4 p-4 h-full" role="main">
	<!-- Left Column -->
	<div
		class="flex flex-col gap-4 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-surface-100 [&::-webkit-scrollbar-track]:dark:bg-surface-800 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-surface-400 [&::-webkit-scrollbar-thumb]:dark:bg-surface-600 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-surface-500 [&::-webkit-scrollbar-thumb:hover]:dark:bg-surface-500"
		role="region"
		aria-label="Primary panels"
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

	<!-- Right Column -->
	<div
		class="flex flex-col gap-4 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-surface-100 [&::-webkit-scrollbar-track]:dark:bg-surface-800 [&::-webkit-scrollbar-track]:rounded [&::-webkit-scrollbar-thumb]:bg-surface-400 [&::-webkit-scrollbar-thumb]:dark:bg-surface-600 [&::-webkit-scrollbar-thumb]:rounded [&::-webkit-scrollbar-thumb:hover]:bg-surface-500 [&::-webkit-scrollbar-thumb:hover]:dark:bg-surface-500"
		role="region"
		aria-label="Secondary panels"
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
