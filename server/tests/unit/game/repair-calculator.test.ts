/**
 * Unit tests for Repair Cost Calculator
 */

import { describe, test, expect } from 'vitest';
import {
	calculateRepairCost,
	calculateFullRepairCost,
	canAffordRepair,
	getRepairPriority,
	DISASTER_REPAIR_MULTIPLIERS,
	EMERGENCY_REPAIR_CONFIG,
} from '../../../src/game/repair-calculator.js';
import * as schema from '../../../src/db/schema.js';

// ✅ Phase 4: Mock structures with requirements for testing
// These match the structure-cost.ts hardcoded values for backward compatibility

const mockHospitalStructure: typeof schema.structures.$inferSelect & {
	requirements: Array<{
		resource: { name: string };
		quantity: number;
	}>;
} = {
	id: 'struct-hospital',
	name: 'HOSPITAL',
	category: 'BUILDING',
	extractorType: null,
	buildingType: 'HOUSE', // Using HOUSE as placeholder (HOSPITAL not in enum)
	description: 'Hospital structure',
	maxLevel: 10,
	tier: 1,
	constructionTimeSeconds: 1000,
	populationRequired: 0,
	displayName: 'Hospital',
	createdAt: new Date(),
	updatedAt: new Date(),
	requirements: [
		{ resource: { name: 'WOOD' }, quantity: 500 },
		{ resource: { name: 'STONE' }, quantity: 300 },
		{ resource: { name: 'ORE' }, quantity: 100 },
	],
};

const mockHouseStructure: typeof schema.structures.$inferSelect & {
	requirements: Array<{
		resource: { name: string };
		quantity: number;
	}>;
} = {
	id: 'struct-house',
	name: 'HOUSE',
	category: 'BUILDING',
	extractorType: null,
	buildingType: 'HOUSE',
	description: 'House structure',
	maxLevel: 10,
	tier: 1,
	constructionTimeSeconds: 500,
	populationRequired: 0,
	displayName: 'House',
	createdAt: new Date(),
	updatedAt: new Date(),
	requirements: [
		{ resource: { name: 'WOOD' }, quantity: 50 },
		{ resource: { name: 'STONE' }, quantity: 20 },
	],
};

const mockTentStructure: typeof schema.structures.$inferSelect & {
	requirements: Array<{
		resource: { name: string };
		quantity: number;
	}>;
} = {
	id: 'struct-tent',
	name: 'TENT',
	category: 'BUILDING',
	extractorType: null,
	buildingType: 'HOUSE', // Using HOUSE as placeholder (TENT not in enum)
	description: 'Tent structure',
	maxLevel: 10,
	tier: 1,
	constructionTimeSeconds: 100,
	populationRequired: 0,
	displayName: 'Tent',
	createdAt: new Date(),
	updatedAt: new Date(),
	requirements: [{ resource: { name: 'WOOD' }, quantity: 10 }],
};

const mockFarmStructure: typeof schema.structures.$inferSelect & {
	requirements: Array<{
		resource: { name: string };
		quantity: number;
	}>;
} = {
	id: 'struct-farm',
	name: 'FARM',
	category: 'EXTRACTOR',
	extractorType: 'FARM',
	buildingType: null,
	description: 'Farm structure',
	maxLevel: 10,
	tier: 1,
	constructionTimeSeconds: 800,
	populationRequired: 0,
	displayName: 'Farm',
	createdAt: new Date(),
	updatedAt: new Date(),
	requirements: [
		{ resource: { name: 'WOOD' }, quantity: 100 },
		{ resource: { name: 'STONE' }, quantity: 50 },
	],
};

