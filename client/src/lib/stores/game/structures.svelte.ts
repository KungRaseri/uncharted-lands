/**
 * Structures Store
 * Manages settlement structures state with real-time Socket.IO updates
 *
 * Handles:
 * - Structure creation (structure:built event)
 * - Structure upgrades (structure:upgraded event)
 * - Structure demolition (structure:demolished event)
 * - Reactive state for UI updates
 */

import { socketStore } from './socket';
import type { Socket } from 'socket.io-client';
import type { Structure } from '@uncharted-lands/shared';

interface StructuresState {
	// Map of settlementId -> Structure[]
	structures: Map<string, Structure[]>;
	loading: boolean;
	error: string | null;
}

// Initial state
let state = $state<StructuresState>({
	structures: new Map(),
	loading: false,
	error: null
});

// Track if listeners are initialized
let listenersInitialized = false;

/**
 * Initialize Socket.IO event listeners for real-time structure updates
 */
function initializeListeners(socket: Socket) {
	if (listenersInitialized) {
		console.log('[StructuresStore] Listeners already initialized, skipping');
		return;
	}

	console.log('[StructuresStore] Initializing Socket.IO listeners');

	// ✅ EVENT: structure:built - New structure created
	socket.on(
		'structure:built',
		(data: {
			settlementId: string;
			structure: Structure;
			category: string;
			structureName: string;
			resourcesDeducted?: { wood: number; stone: number; ore: number };
		}) => {
			console.log('[StructuresStore] Received structure:built:', data);

			if (!data.settlementId || !data.structure) {
				console.warn(
					'[StructuresStore] Invalid structure:built data, missing settlementId or structure'
				);
				return;
			}

			// Get existing structures for settlement
			const existing = state.structures.get(data.settlementId) || [];

			// Add new structure to list
			const updated = [...existing, data.structure];

			// Update map (create new Map to trigger Svelte reactivity)
			state.structures = new Map(state.structures.set(data.settlementId, updated));

			console.log('[StructuresStore] Structure added to settlement:', {
				settlementId: data.settlementId,
				structureId: data.structure.id,
				totalStructures: updated.length
			});
		}
	);

	// ✅ EVENT: structure:upgraded - Structure level increased
	socket.on(
		'structure:upgraded',
		(data: {
			settlementId: string;
			structureId: string;
			level: number;
			category: string;
			structureName: string;
			resourcesDeducted?: { wood: number; stone: number; ore: number };
		}) => {
			console.log('[StructuresStore] Received structure:upgraded:', data);

			if (!data.settlementId || !data.structureId) {
				console.warn('[StructuresStore] Invalid structure:upgraded data');
				return;
			}

			const existing = state.structures.get(data.settlementId);
			if (!existing) {
				console.warn('[StructuresStore] No structures found for settlement:', data.settlementId);
				return;
			}

			// Find and update the structure
			const updated = existing.map((structure) => {
				if (structure.id === data.structureId) {
					return {
						...structure,
						level: data.level,
						updatedAt: new Date().toISOString()
					};
				}
				return structure;
			});

			// Trigger reactivity
			state.structures = new Map(state.structures.set(data.settlementId, updated));

			console.log('[StructuresStore] Structure upgraded:', {
				structureId: data.structureId,
				newLevel: data.level
			});
		}
	);

	// ✅ EVENT: structure:demolished - Structure removed
	socket.on('structure:demolished', (data: { settlementId: string; structureId: string }) => {
		console.log('[StructuresStore] Received structure:demolished:', data);

		if (!data.settlementId || !data.structureId) {
			console.warn('[StructuresStore] Invalid structure:demolished data');
			return;
		}

		const existing = state.structures.get(data.settlementId);
		if (!existing) {
			console.warn('[StructuresStore] No structures found for settlement:', data.settlementId);
			return;
		}

		// Remove the structure
		const updated = existing.filter((structure) => structure.id !== data.structureId);

		// Trigger reactivity
		state.structures = new Map(state.structures.set(data.settlementId, updated));

		console.log('[StructuresStore] Structure removed:', {
			structureId: data.structureId,
			remainingStructures: updated.length
		});
	});

	listenersInitialized = true;
	console.log('[StructuresStore] Listeners initialized successfully');
}

// Subscribe to socket connection state and initialize listeners
$effect(() => {
	const socket = socketStore.getSocket();

	if (socket && !listenersInitialized) {
		console.log('[StructuresStore] Socket available, initializing listeners');
		initializeListeners(socket);
	}
});

/**
 * Initialize structures for a settlement from initial data
 */
function initializeStructures(settlementId: string, structures: Structure[]) {
	console.log(
		'[StructuresStore] Initializing structures for settlement:',
		settlementId,
		structures.length
	);
	state.structures = new Map(state.structures.set(settlementId, structures));
}

/**
 * Get structures for a settlement
 */
function getStructures(settlementId: string): Structure[] {
	return state.structures.get(settlementId) || [];
}

/**
 * Get buildings (non-EXTRACTOR) for a settlement
 */
function getBuildings(settlementId: string): Structure[] {
	const structures = getStructures(settlementId);
	return structures.filter((s) => s.category !== 'EXTRACTOR');
}

/**
 * Get extractors for a settlement
 */
function getExtractors(settlementId: string): Structure[] {
	const structures = getStructures(settlementId);
	return structures.filter((s) => s.category === 'EXTRACTOR');
}

/**
 * Manually add a structure (fallback if event not received)
 */
function addStructure(settlementId: string, structure: Structure) {
	const existing = state.structures.get(settlementId) || [];
	const updated = [...existing, structure];
	state.structures = new Map(state.structures.set(settlementId, updated));

	console.log('[StructuresStore] Structure manually added:', structure.id);
}

/**
 * Manually update a structure (fallback if event not received)
 */
function updateStructure(settlementId: string, structureId: string, updates: Partial<Structure>) {
	const existing = state.structures.get(settlementId);
	if (!existing) return;

	const updated = existing.map((structure) => {
		if (structure.id === structureId) {
			return { ...structure, ...updates };
		}
		return structure;
	});

	state.structures = new Map(state.structures.set(settlementId, updated));

	console.log('[StructuresStore] Structure manually updated:', structureId);
}

/**
 * Manually remove a structure (fallback if event not received)
 */
function removeStructure(settlementId: string, structureId: string) {
	const existing = state.structures.get(settlementId);
	if (!existing) return;

	const updated = existing.filter((structure) => structure.id !== structureId);
	state.structures = new Map(state.structures.set(settlementId, updated));

	console.log('[StructuresStore] Structure manually removed:', structureId);
}

/**
 * Clear all structures (e.g., on logout)
 */
function clearStructures() {
	state.structures = new Map();
	state.error = null;
	console.log('[StructuresStore] All structures cleared');
}

// Export public API
export const structuresStore = {
	// State (read-only via getter)
	get state() {
		return state;
	},

	// Initialization
	initializeStructures,

	// Getters
	getStructures,
	getBuildings,
	getExtractors,

	// Manual operations (fallbacks)
	addStructure,
	updateStructure,
	removeStructure,
	clearStructures
};
