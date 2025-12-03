<script lang="ts">
	/**
	 * StructureGridPanel.svelte
	 *
	 * Displays a 2D grid visualization of settlement layout with structure placements.
	 * Supports keyboard navigation with arrow keys, responsive design, and full WCAG 2.1 AA accessibility.
	 *
	 * Features:
	 * - Configurable grid size (default 10x10)
	 * - Structure placement with icons and names
	 * - Keyboard navigation (Up/Down/Left/Right arrow keys)
	 * - Touch support for mobile (tap for focus)
	 * - Hover/focus tooltips with structure details
	 * - Empty cell indicators for expansion planning
	 * - Responsive grid sizing (desktop to mobile)
	 * - WCAG 2.1 AA compliant with roving tabindex pattern
	 */

	import type { BuildingType } from '$lib/types/structures';

	// ============================================================================
	// TYPE DEFINITIONS
	// ============================================================================

	interface Structure {
		id: string;
		type: BuildingType;
		position: { x: number; y: number }; // 0-based grid coordinates
		name: string;
		icon?: string; // emoji or icon identifier
		level?: number;
		health?: number; // 0-100%
	}

	interface GridCell {
		x: number;
		y: number;
		structure?: Structure;
	}

	interface Props {
		gridSize?: number; // default 10
		structures?: Structure[];
		onCellClick?: (_cell: GridCell) => void;
		onStructureSelect?: (_structure: Structure) => void;
	}

	// ============================================================================
	// PROPS & STATE
	// ============================================================================

	let { gridSize = 10, structures = [], onCellClick, onStructureSelect }: Props = $props();

	// Keyboard navigation state
	let focusedCell = $state<{ x: number; y: number } | null>(null);
	let gridElement: HTMLDivElement | undefined = $state();

	// ============================================================================
	// DERIVED STATE
	// ============================================================================

	/**
	 * Generate 2D grid from gridSize
	 * Creates array of GridCell objects with x,y coordinates
	 */
	const grid = $derived(
		Array.from({ length: gridSize }, (_, y) =>
			Array.from({ length: gridSize }, (_, x) => ({ x, y }))
		)
	);

	/**
	 * Create lookup map for quick structure position queries
	 * Key: "x,y" coordinate string
	 * Value: Structure object
	 */
	const structureMap = $derived(
		structures.reduce(
			(map, structure) => {
				const key = `${structure.position.x},${structure.position.y}`;
				map[key] = structure;
				return map;
			},
			{} as Record<string, Structure>
		)
	);

	/**
	 * Get structure at specific grid position
	 */
	function getStructureAt(x: number, y: number): Structure | undefined {
		return structureMap[`${x},${y}`];
	}

	/**
	 * Check if cell is currently focused
	 */
	function isCellFocused(x: number, y: number): boolean {
		return focusedCell?.x === x && focusedCell?.y === y;
	}

	/**
	 * Count occupied vs empty cells for statistics
	 */
	const cellStats = $derived.by(() => {
		const occupied = structures.length;
		const total = gridSize * gridSize;
		return { occupied, empty: total - occupied, total };
	});

	// ============================================================================
	// ICON & LABEL HELPERS
	// ============================================================================

	/**
	 * Get emoji icon for building type
	 * Falls back to structure.icon if provided
	 */
	function getBuildingIcon(structure: Structure): string {
		if (structure.icon) return structure.icon;

		// Default icons by building type
		switch (structure.type) {
			// Resource Production
			case 'FARM':
				return '🌾';
			case 'LUMBER_MILL':
				return '🪵';
			case 'QUARRY':
				return '🪨';
			case 'MINE':
				return '⛏️';
			case 'FISHING_DOCK':
				return '🎣';

			// Housing & Infrastructure
			case 'HOUSE':
				return '🏠';
			case 'TENT':
				return '⛺';
			case 'STORAGE':
				return '📦';
			case 'WAREHOUSE':
				return '🏢';
			case 'TOWN_HALL':
				return '🏛️';

			// Defense & Special
			case 'WATCHTOWER':
				return '🗼';
			case 'WORKSHOP':
				return '🔧';
			case 'MARKETPLACE':
				return '🏪';
			case 'HOSPITAL':
				return '🏥';
			case 'RESEARCH_LAB':
				return '🔬';
			case 'LIBRARY':
				return '📚';

			// Default fallback
			default:
				return '🏗️';
		}
	}

	/**
	 * Get human-readable building type label
	 */
	function getBuildingLabel(type: BuildingType): string {
		return type
			.split('_')
			.map((word) => word.charAt(0) + word.slice(1).toLowerCase())
			.join(' ');
	}

	/**
	 * Get health status indicator
	 */
	function getHealthStatus(health: number | undefined): string {
		if (health === undefined) return '';
		if (health >= 90) return '💚';
		if (health >= 70) return '💛';
		if (health >= 40) return '🧡';
		return '❤️';
	}

	// ============================================================================
	// KEYBOARD NAVIGATION
	// ============================================================================

	/**
	 * Handle arrow key navigation
	 * Implements roving tabindex pattern for grid navigation
	 */
	function handleKeyDown(event: KeyboardEvent) {
		if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
			return;
		}

		event.preventDefault();

		// Initialize focused cell if not set
		if (!focusedCell) {
			focusedCell = { x: 0, y: 0 };
			return;
		}

		let newX = focusedCell.x;
		let newY = focusedCell.y;

		// Calculate new position based on arrow key
		switch (event.key) {
			case 'ArrowUp':
				newY = Math.max(0, focusedCell.y - 1);
				break;
			case 'ArrowDown':
				newY = Math.min(gridSize - 1, focusedCell.y + 1);
				break;
			case 'ArrowLeft':
				newX = Math.max(0, focusedCell.x - 1);
				break;
			case 'ArrowRight':
				newX = Math.min(gridSize - 1, focusedCell.x + 1);
				break;
		}

		// Update focused cell
		focusedCell = { x: newX, y: newY };

		// Focus the DOM element
		const cellButton = gridElement?.querySelector(
			`button[data-x="${newX}"][data-y="${newY}"]`
		) as HTMLButtonElement;

		if (cellButton) {
			cellButton.focus();
		}
	}

	/**
	 * Handle cell click/tap
	 */
	function handleCellClick(x: number, y: number) {
		focusedCell = { x, y };

		const structure = getStructureAt(x, y);
		const cell: GridCell = { x, y, structure };

		// Trigger callbacks
		onCellClick?.(cell);
		if (structure) {
			onStructureSelect?.(structure);
		}
	}

	/**
	 * Handle cell focus (for mouse/touch)
	 */
	function handleCellFocus(x: number, y: number) {
		focusedCell = { x, y };
	}

	// ============================================================================
	// ACCESSIBILITY HELPERS
	// ============================================================================

	/**
	 * Generate comprehensive aria-label for grid cell
	 */
	function getCellAriaLabel(x: number, y: number): string {
		const structure = getStructureAt(x, y);

		if (structure) {
			const healthStatus = structure.health ? `, ${structure.health}% health` : '';
			const levelInfo = structure.level ? `, Level ${structure.level}` : '';

			return `Row ${y + 1}, Column ${x + 1}: ${structure.name}${levelInfo}${healthStatus}`;
		}

		return `Row ${y + 1}, Column ${x + 1}: Empty cell`;
	}

	/**
	 * Get tabindex for roving tabindex pattern
	 * Only one cell in grid should be tabbable at a time
	 */
	function getCellTabIndex(x: number, y: number): number {
		// First render: make (0,0) tabbable
		if (!focusedCell) {
			return x === 0 && y === 0 ? 0 : -1;
		}

		// Currently focused cell is tabbable
		return isCellFocused(x, y) ? 0 : -1;
	}
