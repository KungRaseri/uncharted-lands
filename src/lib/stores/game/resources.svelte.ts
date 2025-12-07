/**
 * Resources Store
 * Manages settlement resource state with real-time Socket.IO updates
 */

import { browser } from '$app/environment';
import { socketStore } from './socket';

// Types
export type ResourceType = 'food' | 'water' | 'wood' | 'stone' | 'ore';

export interface ResourceData {
	current: number;
	capacity: number;
	productionRate: number; // per hour
	consumptionRate: number; // per hour
}

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

export interface Resource {
	type: ResourceType;
	current: number;
	capacity: number;
	productionRate: number;
	consumptionRate: number;
}

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
	 * Single resource update (amount change)
	 */
	socket.on(
		'resource-update',
		(data: { settlementId: string; type: ResourceType; current: number; capacity?: number }) => {
			console.log('[ResourcesStore] Received resource-update:', data);

			if (!data.settlementId || !data.type) {
				console.error('[ResourcesStore] Invalid resource-update data:', data);
				return;
			}

			const existing = state.resources.get(data.settlementId);
			if (existing?.[data.type]) {
				existing[data.type].current = data.current;
				if (data.capacity !== undefined) {
					existing[data.type].capacity = data.capacity;
				}
				existing.lastUpdate = Date.now();

				// Trigger reactivity
				state.resources = new Map(state.resources);
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
	getResources(settlementId: string): Resource[] | undefined {
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
	getResource(settlementId: string, type: ResourceType): Resource | undefined {
		const resourcesState = state.resources.get(settlementId);
		if (!resourcesState) {
			return undefined;
		}

		const resourceData = resourcesState[type];
		if (!resourceData) {
			return undefined;
		}

		return {
			type,
			current: resourceData.current,
			capacity: resourceData.capacity,
			productionRate: resourceData.productionRate,
			consumptionRate: resourceData.consumptionRate
		};
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
