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

	import { layoutStore } from '$lib/stores/ui/dashboard-layout.svelte';
	import type { PanelConfig } from '$lib/stores/ui/dashboard-layout.svelte';
	import QuickActionsBar from './QuickActionsBar.svelte';
	import DesktopLayout from './layouts/DesktopLayout.svelte';
	import TabletLayout from './layouts/TabletLayout.svelte';
	import MobileLayout from './layouts/MobileLayout.svelte';

	// Panel Components
	import DashboardHeader from './panels/DashboardHeader.svelte';

	// Modals
	import SettingsModal from './modals/SettingsModal.svelte';
	import AlertsPanel from './panels/AlertsPanel.svelte';
	import ResourcePanel from './panels/ResourcePanel.svelte';
	import PopulationPanel from './panels/PopulationPanel.svelte';
	import ConstructionQueuePanel from './panels/ConstructionQueuePanel.svelte';
	import NextActionSuggestion from './panels/NextActionSuggestion.svelte';
	import StructureGridPanel from './panels/StructureGridPanel.svelte';
	import { populationStore } from '$lib/stores/game/population.svelte';
	import { alertsStore } from '$lib/stores/game/alerts.svelte';
	import { constructionStore } from '$lib/stores/game/construction.svelte';
	import { resourcesStore } from '$lib/stores/game/resources.svelte';

	interface Props {
		settlementId: string;
		settlementName: string;
		settlement?: {
			storage?: {
				food: number;
				water: number;
				wood: number;
				stone: number;
				ore: number;
			};
			structures?: Array<{
				id: string;
				buildingType: string;
				name?: string;
				// ... other structure properties
			}>;
			// ... other settlement properties
		};
	}

	let { settlementId, settlementName, settlement }: Props = $props();

	// Settings modal state
	let settingsOpen = $state(false);

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

	// Resources mock data (fallback when store data unavailable)
	const mockResources = [
		{
			type: 'food' as const,
			current: 450,
			capacity: 1000,
			productionRate: 15,
			consumptionRate: 25
		},
		{
			type: 'water' as const,
			current: 780,
			capacity: 1000,
			productionRate: 20,
			consumptionRate: 18
		},
		{
			type: 'wood' as const,
			current: 320,
			capacity: 800,
			productionRate: 12,
			consumptionRate: 8
		},
		{
			type: 'stone' as const,
			current: 150,
			capacity: 500,
			productionRate: 5,
			consumptionRate: 3
		},
		{
			type: 'ore' as const,
			current: 80,
			capacity: 300,
			productionRate: 3,
			consumptionRate: 2
		}
	];

	// Get resources from store with real-time Socket.IO updates
	const realResources = $derived.by(
		() => resourcesStore.getResources(settlementId) || mockResources
	);

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

	// Convert real population store data to PopulationPanel format
	const realPopulation = $derived.by(() => {
		const popState = populationStore.getSettlement(settlementId);
		if (!popState) return undefined;

		// Count immigration/emigration events in last 24h
		const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
		const recentEvents = populationStore.getSettlementEvents(settlementId);
		const immigrants = recentEvents.filter(
			(e) => e.type === 'immigration' && e.timestamp > oneDayAgo
		).length;
		const emigrants = recentEvents.filter(
			(e) => e.type === 'emigration' && e.timestamp > oneDayAgo
		).length;

		return {
			current: popState.current,
			capacity: popState.capacity,
			growthRate: popState.growthRate,
			happiness: popState.happiness,
			immigrants,
			emigrants
		};
	});

	// Real alerts data from alertsStore
	const realAlerts = $derived.by(() => {
		const alerts = alertsStore.getActiveAlerts(settlementId);

		// Convert to AlertsPanel format (timestamp as Date instead of number)
		return alerts.map((alert) => ({
			id: alert.id,
			severity: alert.severity,
			title: alert.title,
			message: alert.message,
			timestamp: new Date(alert.timestamp),
			actionLabel: alert.actionLabel,
			actionHref: alert.actionHref,
			dismissed: alert.dismissed
		}));
	});

	// Real construction queue data from constructionStore
	const realConstruction = $derived.by(() => {
		const active = constructionStore.getActiveProjects(settlementId);
		const queued = constructionStore.getQueuedProjects(settlementId);

		// Map store BuildingType to panel BuildingType
		// Store: 'HOUSING' | 'DEFENSE' | 'INFRASTRUCTURE' | 'PRODUCTION' | 'OTHER'
		// Panel: 'HOUSE' | 'FARM' | 'WAREHOUSE' | 'WORKSHOP' | 'TOWN_HALL' | 'OTHER'
		const mapBuildingType = (
			storeType: string
		): 'HOUSE' | 'FARM' | 'WAREHOUSE' | 'WORKSHOP' | 'TOWN_HALL' | 'OTHER' => {
			switch (storeType) {
				case 'HOUSING':
					return 'HOUSE';
				case 'PRODUCTION':
					return 'FARM';
				case 'INFRASTRUCTURE':
					return 'WAREHOUSE';
				case 'DEFENSE':
					return 'OTHER';
				default:
					return 'OTHER';
			}
		};

		// Convert to ConstructionQueuePanel format
		// Merge active and queued into single array with position and isActive flags
		return [
			...active.map((project, index) => ({
				id: project.id,
				buildingName: project.name,
				buildingType: mapBuildingType(project.type),
				progress: project.progress,
				timeRemaining: Math.max(0, Math.floor((project.completionTime - Date.now()) / 1000)),
				resourceCosts: project.resources,
				queuePosition: index + 1,
				isActive: true
			})),
			...queued.map((project, index) => ({
				id: project.id,
				buildingName: project.name,
				buildingType: mapBuildingType(project.type),
				progress: 0,
				timeRemaining: 0,
				resourceCosts: project.resources,
				queuePosition: active.length + index + 1,
				isActive: false
			}))
		];
	});

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
		<DashboardHeader
			{settlementId}
			{settlementName}
			currentTime={new Date()}
			onSettings={() => (settingsOpen = true)}
		/>
	{:else if panel.id === 'alerts'}
		<AlertsPanel {settlementId} alerts={realAlerts} />
	{:else if panel.id === 'resources'}
		<ResourcePanel {settlementId} resources={realResources} />
	{:else if panel.id === 'population'}
		<PopulationPanel {settlementId} population={realPopulation} />
	{:else if panel.id === 'construction'}
		<ConstructionQueuePanel {settlementId} constructionQueue={realConstruction} />
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

<!-- Settings Modal -->
<SettingsModal bind:open={settingsOpen} onClose={() => (settingsOpen = false)} />

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
