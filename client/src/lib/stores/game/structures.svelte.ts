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
import { logger } from '$lib/utils/logger';

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
		logger.debug('[StructuresStore] Listeners already initialized, skipping');
		return;
	}

	logger.debug('[StructuresStore] Initializing Socket.IO listeners');

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
			logger.info('[StructuresStore] 🎉 Received structure:built EVENT:', {
				settlementId: data.settlementId,
				structureName: data.structureName,
				structure: data.structure
			});

			if (!data.settlementId || !data.structure) {
				logger.warn(
					'[StructuresStore] Invalid structure:built data, missing settlementId or structure'
				);
				return;
			}

			// Get existing structures for settlement
			const existing = state.structures.get(data.settlementId) || [];
			logger.info('[StructuresStore] Existing structures before add:', {
				count: existing.length,
				ids: existing.map((s) => s.id)
			});

			// Add new structure to list
			const updated = [...existing, data.structure];

			// Update map and trigger Svelte 5 reactivity
			state.structures.set(data.settlementId, updated);
			state.structures = new Map(state.structures);

			logger.info('[StructuresStore] ✅ Structure added to settlement - triggering reactivity:', {
				settlementId: data.settlementId,
				structureId: data.structure.id,
				totalStructures: updated.length,
				updatedIds: updated.map((s) => s.id)
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
			logger.debug('[StructuresStore] Received structure:upgraded:', data);

			if (!data.settlementId || !data.structureId) {
				logger.warn('[StructuresStore] Invalid structure:upgraded data');
				return;
			}

			const existing = state.structures.get(data.settlementId);
			if (!existing) {
				logger.warn(
					'[StructuresStore] No structures found for settlement:',
					{ settlementId: data.settlementId }
				);
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
			state.structures.set(data.settlementId, updated);
			state.structures = new Map(state.structures);

			logger.debug('[StructuresStore] Structure upgraded:', {
				structureId: data.structureId,
				newLevel: data.level
			});
		}
	);

	// ✅ EVENT: structure:demolished - Structure removed
	socket.on('structure:demolished', (data: { settlementId: string; structureId: string }) => {
		logger.info('[StructuresStore] 🗑️ Received structure:demolished EVENT:', {
			settlementId: data.settlementId,
			structureId: data.structureId
		});

		if (!data.settlementId || !data.structureId) {
			logger.warn('[StructuresStore] Invalid structure:demolished data');
			return;
		}

		const existing = state.structures.get(data.settlementId);
		if (!existing) {
			logger.warn(
				'[StructuresStore] No structures found for settlement:',
				{ settlementId: data.settlementId }
			);
			return;
		}

		logger.info('[StructuresStore] Existing structures before removal:', {
			count: existing.length,
			ids: existing.map((s) => s.id)
		});

		// Remove the structure
		const updated = existing.filter((structure) => structure.id !== data.structureId);

		// Trigger reactivity
		state.structures.set(data.settlementId, updated);
		state.structures = new Map(state.structures);

		logger.info('[StructuresStore] ✅ Structure removed - triggering reactivity:', {
			structureId: data.structureId,
			totalStructures: updated.length,
			remainingIds: updated.map((s) => s.id)
		});
	});

	listenersInitialized = true;
	logger.debug('[StructuresStore] Listeners initialized successfully');
}

/**
 * Initialize the store by setting up socket listeners
 * Should be called from a component context (e.g., in $effect)
 */
function initialize() {
	const socket = socketStore.getSocket();

	if (socket && !listenersInitialized) {
		logger.debug('[StructuresStore] Initializing socket listeners');
		initializeListeners(socket);
	}
}

/**
 * Initialize structures for a settlement from initial data
 */
function initializeStructures(settlementId: string, structures: Structure[]) {
	logger.debug(
		'[StructuresStore] Initializing structures for settlement:',
		{ settlementId, count: structures.length }
	);
	state.structures.set(settlementId, structures);
	state.structures = new Map(state.structures);
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
	state.structures.set(settlementId, updated);
	state.structures = new Map(state.structures);

	logger.debug('[StructuresStore] Structure manually added:', { structureId: structure.id });
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

	state.structures.set(settlementId, updated);
	state.structures = new Map(state.structures);

	logger.debug('[StructuresStore] Structure manually updated:', { structureId });
}

/**
 * Manually remove a structure (fallback if event not received)
 */
function removeStructure(settlementId: string, structureId: string) {
	const existing = state.structures.get(settlementId);
	if (!existing) return;

	const updated = existing.filter((structure) => structure.id !== structureId);
	state.structures.set(settlementId, updated);
	state.structures = new Map(state.structures);

	logger.debug('[StructuresStore] Structure manually removed:', { structureId });
}

/**
 * Clear all structures (e.g., on logout)
 */
function clearStructures() {
	state.structures = new Map();
	state.error = null;
	logger.debug('[StructuresStore] All structures cleared');
}

// Export public API
export const structuresStore = {
	// State (read-only via getter)
	get state() {
		return state;
	},

	// Initialization
	initialize,
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
