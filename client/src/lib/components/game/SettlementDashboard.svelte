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
	import TilePlotsPanel from './panels/TilePlotsPanel.svelte';

	// Modals
	import SettingsModal from './modals/SettingsModal.svelte';
	import ExtractorTypeSelector from './modals/ExtractorTypeSelector.svelte';
	import ConfirmModal from '$lib/components/ui/ConfirmModal.svelte';
	import AlertsPanel from './panels/AlertsPanel.svelte';
	import SettlementInfoPanel from './panels/SettlementInfoPanel.svelte';
	import ResourcePanel from './panels/ResourcePanel.svelte';
	import PopulationPanel from './panels/PopulationPanel.svelte';
	import ConstructionQueuePanel from './panels/ConstructionQueuePanel.svelte';
	import NextActionSuggestion from './panels/NextActionSuggestion.svelte';
	import BuildingsListPanel from './panels/BuildingsListPanel.svelte';
	import ExtractorsGridPanel from './panels/ExtractorsGridPanel.svelte';
	import ProductionOverviewPanel from './panels/ProductionOverviewPanel.svelte';
	import { populationStore } from '$lib/stores/game/population.svelte';
	import { alertsStore } from '$lib/stores/game/alerts.svelte';
	import { constructionStore } from '$lib/stores/game/construction.svelte';
	import { resourcesStore } from '$lib/stores/game/resources.svelte';
	import { structuresStore } from '$lib/stores/game/structures.svelte';
	import { socketStore } from '$lib/stores/game/socket';
	import { generateSuggestions } from '$lib/utils/settlement-suggestions';
	import { calculateProduction } from '$lib/utils/production-calculator';
	import type { StructureMetadata } from '$lib/api/structures';
	import { logger } from '$lib/utils/logger';
	import { PUBLIC_CLIENT_API_URL } from '$env/static/public';
	import type { TileWithRelations } from '@uncharted-lands/shared';
	import { invalidateAll } from '$app/navigation';
	import { toaster } from '$lib/stores/toaster.svelte';

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
	}

	// ✅ NEW: Add Tile type definition (must match TilePlotsPanel)
	interface Tile {
		id: string;
		xCoord: number;
		yCoord: number;
		biome: string;
		plotSlots: number;
		foodQuality: number;
		waterQuality: number;
		woodQuality: number;
		stoneQuality: number;
		oreQuality: number;
	}

	interface Props {
		settlementId: string;
		settlementName: string;
		onOpenBuildMenu?: () => void; // Handler to open build menu
		structures?: StructureMetadata[];
		settlement?: Settlement;
		tile: TileWithRelations;
	}

	let {
		settlementId,
		settlementName,
		onOpenBuildMenu,
		structures = [],
		settlement,
		tile
	}: Props = $props();

	// ✅ REACTIVE: Get structures from store with real-time Socket.IO updates
	const settlementStructures = $derived(structuresStore.getStructures(settlementId));

	// Settings modal state
	let settingsOpen = $state(false);

	// ✅ NEW: Extractor selection modal state
	let extractorSelectorOpen = $state(false);
	let selectedSlot = $state<number | null>(null);

	// ✅ NEW: Demolish confirmation modal state
	let demolishModalOpen = $state(false);
	let buildingToDemolish = $state<string | null>(null);

	// ✅ NEW: Raw construction queue with tileId/slotPosition for slot locking
	let rawConstructionQueue = $state<
		Array<{
			id: string;
			tileId: string | null;
			slotPosition: number | null;
			structureType: string;
			status: string;
		}>
	>([]);

	// Fetch raw construction queue on mount
	$effect(() => {
		async function fetchRawQueue() {
			try {
				const response = await fetch(
					`${PUBLIC_CLIENT_API_URL}/structures/construction-queue/${settlementId}`,
					{
						method: 'GET',
						credentials: 'include'
					}
				);

				if (response.ok) {
					const data = await response.json();
					if (data.success) {
						// Combine active and queued, extracting only needed fields
						rawConstructionQueue = [
							...data.active.map((item: any) => ({
								id: item.id,
								tileId: item.tileId,
								slotPosition: item.slotPosition,
								structureType: item.structureType,
								status: item.status
							})),
							...data.queued.map((item: any) => ({
								id: item.id,
								tileId: item.tileId,
								slotPosition: item.slotPosition,
								structureType: item.structureType,
								status: item.status
							}))
						];
					}
				}
			} catch (error) {
				logger.error('[Dashboard] Failed to fetch construction queue', { error });
			}
		}

		fetchRawQueue();
	});

	// ✅ NEW: Listen to Socket.IO for construction queue updates
	$effect(() => {
		const socket = socketStore.getSocket();
		if (!socket) return;

		const handleConstructionStarted = (data: {
			constructionId: string;
			settlementId: string;
			structureType: string;
			tileId?: string | null;
			slotPosition?: number | null;
		}) => {
			if (data.settlementId === settlementId) {
				// Add or update the item in rawConstructionQueue
				const existing = rawConstructionQueue.find(
					(item) => item.id === data.constructionId
				);
				if (!existing) {
					rawConstructionQueue = [
						...rawConstructionQueue,
						{
							id: data.constructionId,
							tileId: data.tileId ?? null,
							slotPosition: data.slotPosition ?? null,
							structureType: data.structureType,
							status: 'IN_PROGRESS'
						}
					];
				}
			}
		};

		const handleConstructionComplete = (data: {
			settlementId: string;
			structureId: string;
		}) => {
			if (data.settlementId === settlementId) {
				// Remove completed item from rawConstructionQueue
				rawConstructionQueue = rawConstructionQueue.filter(
					(item) => item.id !== data.structureId
				);
			}
		};

		const handleConstructionQueued = (data: {
			constructionId: string;
			settlementId: string;
			structureType: string;
			tileId?: string | null;
			slotPosition?: number | null;
		}) => {
			if (data.settlementId === settlementId) {
				// Add queued item
				rawConstructionQueue = [
					...rawConstructionQueue,
					{
						id: data.constructionId,
						tileId: data.tileId ?? null,
						slotPosition: data.slotPosition ?? null,
						structureType: data.structureType,
						status: 'QUEUED'
					}
				];
			}
		};

		socket.on('construction-started', handleConstructionStarted);
		socket.on('construction-complete', handleConstructionComplete);
		socket.on('construction-queued', handleConstructionQueued);

		return () => {
			socket.off('construction-started', handleConstructionStarted);
			socket.off('construction-complete', handleConstructionComplete);
			socket.off('construction-queued', handleConstructionQueued);
		};
	});

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
		// Access state properties directly for proper reactivity tracking
		const construction = constructionStore.state.construction;
		const constructionState = construction.get(settlementId);
		const active = constructionState?.active || [];
		const queued = constructionState?.queued || [];

		logger.debug('[Dashboard] Construction queue derived:', {
			settlementId,
			activeCount: active.length,
			queuedCount: queued.length,
			active: active.map((p) => ({ id: p.id, name: p.name })),
			queued: queued.map((p) => ({ id: p.id, name: p.name }))
		});

		// Map store BuildingType to panel BuildingType
		// Store now uses actual types: 'HOUSE', 'STORAGE', 'FOOD', 'WOOD', etc.
		// Panel: 'HOUSE' | 'FARM' | 'WAREHOUSE' | 'WORKSHOP' | 'TOWN_HALL' | 'OTHER'
		const mapBuildingType = (
			storeType: string
		): 'HOUSE' | 'FARM' | 'WAREHOUSE' | 'WORKSHOP' | 'TOWN_HALL' | 'OTHER' => {
			switch (storeType) {
				case 'HOUSE':
					return 'HOUSE';
				case 'STORAGE':
					return 'WAREHOUSE';
				case 'WORKSHOP':
					return 'WORKSHOP';
				case 'TOWN_HALL':
					return 'TOWN_HALL';
				case 'FOOD':
				case 'WATER':
				case 'WOOD':
				case 'STONE':
				case 'ORE':
					return 'FARM'; // All extractors show as farm icon
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
				timeRemaining: Math.max(
					0,
					Math.floor((project.completionTime - Date.now()) / 1000)
				),
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
	// Map to panel-specific types that match BuildingsListPanel and ExtractorsGridPanel interfaces
	const buildings = $derived(
		settlementStructures
			.filter((s) => s.category === 'BUILDING')
			.map((s) => ({
				id: s.id,
				structureId: s.structureId,
				name: s.name,
				description: s.description,
				level: s.level,
				maxLevel: s.maxLevel,
				health: s.health,
				extractorType: s.extractorType ?? null,
				buildingType: s.buildingType ?? null,
				category: s.category,
				modifiers: (s.modifiers ?? []).map((m) => ({
					id: m.id, // BuildingsListPanel expects 'id', but canonical has 'type'
					name: m.name,
					description: m.description,
					value: m.value
				}))
			}))
	);

	const extractors = $derived(
		settlementStructures
			.filter((s) => s.category === 'EXTRACTOR')
			.map((s) => ({
				id: s.id,
				structureId: s.structureId,
				name: s.name,
				description: s.description,
				level: s.level,
				maxLevel: s.maxLevel,
				health: s.health,
				tileId: s.tileId ?? null,
				slotPosition: s.slotPosition ?? null,
				extractorType: s.extractorType ?? null,
				buildingType: s.buildingType ?? null,
				category: s.category
			}))
	);

	// ✅ DEBUG: Log tile and extractor data
	$effect(() => {
		logger.debug('[Dashboard] ==== RENDER UPDATE ====');
		logger.debug('[Dashboard] settlementStructures.length:', {
			settlementStructuresLength: settlementStructures.length
		});
		logger.debug('[Dashboard] Buildings.length:', { buildingsLength: buildings.length });
		logger.debug('[Dashboard] Extractors.length:', { extractorsLength: extractors.length });

		if (settlementStructures.length > 0) {
			logger.debug('[Dashboard] First structure:', {
				name: settlementStructures[0].name,
				category: settlementStructures[0].category
			});
		}

		// Check which panels are visible
		const structuresPanel = currentLayout.panels.find((p) => p.id === 'structures');
		logger.debug('[Dashboard] Structures panel - visible:', {
			visible: structuresPanel?.visible,
			collapsed: structuresPanel?.collapsed,
			column: structuresPanel?.column
		});
		logger.debug('[Dashboard] Current viewport:', { viewport });
		logger.debug('[Dashboard] ====================');
	});

	// ✅ NEW: Group extractors by tile for grid display
	// Map to panel-specific Extractor type
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
			{} as Record<
				string,
				Array<{
					id: string;
					structureId: string;
					name: string;
					description: string;
					level: number;
					maxLevel: number;
					health: number;
					tileId: string | null;
					slotPosition: number | null;
					extractorType: string | null;
					buildingType: string | null;
					category: string;
				}>
			>
		)
	);

	// ✅ FIXED: Action handlers for buildings - Use form submissions to go through SvelteKit actions
	async function handleUpgradeBuilding(buildingId: string) {
		try {
			const formData = new FormData();
			formData.append('structureId', buildingId);

			const response = await fetch('?/upgradeStructure', {
				method: 'POST',
				body: formData,
				credentials: 'include' // ✅ FIX: Include cookies for authentication
			});
			const result = await response.json();

			if (!result.success && result.success !== undefined) {
				logger.error('[Dashboard] Failed to upgrade building:', result);
				toaster.error('Upgrade Failed', result.message || 'Failed to upgrade building');
				return;
			}

			logger.debug('[Dashboard] Building upgraded successfully');
			toaster.success('Building Upgraded', 'Upgrade queued successfully');
			// TODO: Add toast notification system
		} catch (error) {
			logger.error('[Dashboard] Failed to upgrade building:', error);
			toaster.error('Network Error', 'Could not upgrade building');
		}
	}

	async function handleRepairBuilding(buildingId: string) {
		try {
			const formData = new FormData();
			formData.append('structureId', buildingId);

			const response = await fetch('?/repairStructure', {
				method: 'POST',
				body: formData,
				credentials: 'include' // ✅ FIX: Include cookies for authentication
			});
			const result = await response.json();

			if (!result.success && result.success !== undefined) {
				logger.error('[Dashboard] Failed to repair building:', result);
				toaster.error('Repair Failed', result.message || 'Failed to repair building');
				return;
			}

			logger.debug('[Dashboard] Building repaired successfully');
			toaster.success('Building Repaired', 'Repair completed successfully');
		} catch (error) {
			logger.error('[Dashboard] Failed to repair building:', error);
			toaster.error('Network Error', 'Could not repair building');
		}
	}

	function handleDemolishBuilding(buildingId: string) {
		buildingToDemolish = buildingId;
		demolishModalOpen = true;
	}

	async function confirmDemolish() {
		if (!buildingToDemolish) return;

		try {
			const formData = new FormData();
			formData.append('structureId', buildingToDemolish);

			const response = await fetch('?/demolishStructure', {
				method: 'POST',
				body: formData,
				credentials: 'include' // ✅ FIX: Include cookies for authentication
			});
			const result = await response.json();

			if (!result.success && result.success !== undefined) {
				logger.error('[Dashboard] Failed to demolish building:', result);
				toaster.error('Demolish Failed', result.message || 'Failed to demolish building');
				return;
			}

			logger.debug('[Dashboard] Building demolished successfully');
			toaster.success('Building Demolished', 'Structure removed successfully');
			demolishModalOpen = false;
		} catch (error) {
			logger.error('[Dashboard] Failed to demolish building:', error);
			toaster.error('Network Error', 'Could not demolish building');
		} finally {
			buildingToDemolish = null;
		}
	}

	// ✅ NEW: Handlers for plot slot interactions
	function handleBuildExtractor(tileId: string, slotPosition: number) {
		logger.debug('[Dashboard] Build extractor requested for tile:', { tileId, slotPosition });
		selectedSlot = slotPosition;
		extractorSelectorOpen = true;
	}

	// ✅ FIXED: Use form submission to go through SvelteKit server-side action
	async function handleExtractorBuild(tileId: string, slotPosition: number, structureId: string) {
		logger.debug('[Dashboard] Building extractor:', { structureId, tileId, slotPosition });

		try {
			// Create a form and submit it to trigger the buildStructure action
			const formData = new FormData();
			formData.append('structureId', structureId); // ✅ FIXED: Use structureId parameter
			formData.append('tileId', tileId);
			formData.append('slotPosition', slotPosition.toString());

			// Submit to the current page's buildStructure action
			const response = await fetch('?/buildStructure', {
				method: 'POST',
				body: formData,
				credentials: 'include' // ✅ FIX: Include cookies for authentication
			});
			const result = await response.json();

			logger.debug('[Dashboard] Build structure response:', {
				result,
				type: result.type,
				status: response.status
			});

			// SvelteKit actions that use fail() return { type: 'failure', status: number, data: {...} }
			// Success returns { type: 'success', status: 200, data: {...} }
			if (result.type === 'failure' || !response.ok) {
				let errorData = result.data || result;

				// SvelteKit's fail() serializes data with devalue - try to parse if it's a string
				if (typeof errorData === 'string') {
					try {
						errorData = JSON.parse(errorData);
					} catch {
						// If parsing fails, treat it as a plain message
					}
				}

				logger.error('[Dashboard] Failed to create extractor:', {
					errorData,
					errorDataType: typeof errorData
				});

				// Handle error response from server
				let title = 'Build Failed';
				let description = 'Failed to create extractor';

				if (typeof errorData === 'object' && errorData !== null) {
					// Check for shortage details first (most specific)
					if (Array.isArray(errorData.shortages) && errorData.shortages.length > 0) {
						title = 'Insufficient Resources';
						description = errorData.shortages
							.map((s: any) => `${s.type}: need ${s.missing} more`)
							.join(', ');
					}
					// Check for reasons array (from SvelteKit action)
					else if (Array.isArray(errorData.reasons) && errorData.reasons.length > 0) {
						title = 'Insufficient Resources';
						description = errorData.reasons.join(', ');
					}
					// Otherwise use error message
					else {
						description = errorData.message || errorData.error || description;
						title =
							errorData.code === 'INSUFFICIENT_RESOURCES'
								? 'Insufficient Resources'
								: 'Build Failed';
					}
				} else if (typeof errorData === 'string') {
					description = errorData;
				}

				toaster.error(title, description, 5000);
				return;
			}
			selectedSlot = null;

			// Immediately refetch construction queue and tile data
			logger.debug('[Dashboard] Refetching construction queue and invalidating all data');
			await Promise.all([
				constructionStore.fetchConstructionQueue(settlementId),
				invalidateAll()
			]);
			logger.debug('[Dashboard] Refetch complete');

			toaster.success('Extractor Queued', 'Construction has been added to the queue', 3000);
		} catch (error) {
			logger.error('[Dashboard] Failed to create extractor:', error);
			toaster.error('Network Error', 'Could not create extractor', 4000);
		}
	}

	// ✅ NEW: Debug logging
	$effect(() => {
		logger.debug('[Dashboard] Real structures loaded:', {
			total: settlementStructures.length,
			buildings: buildings.length,
			extractors: extractors.length
		});
	});

	// ✅ REAL: Calculate production from real structures and tiles (async)
	let realProduction = $state<Awaited<ReturnType<typeof calculateProduction>> | undefined>(
		undefined
	);

	$effect(() => {
		// Recalculate when structures change
		// Map to ensure properties are string | null (not string | null | undefined)
		const mappedStructures = settlementStructures.map((s) => ({
			...s,
			tileId: s.tileId ?? null,
			slotPosition: s.slotPosition ?? null,
			extractorType: s.extractorType ?? null,
			buildingType: s.buildingType ?? null
		}));
		calculateProduction(mappedStructures, undefined).then((result) => {
			realProduction = result;
		});
	});

	// ✅ REAL: Use settlement data from server
	const realSettlementInfo = $derived.by(() => {
		if (!realPopulation || !settlement) return undefined;

		return {
			name: settlementName,
			level: 1, // TODO: Get from settlement tier when implemented
			type: 'OUTPOST' as const, // TODO: Get from settlement type when implemented
			location: {
				x: tile.xCoord || 0,
				y: tile.yCoord || 0
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
		if (
			event.target instanceof HTMLInputElement ||
			event.target instanceof HTMLTextAreaElement
		) {
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
			<SettlementInfoPanel {settlementId} {settlement} {tile} />
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
				logger.debug('Dismissed suggestion:', { id });
				announcement = `Dismissed suggestion: ${realSuggestions.find((s) => s.id === id)?.title}`;
			}}
			onRefresh={() => {
				logger.debug('Refreshing suggestions');
				announcement = 'Refreshing action suggestions';
			}}
		/>
	{:else if panel.id === 'structures'}
		<!-- Phase 1: Tile Plots Panel - Shows plot slots for the settlement's tile -->
		{#if tile}
			<div class="mb-4">
				<TilePlotsPanel
					{tile}
					{extractors}
					constructionQueue={rawConstructionQueue}
					onBuildExtractor={handleBuildExtractor}
				/>
			</div>
		{/if}

		<!-- Phase 2: Buildings list view -->
		<BuildingsListPanel
			{buildings}
			{settlementId}
			{structures}
			onBuild={onOpenBuildMenu}
			onUpgrade={handleUpgradeBuilding}
			onRepair={handleRepairBuilding}
			onDemolish={handleDemolishBuilding}
		/>

		<!-- Phase 3: Extractors grid view (legacy - could be removed) -->
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
			<p class="m-0 text-surface-600 dark:text-surface-400 text-sm">
				Panel content for {panel.id}
			</p>
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
			<DesktopLayout
				panels={currentLayout.panels}
				{settlementId}
				renderPanel={panelContent}
			/>
		{:else if viewport === 'tablet'}
			<TabletLayout panels={currentLayout.panels} {settlementId} renderPanel={panelContent} />
		{:else}
			<MobileLayout panels={currentLayout.panels} {settlementId} renderPanel={panelContent} />
		{/if}
	</div>
</div>

<!-- Settings Modal -->
<SettingsModal bind:open={settingsOpen} onClose={() => (settingsOpen = false)} />

<!-- Extractor Type Selector Modal -->
{#if tile && extractorSelectorOpen && selectedSlot !== null}
	<ExtractorTypeSelector
		bind:open={extractorSelectorOpen}
		tileId={tile.id}
		slotPosition={selectedSlot}
		resourceQuality={{
			food: tile.foodQuality,
			water: tile.waterQuality,
			wood: tile.woodQuality,
			stone: tile.stoneQuality,
			ore: tile.oreQuality
		}}
		{structures}
		onClose={() => {
			extractorSelectorOpen = false;
			selectedSlot = null;
		}}
		onBuild={handleExtractorBuild}
	/>
{/if}

<!-- Demolish Confirmation Modal -->
<ConfirmModal
	bind:open={demolishModalOpen}
	title="Demolish Building"
	message="Are you sure you want to demolish this building? This action cannot be undone and you will not recover the resources."
	confirmText="Demolish"
	cancelText="Cancel"
	variant="danger"
	onconfirm={confirmDemolish}
	oncancel={() => {
		buildingToDemolish = null;
	}}
/>