describe('Repair Calculator', () => {
	describe('calculateRepairCost', () => {
		test('calculates basic repair cost correctly', () => {
			// Hospital: { wood: 500, stone: 300, ore: 100 }
			// Earthquake damage (0.25 multiplier): 30% health lost
			// Cost = { wood: 500, stone: 300, ore: 100 } × 0.25 × 3
			//      = { wood: 375, stone: 225, ore: 75 }
			const result = calculateRepairCost({
				structure: mockHospitalStructure,
				currentHealth: 70,
				targetHealth: 100,
				disasterType: 'EARTHQUAKE',
			});

			expect(result.healthRestored).toBe(30);
			expect(result.cost.wood).toBe(375);
			expect(result.cost.stone).toBe(225);
			expect(result.cost.ore).toBe(75);
			expect(result.emergencyDiscountApplied).toBe(false);
			expect(result.costMultiplier).toBe(0.25);
		});

		test('applies emergency discount within 48 hours', () => {
			const damagedAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

			const result = calculateRepairCost({
				structure: mockHospitalStructure,
				currentHealth: 70,
				targetHealth: 100,
				disasterType: 'EARTHQUAKE',
				damagedAt,
			});

			// Normal cost: { wood: 375, stone: 225, ore: 75 }
			// Emergency (50% off): { wood: 188, stone: 113, ore: 38 }
			expect(result.emergencyDiscountApplied).toBe(true);
			expect(result.cost.wood).toBe(188);
			expect(result.cost.stone).toBe(113);
			expect(result.cost.ore).toBe(38);
			expect(result.emergencyDiscountTimeRemaining).toBeGreaterThan(0);
		});

		test('does not apply emergency discount after 48 hours', () => {
			const damagedAt = new Date(Date.now() - 49 * 60 * 60 * 1000); // 49 hours ago

			const result = calculateRepairCost({
				structure: mockHospitalStructure,
				currentHealth: 70,
				targetHealth: 100,
				disasterType: 'EARTHQUAKE',
				damagedAt,
			});

			expect(result.emergencyDiscountApplied).toBe(false);
			expect(result.emergencyDiscountTimeRemaining).toBe(0);
			expect(result.cost.wood).toBe(375); // Full price
		});

		test('handles different disaster types with correct multipliers', () => {
			// Wildfire: 0.15 multiplier (easiest to repair)
			const wildfireResult = calculateRepairCost({
				structure: mockHouseStructure,
				currentHealth: 80,
				targetHealth: 100,
				disasterType: 'WILDFIRE',
			});

			// House: { wood: 50, stone: 20 }
			// 20% damage × 0.15 multiplier × 2 (20/10)
			expect(wildfireResult.cost.wood).toBe(15); // 50 × 0.15 × 2
			expect(wildfireResult.cost.stone).toBe(6); // 20 × 0.15 × 2

			// Volcano: 0.4 multiplier (hard to repair)
			const volcanoResult = calculateRepairCost({
				structure: mockHouseStructure,
				currentHealth: 80,
				targetHealth: 100,
				disasterType: 'VOLCANO',
			});

			expect(volcanoResult.cost.wood).toBe(40); // 50 × 0.4 × 2
			expect(volcanoResult.cost.stone).toBe(16); // 20 × 0.4 × 2
		});

		test('throws error for invalid health values', () => {
			expect(() => {
				calculateRepairCost({
					structure: mockHouseStructure,
					currentHealth: 110, // Invalid
					targetHealth: 100,
					disasterType: 'EARTHQUAKE',
				});
			}).toThrow('Invalid current health');

			expect(() => {
				calculateRepairCost({
					structure: mockHouseStructure,
					currentHealth: 50,
					targetHealth: 40, // Target less than current
					disasterType: 'EARTHQUAKE',
				});
			}).toThrow('Target health');
		});
	});

	describe('calculateFullRepairCost', () => {
		test('repairs to 100% health', () => {
			const result = calculateFullRepairCost(mockFarmStructure, 45, 'FLOOD');

			expect(result.healthRestored).toBe(55);
			expect(result.cost).toBeDefined();
		});
	});

	describe('canAffordRepair', () => {
		test('returns true when player has sufficient resources', () => {
			const repairCost = calculateRepairCost({
				structure: mockTentStructure,
				currentHealth: 50,
				targetHealth: 100,
				disasterType: 'WILDFIRE',
			});

			const result = canAffordRepair(repairCost, {
				food: 1000,
				water: 1000,
				wood: 1000,
				stone: 1000,
				ore: 1000,
			});

			expect(result.canAfford).toBe(true);
			expect(Object.keys(result.missing).length).toBe(0);
		});

		test('returns false and shows missing resources when insufficient', () => {
			const repairCost = calculateRepairCost({
				structure: mockHospitalStructure,
				currentHealth: 50,
				targetHealth: 100,
				disasterType: 'EARTHQUAKE',
			});

			const result = canAffordRepair(repairCost, {
				food: 0,
				water: 0,
				wood: 100, // Need 625
				stone: 50, // Need 375
				ore: 10, // Need 125
			});

			expect(result.canAfford).toBe(false);
			expect(result.missing.wood).toBe(525); // 625 - 100
			expect(result.missing.stone).toBe(325); // 375 - 50
			expect(result.missing.ore).toBe(115); // 125 - 10
		});
	});

	describe('getRepairPriority', () => {
		test('returns correct priority levels', () => {
			expect(getRepairPriority(0)).toEqual({ priority: 1, label: 'DESTROYED', urgent: true });
			expect(getRepairPriority(15)).toEqual({ priority: 1, label: 'CRITICAL', urgent: true });
			expect(getRepairPriority(30)).toEqual({ priority: 2, label: 'POOR', urgent: true });
			expect(getRepairPriority(50)).toEqual({ priority: 3, label: 'DAMAGED', urgent: false });
			expect(getRepairPriority(70)).toEqual({ priority: 4, label: 'GOOD', urgent: false });
			expect(getRepairPriority(90)).toEqual({ priority: 5, label: 'EXCELLENT', urgent: false });
		});
	});

	describe('DISASTER_REPAIR_MULTIPLIERS', () => {
		test('all disaster types have multipliers defined', () => {
			const disasterTypes = [
				'DROUGHT',
				'FLOOD',
				'BLIZZARD',
				'HURRICANE',
				'TORNADO',
				'SANDSTORM',
				'HEATWAVE',
				'EARTHQUAKE',
				'VOLCANO',
				'LANDSLIDE',
				'AVALANCHE',
				'WILDFIRE',
				'INSECT_PLAGUE',
				'BLIGHT',
				'LOCUST_SWARM',
			];

			for (const type of disasterTypes) {
				expect(
					DISASTER_REPAIR_MULTIPLIERS[type as keyof typeof DISASTER_REPAIR_MULTIPLIERS]
				).toBeDefined();
			}
		});

		test('multipliers are in expected ranges', () => {
			const multipliers = Object.values(DISASTER_REPAIR_MULTIPLIERS);

			for (const multiplier of multipliers) {
				expect(multiplier).toBeGreaterThanOrEqual(0.15);
				expect(multiplier).toBeLessThanOrEqual(0.5);
			}
		});
	});

	describe('EMERGENCY_REPAIR_CONFIG', () => {
		test('discount window is 48 hours', () => {
			expect(EMERGENCY_REPAIR_CONFIG.DISCOUNT_WINDOW_MS).toBe(48 * 60 * 60 * 1000);
		});

		test('discount percentage is 50%', () => {
			expect(EMERGENCY_REPAIR_CONFIG.DISCOUNT_PERCENTAGE).toBe(0.5);
		});
	});
});
