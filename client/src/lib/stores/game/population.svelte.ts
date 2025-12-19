/**
 * Population Store for Uncharted Lands
 *
 * Manages settlement population data and real-time updates via Socket.IO
 */

import { browser } from '$app/environment';
import { socketStore } from './socket';
import { logger } from '$lib/utils/logger'

interface PopulationState {
	settlementId: string;
	current: number;
	capacity: number;
	happiness: number;
	happinessDescription: string;
	growthRate: number;
	status: 'Growing' | 'Stable' | 'Declining';
	lastUpdate: number;
}

interface PopulationStore {
	settlements: Map<string, PopulationState>;
	recentEvents: PopulationEvent[];
}

interface PopulationEvent {
	id: string;
	type: 'growth' | 'immigration' | 'emigration' | 'warning';
	settlementId: string;
	message: string;
	timestamp: number;
	data: Record<string, unknown>;
}

// Create reactive state
let state = $state<PopulationStore>({
	settlements: new Map(),
	recentEvents: []
});

// Initialize socket listeners
function initializeListeners() {
	const socket = socketStore.getSocket();
	if (!socket) return;

	// Population state updates (regular broadcasts)
	socket.on(
		'population-state',
		(data: {
			settlementId: string;
			current: number;
			capacity: number;
			happiness: number;
			happinessDescription: string;
			growthRate: number;
			status: 'Growing' | 'Stable' | 'Declining';
			timestamp: number;
		}) => {
			logger.debug('[POPULATION] State update:', data);
			logger.debug(
				'[POPULATION] DEBUG - Capacity value:',
				data.capacity,
				typeof data.capacity
			);

			state.settlements.set(data.settlementId, {
				settlementId: data.settlementId,
				current: data.current,
				capacity: data.capacity,
				happiness: data.happiness,
				happinessDescription: data.happinessDescription,
				growthRate: data.growthRate,
				status: data.status,
				lastUpdate: data.timestamp
			});

			// Trigger reactivity
			state.settlements = new Map(state.settlements);
		}
	);

	// Population growth events
	socket.on(
		'population-growth',
		(data: {
			settlementId: string;
			oldPopulation: number;
			newPopulation: number;
			happiness: number;
			growthRate: number;
			timestamp: number;
		}) => {
			logger.debug('[POPULATION] Growth event:', data);

			const change = data.newPopulation - data.oldPopulation;
			const message =
				change > 0
					? `Population grew by ${change} (${data.oldPopulation} → ${data.newPopulation})`
					: `Population decreased by ${Math.abs(change)} (${data.oldPopulation} → ${data.newPopulation})`;

			addEvent({
				type: 'growth',
				settlementId: data.settlementId,
				message,
				timestamp: data.timestamp,
				data: {
					oldPopulation: data.oldPopulation,
					newPopulation: data.newPopulation,
					change,
					happiness: data.happiness,
					growthRate: data.growthRate
				}
			});
		}
	);

	// Settler arrived (immigration)
	socket.on(
		'settler-arrived',
		(data: {
			settlementId: string;
			population: number;
			immigrantCount: number;
			happiness: number;
			timestamp: number;
		}) => {
			logger.debug('[POPULATION] Immigration event:', data);

			addEvent({
				type: 'immigration',
				settlementId: data.settlementId,
				message: `🎉 ${data.immigrantCount} new settler${data.immigrantCount > 1 ? 's' : ''} arrived! (Population: ${data.population})`,
				timestamp: data.timestamp,
				data: {
					immigrantCount: data.immigrantCount,
					population: data.population,
					happiness: data.happiness
				}
			});
		}
	);

	// Population warnings
	socket.on(
		'population-warning',
		(data: {
			settlementId: string;
			population: number;
			happiness: number;
			warning: 'low_happiness' | 'emigration_risk' | 'no_housing';
			message: string;
			timestamp: number;
		}) => {
			logger.debug('[POPULATION] Warning:', data);

			const icon = data.warning === 'low_happiness' ? '😟' : '⚠️';

			addEvent({
				type: 'warning',
				settlementId: data.settlementId,
				message: `${icon} ${data.message}`,
				timestamp: data.timestamp,
				data: {
					warning: data.warning,
					population: data.population,
					happiness: data.happiness
				}
			});

			// Check if this is an emigration event
			if (data.message.includes('left')) {
				addEvent({
					type: 'emigration',
					settlementId: data.settlementId,
					message: `😔 ${data.message}`,
					timestamp: data.timestamp,
					data: {
						population: data.population,
						happiness: data.happiness
					}
				});
			}
		}
	);
}

