<script lang="ts">
	/**
	 * Draggable Panel List Component
	 *
	 * Reorderable list of dashboard panels with:
	 * - Touch/mouse drag-to-reorder
	 * - Keyboard reordering (Up/Down arrows)
	 * - Visual feedback during drag
	 * - Accessibility (ARIA live region)
	 */

	import type { PanelConfig } from '$lib/stores/ui/dashboard-layout.svelte';

	interface Props {
		panels: PanelConfig[];
		panelNames: Record<string, string>;
		onReorder: (panelId: string, newPosition: number) => void;
	}

	let { panels, panelNames, onReorder }: Props = $props();

	// Drag state
	let draggedPanelId = $state<string | null>(null);
	let draggedOverPanelId = $state<string | null>(null);
	let isDragging = $state(false);
	let touchStartY = $state(0);

	// Sort panels by position for display
	const sortedPanels = $derived([...panels].sort((a, b) => a.position - b.position));

	// Drag handlers (Mouse)
	function handleDragStart(e: DragEvent, panelId: string) {
		draggedPanelId = panelId;
		isDragging = true;

		// Set drag image
		if (e.dataTransfer) {
			e.dataTransfer.effectAllowed = 'move';
			e.dataTransfer.setData('text/plain', panelId);
		}
	}

	function handleDragOver(e: DragEvent, panelId: string) {
		e.preventDefault();
		draggedOverPanelId = panelId;
	}

	function handleDragEnd() {
		draggedPanelId = null;
		draggedOverPanelId = null;
		isDragging = false;
	}

	function handleDrop(e: DragEvent, targetPanelId: string) {
		e.preventDefault();

		if (draggedPanelId && draggedPanelId !== targetPanelId) {
			const targetPanel = panels.find((p) => p.id === targetPanelId);
			if (targetPanel) {
				onReorder(draggedPanelId, targetPanel.position);
			}
		}

		handleDragEnd();
	}

	// Touch handlers
	function handleTouchStart(e: TouchEvent, panelId: string) {
		draggedPanelId = panelId;
		touchStartY = e.touches[0].clientY;
		isDragging = true;
	}

	function handleTouchMove(e: TouchEvent) {
		if (!draggedPanelId) return;

		const touch = e.touches[0];
		const element = document.elementFromPoint(touch.clientX, touch.clientY);

		// Find panel under touch
		const panelElement = element?.closest('[data-panel-id]') as HTMLElement;
		if (panelElement) {
			const panelId = panelElement.dataset.panelId;
			if (panelId) {
				draggedOverPanelId = panelId;
			}
		}
	}

	function handleTouchEnd() {
		if (draggedPanelId && draggedOverPanelId && draggedPanelId !== draggedOverPanelId) {
			const targetPanel = panels.find((p) => p.id === draggedOverPanelId);
			if (targetPanel) {
				onReorder(draggedPanelId, targetPanel.position);
			}
		}

		handleDragEnd();
	}

	// Keyboard handlers
	function handleKeydown(e: KeyboardEvent, panelId: string) {
		const panel = panels.find((p) => p.id === panelId);
		if (!panel) return;

		let handled = false;

		switch (e.key) {
			case 'ArrowUp':
				if (panel.position > 0) {
					onReorder(panelId, panel.position - 1);
					handled = true;
				}
				break;

			case 'ArrowDown':
				if (panel.position < panels.length - 1) {
					onReorder(panelId, panel.position + 1);
					handled = true;
				}
				break;

			case 'Home':
				if (panel.position !== 0) {
					onReorder(panelId, 0);
					handled = true;
				}
				break;

			case 'End':
				if (panel.position !== panels.length - 1) {
					onReorder(panelId, panels.length - 1);
					handled = true;
				}
				break;
		}

		if (handled) {
			e.preventDefault();
		}
	}
</script>

<div class="flex flex-col gap-2" role="list" aria-label="Dashboard panels">
	{#each sortedPanels as panel (panel.id)}
		<div
			class={`flex items-center gap-3 p-3 min-h-14 rounded-lg border-2 cursor-move select-none transition-all duration-200 ${
				draggedPanelId === panel.id
					? 'opacity-50 scale-[0.98]'
					: draggedOverPanelId === panel.id && draggedPanelId !== panel.id
						? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900'
						: 'border-transparent bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700'
			} focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary-500 dark:focus-visible:outline-primary-400 focus-visible:outline-offset-2`}
			data-panel-id={panel.id}
			role="button"
			draggable="true"
			ondragstart={(e) => handleDragStart(e, panel.id)}
			ondragover={(e) => handleDragOver(e, panel.id)}
			ondragend={handleDragEnd}
			ondrop={(e) => handleDrop(e, panel.id)}
			ontouchstart={(e) => handleTouchStart(e, panel.id)}
			ontouchmove={handleTouchMove}
			ontouchend={handleTouchEnd}
			tabindex="0"
			onkeydown={(e) => handleKeydown(e, panel.id)}
			aria-label={`${panelNames[panel.id]}, position ${panel.position + 1} of ${panels.length}. Use arrow keys to reorder.`}
		>
			<!-- Drag Handle -->
			<div
				class="flex items-center text-surface-600 dark:text-surface-400 cursor-grab active:cursor-grabbing"
				aria-hidden="true"
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
				>
					<line x1="5" y1="9" x2="19" y2="9" />
					<line x1="5" y1="15" x2="19" y2="15" />
				</svg>
			</div>

			<!-- Panel Info -->
			<div class="flex flex-col gap-1 flex-1">
				<span class="text-[0.9375rem] font-medium text-surface-900 dark:text-surface-50"
					>{panelNames[panel.id]}</span
				>
				<span class="text-xs text-surface-600 dark:text-surface-400"
					>Position {panel.position + 1}</span
				>
			</div>

			<!-- Visual indicator (collapsed/visible) -->
			<div class="flex gap-2">
				{#if !panel.visible}
					<span
						class="px-2 py-1 rounded text-xs font-medium uppercase bg-error-100 dark:bg-error-900 text-error-700 dark:text-error-200"
						title="Hidden">Hidden</span
					>
				{:else if panel.collapsed}
					<span
						class="px-2 py-1 rounded text-xs font-medium uppercase bg-warning-100 dark:bg-warning-900 text-warning-700 dark:text-warning-200"
						title="Collapsed">Collapsed</span
					>
				{/if}
			</div>
		</div>
	{/each}
</div>

<!-- ARIA live region for screen reader announcements -->
<div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
	{#if isDragging && draggedPanelId}
		{panelNames[draggedPanelId]} is being moved
	{/if}
</div>
