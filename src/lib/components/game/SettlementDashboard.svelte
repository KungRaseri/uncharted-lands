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
	import ResourceHeaderBar from './panels/ResourceHeaderBar.svelte';
	import SettlementInfoPanel from './panels/SettlementInfoPanel.svelte';
	import PopulationPanel from './panels/PopulationPanel.svelte';
	import ConstructionQueuePanel from './panels/ConstructionQueuePanel.svelte';
	import NextActionSuggestion from './panels/NextActionSuggestion.svelte';
	import StructureGridPanel from './panels/StructureGridPanel.svelte';
	import BuildingsListPanel from './panels/BuildingsListPanel.svelte';
	import ProductionOverviewPanel from './panels/ProductionOverviewPanel.svelte';
	import { populationStore } from '$lib/stores/game/population.svelte';
	import { API_URL } from '$lib/config';
	import { alertsStore } from '$lib/stores/game/alerts.svelte';
	import { constructionStore } from '$lib/stores/game/construction.svelte';
	import { resourcesStore } from '$lib/stores/game/resources.svelte';

	// ✅ NEW: TypeScript interface for settlement structures
	interface SettlementStructure {
		id: string;
		structureId: string;
		settlementId: string;
		tileId: string | null;
		slotPosition: number | null;
		level: number;
		health: number;
		name: string;
		description: string;
		category: string;
		buildingType: string | null;
		extractorType: string | null;
		maxLevel: number;
		modifiers: Array<{
			id: string;
			name: string;
			description: string;
			value: number;
		}>;
	}

	interface Props {
		settlementId: string;
		settlementName: string;
		onOpenBuildMenu?: () => void; // Handler to open build menu
		settlementStructures?: SettlementStructure[]; // ✅ NEW: Optional for backward compatibility
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

	let {
		settlementId,
		settlementName,
		onOpenBuildMenu,
		settlementStructures = []
	}: Props = $props();

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

	// ✅ NEW: Split structures into buildings and extractors
	const buildings = $derived(settlementStructures.filter((s) => s.category === 'BUILDING'));

	const extractors = $derived(settlementStructures.filter((s) => s.category === 'EXTRACTOR'));

	// ✅ NEW: Group extractors by tile for grid display
	const extractorsByTile = $derived(
		extractors.reduce(
			(acc, extractor) => {
				if (!extractor.tileId) return acc;
				if (!acc[extractor.tileId]) {
					acc[extractor.tileId] = [];
				}
				acc[extractor.tileId].push(extractor);
				return acc;
			},
			{} as Record<string, SettlementStructure[]>
		)
	);

	// ✅ NEW: Action handlers for buildings
	async function handleUpgradeBuilding(buildingId: string) {
		try {
			const response = await fetch(`${API_URL}/structures/${buildingId}/upgrade`, {
				method: 'POST',
				credentials: 'include'
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('[Dashboard] Failed to upgrade building:', error);
				// TODO: Add toast notification system
				alert(error.error || 'Failed to upgrade building');
				return;
			}

			console.log('[Dashboard] Building upgraded successfully');
			// TODO: Add toast notification system
		} catch (error) {
			console.error('[Dashboard] Failed to upgrade building:', error);
			alert('Network error - could not upgrade building');
		}
	}

	async function handleRepairBuilding(buildingId: string) {
		try {
			const response = await fetch(`${API_URL}/structures/${buildingId}/repair`, {
				method: 'POST',
				credentials: 'include'
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('[Dashboard] Failed to repair building:', error);
				alert(error.error || 'Failed to repair building');
				return;
			}

			console.log('[Dashboard] Building repaired successfully');
		} catch (error) {
			console.error('[Dashboard] Failed to repair building:', error);
			alert('Network error - could not repair building');
		}
	}

	async function handleDemolishBuilding(buildingId: string) {
		if (
			!confirm('Are you sure you want to demolish this building? This action cannot be undone.')
		) {
			return;
		}

		try {
			const response = await fetch(`${API_URL}/structures/${buildingId}`, {
				method: 'DELETE',
				credentials: 'include'
			});

			if (!response.ok) {
				const error = await response.json();
				console.error('[Dashboard] Failed to demolish building:', error);
				alert(error.error || 'Failed to demolish building');
				return;
			}

			console.log('[Dashboard] Building demolished successfully');
		} catch (error) {
			console.error('[Dashboard] Failed to demolish building:', error);
			alert('Network error - could not demolish building');
		}
	}

	// ✅ NEW: Debug logging
	$effect(() => {
		console.log('[Dashboard] Real structures loaded:', {
			total: settlementStructures.length,
			buildings: buildings.length,
			extractors: extractors.length,
			tilesWithExtractors: Object.keys(extractorsByTile).length
		});
	});

	// Production overview mock data
	const mockProduction = {
		rates: {
			food: 45,
			water: 60,
			wood: 30,
			stone: 25,
			ore: 15
		},
		extractors: [
			{
				id: '1',
				type: 'FARM' as const,
				name: 'Main Farm',
				level: 2,
				health: 85,
				quality: 75,
				production: 25,
				location: { x: 2, y: 3 }
			},
			{
				id: '6',
				type: 'FARM' as const,
				name: 'North Farm',
				level: 1,
				health: 100,
				quality: 60,
				production: 20,
				location: { x: 3, y: 1 }
			},
			{
				id: '7',
				type: 'WELL' as const,
				name: 'Central Well',
				level: 2,
				health: 95,
				quality: 85,
				production: 40,
				location: { x: 5, y: 4 }
			},
			{
				id: '8',
				type: 'WELL' as const,
				name: 'South Well',
				level: 1,
				health: 78,
				quality: 70,
				production: 20,
				location: { x: 6, y: 8 }
			},
			{
				id: '3',
				type: 'LUMBER_MILL' as const,
				name: 'Lumber Mill',
				level: 3,
				health: 92,
				quality: 80,
				production: 30,
				location: { x: 1, y: 1 }
			},
			{
				id: '9',
				type: 'QUARRY' as const,
				name: 'Stone Quarry',
				level: 2,
				health: 88,
				quality: 65,
				production: 25,
				location: { x: 8, y: 2 }
			},
			{
				id: '10',
				type: 'MINE' as const,
				name: 'Iron Mine',
				level: 1,
				health: 100,
				quality: 55,
				production: 15,
				location: { x: 9, y: 5 }
			}
		]
	};

	// Settlement info mock data (reactive to population changes)
	const mockSettlementInfo = $derived.by(() => {
		// Return undefined if population data not available yet
		if (!realPopulation) return undefined;

		return {
			name: settlementName,
			level: 3,
			type: 'VILLAGE' as const,
			location: { x: 125, y: 89 },
			population: {
				current: realPopulation.current,
				capacity: realPopulation.capacity
			},
			happiness: realPopulation.happiness,
			founded: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago
			resilience: 35
		};
	});

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
	{:else if panel.id === 'resource-header'}
		<ResourceHeaderBar {settlementId} resources={realResources} />
	{:else if panel.id === 'settlement-info'}
		<SettlementInfoPanel {settlementId} info={mockSettlementInfo ?? undefined} />
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
		<!-- Phase 2: Buildings list view -->
		<BuildingsListPanel
			{buildings}
			{settlementId}
			onUpgrade={handleUpgradeBuilding}
			onRepair={handleRepairBuilding}
			onDemolish={handleDemolishBuilding}
		/>

		<!-- TODO Phase 3: Replace this with ExtractorsGridPanel -->
		<!-- For now, showing extractors with old StructureGridPanel -->
		{#if extractors.length > 0}
			<div class="mt-4">
				<StructureGridPanel
					{settlementId}
					gridSize={10}
					structures={extractors}
					onCellClick={(cell) => {
						console.log('Cell clicked:', cell);
						announcement = `Selected cell at position ${cell.x}, ${cell.y}`;
					}}
					onStructureSelect={(structure) => {
						console.log('Structure selected:', structure);
						announcement = `Selected ${structure.name}`;
					}}
				/>
			</div>
		{/if}
	{:else if panel.id === 'production-overview'}
		<ProductionOverviewPanel {settlementId} production={mockProduction} />
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
	<div class="flex-1 overflow-hidden">
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

<!-- Debug Panel (Development Only) -->
{#if import.meta.env.DEV}
	<div class="card variant-filled-surface p-4 mt-4">
		<h3 class="h3 mb-2">🔧 Debug: Settlement Structures</h3>
		<div class="grid grid-cols-2 gap-2 text-sm">
			<div><strong>Total Structures:</strong> {settlementStructures.length}</div>
			<div><strong>Buildings:</strong> {buildings.length}</div>
			<div><strong>Extractors:</strong> {extractors.length}</div>
			<div><strong>Tiles with Extractors:</strong> {Object.keys(extractorsByTile).length}</div>
		</div>
		<details class="mt-2">
			<summary class="cursor-pointer hover:text-primary-500">View Raw Data</summary>
			<pre class="text-xs mt-2 overflow-auto max-h-64 bg-surface-900 p-2 rounded">
{JSON.stringify(settlementStructures, null, 2)}
			</pre>
		</details>
	</div>
{/if}
