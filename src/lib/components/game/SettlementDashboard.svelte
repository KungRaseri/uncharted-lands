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

	// Panel Components
	import DashboardHeader from './panels/DashboardHeader.svelte';
	import AlertsPanel from './panels/AlertsPanel.svelte';
	import ResourcePanel from './panels/ResourcePanel.svelte';
	import PopulationPanel from './panels/PopulationPanel.svelte';
	import ConstructionQueuePanel from './panels/ConstructionQueuePanel.svelte';
	import NextActionSuggestion from './panels/NextActionSuggestion.svelte';
	import StructureGridPanel from './panels/StructureGridPanel.svelte';

	interface Props {
		settlementId: string;
		settlementName: string;
	}

	let { settlementId, settlementName }: Props = $props();

	// Mock data for panels (TODO: Replace with real data from stores/API)

	// Alerts mock data
	const mockAlerts = [
		{
			id: '1',
			severity: 'critical' as const,
			title: 'Food shortage imminent',
			message: 'Food reserves will be depleted in 2 hours. Build more farms or reduce population.',
			timestamp: Date.now() - 300000 // 5 minutes ago
		},
		{
			id: '2',
			severity: 'warning' as const,
			title: 'Low wood supply',
			message: 'Wood reserves at 35%. Consider building a lumber mill.',
			timestamp: Date.now() - 600000 // 10 minutes ago
		},
		{
			id: '3',
			severity: 'info' as const,
			title: 'Construction complete',
			message: 'Farmhouse construction completed successfully.',
			timestamp: Date.now() - 900000 // 15 minutes ago
		}
	];

	// Resources mock data
	const mockResources = [
		{
			type: 'FOOD' as const,
			current: 450,
			capacity: 1000,
			production: 15,
			consumption: 25
		},
		{
			type: 'WATER' as const,
			current: 780,
			capacity: 1000,
			production: 20,
			consumption: 18
		},
		{
			type: 'WOOD' as const,
			current: 320,
			capacity: 800,
			production: 12,
			consumption: 8
		},
		{
			type: 'STONE' as const,
			current: 150,
			capacity: 500,
			production: 5,
			consumption: 3
		},
		{
			type: 'ORE' as const,
			current: 80,
			capacity: 300,
			production: 3,
			consumption: 2
		}
	];

	// Population mock data
	const mockPopulation = {
		current: 245,
		capacity: 300,
		happiness: 78,
		growthRate: 5.2,
		demographics: {
			workers: 150,
			children: 60,
			elderly: 35
		}
	};

	// Construction queue mock data
	const mockActiveProjects = [
		{
			id: '1',
			name: 'Farmhouse',
			type: 'HOUSING' as const,
			progress: 75,
			startTime: Date.now() - 900000, // Started 15 minutes ago
			completionTime: Date.now() + 300000, // Completes in 5 minutes
			resources: { wood: 50, stone: 30 }
		},
		{
			id: '2',
			name: 'Watchtower',
			type: 'DEFENSE' as const,
			progress: 30,
			startTime: Date.now() - 300000, // Started 5 minutes ago
			completionTime: Date.now() + 900000, // Completes in 15 minutes
			resources: { wood: 80, stone: 60, ore: 20 }
		}
	];

	const mockQueuedProjects = [
		{
			id: '3',
			name: 'Workshop',
			type: 'INFRASTRUCTURE' as const,
			progress: 0,
			startTime: 0,
			completionTime: 0,
			resources: { wood: 100, stone: 80, ore: 40 }
		},
		{
			id: '4',
			name: 'Storage Facility',
			type: 'INFRASTRUCTURE' as const,
			progress: 0,
			startTime: 0,
			completionTime: 0,
			resources: { wood: 60, stone: 40 }
		}
	];

	// Suggestions mock data
	const mockSuggestions = [
		{
			id: '1',
			priority: 'critical' as const,
			category: 'resources' as const,
			title: 'Increase food production',
			reasoning:
				'Food consumption (25/hr) exceeds production (15/hr). You will run out of food in approximately 2 hours.',
			action: {
				label: 'Build Farm',
				href: '/game/build/farm'
			},
			estimatedTime: '10 minutes',
			impact: 'High'
		},
		{
			id: '2',
			priority: 'high' as const,
			category: 'population' as const,
			title: 'Build more housing',
			reasoning:
				'Population is at 82% capacity (245/300). Immigration will stop soon without more housing.',
			action: {
				label: 'Build House',
				href: '/game/build/house'
			},
			estimatedTime: '5 minutes',
			impact: 'Medium'
		},
		{
			id: '3',
			priority: 'medium' as const,
			category: 'construction' as const,
			title: 'Upgrade lumber mill',
			reasoning: 'Upgrading lumber mill will increase wood production by 40%.',
			action: {
				label: 'Upgrade',
				href: '/game/upgrade/lumber-mill-1'
			},
			estimatedTime: '15 minutes',
			impact: 'Medium'
		},
		{
			id: '4',
			priority: 'low' as const,
			category: 'expansion' as const,
			title: 'Scout nearby region',
			reasoning: 'Unexplored tiles detected to the north. Scouting may reveal valuable resources.',
			action: {
				label: 'Send Scout',
				href: '/game/scout/north'
			},
			estimatedTime: '30 minutes',
			impact: 'Low'
		}
	];

	// Structures mock data for grid
	const mockStructures = [
		{
			id: '1',
			type: 'FARM' as const,
			position: { x: 2, y: 3 },
			name: 'Main Farm',
			level: 2,
			health: 85
		},
		{
			id: '2',
			type: 'WATCHTOWER' as const,
			position: { x: 5, y: 5 },
			name: 'Guard Tower',
			level: 1,
			health: 100
		},
		{
			id: '3',
			type: 'LUMBER_MILL' as const,
			position: { x: 1, y: 1 },
			name: 'Lumber Mill',
			level: 3,
			health: 92
		},
		{
			id: '4',
			type: 'HOUSE' as const,
			position: { x: 4, y: 2 },
			name: 'Residence 1',
			level: 1,
			health: 78
		},
		{
			id: '5',
			type: 'WAREHOUSE' as const,
			position: { x: 7, y: 4 },
			name: 'Main Storage',
			level: 2,
			health: 95
		}
	];

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
	{#if panel.id === 'header'}
		<DashboardHeader {settlementId} {settlementName} currentTime={new Date()} />
	{:else if panel.id === 'alerts'}
		<AlertsPanel {settlementId} alerts={mockAlerts} />
	{:else if panel.id === 'resources'}
		<ResourcePanel {settlementId} resources={mockResources} />
	{:else if panel.id === 'population'}
		<PopulationPanel {settlementId} population={mockPopulation} />
	{:else if panel.id === 'construction'}
		<ConstructionQueuePanel
			{settlementId}
			activeProjects={mockActiveProjects}
			queuedProjects={mockQueuedProjects}
		/>
	{:else if panel.id === 'suggestions'}
		<NextActionSuggestion
			{settlementId}
			suggestions={mockSuggestions}
			onDismiss={(id) => {
				console.log('Dismissed suggestion:', id);
				announcement = `Dismissed suggestion: ${mockSuggestions.find((s) => s.id === id)?.title}`;
			}}
			onRefresh={() => {
				console.log('Refreshing suggestions');
				announcement = 'Refreshing action suggestions';
			}}
		/>
	{:else if panel.id === 'structures'}
		<StructureGridPanel
			{settlementId}
			gridSize={10}
			structures={mockStructures}
			onCellClick={(cell) => {
				console.log('Cell clicked:', cell);
				announcement = `Selected cell at position ${cell.x}, ${cell.y}`;
			}}
			onStructureSelect={(structure) => {
				console.log('Structure selected:', structure);
				announcement = `Selected ${structure.name}`;
			}}
		/>
	{:else}
		<!-- Fallback for unmapped panels -->
		<div class="panel-placeholder">
			<h3>{panel.id}</h3>
			<p>Panel content for {panel.id}</p>
			<p class="text-muted">This panel is not yet implemented.</p>
		</div>
	{/if}
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

	/* Placeholder styling (for unmapped panels) */
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

	.panel-placeholder .text-muted {
		margin-top: var(--spacing-xs, 0.25rem);
		color: var(--text-tertiary, #9ca3af);
		font-size: 0.8125rem;
		font-style: italic;
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
