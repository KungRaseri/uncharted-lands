/**
 * Resources Store
 * Manages settlement resource state with real-time Socket.IO updates
 *
 * ARCHITECTURAL DECISION: Import types from central repository
 * Resource interfaces imported from $lib/types/resources (single source of truth)
 */

import { browser } from '$app/environment';
import { socketStore } from './socket';
import type { ResourceType, ResourceData, ResourceWithType } from '$lib/types/resources';

// Store-specific types
export interface ResourcesState {
	settlementId: string;
	food: ResourceData;
	water: ResourceData;
	wood: ResourceData;
	stone: ResourceData;
	ore: ResourceData;
	lastUpdate: number;
}

interface ResourcesStore {
	resources: Map<string, ResourcesState>; // settlementId → resources
}

// Re-export for backward compatibility
export type { ResourceType, ResourceData, ResourceWithType } from '$lib/types/resources';

// State with Svelte 5 runes
let state = $state<ResourcesStore>({
	resources: new Map()
});

/**
 * Initialize Socket.IO listeners for resource events
 */
function initializeListeners() {
	const socket = socketStore.getSocket();
	if (!socket) {
		console.warn('[ResourcesStore] No socket available for listeners');
		return;
	}

	console.log('[ResourcesStore] Initializing Socket.IO listeners');

	/**
	 * Bulk resource data update (on page load or settlement switch)
	 */
	socket.on('resources-data', (data: ResourcesState) => {
		console.log('[ResourcesStore] Received resources-data:', data);

		if (!data.settlementId) {
			console.error('[ResourcesStore] Missing settlementId in resources-data');
			return;
		}

		state.resources.set(data.settlementId, {
			...data,
			lastUpdate: Date.now()
		});

		// Trigger reactivity
		state.resources = new Map(state.resources);
	});

	/**
	 * Resource update from game loop (all resources updated at once)
	 */
	socket.on(
		'resource-update',
		(data: {
			type: 'auto-production' | 'manual-collection';
			settlementId: string;
			resources: { food: number; water: number; wood: number; stone: number; ore: number };
			production: { food: number; water: number; wood: number; stone: number; ore: number };
			consumption: { food: number; water: number; wood: number; stone: number; ore: number };
			netProduction: {
				food: number;
				water: number;
				wood: number;
				stone: number;
				ore: number;
			};
			population: number;
			timestamp: number;
		}) => {
			console.log('[ResourcesStore] Received resource-update:', data);

			if (!data.settlementId || !data.resources) {
				console.error('[ResourcesStore] Invalid resource-update data:', data);
				return;
			}

			const existing = state.resources.get(data.settlementId);
			if (existing) {
				// Update all resource current amounts
				existing.food.current = data.resources.food;
				existing.water.current = data.resources.water;
				existing.wood.current = data.resources.wood;
				existing.stone.current = data.resources.stone;
				existing.ore.current = data.resources.ore;

				// Update production rates (convert from per-interval to per-hour)
				// Production rates in the payload are for the tick interval, need to convert to hourly
				// Note: In E2E this is 10 seconds, in production it's 3600 seconds (1 hour)
				const RESOURCE_INTERVAL_SEC = 10; // From environment variable RESOURCE_INTERVAL_SEC
				const secondsPerHour = 3600;
				const intervalsPerHour = secondsPerHour / RESOURCE_INTERVAL_SEC;

				existing.food.productionRate = data.production.food * intervalsPerHour;
				existing.water.productionRate = data.production.water * intervalsPerHour;
				existing.wood.productionRate = data.production.wood * intervalsPerHour;
				existing.stone.productionRate = data.production.stone * intervalsPerHour;
				existing.ore.productionRate = data.production.ore * intervalsPerHour;

				existing.food.consumptionRate = data.consumption.food * intervalsPerHour;
				existing.water.consumptionRate = data.consumption.water * intervalsPerHour;
				existing.wood.consumptionRate = data.consumption.wood * intervalsPerHour;
				existing.stone.consumptionRate = data.consumption.stone * intervalsPerHour;
				existing.ore.consumptionRate = data.consumption.ore * intervalsPerHour;

				existing.lastUpdate = Date.now();

				// Trigger reactivity
				state.resources = new Map(state.resources);

				console.log(
					'[ResourcesStore] Updated all resources for settlement:',
					data.settlementId,
					{
						resources: data.resources,
						productionRates: {
							food: existing.food.productionRate,
							water: existing.water.productionRate,
							wood: existing.wood.productionRate,
							stone: existing.stone.productionRate,
							ore: existing.ore.productionRate
						}
					}
				);
			} else {
				console.warn(
					`[ResourcesStore] Settlement ${data.settlementId} not found for resource update`
				);
			}
		}
	);

	/**
	 * Production rate change
	 */
	socket.on(
		'resource-production',
		(data: { settlementId: string; type: ResourceType; productionRate: number }) => {
			console.log('[ResourcesStore] Received resource-production:', data);

			if (!data.settlementId || !data.type) {
				console.error('[ResourcesStore] Invalid resource-production data:', data);
				return;
			}

			const existing = state.resources.get(data.settlementId);
			if (existing?.[data.type]) {
				existing[data.type].productionRate = data.productionRate;
				existing.lastUpdate = Date.now();

				// Trigger reactivity
				state.resources = new Map(state.resources);
			} else {
				console.warn(
					`[ResourcesStore] Settlement ${data.settlementId} not found for production update`
				);
			}
		}
	);

	/**
	 * Consumption rate change
	 */
	socket.on(
		'resource-consumption',
		(data: { settlementId: string; type: ResourceType; consumptionRate: number }) => {
			console.log('[ResourcesStore] Received resource-consumption:', data);

			if (!data.settlementId || !data.type) {
				console.error('[ResourcesStore] Invalid resource-consumption data:', data);
				return;
			}

			const existing = state.resources.get(data.settlementId);
			if (existing?.[data.type]) {
				existing[data.type].consumptionRate = data.consumptionRate;
				existing.lastUpdate = Date.now();

				// Trigger reactivity
				state.resources = new Map(state.resources);
			} else {
				console.warn(
					`[ResourcesStore] Settlement ${data.settlementId} not found for consumption update`
				);
			}
		}
	);

	/**
	 * Storage capacity change (from building warehouses)
	 */
	socket.on(
		'resource-capacity-change',
		(data: { settlementId: string; capacities: Record<ResourceType, number> }) => {
			console.log('[ResourcesStore] Received resource-capacity-change:', data);

			if (!data.settlementId || !data.capacities) {
				console.error('[ResourcesStore] Invalid resource-capacity-change data:', data);
				return;
			}

			const existing = state.resources.get(data.settlementId);
			if (existing) {
				// Update all capacities
				for (const [type, capacity] of Object.entries(data.capacities)) {
					const resourceType = type as ResourceType;
					if (existing[resourceType]) {
						existing[resourceType].capacity = capacity;
					}
				}

				existing.lastUpdate = Date.now();

				// Trigger reactivity
				state.resources = new Map(state.resources);
			} else {
				console.warn(
					`[ResourcesStore] Settlement ${data.settlementId} not found for capacity change`
				);
			}
		}
	);

	/**
	 * Structure built - deduct resources from storage
	 * Handles resource deduction when structures are constructed
	 */
	socket.on(
		'structure:built',
		(data: {
			settlementId: string;
			structure: unknown;
			category: string;
			structureName: string;
			resourcesDeducted?: {
				wood: number;
				stone: number;
				ore: number;
			};
		}) => {
			console.log('[ResourcesStore] Received structure:built:', data);

			if (!data.settlementId) {
				console.error('[ResourcesStore] Missing settlementId in structure:built');
				return;
			}

			const existing = state.resources.get(data.settlementId);
			if (existing && data.resourcesDeducted) {
				// Deduct resources from current amounts
				existing.wood.current = Math.max(
					0,
					existing.wood.current - data.resourcesDeducted.wood
				);
				existing.stone.current = Math.max(
					0,
					existing.stone.current - data.resourcesDeducted.stone
				);
				existing.ore.current = Math.max(
					0,
					existing.ore.current - data.resourcesDeducted.ore
				);

				existing.lastUpdate = Date.now();

				// Trigger reactivity
				state.resources = new Map(state.resources);

				console.log(
					`[ResourcesStore] Deducted construction costs for ${data.structureName}:`,
					data.resourcesDeducted,
					'New resources:',
					{
						wood: existing.wood.current,
						stone: existing.stone.current,
						ore: existing.ore.current
					}
				);
			} else if (!existing) {
				console.warn(
					`[ResourcesStore] Settlement ${data.settlementId} not found for structure:built update`
				);
			}
		}
	);

	/**
	 * Structure upgraded - deduct upgrade costs from storage
	 * Handles resource deduction when structures are upgraded
	 */
	socket.on(
		'structure:upgraded',
		(data: {
			settlementId: string;
			structureId: string;
			level: number;
			category: string;
			structureName: string;
			resourcesDeducted?: {
				wood: number;
				stone: number;
				ore: number;
			};
		}) => {
			console.log('[ResourcesStore] Received structure:upgraded:', data);

			if (!data.settlementId) {
				console.error('[ResourcesStore] Missing settlementId in structure:upgraded');
				return;
			}

			const existing = state.resources.get(data.settlementId);
			if (existing && data.resourcesDeducted) {
				// Deduct upgrade costs from current amounts
				existing.wood.current = Math.max(
					0,
					existing.wood.current - data.resourcesDeducted.wood
				);
				existing.stone.current = Math.max(
					0,
					existing.stone.current - data.resourcesDeducted.stone
				);
				existing.ore.current = Math.max(
					0,
					existing.ore.current - data.resourcesDeducted.ore
				);

				existing.lastUpdate = Date.now();

				// Trigger reactivity
				state.resources = new Map(state.resources);

				console.log(
					`[ResourcesStore] Deducted upgrade costs for ${data.structureName} to level ${data.level}:`,
					data.resourcesDeducted,
					'New resources:',
					{
						wood: existing.wood.current,
						stone: existing.stone.current,
						ore: existing.ore.current
					}
				);
			} else if (!existing) {
				console.warn(
					`[ResourcesStore] Settlement ${data.settlementId} not found for structure:upgraded update`
				);
			}
		}
	);
}

