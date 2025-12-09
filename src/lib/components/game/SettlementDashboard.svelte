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
	import DesktopLayout from './layouts/DesktopLayout.svelte';
	import TabletLayout from './layouts/TabletLayout.svelte';
	import MobileLayout from './layouts/MobileLayout.svelte';

	// Panel Components
	import DashboardHeader from './panels/DashboardHeader.svelte';

	// Modals
	import SettingsModal from './modals/SettingsModal.svelte';
	import AlertsPanel from './panels/AlertsPanel.svelte';
	import SettlementInfoPanel from './panels/SettlementInfoPanel.svelte';
	import ResourcePanel from './panels/ResourcePanel.svelte';
	import PopulationPanel from './panels/PopulationPanel.svelte';
	import ConstructionQueuePanel from './panels/ConstructionQueuePanel.svelte';
	import NextActionSuggestion from './panels/NextActionSuggestion.svelte';
	import StructureGridPanel from './panels/StructureGridPanel.svelte';
	import BuildingsListPanel from './panels/BuildingsListPanel.svelte';
	import ExtractorsGridPanel from './panels/ExtractorsGridPanel.svelte';
	import ProductionOverviewPanel from './panels/ProductionOverviewPanel.svelte';
	import { populationStore } from '$lib/stores/game/population.svelte';
	import { API_URL } from '$lib/config';
	import { alertsStore } from '$lib/stores/game/alerts.svelte';
	import { constructionStore } from '$lib/stores/game/construction.svelte';
	import { resourcesStore } from '$lib/stores/game/resources.svelte';
	import { generateSuggestions } from '$lib/utils/settlement-suggestions';
	import { calculateProduction } from '$lib/utils/production-calculator';

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

	interface Settlement {
		id: string;
		name: string;
		tileId: string;
		playerProfileId: string;
		worldId: string;
		resilience: number | null;
		createdAt: string | Date;
		Tile?: {
			xCoord: number;
			yCoord: number;
		} | null;
	}

	interface Props {
		settlementId: string;
		settlementName: string;
		onOpenBuildMenu?: () => void; // Handler to open build menu
		settlementStructures?: SettlementStructure[]; // ✅ NEW: Optional for backward compatibility
		settlement?: Settlement;
	}

	let {
		settlementId,
		settlementName,
		onOpenBuildMenu,
		settlementStructures = [],
		settlement
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

	// ✅ REAL: Generate suggestions from real data
	const realSuggestions = $derived.by(() => {
		return generateSuggestions({
			settlementId,
			resources: resourcesStore.getResourcesState(settlementId),
			population: realPopulation
				? {
						current: realPopulation.current,
						capacity: realPopulation.capacity,
						happiness: realPopulation.happiness
					}
				: undefined,
			structures: settlementStructures
		});
	});

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
			extractors: extractors.length
		});
	});

	// ✅ REAL: Calculate production from real structures and tiles
	const realProduction = $derived.by(() => {
		// Note: Tile data not currently available, quality modifiers won't be applied
		return calculateProduction(settlementStructures, undefined);
	});

	// ✅ REAL: Use settlement data from server
	const realSettlementInfo = $derived.by(() => {
		if (!realPopulation || !settlement) return undefined;

		return {
			name: settlementName,
			level: 1, // TODO: Get from settlement tier when implemented
			type: 'OUTPOST' as const, // TODO: Get from settlement type when implemented
			location: {
				x: settlement.Tile?.xCoord || 0,
				y: settlement.Tile?.yCoord || 0
			},
			population: {
				current: realPopulation.current,
				capacity: realPopulation.capacity
			},
			happiness: realPopulation.happiness,
			founded: new Date(settlement.createdAt),
			resilience: settlement.resilience || 0
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
	{#if panel.id === 'alerts'}
		<AlertsPanel {settlementId} alerts={realAlerts} />
	{:else if panel.id === 'resource-header'}
		<ResourcePanel {settlementId} settlementName={settlement?.name} resources={realResources} />
	{:else if panel.id === 'settlement-info'}
		{#if settlement}
			<SettlementInfoPanel {settlementId} {settlement} />
		{/if}
	{:else if panel.id === 'population'}
		<PopulationPanel {settlementId} population={realPopulation} />
	{:else if panel.id === 'construction'}
		<ConstructionQueuePanel {settlementId} constructionQueue={realConstruction} />
	{:else if panel.id === 'suggestions'}
		<NextActionSuggestion
			{settlementId}
			suggestions={realSuggestions}
			onDismiss={(id) => {
				console.log('Dismissed suggestion:', id);
				announcement = `Dismissed suggestion: ${realSuggestions.find((s) => s.id === id)?.title}`;
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
			onBuild={onOpenBuildMenu}
			onUpgrade={handleUpgradeBuilding}
			onRepair={handleRepairBuilding}
			onDemolish={handleDemolishBuilding}
		/>

		<!-- Phase 3: Extractors grid view -->
		{#if Object.keys(extractorsByTile).length > 0}
			<div class="mt-4">
				<ExtractorsGridPanel
					{extractorsByTile}
					{settlementId}
					totalSlotsPerTile={5}
					onUpgrade={handleUpgradeBuilding}
					onRepair={handleRepairBuilding}
					onDemolish={handleDemolishBuilding}
				/>
			</div>
		{/if}
	{:else if panel.id === 'production-overview'}
		<ProductionOverviewPanel {settlementId} production={realProduction} />
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
