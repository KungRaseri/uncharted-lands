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

<div class="panel-list" role="list" aria-label="Dashboard panels">
	{#each sortedPanels as panel (panel.id)}
		<div
			class="panel-item"
			class:dragging={draggedPanelId === panel.id}
			class:drag-over={draggedOverPanelId === panel.id && draggedPanelId !== panel.id}
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
			<div class="drag-handle" aria-hidden="true">
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
			<div class="panel-info">
				<span class="panel-name">{panelNames[panel.id]}</span>
				<span class="panel-position">Position {panel.position + 1}</span>
			</div>

			<!-- Visual indicator (collapsed/visible) -->
			<div class="panel-status">
				{#if !panel.visible}
					<span class="status-badge hidden" title="Hidden">Hidden</span>
				{:else if panel.collapsed}
					<span class="status-badge collapsed" title="Collapsed">Collapsed</span>
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

<style>
	/* Panel List */
	.panel-list {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	/* Panel Item */
	.panel-item {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		padding: 0.75rem;
		background: var(--color-surface-secondary, #f5f5f5);
		border: 2px solid transparent;
		border-radius: 0.5rem;
		cursor: move;
		transition: all 0.2s ease;
		min-height: 56px; /* Touch target */
		user-select: none;
	}

	.panel-item:hover {
		background: var(--color-surface-tertiary, #e0e0e0);
	}

	.panel-item:focus {
		outline: 2px solid var(--color-primary-500, #3b82f6);
		outline-offset: 2px;
	}

	.panel-item.dragging {
		opacity: 0.5;
		transform: scale(0.98);
	}

	.panel-item.drag-over {
		border-color: var(--color-primary-500, #3b82f6);
		background: var(--color-primary-50, #eff6ff);
	}

	/* Drag Handle */
	.drag-handle {
		color: var(--color-text-secondary, #666);
		display: flex;
		align-items: center;
		cursor: grab;
	}

	.panel-item:active .drag-handle {
		cursor: grabbing;
	}

	/* Panel Info */
	.panel-info {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		flex: 1;
	}

	.panel-name {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--color-text-primary, #1a1a1a);
	}

	.panel-position {
		font-size: 0.75rem;
		color: var(--color-text-secondary, #666);
	}

	/* Panel Status */
	.panel-status {
		display: flex;
		gap: 0.5rem;
	}

	.status-badge {
		padding: 0.25rem 0.5rem;
		border-radius: 0.25rem;
		font-size: 0.75rem;
		font-weight: 500;
		text-transform: uppercase;
	}

	.status-badge.hidden {
		background: var(--color-error-100, #fee);
		color: var(--color-error-700, #b91c1c);
	}

	.status-badge.collapsed {
		background: var(--color-warning-100, #fef3c7);
		color: var(--color-warning-700, #a16207);
	}

	/* Screen Reader Only */
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

	/* Dark Mode */
	:global(.dark) .panel-item {
		background: var(--color-surface-secondary-dark, #2a2a2a);
	}

	:global(.dark) .panel-item:hover {
		background: var(--color-surface-tertiary-dark, #3a3a3a);
	}

	:global(.dark) .panel-item.drag-over {
		background: var(--color-primary-900, #1e3a8a);
		border-color: var(--color-primary-400, #60a5fa);
	}

	:global(.dark) .drag-handle {
		color: var(--color-text-secondary-dark, #a0a0a0);
	}

	:global(.dark) .panel-name {
		color: var(--color-text-primary-dark, #f5f5f5);
	}

	:global(.dark) .panel-position {
		color: var(--color-text-secondary-dark, #a0a0a0);
	}

	:global(.dark) .status-badge.hidden {
		background: var(--color-error-900, #7f1d1d);
		color: var(--color-error-200, #fecaca);
	}

	:global(.dark) .status-badge.collapsed {
		background: var(--color-warning-900, #78350f);
		color: var(--color-warning-200, #fef3c7);
	}
</style>