// Add event to recent events list
function addEvent(event: Omit<PopulationEvent, 'id'>) {
	const newEvent: PopulationEvent = {
		id: `${event.settlementId}-${event.timestamp}-${Math.random()}`,
		...event
	};

	state.recentEvents.unshift(newEvent);

	// Keep only last 50 events
	if (state.recentEvents.length > 50) {
		state.recentEvents = state.recentEvents.slice(0, 50);
	}
}

// Initialize listeners when socket connects (only in browser)
if (browser) {
	socketStore.subscribe(($socket) => {
		if ($socket.connectionState === 'connected' && $socket.socket) {
			initializeListeners();
		}
	});
}

// Export store interface
export const populationStore = {
	// Get population state for a settlement
	getSettlement: (settlementId: string): PopulationState | undefined => {
		return state.settlements.get(settlementId);
	},

	// Get all settlements
	get settlements(): Map<string, PopulationState> {
		return state.settlements;
	},

	// Get recent events
	get recentEvents(): PopulationEvent[] {
		return state.recentEvents;
	},

	// Get events for a specific settlement
	getSettlementEvents: (settlementId: string): PopulationEvent[] => {
		return state.recentEvents.filter((e) => e.settlementId === settlementId);
	},

	// Clear events for a settlement
	clearSettlementEvents: (settlementId: string) => {
		state.recentEvents = state.recentEvents.filter((e) => e.settlementId !== settlementId);
	},

	// Clear all events
	clearAllEvents: () => {
		state.recentEvents = [];
	},

	// Dismiss a specific event
	dismissEvent: (eventId: string) => {
		state.recentEvents = state.recentEvents.filter((e) => e.id !== eventId);
	},

	/**
	 * Initialize store from server-side loaded data
	 * Call this in +page.svelte onMount with data from +page.server.ts
	 */
	initializeFromServerData: (
		settlementId: string,
		serverData: {
			current: number;
			capacity: number;
			happiness: number;
			growthRate: number;
			immigrationChance: number;
			emigrationChance: number;
			lastGrowthTick: number;
		}
	): void => {
		logger.debug(
			'[PopulationStore] Initializing from server data for settlement:',
			{settlementId,
			serverData}
		);

		// Calculate happiness description and status
		let happinessDescription = 'Content';
		let status: 'Growing' | 'Stable' | 'Declining' = 'Stable';

		if (serverData.happiness >= 80) {
			happinessDescription = 'Very Happy';
			status = 'Growing';
		} else if (serverData.happiness >= 60) {
			happinessDescription = 'Happy';
			status = 'Growing';
		} else if (serverData.happiness >= 40) {
			happinessDescription = 'Content';
			status = 'Stable';
		} else if (serverData.happiness >= 20) {
			happinessDescription = 'Unhappy';
			status = 'Declining';
		} else {
			happinessDescription = 'Very Unhappy';
			status = 'Declining';
		}

		const populationState: PopulationState = {
			settlementId,
			current: serverData.current,
			capacity: serverData.capacity,
			happiness: serverData.happiness,
			happinessDescription,
			growthRate: serverData.growthRate,
			status,
			lastUpdate: Date.now()
		};

		state.settlements.set(settlementId, populationState);

		// Trigger Svelte reactivity
		state.settlements = new Map(state.settlements);

		logger.debug('[PopulationStore] Initialized population for settlement:', {settlementId});
		logger.debug('[PopulationStore] Current settlements map size:', {size: state.settlements.size});
	},

	/**
	 * Initialize Socket.IO listeners
	 * Called automatically when socket connects
	 */
	initializeListeners: () => {
		initializeListeners();
	}
};
