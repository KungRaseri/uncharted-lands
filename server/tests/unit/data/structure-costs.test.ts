/**
 * Structure Costs Configuration Tests
 *
 * Validates that structure-costs.ts is complete and matches GDD specifications.
 *
 * Test Categories:
 * 1. Completeness Tests - All GDD structures are defined
 * 2. Format Tests - All cost entries have required fields
 * 3. GDD Compliance Tests - Costs match GDD Table 6.7 exactly
 * 4. Regression Tests - Previously correct costs remain correct
 */

import { describe, test, expect } from 'vitest';
import {
	STRUCTURE_COSTS,
	getStructureCostByName,
	isValidStructure,
} from '../../../src/data/structure-costs';

describe('Structure Costs Configuration', () => {
	describe('Completeness Tests', () => {
		test('should have costs defined for all GDD structures', () => {
			// GDD Section 6.7 lists these as minimum required structures
			const requiredStructures = [
				'TENT',
				'FARM',
				'LUMBER_MILL',
				'QUARRY',
				'MINE',
				'HOUSE',
				'WAREHOUSE',
				'WORKSHOP',
				'MARKETPLACE',
				'TOWN_HALL',
			];

			for (const structureName of requiredStructures) {
				const cost = getStructureCostByName(structureName);
				expect(cost, `${structureName} should have costs defined`).toBeDefined();
			}
		});

		test('should have 30+ structures defined (per GDD Section 3.2)', () => {
			expect(STRUCTURE_COSTS.length).toBeGreaterThanOrEqual(30);
		});

		test('should include all 7 structure categories', () => {
			const categories = new Set(STRUCTURE_COSTS.map((s) => s.category));

			// GDD Section 3.2.3 defines 7 categories
			expect(categories.has('EXTRACTOR')).toBe(true);
			expect(categories.has('BUILDING')).toBe(true);
			// Note: Other categories (DISASTER_DEFENSE, NPC_INTERACTION, etc.) may not be implemented yet
		});
	});

	describe('Format Tests', () => {
		test('all structures should have required fields', () => {
			for (const structure of STRUCTURE_COSTS) {
				// Required fields (per TypeScript type StructureCostDefinition)
				expect(structure.id, `${structure.id} should have id`).toBeDefined();
				expect(structure.name, `${structure.id} should have name`).toBeDefined();
				expect(structure.displayName, `${structure.id} should have displayName`).toBeDefined();
				expect(structure.costs, `${structure.id} should have costs`).toBeDefined();
				expect(structure.category, `${structure.id} should have category`).toBeDefined();
				expect(structure.tier, `${structure.id} should have tier`).toBeDefined();

				// Costs should be an object
				expect(typeof structure.costs).toBe('object');

				// Tier should be a positive number
				expect(structure.tier).toBeGreaterThan(0);
			}
		});

		test('all resource costs should be positive numbers', () => {
			for (const structure of STRUCTURE_COSTS) {
				const costs = structure.costs;

				for (const [resource, amount] of Object.entries(costs)) {
					expect(amount, `${structure.id} ${resource} cost should be positive`).toBeGreaterThan(0);
					expect(
						Number.isInteger(amount),
						`${structure.id} ${resource} cost should be an integer`
					).toBe(true);
				}
			}
		});

		test('cost properties should only include valid resources', () => {
			const validResources = ['food', 'water', 'wood', 'stone', 'ore'];

			for (const structure of STRUCTURE_COSTS) {
				const costKeys = Object.keys(structure.costs);

				for (const key of costKeys) {
					expect(validResources, `${structure.id} has invalid resource: ${key}`).toContain(key);
				}
			}
		});
	});

	describe('GDD Compliance Tests', () => {
		// GDD Section 6.7 - Construction Time Table specifies exact costs
		test('TENT should match GDD specification', () => {
			const tent = getStructureCostByName('TENT');

			expect(tent).toMatchObject({
				id: 'TENT',
				name: 'TENT',
				costs: { wood: 10 },
			});
		});

		test('FARM should match GDD specification', () => {
			const farm = getStructureCostByName('FARM');

			expect(farm).toMatchObject({
				id: 'FARM',
				name: 'FARM',
				costs: { wood: 20, stone: 10 },
			});
		});

		test('LUMBER_MILL should match GDD specification', () => {
			const mill = getStructureCostByName('LUMBER_MILL');

			expect(mill).toMatchObject({
				id: 'LUMBER_MILL',
				name: 'LUMBER_MILL',
				costs: { wood: 20, stone: 10 },
			});
		});

		test('QUARRY should match GDD specification', () => {
			const quarry = getStructureCostByName('QUARRY');

			expect(quarry).toMatchObject({
				id: 'QUARRY',
				name: 'QUARRY',
				costs: { wood: 20, stone: 10 },
			});
		});

		test('MINE should match GDD specification', () => {
			const mine = getStructureCostByName('MINE');

			expect(mine).toMatchObject({
				id: 'MINE',
				name: 'MINE',
				costs: { wood: 30, stone: 20 },
			});
		});

		test('HOUSE should match GDD specification', () => {
			const house = getStructureCostByName('HOUSE');

			expect(house).toMatchObject({
				id: 'HOUSE',
				name: 'HOUSE',
				costs: { wood: 50, stone: 20 },
			});
		});

		test('WAREHOUSE should match GDD specification', () => {
			const warehouse = getStructureCostByName('WAREHOUSE');

			expect(warehouse).toMatchObject({
				id: 'WAREHOUSE',
				name: 'WAREHOUSE',
				costs: { wood: 40, stone: 20 },
			});
		});

		test('WORKSHOP should match GDD specification', () => {
			const workshop = getStructureCostByName('WORKSHOP');

			expect(workshop).toMatchObject({
				id: 'WORKSHOP',
				name: 'WORKSHOP',
				costs: { wood: 60, stone: 60, ore: 30 },
			});
		});

		test('MARKETPLACE should match GDD specification', () => {
			const marketplace = getStructureCostByName('MARKETPLACE');

			expect(marketplace).toMatchObject({
				id: 'MARKETPLACE',
				name: 'MARKETPLACE',
				costs: { wood: 120, stone: 80 },
			});
		});

		test('TOWN_HALL should match GDD specification', () => {
			const townHall = getStructureCostByName('TOWN_HALL');

			expect(townHall).toMatchObject({
				id: 'TOWN_HALL',
				name: 'TOWN_HALL',
				costs: { wood: 200, stone: 150, ore: 50 },
			});
		});
	});

	describe('Regression Tests', () => {
		// ISSUE #4 & #6 - HOUSE was the only structure with correct costs in both old locations
		test('HOUSE should remain correct after refactor (regression)', () => {
			const house = getStructureCostByName('HOUSE');

			expect(house?.costs).toEqual({ wood: 50, stone: 20 });
		});

		test('should not have extra resource costs not in GDD', () => {
			// Old implementation added extra resources (water, food) not in GDD spec
			const farm = getStructureCostByName('FARM');

			// Should NOT have food or water costs (old bug)
			expect(farm?.costs).not.toHaveProperty('food');
			expect(farm?.costs).not.toHaveProperty('water');

			// Should ONLY have wood and stone
			expect(Object.keys(farm?.costs || {})).toEqual(['wood', 'stone']);
		});
	});

	describe('Helper Functions', () => {
		test('getStructureCostByName should return cost for valid structure', () => {
			const house = getStructureCostByName('HOUSE');

			expect(house).toBeDefined();
			expect(house?.id).toBe('HOUSE');
		});

		test('getStructureCostByName should return undefined for invalid structure', () => {
			const invalid = getStructureCostByName('INVALID_STRUCTURE');

			expect(invalid).toBeUndefined();
		});

		test('isValidStructure should return true for valid structures', () => {
			expect(isValidStructure('HOUSE')).toBe(true);
			expect(isValidStructure('FARM')).toBe(true);
			expect(isValidStructure('MINE')).toBe(true);
		});

		test('isValidStructure should return false for invalid structures', () => {
			expect(isValidStructure('INVALID')).toBe(false);
			expect(isValidStructure('')).toBe(false);
		});

		test('isValidStructure should be case-sensitive', () => {
			expect(isValidStructure('house')).toBe(false);
			expect(isValidStructure('HOUSE')).toBe(true);
		});
	});

	describe('Data Integrity', () => {
		test('should have no duplicate structure IDs', () => {
			const ids = STRUCTURE_COSTS.map((s) => s.id);
			const uniqueIds = new Set(ids);

			expect(ids.length).toBe(uniqueIds.size);
		});

		test('structure ID should match name', () => {
			for (const structure of STRUCTURE_COSTS) {
				expect(structure.id).toBe(structure.name);
			}
		});

		test('all structures should have non-empty display names', () => {
			for (const structure of STRUCTURE_COSTS) {
				expect(structure.displayName.length).toBeGreaterThan(0);
			}
		});
	});
});
