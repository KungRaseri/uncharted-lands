/**
 * Tests for Storage Calculator
 */

import { describe, it, expect } from 'vitest';
import {
	calculateStorageCapacity,
	clampToCapacity,
	calculateWaste,
	calculateStorageUtilization,
	isNearCapacity,
	getStorageSummary,
	BASE_STORAGE_CAPACITY,
	type StorageCapacity,
} from '../../../src/game/storage-calculator.js';
import type { Structure } from '../../../src/game/consumption-calculator.js';
import type { Resources } from '../../../src/game/resource-calculator.js';

describe('Storage Calculator', () => {
	describe('calculateStorageCapacity', () => {
		it('should return base capacity with no structures', () => {
			const capacity = calculateStorageCapacity([]);
			expect(capacity).toEqual(BASE_STORAGE_CAPACITY);
		});

		it('should add general storage capacity modifiers to all resources', () => {
			const structures: Structure[] = [
				{
					name: 'Warehouse',
					modifiers: [{ name: 'Storage Capacity', value: 500 }],
				},
			];

			const capacity = calculateStorageCapacity(structures);

			expect(capacity.food).toBe(BASE_STORAGE_CAPACITY.food + 500);
			expect(capacity.water).toBe(BASE_STORAGE_CAPACITY.water + 500);
			expect(capacity.wood).toBe(BASE_STORAGE_CAPACITY.wood + 500);
			expect(capacity.stone).toBe(BASE_STORAGE_CAPACITY.stone + 500);
			expect(capacity.ore).toBe(BASE_STORAGE_CAPACITY.ore + 500);
		});

		it('should add resource-specific storage modifiers', () => {
			const structures: Structure[] = [
				{
					name: 'Granary',
					modifiers: [{ name: 'Food Storage', value: 300 }],
				},
				{
					name: 'Water Tower',
					modifiers: [{ name: 'Water Storage', value: 400 }],
				},
			];

			const capacity = calculateStorageCapacity(structures);

			expect(capacity.food).toBe(BASE_STORAGE_CAPACITY.food + 300);
			expect(capacity.water).toBe(BASE_STORAGE_CAPACITY.water + 400);
			expect(capacity.wood).toBe(BASE_STORAGE_CAPACITY.wood);
			expect(capacity.stone).toBe(BASE_STORAGE_CAPACITY.stone);
			expect(capacity.ore).toBe(BASE_STORAGE_CAPACITY.ore);
		});

		it('should add wood, stone, and ore specific storage modifiers', () => {
			const structures: Structure[] = [
				{
					name: 'Lumber Yard',
					modifiers: [{ name: 'Wood Storage', value: 250 }],
				},
				{
					name: 'Stone Vault',
					modifiers: [{ name: 'Stone Storage', value: 350 }],
				},
				{
					name: 'Ore Depot',
					modifiers: [{ name: 'Ore Storage', value: 150 }],
				},
			];

			const capacity = calculateStorageCapacity(structures);

			expect(capacity.wood).toBe(BASE_STORAGE_CAPACITY.wood + 250);
			expect(capacity.stone).toBe(BASE_STORAGE_CAPACITY.stone + 350);
			expect(capacity.ore).toBe(BASE_STORAGE_CAPACITY.ore + 150);
			expect(capacity.food).toBe(BASE_STORAGE_CAPACITY.food);
			expect(capacity.water).toBe(BASE_STORAGE_CAPACITY.water);
		});

		it('should stack multiple storage modifiers', () => {
			const structures: Structure[] = [
				{
					name: 'Warehouse 1',
					modifiers: [{ name: 'Storage Capacity', value: 100 }],
				},
				{
					name: 'Warehouse 2',
					modifiers: [{ name: 'Storage Capacity', value: 200 }],
				},
				{
					name: 'Granary',
					modifiers: [{ name: 'Food Storage', value: 500 }],
				},
			];

			const capacity = calculateStorageCapacity(structures);

			// Food: base + 100 + 200 + 500
			expect(capacity.food).toBe(BASE_STORAGE_CAPACITY.food + 800);
			// Others: base + 100 + 200
			expect(capacity.water).toBe(BASE_STORAGE_CAPACITY.water + 300);
		});
	});

	describe('clampToCapacity', () => {
		const capacity: StorageCapacity = {
			food: 100,
			water: 100,
			wood: 100,
			stone: 100,
			ore: 100,
		};

		it('should not modify resources within capacity', () => {
			const resources: Resources = {
				food: 50,
				water: 75,
				wood: 25,
				stone: 100,
				ore: 0,
			};

			const clamped = clampToCapacity(resources, capacity);
			expect(clamped).toEqual(resources);
		});

		it('should clamp resources exceeding capacity', () => {
			const resources: Resources = {
				food: 150,
				water: 200,
				wood: 100,
				stone: 50,
				ore: 25,
			};

			const clamped = clampToCapacity(resources, capacity);

			expect(clamped.food).toBe(100);
			expect(clamped.water).toBe(100);
			expect(clamped.wood).toBe(100);
			expect(clamped.stone).toBe(50);
			expect(clamped.ore).toBe(25);
		});

		it('should clamp negative resources to zero', () => {
			const resources: Resources = {
				food: -50,
				water: -100,
				wood: 50,
				stone: -25,
				ore: 0,
			};

			const clamped = clampToCapacity(resources, capacity);

			expect(clamped.food).toBe(0);
			expect(clamped.water).toBe(0);
			expect(clamped.wood).toBe(50);
			expect(clamped.stone).toBe(0);
			expect(clamped.ore).toBe(0);
		});

		it('should handle all resources at maximum capacity', () => {
			const resources: Resources = {
				food: 1000,
				water: 1000,
				wood: 1000,
				stone: 1000,
				ore: 1000,
			};

			const clamped = clampToCapacity(resources, capacity);
			expect(clamped).toEqual(capacity);
		});
	});

	describe('calculateWaste', () => {
		const capacity: StorageCapacity = {
			food: 100,
			water: 100,
			wood: 100,
			stone: 100,
			ore: 100,
		};

		it('should calculate zero waste when resources fit', () => {
			const current: Resources = {
				food: 50,
				water: 50,
				wood: 50,
				stone: 50,
				ore: 50,
			};

			const changes: Resources = {
				food: 30,
				water: 30,
				wood: 30,
				stone: 30,
				ore: 30,
			};

			const waste = calculateWaste(current, changes, capacity);

			expect(waste.food).toBe(0);
			expect(waste.water).toBe(0);
			expect(waste.wood).toBe(0);
			expect(waste.stone).toBe(0);
			expect(waste.ore).toBe(0);
		});

		it('should calculate waste when resources exceed capacity', () => {
			const current: Resources = {
				food: 80,
				water: 90,
				wood: 50,
				stone: 100,
				ore: 75,
			};

			const changes: Resources = {
				food: 30, // 80 + 30 = 110, waste 10
				water: 20, // 90 + 20 = 110, waste 10
				wood: 60, // 50 + 60 = 110, waste 10
				stone: 10, // 100 + 10 = 110, waste 10
				ore: 10, // 75 + 10 = 85, no waste
			};

			const waste = calculateWaste(current, changes, capacity);

			expect(waste.food).toBe(10);
			expect(waste.water).toBe(10);
			expect(waste.wood).toBe(10);
			expect(waste.stone).toBe(10);
			expect(waste.ore).toBe(0);
		});

		it('should handle negative changes (consumption)', () => {
			const current: Resources = {
				food: 80,
				water: 80,
				wood: 80,
				stone: 80,
				ore: 80,
			};

			const changes: Resources = {
				food: -30,
				water: -50,
				wood: 0,
				stone: 10,
				ore: -20,
			};

			const waste = calculateWaste(current, changes, capacity);

			// No waste when consuming
			expect(waste.food).toBe(0);
			expect(waste.water).toBe(0);
			expect(waste.wood).toBe(0);
			expect(waste.stone).toBe(0);
			expect(waste.ore).toBe(0);
		});

		it('should calculate waste when at capacity and producing', () => {
			const current: Resources = {
				food: 100,
				water: 100,
				wood: 100,
				stone: 100,
				ore: 100,
			};

			const changes: Resources = {
				food: 50,
				water: 1,
				wood: 0,
				stone: 0,
				ore: 0,
			};

			const waste = calculateWaste(current, changes, capacity);

			expect(waste.food).toBe(50);
			expect(waste.water).toBe(1);
			expect(waste.wood).toBe(0);
			expect(waste.stone).toBe(0);
			expect(waste.ore).toBe(0);
		});
	});

	describe('calculateStorageUtilization', () => {
		const capacity: StorageCapacity = {
			food: 1000,
			water: 2000,
			wood: 500,
			stone: 500,
			ore: 250,
		};

		it('should calculate 0% utilization for empty storage', () => {
			const resources: Resources = {
				food: 0,
				water: 0,
				wood: 0,
				stone: 0,
				ore: 0,
			};

			const utilization = calculateStorageUtilization(resources, capacity);

			expect(utilization.food).toBe(0);
			expect(utilization.water).toBe(0);
			expect(utilization.wood).toBe(0);
			expect(utilization.stone).toBe(0);
			expect(utilization.ore).toBe(0);
		});

		it('should calculate 100% utilization for full storage', () => {
			const utilization = calculateStorageUtilization(capacity, capacity);

			expect(utilization.food).toBe(100);
			expect(utilization.water).toBe(100);
			expect(utilization.wood).toBe(100);
			expect(utilization.stone).toBe(100);
			expect(utilization.ore).toBe(100);
		});

		it('should calculate 50% utilization for half-full storage', () => {
			const resources: Resources = {
				food: 500,
				water: 1000,
				wood: 250,
				stone: 250,
				ore: 125,
			};

			const utilization = calculateStorageUtilization(resources, capacity);

			expect(utilization.food).toBe(50);
			expect(utilization.water).toBe(50);
			expect(utilization.wood).toBe(50);
			expect(utilization.stone).toBe(50);
			expect(utilization.ore).toBe(50);
		});

		it('should calculate different utilizations for each resource', () => {
			const resources: Resources = {
				food: 900, // 90%
				water: 400, // 20%
				wood: 250, // 50%
				stone: 450, // 90%
				ore: 125, // 50%
			};

			const utilization = calculateStorageUtilization(resources, capacity);

			expect(utilization.food).toBe(90);
			expect(utilization.water).toBe(20);
			expect(utilization.wood).toBe(50);
			expect(utilization.stone).toBe(90);
			expect(utilization.ore).toBe(50);
		});
	});

	describe('isNearCapacity', () => {
		const capacity: StorageCapacity = {
			food: 1000,
			water: 1000,
			wood: 1000,
			stone: 1000,
			ore: 1000,
		};

		it('should return false when storage is low', () => {
			const resources: Resources = {
				food: 500,
				water: 500,
				wood: 500,
				stone: 500,
				ore: 500,
			};

			const near = isNearCapacity(resources, capacity);

			expect(near.food).toBe(false);
			expect(near.water).toBe(false);
			expect(near.wood).toBe(false);
			expect(near.stone).toBe(false);
			expect(near.ore).toBe(false);
		});

		it('should return true when storage is >90%', () => {
			const resources: Resources = {
				food: 950,
				water: 920,
				wood: 500,
				stone: 900,
				ore: 910,
			};

			const near = isNearCapacity(resources, capacity);

			expect(near.food).toBe(true);
			expect(near.water).toBe(true);
			expect(near.wood).toBe(false);
			expect(near.stone).toBe(false);
			expect(near.ore).toBe(true);
		});

		it('should return false at exactly 90%', () => {
			const resources: Resources = {
				food: 900,
				water: 900,
				wood: 900,
				stone: 900,
				ore: 900,
			};

			const near = isNearCapacity(resources, capacity);

			// Exactly 90% should not trigger warning
			expect(near.food).toBe(false);
			expect(near.water).toBe(false);
			expect(near.wood).toBe(false);
			expect(near.stone).toBe(false);
			expect(near.ore).toBe(false);
		});

		it('should return true at 100%', () => {
			const near = isNearCapacity(capacity, capacity);

			expect(near.food).toBe(true);
			expect(near.water).toBe(true);
			expect(near.wood).toBe(true);
			expect(near.stone).toBe(true);
			expect(near.ore).toBe(true);
		});
	});

	describe('getStorageSummary', () => {
		it('should return complete summary with base capacity', () => {
			const resources: Resources = {
				food: 500,
				water: 500,
				wood: 250,
				stone: 250,
				ore: 125,
			};

			const summary = getStorageSummary(resources, []);

			expect(summary.resources).toEqual(resources);
			expect(summary.capacity).toEqual(BASE_STORAGE_CAPACITY);
			expect(summary.utilization).toBeDefined();
			expect(summary.nearCapacity).toBeDefined();
			expect(summary.hasWarnings).toBe(false);
		});

		it('should include warnings when near capacity', () => {
			const structures: Structure[] = [
				{
					name: 'Warehouse',
					modifiers: [{ name: 'Storage Capacity', value: 0 }],
				},
			];

			const resources: Resources = {
				food: 950, // 95% of 1000
				water: 500,
				wood: 250,
				stone: 250,
				ore: 125,
			};

			const summary = getStorageSummary(resources, structures);

			expect(summary.nearCapacity.food).toBe(true);
			expect(summary.hasWarnings).toBe(true);
		});

		it('should calculate utilization correctly', () => {
			const resources: Resources = {
				food: 500,
				water: 1000,
				wood: 250,
				stone: 500,
				ore: 250,
			};

			const summary = getStorageSummary(resources, []);

			expect(summary.utilization.food).toBe(50);
			expect(summary.utilization.water).toBe(100);
			expect(summary.utilization.wood).toBe(25); // 250/1000 = 25%
			expect(summary.utilization.stone).toBe(50); // 500/1000 = 50%
			expect(summary.utilization.ore).toBe(25); // 250/1000 = 25%
		});
	});
});
