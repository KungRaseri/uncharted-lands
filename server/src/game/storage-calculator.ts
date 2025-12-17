/**
 * Storage Calculator
 *
 * Calculates storage capacity limits and handles resource overflow
 */

import type { Resources } from './resource-calculator.js';
import type { Structure } from './consumption-calculator.js';

/**
 * Storage capacity for each resource type
 */
export interface StorageCapacity {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

/**
 * Base storage capacity without any structures
 * GDD Specification (Section 6.3): 1000 units per resource type
 */
export const BASE_STORAGE_CAPACITY: StorageCapacity = {
	food: 1000,
	water: 1000,
	wood: 1000,
	stone: 1000,
	ore: 1000,
};

/**
 * Calculate total storage capacity from settlement structures
 * Based on "Storage Capacity" modifiers plus base capacity
 *
 * @param structures Array of settlement structures with modifiers
 * @returns Storage capacity for each resource type
 */
export function calculateStorageCapacity(structures: Structure[]): StorageCapacity {
	const capacity: StorageCapacity = { ...BASE_STORAGE_CAPACITY };

	for (const structure of structures) {
		for (const modifier of structure.modifiers) {
			if (modifier.name === 'Storage Capacity') {
				// Apply to all resources equally
				capacity.food += modifier.value;
				capacity.water += modifier.value;
				capacity.wood += modifier.value;
				capacity.stone += modifier.value;
				capacity.ore += modifier.value;
			} else if (modifier.name.includes('Storage')) {
				// Resource-specific storage modifiers
				if (modifier.name.includes('Food')) {
					capacity.food += modifier.value;
				} else if (modifier.name.includes('Water')) {
					capacity.water += modifier.value;
				} else if (modifier.name.includes('Wood')) {
					capacity.wood += modifier.value;
				} else if (modifier.name.includes('Stone')) {
					capacity.stone += modifier.value;
				} else if (modifier.name.includes('Ore')) {
					capacity.ore += modifier.value;
				}
			}
		}
	}

	return capacity;
}

/**
 * Clamp resources to storage capacity limits
 *
 * @param resources Current resource amounts
 * @param capacity Storage capacity limits
 * @returns Resources clamped to capacity
 */
export function clampToCapacity(resources: Resources, capacity: StorageCapacity): Resources {
	return {
		food: Math.min(Math.max(0, resources.food), capacity.food),
		water: Math.min(Math.max(0, resources.water), capacity.water),
		wood: Math.min(Math.max(0, resources.wood), capacity.wood),
		stone: Math.min(Math.max(0, resources.stone), capacity.stone),
		ore: Math.min(Math.max(0, resources.ore), capacity.ore),
	};
}

/**
 * Calculate wasted resources (overflow beyond capacity)
 *
 * @param current Current resource amounts
 * @param changes Resource changes to apply (can be negative)
 * @param capacity Storage capacity limits
 * @returns Amount of each resource wasted
 */
export function calculateWaste(
	current: Resources,
	changes: Resources,
	capacity: StorageCapacity
): Resources {
	const waste: Resources = {
		food: 0,
		water: 0,
		wood: 0,
		stone: 0,
		ore: 0,
	};

	// Calculate waste for each resource
	for (const key of ['food', 'water', 'wood', 'stone', 'ore'] as const) {
		const newAmount = current[key] + changes[key];
		if (newAmount > capacity[key]) {
			waste[key] = newAmount - capacity[key];
		}
	}

	return waste;
}

/**
 * Calculate storage utilization percentage
 *
 * @param resources Current resource amounts
 * @param capacity Storage capacity limits
 * @returns Utilization percentage for each resource (0-100)
 */
export function calculateStorageUtilization(
	resources: Resources,
	capacity: StorageCapacity
): Record<keyof Resources, number> {
	return {
		food: (resources.food / capacity.food) * 100,
		water: (resources.water / capacity.water) * 100,
		wood: (resources.wood / capacity.wood) * 100,
		stone: (resources.stone / capacity.stone) * 100,
		ore: (resources.ore / capacity.ore) * 100,
	};
}

/**
 * Check if storage is near capacity (>90% full)
 *
 * @param resources Current resource amounts
 * @param capacity Storage capacity limits
 * @returns Object indicating which resources are near capacity
 */
export function isNearCapacity(
	resources: Resources,
	capacity: StorageCapacity
): Record<keyof Resources, boolean> {
	const utilization = calculateStorageUtilization(resources, capacity);

	return {
		food: utilization.food > 90,
		water: utilization.water > 90,
		wood: utilization.wood > 90,
		stone: utilization.stone > 90,
		ore: utilization.ore > 90,
	};
}

/**
 * Get storage summary for display
 *
 * @param resources Current resource amounts
 * @param structures Array of settlement structures
 * @returns Storage summary with capacity, utilization, and warnings
 */
export function getStorageSummary(resources: Resources, structures: Structure[]) {
	const capacity = calculateStorageCapacity(structures);
	const utilization = calculateStorageUtilization(resources, capacity);
	const nearCapacity = isNearCapacity(resources, capacity);

	// Check if any resource is near or at capacity
	const hasWarnings = Object.values(nearCapacity).some(Boolean);

	return {
		resources,
		capacity,
		utilization,
		nearCapacity,
		hasWarnings,
	};
}
