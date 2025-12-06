<script lang="ts">
	/**
	 * StructureGridPanel.svelte
	 *
	 * Displays a 2D grid visualization of settlement layout with structure placements.
	 * Supports keyboard navigation with arrow keys, responsive design, and full WCAG 2.1 AA accessibility.
	 *
	 * Features:
	 * - Configurable grid size (default 10x10)
	 * - Structure placement with visual indicators
	 * - Keyboard navigation (Up/Down/Left/Right arrow keys)
	 * - Touch support for mobile (tap for focus)
	 * - Hover/focus tooltips with structure details
	 * - Empty cell indicators for expansion planning
	 * - Responsive grid sizing (desktop to mobile)
	 * - WCAG 2.1 AA compliant with roving tabindex pattern
	 */

	import type { StructureType } from '$lib/types/structures';

	// ============================================================================
	// TYPE DEFINITIONS
	// ============================================================================

	interface Structure {
		id: string;
		type: StructureType;
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
		settlementId: string;
		gridSize?: number; // default 10
		structures?: Structure[];
		onCellClick?: (cell: GridCell) => void;
		onStructureSelect?: (structure: Structure) => void;
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
	function getBuildingLabel(type: StructureType): string {
		if (!type) return 'Unknown';
		return type
			.split('_')
			.map((word: string) => word.charAt(0) + word.slice(1).toLowerCase())
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

<section
	class="flex flex-col h-full overflow-hidden rounded-lg bg-surface-50 dark:bg-surface-950 border-2 border-surface-200 dark:border-surface-800 shadow-sm"
	aria-labelledby="grid-heading"
>
	<!-- Panel Header -->
	<header
		class="p-4 bg-surface-100 dark:bg-surface-900 border-b-2 border-surface-200 dark:border-surface-800"
	>
		<div class="flex items-center justify-between">
			<h2 id="grid-heading" class="text-2xl font-semibold text-surface-900 dark:text-surface-50">
				🗺️ Settlement Layout
			</h2>
			<div class="text-xs text-surface-600 dark:text-surface-400">
				<span class="sr-only">Cell statistics:</span>
				<span>{cellStats.occupied} occupied</span>
				<span class="mx-1">•</span>
				<span>{cellStats.empty} empty</span>
			</div>
		</div>
	</header>

	<!-- Grid Container -->
	<div class="flex-1 overflow-auto p-4">
		<!-- Grid Instructions (Screen Reader Only) -->
		<div class="sr-only" id="grid-instructions">
			Navigate the settlement grid using arrow keys. Press Enter or Space to select a cell. Use Tab
			to skip to the next section.
		</div>

		<!-- 2D Grid -->
		<div
			bind:this={gridElement}
			class="flex flex-col gap-1"
			role="grid"
			tabindex="0"
			aria-describedby="grid-instructions"
			onkeydown={handleKeyDown}
		>
			{#each grid as row, y (y)}
				<div class="flex gap-1" role="row" aria-rowindex={y + 1}>
					{#each row as cell, x (cell.x)}
						{@const structure = getStructureAt(x, y)}
						{@const isFocused = isCellFocused(x, y)}

						<button
							class="group relative aspect-square flex-1 min-w-0 min-h-10 md:min-h-16 lg:min-h-[72px] xl:min-h-20 p-1 rounded-md border-2 cursor-pointer transition-all duration-200 ease-in-out flex items-center justify-center {structure
								? 'bg-primary-50 dark:bg-primary-950 border-primary-300 dark:border-primary-700'
								: 'bg-surface-100 dark:bg-surface-900 border-surface-300 dark:border-surface-700 border-dashed'} {isFocused
								? 'border-primary-500 dark:border-primary-400 shadow-[0_0_0_2px] shadow-primary-200 dark:shadow-primary-800'
								: ''} hover:bg-surface-100 dark:hover:bg-surface-800 hover:border-primary-300 dark:hover:border-primary-600 hover:scale-105 hover:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 dark:focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:z-20"
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
								<div class="flex flex-col items-center justify-center gap-0.5">
									<!-- Icon -->
									<span class="text-xl md:text-2xl lg:text-[2.5rem] xl:text-5xl" aria-hidden="true">
										{getBuildingIcon(structure)}
									</span>

									<!-- Health Indicator -->
									{#if structure.health !== undefined}
										<span class="text-xs md:text-sm" data-testid="health" aria-hidden="true">
											{getHealthStatus(structure.health)}
										</span>
									{/if}
									<!-- Structure Name (Desktop Only) -->
									<span
										class="hidden md:block text-[0.625rem] lg:text-xs xl:text-sm font-semibold text-center leading-tight max-w-full overflow-hidden text-ellipsis whitespace-nowrap text-surface-900 dark:text-surface-50"
									>
										{structure.name}
									</span>

									<!-- Level Badge (Desktop Only) -->
									{#if structure.level}
										<span
											class="hidden md:inline-block text-[0.625rem] xl:text-xs font-bold text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-950 px-1 py-0.5 rounded leading-none"
											aria-hidden="true"
										>
											L{structure.level}
										</span>
									{/if}
								</div>

								<!-- Tooltip on Hover/Focus -->
								<div
									class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-surface-900 dark:bg-surface-950 text-surface-50 dark:text-surface-100 rounded-lg shadow-[0_4px_12px_rgba(0,0,0,0.3)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.6)] z-100 min-w-[200px] opacity-0 pointer-events-none transition-opacity duration-200 group-hover:opacity-100 group-focus:opacity-100 before:content-[''] before:absolute before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-[6px] before:border-transparent before:border-b-surface-900 dark:before:border-b-surface-950"
									role="tooltip"
								>
									<div
										class="flex items-center gap-2 mb-2 pb-2 border-b border-surface-700 dark:border-surface-800"
									>
										<span class="text-2xl" aria-hidden="true">
											{getBuildingIcon(structure)}
										</span>
										<span class="font-semibold text-sm">{structure.name}</span>
									</div>
									<div class="flex flex-col gap-1.5">
										<div class="flex justify-between text-xs">
											<span class="text-surface-400 dark:text-surface-500">Type:</span>
											<span>{getBuildingLabel(structure.type)}</span>
										</div>
										{#if structure.level}
											<div class="flex justify-between text-xs">
												<span class="text-surface-400 dark:text-surface-500">Level:</span>
												<span>{structure.level}</span>
											</div>
										{/if}
										{#if structure.health !== undefined}
											<div class="flex justify-between text-xs">
												<span class="text-surface-400 dark:text-surface-500">Health:</span>
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
										<div class="flex justify-between text-xs">
											<span class="text-surface-400 dark:text-surface-500">Position:</span>
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
		<div
			class="hidden min-[480px]:flex items-center justify-center gap-6 mt-4 pt-4 border-t border-surface-200 dark:border-surface-800"
			aria-label="Grid legend"
		>
			<div class="flex items-center gap-2 text-sm">
				<div
					class="w-5 h-5 rounded border-2 bg-primary-50 dark:bg-primary-950 border-primary-300 dark:border-primary-700"
				></div>
				<span class="text-xs">Occupied</span>
			</div>
			<div class="flex items-center gap-2 text-sm">
				<div
					class="w-5 h-5 rounded border-2 bg-surface-100 dark:bg-surface-950 border-surface-300 dark:border-surface-700 border-dashed"
				></div>
				<span class="text-xs">Empty</span>
			</div>
			<div class="flex items-center gap-2 text-sm">
				<div
					class="w-5 h-5 rounded border-2 bg-surface-50 dark:bg-surface-900 border-primary-500 dark:border-primary-400 shadow-[0_0_0_2px] shadow-primary-200 dark:shadow-primary-900"
				></div>
				<span class="text-xs">Focused</span>
			</div>
		</div>
	</div>
</section>