/**
 * Subscribe to socket connection state changes (only in browser)
 */
if (browser) {
	socketStore.subscribe(($socket) => {
		if ($socket.connectionState === 'connected' && $socket.socket) {
			initializeListeners();
		}
	});
}

/**
 * Public API
 */
export const resourcesStore = {
	/**
	 * Get all resources for a settlement as an array (for ResourcePanel)
	 */
	getResources(settlementId: string): ResourceWithType[] | undefined {
		const resourcesState = state.resources.get(settlementId);
		if (!resourcesState) {
			return undefined;
		}

		// Convert to array format expected by ResourcePanel
		const resourceTypes: ResourceType[] = ['food', 'water', 'wood', 'stone', 'ore'];
		return resourceTypes.map((type) => ({
			type,
			current: resourcesState[type].current,
			capacity: resourcesState[type].capacity,
			productionRate: resourcesState[type].productionRate,
			consumptionRate: resourcesState[type].consumptionRate
		}));
	},

	/**
	 * Get a specific resource for a settlement
	 */
	getResource(settlementId: string, type: ResourceType): ResourceData | undefined {
		const resourcesState = state.resources.get(settlementId);
		if (!resourcesState) {
			return undefined;
		}

		const resourceData = resourcesState[type];
		if (!resourceData) {
			return undefined;
		}

		return resourceData;
	},

	/**
	 * Get current amount of a specific resource
	 */
	getCurrentAmount(settlementId: string, type: ResourceType): number {
		const resource = this.getResource(settlementId, type);
		return resource?.current ?? 0;
	},

	/**
	 * Get storage capacity of a specific resource
	 */
	getCapacity(settlementId: string, type: ResourceType): number {
		const resource = this.getResource(settlementId, type);
		return resource?.capacity ?? 0;
	},

	/**
	 * Get production rate of a specific resource (per hour)
	 */
	getProductionRate(settlementId: string, type: ResourceType): number {
		const resource = this.getResource(settlementId, type);
		return resource?.productionRate ?? 0;
	},

	/**
	 * Get consumption rate of a specific resource (per hour)
	 */
	getConsumptionRate(settlementId: string, type: ResourceType): number {
		const resource = this.getResource(settlementId, type);
		return resource?.consumptionRate ?? 0;
	},

	/**
	 * Get net rate (production - consumption) of a specific resource
	 */
	getNetRate(settlementId: string, type: ResourceType): number {
		const resource = this.getResource(settlementId, type);
		if (!resource) {
			return 0;
		}
		return resource.productionRate - resource.consumptionRate;
	},

	/**
	 * Get percentage filled for a specific resource
	 */
	getPercentage(settlementId: string, type: ResourceType): number {
		const resource = this.getResource(settlementId, type);
		if (!resource || resource.capacity === 0) {
			return 0;
		}
		return (resource.current / resource.capacity) * 100;
	},

	/**
	 * Request fresh resource data from server
	 */
	requestResourcesData(settlementId: string): void {
		const socket = socketStore.getSocket();
		if (!socket) {
			console.warn('[ResourcesStore] Cannot request data - no socket connection');
			return;
		}

		console.log('[ResourcesStore] Requesting resources data for:', settlementId);
		socket.emit('request-resources-data', { settlementId });
	},

	/**
	 * Get raw resources state for a settlement
	 */
	getResourcesState(settlementId: string): ResourcesState | undefined {
		return state.resources.get(settlementId);
	},

	/**
	 * Initialize store from server-side loaded data
	 * Call this in +page.svelte onMount with data from +page.server.ts
	 *
	 * @param settlementId - The settlement ID
	 * @param serverData - Settlement data from REST API (has storage property)
	 */
	initializeFromServerData(
		settlementId: string,
		serverData: {
			storage: { food: number; water: number; wood: number; stone: number; ore: number };
			capacity?: number;
		}
	): void {
		const capacity = serverData.capacity || 1000;

		console.log(
			'[ResourcesStore] Initializing from server data for settlement:',
			settlementId,
			serverData
		);

		const resourcesState: ResourcesState = {
			settlementId,
			food: {
				current: serverData.storage.food,
				capacity,
				productionRate: 0,
				consumptionRate: 0
			},
			water: {
				current: serverData.storage.water,
				capacity,
				productionRate: 0,
				consumptionRate: 0
			},
			wood: {
				current: serverData.storage.wood,
				capacity,
				productionRate: 0,
				consumptionRate: 0
			},
			stone: {
				current: serverData.storage.stone,
				capacity,
				productionRate: 0,
				consumptionRate: 0
			},
			ore: {
				current: serverData.storage.ore,
				capacity,
				productionRate: 0,
				consumptionRate: 0
			},
			lastUpdate: Date.now()
		};

		state.resources.set(settlementId, resourcesState);

		// Trigger Svelte reactivity by creating new Map reference
		state.resources = new Map(state.resources);

		console.log('[ResourcesStore] Initialized resources for settlement:', settlementId);
		console.log('[ResourcesStore] Current resources map size:', state.resources.size);
	},

	/**
	 * Access to all resources (for debugging)
	 */
	get allResources() {
		return state.resources;
	}
};