</script>

<!-- ============================================================================ -->
<!-- TEMPLATE -->
<!-- ============================================================================ -->

<section class="structure-grid-panel card variant-soft-surface" aria-labelledby="grid-heading">
	<!-- Panel Header -->
	<header class="panel-header">
		<div class="flex items-center justify-between">
			<h2 id="grid-heading" class="h4 font-semibold">🗺️ Settlement Layout</h2>
			<div class="stats text-xs text-surface-600-300-token">
				<span class="sr-only">Cell statistics:</span>
				<span>{cellStats.occupied} occupied</span>
				<span class="mx-1">•</span>
				<span>{cellStats.empty} empty</span>
			</div>
		</div>
	</header>

	<!-- Grid Container -->
	<div class="panel-content">
		<!-- Grid Instructions (Screen Reader Only) -->
		<div class="sr-only" id="grid-instructions">
			Navigate the settlement grid using arrow keys. Press Enter or Space to select a cell. Use Tab
			to skip to the next section.
		</div>

		<!-- 2D Grid -->
		<div
			bind:this={gridElement}
			class="grid-container"
			role="grid"
			aria-describedby="grid-instructions"
			onkeydown={handleKeyDown}
		>
			{#each grid as row, y (y)}
				<div class="grid-row" role="row" aria-rowindex={y + 1}>
					{#each row as cell, x (cell.x)}
						{@const structure = getStructureAt(x, y)}
						{@const isFocused = isCellFocused(x, y)}

						<button
							class="grid-cell {structure ? 'occupied' : 'empty'} {isFocused ? 'focused' : ''}"
							role="gridcell"
							aria-colindex={x + 1}
							aria-label={getCellAriaLabel(x, y)}
							tabindex={getCellTabIndex(x, y)}
							data-x={x}
							data-y={y}
							onclick={() => handleCellClick(x, y)}
							onfocus={() => handleCellFocus(x, y)}
						>
							{#if structure}
								<!-- Occupied Cell: Display Structure -->
								<div class="structure-content">
									<!-- Icon -->
									<span class="structure-icon" aria-hidden="true">
										{getBuildingIcon(structure)}
									</span>

									<!-- Health Indicator -->
									{#if structure.health !== undefined}
										<span class="health-indicator" aria-hidden="true">
											{getHealthStatus(structure.health)}
										</span>
									{/if}

									<!-- Structure Name (Desktop Only) -->
									<span class="structure-name">
										{structure.name}
									</span>

									<!-- Level Badge (Desktop Only) -->
									{#if structure.level}
										<span class="level-badge" aria-hidden="true">
											L{structure.level}
										</span>
									{/if}
								</div>

								<!-- Tooltip on Hover/Focus -->
								<div class="structure-tooltip" role="tooltip">
									<div class="tooltip-header">
										<span class="tooltip-icon" aria-hidden="true">
											{getBuildingIcon(structure)}
										</span>
										<span class="tooltip-title">{structure.name}</span>
									</div>
									<div class="tooltip-body">
										<div class="tooltip-row">
											<span class="text-surface-600-300-token">Type:</span>
											<span>{getBuildingLabel(structure.type)}</span>
										</div>
										{#if structure.level}
											<div class="tooltip-row">
												<span class="text-surface-600-300-token">Level:</span>
												<span>{structure.level}</span>
											</div>
										{/if}
										{#if structure.health !== undefined}
											<div class="tooltip-row">
												<span class="text-surface-600-300-token">Health:</span>
												<span
													class={structure.health < 40
														? 'text-error-500'
														: structure.health < 70
															? 'text-warning-500'
															: 'text-success-500'}
												>
													{structure.health}%
												</span>
											</div>
										{/if}
										<div class="tooltip-row">
											<span class="text-surface-600-300-token">Position:</span>
											<span>({x}, {y})</span>
										</div>
									</div>
								</div>
							{:else}
								<!-- Empty Cell -->
								<div class="empty-content">
									<span class="empty-icon" aria-hidden="true">+</span>
									<span class="sr-only">Empty cell available for construction</span>
								</div>
							{/if}
						</button>
					{/each}
				</div>
			{/each}
		</div>

		<!-- Grid Legend (Desktop Only) -->
		<div class="grid-legend" aria-label="Grid legend">
			<div class="legend-item">
				<div class="legend-swatch occupied"></div>
				<span class="text-xs">Occupied</span>
			</div>
			<div class="legend-item">
				<div class="legend-swatch empty"></div>
				<span class="text-xs">Empty</span>
			</div>
			<div class="legend-item">
				<div class="legend-swatch focused"></div>
				<span class="text-xs">Focused</span>
			</div>
		</div>
	</div>
</section>

<!-- ============================================================================ -->
<!-- STYLES -->
<!-- ============================================================================ -->

<style lang="postcss">
	/* ========================================================================
	 * PANEL LAYOUT
	 * ======================================================================== */

	.structure-grid-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}

	.panel-header {
		padding: 1rem;
		background-color: var(--surface-100);
		border-bottom: 1px solid var(--surface-200);
	}

	.panel-content {
		flex: 1;
		overflow: auto;
		padding: 1rem;
	}

	/* ========================================================================
	 * GRID CONTAINER
	 * ======================================================================== */

	.grid-container {
		display: flex;
		flex-direction: column;
		gap: 0.25rem;
		max-width: 100%;
		margin: 0 auto;
	}

	.grid-row {
		display: flex;
		gap: 0.25rem;
	}

	/* ========================================================================
	 * GRID CELLS
	 * ======================================================================== */

	.grid-cell {
		position: relative;
		aspect-ratio: 1;
		flex: 1;
		min-width: 0;
		min-height: 48px; /* Minimum touch target */
		padding: 0.25rem;
		background-color: var(--surface-50);
		border: 2px solid var(--surface-200);
		border-radius: 0.375rem;
		cursor: pointer;
		transition: all 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.grid-cell:hover {
		background-color: var(--surface-100);
		border-color: var(--primary-300);
		transform: scale(1.05);
		z-index: 10;
	}

	.grid-cell:focus {
		outline: 3px solid var(--primary-500);
		outline-offset: 2px;
		z-index: 20;
	}

	.grid-cell.focused {
		border-color: var(--primary-500);
		box-shadow: 0 0 0 2px var(--primary-200);
	}

	/* Occupied Cell Styling */
	.grid-cell.occupied {
		background-color: var(--primary-50);
		border-color: var(--primary-300);
	}

	.grid-cell.occupied:hover {
		background-color: var(--primary-100);
		border-color: var(--primary-400);
	}

	/* Empty Cell Styling */
	.grid-cell.empty {
		background-color: var(--surface-100);
		border-color: var(--surface-300);
		border-style: dashed;
	}

	.grid-cell.empty:hover {
		background-color: var(--surface-200);
		border-color: var(--surface-400);
	}

	/* ========================================================================
	 * STRUCTURE CONTENT
	 * ======================================================================== */

	.structure-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.125rem;
		width: 100%;
		height: 100%;
	}

	.structure-icon {
		font-size: 1.5rem;
		line-height: 1;
	}

	.health-indicator {
		font-size: 0.75rem;
		line-height: 1;
	}

	.structure-name {
		font-size: 0.625rem;
		font-weight: 600;
		text-align: center;
		line-height: 1.2;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: none; /* Hidden on mobile by default */
	}

	.level-badge {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--primary-600);
		background-color: var(--primary-100);
		padding: 0.125rem 0.25rem;
		border-radius: 0.25rem;
		line-height: 1;
		display: none; /* Hidden on mobile by default */
	}

	/* ========================================================================
	 * EMPTY CELL CONTENT
	 * ======================================================================== */

	.empty-content {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		height: 100%;
	}

	.empty-icon {
		font-size: 1.5rem;
		color: var(--surface-400);
		font-weight: 300;
	}

	/* ========================================================================
	 * TOOLTIPS
	 * ======================================================================== */

	.structure-tooltip {
		position: absolute;
		top: 100%;
		left: 50%;
		transform: translateX(-50%);
		margin-top: 0.5rem;
		padding: 0.75rem;
		background-color: var(--surface-900);
		color: var(--surface-50);
		border-radius: 0.5rem;
		box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
		z-index: 100;
		min-width: 200px;
		opacity: 0;
		pointer-events: none;
		transition: opacity 0.2s ease;
	}

	.grid-cell:hover .structure-tooltip,
	.grid-cell:focus .structure-tooltip {
		opacity: 1;
	}

	.tooltip-header {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--surface-700);
	}

	.tooltip-icon {
		font-size: 1.5rem;
	}

	.tooltip-title {
		font-weight: 600;
		font-size: 0.875rem;
	}

	.tooltip-body {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.tooltip-row {
		display: flex;
		justify-content: space-between;
		font-size: 0.75rem;
	}

	/* Arrow for tooltip */
	.structure-tooltip::before {
		content: '';
		position: absolute;
		bottom: 100%;
		left: 50%;
		transform: translateX(-50%);
		border: 6px solid transparent;
		border-bottom-color: var(--surface-900);
	}

	/* ========================================================================
	 * GRID LEGEND
	 * ======================================================================== */

	.grid-legend {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 1.5rem;
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--surface-200);
	}

	.legend-item {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.legend-swatch {
		width: 20px;
		height: 20px;
		border-radius: 0.25rem;
		border: 2px solid;
	}

	.legend-swatch.occupied {
		background-color: var(--primary-50);
		border-color: var(--primary-300);
	}

	.legend-swatch.empty {
		background-color: var(--surface-100);
		border-color: var(--surface-300);
		border-style: dashed;
	}

	.legend-swatch.focused {
		background-color: var(--surface-50);
		border-color: var(--primary-500);
		box-shadow: 0 0 0 2px var(--primary-200);
	}

	/* ========================================================================
	 * RESPONSIVE DESIGN
	 * ======================================================================== */

	/* Small Mobile (<480px): Smaller icons, simplified layout */
	@media (max-width: 479px) {
		.grid-cell {
			min-height: 40px; /* Smaller cells on very small screens */
		}

		.structure-icon {
			font-size: 1.25rem;
		}

		.health-indicator {
			font-size: 0.625rem;
		}

		.empty-icon {
			font-size: 1.25rem;
		}

		.grid-legend {
			display: none; /* Hide legend on very small screens */
		}
	}

	/* Mobile/Tablet (480px - 767px): Standard mobile layout */
	@media (min-width: 480px) and (max-width: 767px) {
		.grid-cell {
			min-height: 44px; /* Standard touch target */
		}

		.structure-name {
			display: none; /* Still hidden */
		}

		.level-badge {
			display: none; /* Still hidden */
		}
	}

	/* Desktop (768px+): Show structure names and level badges */
	@media (min-width: 768px) {
		.grid-cell {
			min-height: 64px; /* Larger cells for desktop */
		}

		.structure-icon {
			font-size: 2rem;
		}

		.structure-name {
			display: block; /* Show structure names */
		}

		.level-badge {
			display: block; /* Show level badges */
		}
	}

	/* Large Desktop (1024px+): Even larger grid cells */
	@media (min-width: 1024px) {
		.grid-cell {
			min-height: 72px;
		}

		.structure-icon {
			font-size: 2.5rem;
		}

		.structure-name {
			font-size: 0.75rem;
		}
	}

	/* Ultrawide (1920px+): Maximum comfort */
	@media (min-width: 1920px) {
		.grid-cell {
			min-height: 80px;
		}

		.structure-icon {
			font-size: 3rem;
		}

		.structure-name {
			font-size: 0.875rem;
		}

		.level-badge {
			font-size: 0.75rem;
		}
	}

	/* ========================================================================
	 * ACCESSIBILITY MEDIA QUERIES
	 * ======================================================================== */

	/* High Contrast Mode: Stronger borders */
	@media (prefers-contrast: high) {
		.grid-cell {
			border-width: 3px;
		}

		.grid-cell.focused {
			box-shadow: 0 0 0 4px var(--primary-300);
		}

		.grid-cell:focus {
			outline-width: 4px;
		}
	}

	/* Reduced Motion: Disable transitions and transforms */
	@media (prefers-reduced-motion: reduce) {
		.grid-cell {
			transition: none;
		}

		.grid-cell:hover {
			transform: none;
		}

		.structure-tooltip {
			transition: none;
		}
	}

	/* ========================================================================
	 * SCREEN READER ONLY
	 * ======================================================================== */

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
</style>
