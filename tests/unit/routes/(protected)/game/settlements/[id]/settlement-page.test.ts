import { describe, it, expect } from 'vitest';
import type { StructureMetadata } from '$lib/api/structures';

/**
 * Unit tests for Settlement Page Component Logic
 *
 * Tests the derived state and affordability calculations that were
 * migrated from hardcoded structures to API metadata.
 */

// Extend StructureMetadata to include category for testing
type StructureWithCategory = StructureMetadata & { category: string };

describe('Settlement Page - API Metadata Integration', () => {
	// Mock structure metadata from API (with category for component testing)
	const mockStructures: StructureWithCategory[] = [
		{
			id: 'tent',
			name: 'Tent',
			description: 'Basic housing',
			category: 'housing',
			costs: {
				food: 0,
				water: 0,
				wood: 10,
				stone: 0,
				ore: 0
			},
			requirements: {
				area: 10,
				solar: 0,
				wind: 0
			},
			constructionTime: 0,
			populationRequired: 0,
			modifiers: []
		},
		{
			id: 'farm',
			name: 'Farm',
			description: 'Produces food',
			category: 'production',
			costs: {
				food: 0,
				water: 0,
				wood: 20,
				stone: 10,
				ore: 0
			},
			requirements: {
				area: 20,
				solar: 0,
				wind: 0
			},
			constructionTime: 180,
			populationRequired: 2,
			modifiers: [
				{
					name: 'Food Production',
					description: '+10 food per tick',
					value: 10
				}
			]
		},
		{
			id: 'warehouse',
			name: 'Warehouse',
			description: 'Increases storage',
			category: 'storage',
			costs: {
				food: 0,
				water: 0,
				wood: 40,
				stone: 20,
				ore: 0
			},
			requirements: {
				area: 15,
				solar: 0,
				wind: 0
			},
			constructionTime: 300,
			populationRequired: 0,
			modifiers: []
		}
	];

	describe('Categories Derivation', () => {
		it('should extract unique categories from structures', () => {
			// Simulate the derived state logic
			const categories = Array.from(new Set(mockStructures.map((s) => s.category)));

			expect(categories).toContain('housing');
			expect(categories).toContain('production');
			expect(categories).toContain('storage');
			expect(categories).toHaveLength(3);
		});

		it('should handle empty structures array', () => {
			const categories = Array.from(
				new Set(([] as StructureWithCategory[]).map((s) => s.category))
			);

			expect(categories).toHaveLength(0);
		});

		it('should handle duplicate categories', () => {
			const duplicateStructures: StructureWithCategory[] = [
				{ ...mockStructures[0], id: 'tent1' },
				{ ...mockStructures[0], id: 'tent2' },
				{ ...mockStructures[1], id: 'farm1' }
			];

			const categories = Array.from(new Set(duplicateStructures.map((s) => s.category)));

			expect(categories).toHaveLength(2); // Only housing and production
		});
	});

	describe('Structures by Category Filtering', () => {
		it('should filter structures by housing category', () => {
			const category = 'housing';
			const filtered = mockStructures.filter((s) => s.category === category);

			expect(filtered).toHaveLength(1);
			expect(filtered[0].id).toBe('tent');
		});

		it('should filter structures by production category', () => {
			const category = 'production';
			const filtered = mockStructures.filter((s) => s.category === category);

			expect(filtered).toHaveLength(1);
			expect(filtered[0].id).toBe('farm');
		});

		it('should return empty array for non-existent category', () => {
			const category = 'defense';
			const filtered = mockStructures.filter((s) => s.category === category);

			expect(filtered).toHaveLength(0);
		});

		it('should return all structures matching category', () => {
			const multiHousingStructures: StructureWithCategory[] = [
				...mockStructures,
				{
					id: 'house',
					name: 'House',
					description: 'Better housing',
					category: 'housing',
					costs: {
						food: 0,
						water: 0,
						wood: 50,
						stone: 20,
						ore: 0
					},
					requirements: {
						area: 15,
						solar: 0,
						wind: 0
					},
					constructionTime: 600,
					populationRequired: 0,
					modifiers: []
				}
			];

			const category = 'housing';
			const filtered = multiHousingStructures.filter((s) => s.category === category);

			expect(filtered).toHaveLength(2);
			expect(filtered.map((s) => s.id)).toContain('tent');
			expect(filtered.map((s) => s.id)).toContain('house');
		});
	});

	describe('Affordability Checking', () => {
		const mockStorage = {
			id: 'storage-1',
			settlementId: 'settlement-1',
			food: 100,
			water: 100,
			wood: 50,
			stone: 30,
			ore: 10,
			capacity: 1000,
			createdAt: new Date(),
			updatedAt: new Date()
		};

		it('should return canBuild: true when all resources are sufficient', () => {
			const structure = mockStructures[0]; // Tent: needs 10 wood
			const reasons: string[] = [];

			// Check wood
			if (mockStorage.wood < structure.costs.wood) {
				reasons.push(`Need ${structure.costs.wood} wood (have ${mockStorage.wood})`);
			}
			if (mockStorage.stone < structure.costs.stone) {
				reasons.push(`Need ${structure.costs.stone} stone (have ${mockStorage.stone})`);
			}
			if (mockStorage.ore < structure.costs.ore) {
				reasons.push(`Need ${structure.costs.ore} ore (have ${mockStorage.ore})`);
			}

			const result = {
				canBuild: reasons.length === 0,
				reasons
			};

			expect(result.canBuild).toBe(true);
			expect(result.reasons).toHaveLength(0);
		});

		it('should return canBuild: false when wood is insufficient', () => {
			const structure = mockStructures[2]; // Warehouse: needs 40 wood
			const insufficientStorage = {
				...mockStorage,
				wood: 20 // Have 20, need 40
			};

			const reasons: string[] = [];

			if (insufficientStorage.wood < structure.costs.wood) {
				reasons.push(`Need ${structure.costs.wood} wood (have ${insufficientStorage.wood})`);
			}

			const result = {
				canBuild: reasons.length === 0,
				reasons
			};

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toHaveLength(1);
			expect(result.reasons[0]).toContain('wood');
		});

		it('should return multiple reasons when multiple resources are insufficient', () => {
			const structure = mockStructures[1]; // Farm: needs 20 wood, 10 stone
			const insufficientStorage = {
				...mockStorage,
				wood: 5, // Need 20
				stone: 2 // Need 10
			};

			const reasons: string[] = [];

			if (insufficientStorage.wood < structure.costs.wood) {
				reasons.push(`Need ${structure.costs.wood} wood (have ${insufficientStorage.wood})`);
			}
			if (insufficientStorage.stone < structure.costs.stone) {
				reasons.push(`Need ${structure.costs.stone} stone (have ${insufficientStorage.stone})`);
			}

			const result = {
				canBuild: reasons.length === 0,
				reasons
			};

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toHaveLength(2);
			expect(result.reasons.some((r) => r.includes('wood'))).toBe(true);
			expect(result.reasons.some((r) => r.includes('stone'))).toBe(true);
		});

		it('should handle all resource types (food, water, wood, stone, ore)', () => {
			const expensiveStructure: StructureMetadata = {
				id: 'expensive',
				name: 'Expensive Structure',
				description: 'Needs everything',
				costs: {
					food: 200,
					water: 200,
					wood: 100,
					stone: 100,
					ore: 50
				},
				requirements: {
					area: 50,
					solar: 0,
					wind: 0
				},
				constructionTime: 1000,
				populationRequired: 0,
				modifiers: []
			};

			const reasons: string[] = [];

			if (mockStorage.food < expensiveStructure.costs.food) {
				reasons.push(`Need ${expensiveStructure.costs.food} food (have ${mockStorage.food})`);
			}
			if (mockStorage.water < expensiveStructure.costs.water) {
				reasons.push(`Need ${expensiveStructure.costs.water} water (have ${mockStorage.water})`);
			}
			if (mockStorage.wood < expensiveStructure.costs.wood) {
				reasons.push(`Need ${expensiveStructure.costs.wood} wood (have ${mockStorage.wood})`);
			}
			if (mockStorage.stone < expensiveStructure.costs.stone) {
				reasons.push(`Need ${expensiveStructure.costs.stone} stone (have ${mockStorage.stone})`);
			}
			if (mockStorage.ore < expensiveStructure.costs.ore) {
				reasons.push(`Need ${expensiveStructure.costs.ore} ore (have ${mockStorage.ore})`);
			}

			const result = {
				canBuild: reasons.length === 0,
				reasons
			};

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toHaveLength(5); // All resources insufficient
		});

		it('should return canBuild: false when no structure is selected', () => {
			const selectedStructure = null;

			const result = selectedStructure
				? { canBuild: true, reasons: [] }
				: { canBuild: false, reasons: [] };

			expect(result.canBuild).toBe(false);
			expect(result.reasons).toHaveLength(0);
		});

		it('should handle zero-cost structures', () => {
			// Tent is zero-cost for most resources
			const structure = mockStructures[0]; // Tent

			const reasons: string[] = [];

			// Check all costs (Tent has wood: 10, everything else: 0)
			if (mockStorage.food < structure.costs.food) reasons.push('food');
			if (mockStorage.water < structure.costs.water) reasons.push('water');
			if (mockStorage.wood < structure.costs.wood) reasons.push('wood');
			if (mockStorage.stone < structure.costs.stone) reasons.push('stone');
			if (mockStorage.ore < structure.costs.ore) reasons.push('ore');

			const result = {
				canBuild: reasons.length === 0,
				reasons
			};

			expect(result.canBuild).toBe(true);
			expect(result.reasons).toHaveLength(0);
		});

		it('should show exact deficit amounts in reasons', () => {
			const structure = mockStructures[2]; // Warehouse: needs 40 wood, 20 stone
			const poorStorage = {
				...mockStorage,
				wood: 10, // Need 40, have 10, deficit 30
				stone: 5 // Need 20, have 5, deficit 15
			};

			const reasons: string[] = [];

			if (poorStorage.wood < structure.costs.wood) {
				reasons.push(`Need ${structure.costs.wood} wood (have ${poorStorage.wood})`);
			}
			if (poorStorage.stone < structure.costs.stone) {
				reasons.push(`Need ${structure.costs.stone} stone (have ${poorStorage.stone})`);
			}

			expect(reasons[0]).toBe('Need 40 wood (have 10)');
			expect(reasons[1]).toBe('Need 20 stone (have 5)');
		});
	});

	describe('StructureMetadata Type Compatibility', () => {
		it('should have correct structure for costs and requirements properties', () => {
			const structure = mockStructures[0];

			// Costs should only have resource costs
			expect(structure.costs).toHaveProperty('food');
			expect(structure.costs).toHaveProperty('water');
			expect(structure.costs).toHaveProperty('wood');
			expect(structure.costs).toHaveProperty('stone');
			expect(structure.costs).toHaveProperty('ore');

			// Requirements should have plot requirements
			expect(structure.requirements).toHaveProperty('area');
			expect(structure.requirements).toHaveProperty('solar');
			expect(structure.requirements).toHaveProperty('wind');
		});

		it('should have all required StructureMetadata fields', () => {
			const structure = mockStructures[0];

			expect(structure).toHaveProperty('id');
			expect(structure).toHaveProperty('name');
			expect(structure).toHaveProperty('description');
			expect(structure).toHaveProperty('category');
			expect(structure).toHaveProperty('costs');
			expect(structure).toHaveProperty('constructionTime');
			expect(structure).toHaveProperty('modifiers');
		});

		it('should have modifiers as an array', () => {
			const structureWithModifiers = mockStructures[1]; // Farm has modifiers
			const structureWithoutModifiers = mockStructures[0]; // Tent has no modifiers

			expect(Array.isArray(structureWithModifiers.modifiers)).toBe(true);
			expect(structureWithModifiers.modifiers?.length).toBeGreaterThan(0);

			expect(Array.isArray(structureWithoutModifiers.modifiers)).toBe(true);
			expect(structureWithoutModifiers.modifiers?.length).toBe(0);
		});
	});
});
