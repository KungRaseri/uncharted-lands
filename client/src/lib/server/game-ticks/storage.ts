/**
 * Storage Management
 * 
 * Handles storage capacity calculations and resource limits.
 */

import type { Settlement, SettlementStorage, SettlementStructure, StructureModifier } from '@prisma/client';
import type { ResourceAmounts } from './production';

type SettlementWithRelations = Settlement & {
	Storage: SettlementStorage;
	Structures: (SettlementStructure & {
		modifiers: StructureModifier[];
	})[];
};

export interface ResourceCapacity {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

/**
 * Base storage capacity for all settlements
 */
export const BASE_STORAGE_CAPACITY = 1000;

/**
 * Calculate total storage capacity from structures
 */
export function calculateStorageCapacity(settlement: SettlementWithRelations): ResourceCapacity {
	const capacity: ResourceCapacity = {
		food: BASE_STORAGE_CAPACITY,
		water: BASE_STORAGE_CAPACITY,
		wood: BASE_STORAGE_CAPACITY,
		stone: BASE_STORAGE_CAPACITY,
		ore: BASE_STORAGE_CAPACITY
	};

	// Add capacity bonuses from structures
	for (const structure of settlement.Structures) {
		for (const modifier of structure.modifiers) {
			if (modifier.name === 'Storage Capacity') {
				// General storage increases all capacities
				capacity.food += modifier.value;
				capacity.water += modifier.value;
				capacity.wood += modifier.value;
				capacity.stone += modifier.value;
				capacity.ore += modifier.value;
			} else if (modifier.name === 'Food Storage') {
				capacity.food += modifier.value;
			}
			// Add other specific storage types as needed
		}
	}

	return capacity;
}

/**
 * Clamp resource amounts to capacity limits
 */
export function clampToCapacity(
	amounts: ResourceAmounts,
	capacity: ResourceCapacity
): ResourceAmounts {
	return {
		food: Math.max(0, Math.min(capacity.food, amounts.food)),
		water: Math.max(0, Math.min(capacity.water, amounts.water)),
		wood: Math.max(0, Math.min(capacity.wood, amounts.wood)),
		stone: Math.max(0, Math.min(capacity.stone, amounts.stone)),
		ore: Math.max(0, Math.min(capacity.ore, amounts.ore))
	};
}

/**
 * Calculate wasted resources (exceeding capacity)
 */
export function calculateWaste(
	current: ResourceAmounts,
	changes: ResourceAmounts,
	capacity: ResourceCapacity
): ResourceAmounts {
	return {
		food: Math.max(0, (current.food + changes.food) - capacity.food),
		water: Math.max(0, (current.water + changes.water) - capacity.water),
		wood: Math.max(0, (current.wood + changes.wood) - capacity.wood),
		stone: Math.max(0, (current.stone + changes.stone) - capacity.stone),
		ore: Math.max(0, (current.ore + changes.ore) - capacity.ore)
	};
}

/**
 * Calculate storage utilization percentage
 */
export function calculateStorageUtilization(
	storage: SettlementStorage,
	capacity: ResourceCapacity
): number {
	const totalStored = storage.food + storage.water + storage.wood + storage.stone + storage.ore;
	const totalCapacity = capacity.food + capacity.water + capacity.wood + capacity.stone + capacity.ore;
	
	return totalCapacity > 0 ? Math.round((totalStored / totalCapacity) * 100) : 0;
}

/**
 * Get storage summary for display
 */
export function getStorageSummary(settlement: SettlementWithRelations) {
	const capacity = calculateStorageCapacity(settlement);
	const utilization = calculateStorageUtilization(settlement.Storage, capacity);
	
	const details = {
		food: { current: settlement.Storage.food, capacity: capacity.food },
		water: { current: settlement.Storage.water, capacity: capacity.water },
		wood: { current: settlement.Storage.wood, capacity: capacity.wood },
		stone: { current: settlement.Storage.stone, capacity: capacity.stone },
		ore: { current: settlement.Storage.ore, capacity: capacity.ore }
	};

	return {
		capacity,
		utilization,
		details
	};
}
