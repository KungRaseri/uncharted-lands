/**
 * Tests for Structure Validation System
 *
 * Tests the validation and resource deduction logic for structure building.
 * Ensures proper validation, atomic transactions, and error handling.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
	validateAndDeductResources,
	checkResourceAvailability,
} from '../../../src/game/structure-validation.js';
import type { ValidationResult, ResourceShortage } from '../../../src/game/structure-validation.js';
import type * as schema from '../../../src/db/schema.js';

// ✅ Phase 4: Mock Structure objects instead of hardcoded imports
const mockTentStructure: typeof schema.structures.$inferSelect = {
	id: 'struct-tent',
	name: 'TENT',
	displayName: 'Tent',
	description: 'Basic shelter',
	category: 'BUILDING',
	extractorType: null,
	buildingType: 'HOUSE', // TENT is a type of HOUSE in the enum
	maxLevel: 1,
	tier: 1,
	constructionTimeSeconds: 0,
	populationRequired: 0,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockFarmStructure: typeof schema.structures.$inferSelect = {
	id: 'struct-farm',
	name: 'FARM',
	displayName: 'Farm',
	description: 'Produces food',
	category: 'EXTRACTOR',
	extractorType: 'FARM',
	buildingType: null,
	maxLevel: 5,
	tier: 1,
	constructionTimeSeconds: 180,
	populationRequired: 2,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockWorkshopStructure: typeof schema.structures.$inferSelect = {
	id: 'struct-workshop',
	name: 'WORKSHOP',
	displayName: 'Workshop',
	description: 'Advanced crafting',
	category: 'BUILDING',
	extractorType: null,
	buildingType: 'WORKSHOP',
	maxLevel: 5,
	tier: 2,
	constructionTimeSeconds: 900,
	populationRequired: 2,
	createdAt: new Date(),
	updatedAt: new Date(),
};

const mockHouseStructure: typeof schema.structures.$inferSelect = {
	id: 'struct-house',
	name: 'HOUSE',
	displayName: 'House',
	description: 'Basic housing',
	category: 'BUILDING',
	extractorType: null,
	buildingType: 'HOUSE',
	maxLevel: 5,
	tier: 1,
	constructionTimeSeconds: 600,
	populationRequired: 0,
	createdAt: new Date(),
	updatedAt: new Date(),
};

// Mock requirement records (costs) for each structure
const mockTentRequirements = [{ resource: { name: 'WOOD' }, quantity: 10 }];

const mockFarmRequirements = [
	{ resource: { name: 'WOOD' }, quantity: 20 },
	{ resource: { name: 'STONE' }, quantity: 10 },
];

const mockWorkshopRequirements = [
	{ resource: { name: 'WOOD' }, quantity: 60 },
	{ resource: { name: 'STONE' }, quantity: 60 },
	{ resource: { name: 'ORE' }, quantity: 30 },
];

const mockHouseRequirements = [
	{ resource: { name: 'WOOD' }, quantity: 50 },
	{ resource: { name: 'STONE' }, quantity: 20 },
];

// ✅ Mock for testing unknown structure error case
const mockUnknownStructure: typeof schema.structures.$inferSelect = {
	id: 'struct-unknown',
	name: 'UNKNOWN_STRUCTURE',
	displayName: 'Unknown Structure',
	description: 'Invalid structure for testing',
	category: 'BUILDING',
	extractorType: null,
	buildingType: 'HOUSE',
	maxLevel: 1,
	tier: 1,
	constructionTimeSeconds: 0,
	populationRequired: 0,
	createdAt: new Date(),
	updatedAt: new Date(),
};

// Mock database and transaction
const mockWhere = vi.fn().mockResolvedValue(true);

const mockSet = vi.fn().mockReturnValue({
	where: mockWhere,
});

const mockUpdate = vi.fn().mockReturnValue({
	set: mockSet,
});

const mockTransaction = {
	query: {
		settlements: {
			findFirst: vi.fn(),
		},
		structureRequirements: {
			findMany: vi.fn(), // ✅ Phase 4: Added mock for database queries
		},
	},
	update: mockUpdate,
};

// ✅ Phase 4: Track which structure is being tested for mock requirements
// Since we can't reliably parse Drizzle's eq() SQL objects, we use a test-level variable
let currentTestStructure: typeof schema.structures.$inferSelect | null = null;

describe('Structure Validation System', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		currentTestStructure = null; // Reset for each test

		// ✅ Phase 4: Mock requirements lookup based on currentTestStructure
		// The validation function receives a structure object, but the mock doesn't have access to it.
		// We work around this by having each test set currentTestStructure before calling the function.
		mockTransaction.query.structureRequirements.findMany.mockImplementation(async () => {
			if (!currentTestStructure) {
				console.log(
					'[Mock Debug] currentTestStructure not set - test must set it before calling validation'
				);
				return [];
			}

			// Return requirements based on the current structure being tested
			switch (currentTestStructure.id) {
				case 'struct-tent':
					return mockTentRequirements;
				case 'struct-farm':
					return mockFarmRequirements;
				case 'struct-workshop':
					return mockWorkshopRequirements;
				case 'struct-house':
					return mockHouseRequirements;
				case 'struct-unknown':
					return [];
				default:
					console.log('[Mock Debug] Unknown structure ID:', currentTestStructure.id);
					return [];
			}
		});
	});

	describe('checkResourceAvailability', () => {
		describe('Success Cases', () => {
			it('should validate TENT (10 wood) with sufficient resources', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 50, // Sufficient for TENT (needs 10)
						stone: 30,
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);

				currentTestStructure = mockTentStructure; // Set structure for mock        currentTestStructure = mockTentStructure; // Set structure for mock`n
				const result = await checkResourceAvailability(
					mockTransaction as any,
					'settlement-1',
					mockTentStructure
				);

				expect(result.success).toBe(true);
				expect(result.shortages).toBeUndefined();
			});

			it('should validate FARM (20 wood, 10 stone) with sufficient resources', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 50, // Sufficient for FARM (needs 20)
						stone: 30, // Sufficient for FARM (needs 10)
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockFarmStructure; // Set structure for mock`n

				const result = await checkResourceAvailability(
					mockTransaction as any,
					'settlement-1',
					mockFarmStructure
				);

				expect(result.success).toBe(true);
				expect(result.shortages).toBeUndefined();
			});

			it('should validate WORKSHOP (60 wood, 60 stone, 30 ore) with exact resources', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 60, // Exactly enough
						stone: 60, // Exactly enough
						ore: 30, // Exactly enough
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockWorkshopStructure; // Set structure for mock`n

				const result = await checkResourceAvailability(
					mockTransaction as any,
					'settlement-1',
					mockWorkshopStructure
				);

				expect(result.success).toBe(true);
				expect(result.shortages).toBeUndefined();
			});
		});

		describe('Failure Cases - Single Resource Shortage', () => {
			it('should fail with insufficient wood for TENT', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 5, // Insufficient for TENT (needs 10)
						stone: 30,
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockTentStructure; // Set structure for mock`n

				const result = await checkResourceAvailability(
					mockTransaction as any,
					'settlement-1',
					mockTentStructure
				);

				expect(result.success).toBe(false);
				expect(result.shortages).toHaveLength(1);
				expect(result.shortages!).toBeDefined();
				expect(result.shortages![0]).toEqual({
					type: 'wood',
					required: 10,
					available: 5,
					missing: 5,
				});
			});

			it('should fail with insufficient stone for FARM', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 50, // Sufficient
						stone: 5, // Insufficient (needs 10)
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockFarmStructure; // Set structure for mock`n

				const result = await checkResourceAvailability(
					mockTransaction as any,
					'settlement-1',
					mockFarmStructure
				);

				expect(result.success).toBe(false);
				expect(result.shortages).toHaveLength(1);
				expect(result.shortages!).toBeDefined();
				expect(result.shortages![0]).toEqual({
					type: 'stone',
					required: 10,
					available: 5,
					missing: 5,
				});
			});

			it('should fail with zero resources for FARM', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 0, // None available
						stone: 0,
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockFarmStructure; // Set structure for mock`n

				const result = await checkResourceAvailability(
					mockTransaction as any,
					'settlement-1',
					mockFarmStructure
				);

				expect(result.success).toBe(false);
				expect(result.shortages).toHaveLength(2);
				expect(result.shortages).toEqual(
					expect.arrayContaining([
						{ type: 'wood', required: 20, available: 0, missing: 20 },
						{ type: 'stone', required: 10, available: 0, missing: 10 },
					])
				);
			});
		});

		describe('Failure Cases - Multiple Resource Shortages', () => {
			it('should report all shortages for WORKSHOP when multiple resources insufficient', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 20, // Insufficient (needs 60)
						stone: 30, // Insufficient (needs 60)
						ore: 10, // Insufficient (needs 30)
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockWorkshopStructure; // Set structure for mock`n

				const result = await checkResourceAvailability(
					mockTransaction as any,
					'settlement-1',
					mockWorkshopStructure
				);

				expect(result.success).toBe(false);
				expect(result.shortages).toHaveLength(3);
				expect(result.shortages).toEqual(
					expect.arrayContaining([
						{ type: 'wood', required: 60, available: 20, missing: 40 },
						{ type: 'stone', required: 60, available: 30, missing: 30 },
						{ type: 'ore', required: 30, available: 10, missing: 20 },
					])
				);
			});

			it('should report wood and stone shortages for HOUSE', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 10, // Insufficient (needs 50)
						stone: 5, // Insufficient (needs 20)
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockHouseStructure; // Set structure for mock`n

				const result = await checkResourceAvailability(
					mockTransaction as any,
					'settlement-1',
					mockHouseStructure
				);

				expect(result.success).toBe(false);
				expect(result.shortages).toHaveLength(2);
				expect(result.shortages).toEqual(
					expect.arrayContaining([
						{ type: 'wood', required: 50, available: 10, missing: 40 },
						{ type: 'stone', required: 20, available: 5, missing: 15 },
					])
				);
			});
		});

		describe('Error Cases', () => {
			it('should throw error when settlement not found', async () => {
				mockTransaction.query.settlements.findFirst.mockResolvedValue(null);

				await expect(
					checkResourceAvailability(
						mockTransaction as any,
						'nonexistent-settlement',
						mockTentStructure
					)
				).rejects.toThrow('Settlement not found');
			});

			it('should throw error when settlement has no storage', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: null,
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);

				await expect(
					checkResourceAvailability(mockTransaction as any, 'settlement-1', mockTentStructure)
				).rejects.toThrow('Settlement storage not found');
			});

			it('should succeed for structure with no requirements (zero cost)', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 50,
						stone: 30,
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);

				currentTestStructure = mockUnknownStructure; // Set structure for mock
				const result = await checkResourceAvailability(
					mockTransaction as any,
					'settlement-1',
					mockUnknownStructure
				);

				// ✅ Phase 4: Structures with no requirements in database are valid (zero cost)
				// This is different from the old hardcoded approach
				expect(result.success).toBe(true);
				expect(result.shortages).toBeUndefined();
			});
		});
	});

	describe('validateAndDeductResources', () => {
		describe('Success Cases with Resource Deduction', () => {
			it('should validate and deduct resources for TENT', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 50,
						stone: 30,
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockTentStructure; // Set structure for mock`n

				const result = await validateAndDeductResources(
					mockTransaction as any,
					'settlement-1',
					mockTentStructure
				);

				expect(result.success).toBe(true);
				expect(result.shortages).toEqual([]);
				expect(result.deductedResources).toEqual({
					wood: 10,
					stone: 0,
					ore: 0,
				});

				// Verify update was called with correct Drizzle ORM chain
				expect(mockUpdate).toHaveBeenCalledTimes(1);
				expect(mockSet).toHaveBeenCalledWith({
					wood: 40, // 50 - 10
					stone: 30,
					ore: 0,
				});
				expect(mockWhere).toHaveBeenCalledTimes(1);
			});

			it('should validate and deduct resources for FARM', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 50,
						stone: 30,
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockFarmStructure; // Set structure for mock`n

				const result = await validateAndDeductResources(
					mockTransaction as any,
					'settlement-1',
					mockFarmStructure
				);

				expect(result.success).toBe(true);
				expect(result.deductedResources).toEqual({
					wood: 20,
					stone: 10,
					ore: 0,
				});

				// Verify update called with correct deductions using Drizzle ORM chain
				expect(mockSet).toHaveBeenCalledWith({
					wood: 30, // 50 - 20
					stone: 20, // 30 - 10
					ore: 0,
				});
			});

			it('should validate and deduct all three resources for WORKSHOP', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 100,
						water: 200,
						wood: 100,
						stone: 100,
						ore: 50,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockWorkshopStructure; // Set structure for mock`n

				const result = await validateAndDeductResources(
					mockTransaction as any,
					'settlement-1',
					mockWorkshopStructure
				);

				expect(result.success).toBe(true);
				expect(result.deductedResources).toEqual({
					wood: 60,
					stone: 60,
					ore: 30,
				});

				// Verify update called with correct deductions using Drizzle ORM chain
				expect(mockSet).toHaveBeenCalledWith({
					wood: 40, // 100 - 60
					stone: 40, // 100 - 60
					ore: 20, // 50 - 30
				});
			});
		});

		describe('Failure Cases - No Deduction on Failure', () => {
			it('should NOT deduct resources when validation fails', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 5, // Insufficient
						stone: 30,
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockTentStructure; // Set structure for mock`n

				const result = await validateAndDeductResources(
					mockTransaction as any,
					'settlement-1',
					mockTentStructure
				);

				expect(result.success).toBe(false);
				expect(result.shortages).toHaveLength(1);
				expect(result.deductedResources).toEqual({
					wood: 0,
					stone: 0,
					ore: 0,
				});

				// Verify update was NEVER called
				expect(mockTransaction.update).not.toHaveBeenCalled();
			});

			it('should NOT deduct resources when multiple resources insufficient', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 10, // Insufficient
						stone: 5, // Insufficient
						ore: 0,
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockHouseStructure; // Set structure for mock`n

				const result = await validateAndDeductResources(
					mockTransaction as any,
					'settlement-1',
					mockHouseStructure
				);

				expect(result.success).toBe(false);
				expect(result.shortages).toHaveLength(2);

				// Verify update was NEVER called (atomic operation)
				expect(mockTransaction.update).not.toHaveBeenCalled();
			});
		});

		describe('Atomicity Tests', () => {
			it('should be atomic - either all resources deducted or none', async () => {
				const mockSettlement = {
					id: 'settlement-1',
					storage: {
						id: 'storage-1',
						food: 50,
						water: 100,
						wood: 60, // Sufficient
						stone: 60, // Sufficient
						ore: 10, // Insufficient for WORKSHOP (needs 30)
						capacity: 5000,
					},
				};

				mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
				currentTestStructure = mockWorkshopStructure; // Set structure for mock`n

				const result = await validateAndDeductResources(
					mockTransaction as any,
					'settlement-1',
					mockWorkshopStructure
				);

				expect(result.success).toBe(false);
				expect(result.shortages).toHaveLength(1);
				expect(result.shortages!).toBeDefined();
				expect(result.shortages![0].type).toBe('ore');

				// CRITICAL: No resources should be deducted even though wood and stone were sufficient
				expect(mockTransaction.update).not.toHaveBeenCalled();
				expect(result.deductedResources).toEqual({
					wood: 0,
					stone: 0,
					ore: 0,
				});
			});
		});
	});

	describe('Edge Cases', () => {
		it('should handle exact resource match (no surplus)', async () => {
			const mockSettlement = {
				id: 'settlement-1',
				storage: {
					id: 'storage-1',
					food: 50,
					water: 100,
					wood: 20, // Exactly enough for FARM
					stone: 10, // Exactly enough for FARM
					ore: 0,
					capacity: 5000,
				},
			};

			mockTransaction.query.settlements.findFirst.mockResolvedValue(mockSettlement);
			currentTestStructure = mockFarmStructure; // Set structure for mock`n

			const result = await validateAndDeductResources(
				mockTransaction as any,
				'settlement-1',
				mockFarmStructure
			);

			expect(result.success).toBe(true);
			expect(result.deductedResources).toEqual({
				wood: 20,
				stone: 10,
				ore: 0,
			});

			// Verify resources fully depleted using Drizzle ORM chain
			expect(mockSet).toHaveBeenCalledWith({
				wood: 0,
				stone: 0,
				ore: 0,
			});
		});
	});
});
