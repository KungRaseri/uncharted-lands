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
		onOpenBuildMenu?: () => void; // Handler to open build menu
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

	let { settlementId, settlementName, onOpenBuildMenu }: Props = $props();

	// Settings modal state
	let settingsOpen = $state(false);

	// Get resources from store with real-time Socket.IO updates
	const realResources = $derived.by(() => resourcesStore.getResources(settlementId));

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

	// Suggestions mock data
	const mockSuggestions = [
		{
			id: '1',
			priority: 'critical' as const,
			category: 'resources' as const,
			title: 'Increase food production',
			reasoning:
				'Food consumption (25/hr) exceeds production (15/hr). You will run out of food in approximately 2 hours.',
			actionLabel: 'Build Farm',
			actionHref: '/game/build/farm',
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
			actionLabel: 'Build House',
			actionHref: '/game/build/house',
			estimatedTime: '5 minutes',
			impact: 'Medium'
		},
		{
			id: '3',
			priority: 'medium' as const,
			category: 'construction' as const,
			title: 'Upgrade lumber mill',
			reasoning: 'Upgrading lumber mill will increase wood production by 40%.',
			actionLabel: 'Upgrade',
			actionHref: '/game/upgrade/lumber-mill-1',
			estimatedTime: '15 minutes',
			impact: 'Medium'
		},
		{
			id: '4',
			priority: 'low' as const,
			category: 'expansion' as const,
			title: 'Scout nearby region',
			reasoning: 'Unexplored tiles detected to the north. Scouting may reveal valuable resources.',
			actionLabel: 'Send Scout',
			actionHref: '/game/scout/north',
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
		<div
			class="p-4 bg-white dark:bg-surface-800 rounded-lg border-2 border-dashed border-surface-300 dark:border-surface-600"
		>
			<h3 class="m-0 mb-2 capitalize text-surface-900 dark:text-surface-100">{panel.id}</h3>
			<p class="m-0 text-surface-600 dark:text-surface-400 text-sm">Panel content for {panel.id}</p>
			<p class="mt-1 text-surface-500 dark:text-surface-500 text-[0.8125rem] italic">
				This panel is not yet implemented.
			</p>
		</div>
	{/if}
{/snippet}

<div class="flex flex-col h-screen overflow-hidden bg-surface-50 dark:bg-surface-950">
	<!-- Skip to content link for accessibility -->
	<a
		href="#main-content"
		class="absolute -top-10 left-0 bg-primary-500 dark:bg-primary-600 text-white px-4 py-2 no-underline rounded-br z-1000 focus:top-0"
	>
		Skip to main content
	</a>

	<!-- Screen reader announcements -->
	<div role="status" aria-live="polite" aria-atomic="true" class="sr-only">
		{announcement}
	</div>

	<!-- Quick Actions Bar (always visible) -->
	<div
		class="shrink-0 md:relative md:bottom-auto md:left-auto md:right-auto md:shadow-none md:z-100 fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-900 shadow-[0_-4px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_-4px_8px_rgba(0,0,0,0.3)] z-200"
	>
		<QuickActionsBar {settlementId} {onOpenBuildMenu} />
	</div>

	<!-- Main content with responsive layout -->
	<div id="main-content" class="flex-1 overflow-hidden">
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
	/* Screen reader only utility (not available in Tailwind) */
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
