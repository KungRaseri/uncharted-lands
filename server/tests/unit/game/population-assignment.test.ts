/**
 * Unit Tests: Population Assignment System
 *
 * Tests auto-assignment algorithm, bonus calculations, and helper functions.
 *
 * Phase 1D: Population Assignment System
 */

import { describe, test, expect } from 'vitest';
import {
	autoAssignPopulation,
	calculateStaffingBonus,
	getUnstaffedStructures,
	validateAssignment,
	calculateAllStaffingBonuses,
	type StructureWithType,
} from '../../../src/game/population-assignment.js';
import { getStaffingRequirement } from '../../../src/config/structure-staffing.js';

/**
 * Create mock structure for testing
 */
function createMockStructure(
	id: string,
	category: 'BUILDING' | 'EXTRACTOR',
	type: string,
	populationAssigned = 0
): StructureWithType {
	const structure: StructureWithType = {
		id,
		structureId: 'structure-' + id,
		settlementId: 'test-settlement',
		category,
		level: 1,
		populationAssigned,
		tileId: null,
		slotPosition: null,
		health: 100,
		damagedAt: null,
		lastRepairedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	if (category === 'BUILDING') {
		structure.buildingType = type as any;
	} else {
		structure.extractorType = type as any;
	}

	return structure;
}

describe('autoAssignPopulation', () => {
	describe('Priority-Based Assignment', () => {
		test('should assign to highest priority structures first (FARM priority 10)', () => {
			const structures: StructureWithType[] = [
				createMockStructure('farm', 'EXTRACTOR', 'FARM'),
				createMockStructure('workshop', 'BUILDING', 'WORKSHOP'), // Priority 7
				createMockStructure('quarry', 'EXTRACTOR', 'QUARRY'), // Priority 7
			];

			// Only enough for FARM (requires 2)
			const result = autoAssignPopulation(2, structures);

			expect(result.assignments.get('farm')).toBe(2); // FARM gets all
			expect(result.assignments.get('workshop')).toBeUndefined(); // None left
			expect(result.assignments.get('quarry')).toBeUndefined(); // None left
		});

		test('should assign to WELL (priority 10) before LUMBER_MILL (priority 8)', () => {
			const structures: StructureWithType[] = [
				createMockStructure('well', 'EXTRACTOR', 'WELL'), // Priority 10, requires 1
				createMockStructure('lumber', 'EXTRACTOR', 'LUMBER_MILL'), // Priority 8, requires 2
			];

			// Only 1 worker available
			const result = autoAssignPopulation(1, structures);

			expect(result.assignments.get('well')).toBe(1); // WELL gets the worker
			expect(result.assignments.get('lumber')).toBeUndefined(); // None left
		});

		test('should prioritize FISHING_DOCK (9) over LUMBER_MILL (8) over QUARRY (7)', () => {
			const structures: StructureWithType[] = [
				createMockStructure('fishing', 'EXTRACTOR', 'FISHING_DOCK'), // Priority 9, requires 2
				createMockStructure('lumber', 'EXTRACTOR', 'LUMBER_MILL'), // Priority 8, requires 2
				createMockStructure('quarry', 'EXTRACTOR', 'QUARRY'), // Priority 7, requires 2
			];

			// Only 4 workers (enough for 2 structures)
			const result = autoAssignPopulation(4, structures);

			expect(result.assignments.get('fishing')).toBe(2); // Fishing first
			expect(result.assignments.get('lumber')).toBe(2); // Lumber second
			expect(result.assignments.get('quarry')).toBeUndefined(); // None left
		});
	});

	describe('Sufficient Population Scenarios', () => {
		test('should fully staff all structures when population abundant', () => {
			const structures: StructureWithType[] = [
				createMockStructure('farm', 'EXTRACTOR', 'FARM'), // Requires 2, optional 3 (max 5)
				createMockStructure('well', 'EXTRACTOR', 'WELL'), // Requires 1, optional 1 (max 2)
				createMockStructure('house', 'BUILDING', 'HOUSE'), // Requires 0 (passive)
			];

			const result = autoAssignPopulation(10, structures);

			// With abundant population, should fully staff with optional workers too
			expect(result.assignments.get('farm')).toBe(5); // 2 required + 3 optional
			expect(result.assignments.get('well')).toBe(2); // 1 required + 1 optional
			expect(result.assignments.get('house')).toBeUndefined(); // Passive, no workers
			expect(result.totalAssigned).toBe(7); // 5 + 2
			expect(result.remainingPopulation).toBe(3); // 10 - 7
		});

		test('should assign optional workers after required workers', () => {
			const structures: StructureWithType[] = [
				createMockStructure('farm', 'EXTRACTOR', 'FARM'), // Required 2, optional 3, max 5
			];

			const result = autoAssignPopulation(10, structures);

			expect(result.assignments.get('farm')).toBe(5); // Fully staffed (2 + 3)
			expect(result.remainingPopulation).toBe(5);
		});

		test('should respect max capacity (required + optional)', () => {
			const structures: StructureWithType[] = [
				createMockStructure('mine', 'EXTRACTOR', 'MINE'), // Required 3, optional 5, max 8
			];

			const result = autoAssignPopulation(100, structures);

			expect(result.assignments.get('mine')).toBe(8); // Capped at max capacity
			expect(result.remainingPopulation).toBe(92);
		});

		test('should assign optional workers to highest bonus structures first', () => {
			const structures: StructureWithType[] = [
				createMockStructure('herb', 'EXTRACTOR', 'HERB_GARDEN'), // +12% bonus (highest)
				createMockStructure('farm', 'EXTRACTOR', 'FARM'), // +10% bonus
				createMockStructure('quarry', 'EXTRACTOR', 'QUARRY'), // +8% bonus
			];

			// Enough for required (1+2+2=5) + 2 optional
			const result = autoAssignPopulation(7, structures);

			const herbStaffing = getStaffingRequirement('EXTRACTOR', 'HERB_GARDEN');
			const herbAssigned = result.assignments.get('herb')!;

			// Herb should get optional workers first (highest bonus)
			expect(herbAssigned).toBeGreaterThan(herbStaffing.required);
		});
	});

	describe('Insufficient Population Scenarios', () => {
		test('should assign nothing when zero population', () => {
			const structures: StructureWithType[] = [
				createMockStructure('farm', 'EXTRACTOR', 'FARM'),
				createMockStructure('well', 'EXTRACTOR', 'WELL'),
			];

			const result = autoAssignPopulation(0, structures);

			expect(result.assignments.get('farm')).toBeUndefined();
			expect(result.assignments.get('well')).toBeUndefined();
			expect(result.totalAssigned).toBe(0);
			expect(result.remainingPopulation).toBe(0);
			expect(result.understaffedStructures).toHaveLength(2);
		});

		test('should partially staff high-priority structures first', () => {
			const structures: StructureWithType[] = [
				createMockStructure('farm', 'EXTRACTOR', 'FARM'), // Priority 10, requires 2
				createMockStructure('workshop', 'BUILDING', 'WORKSHOP'), // Priority 7, requires 2
			];

			// Only 1 worker available
			const result = autoAssignPopulation(1, structures);

			expect(result.assignments.get('farm')).toBe(1); // FARM gets partial
			expect(result.assignments.get('workshop')).toBeUndefined(); // None left
			expect(result.understaffedStructures).toHaveLength(2);
		});

		test('should mark all structures as understaffed when insufficient', () => {
			const structures: StructureWithType[] = [
				createMockStructure('farm', 'EXTRACTOR', 'FARM'), // Requires 2
				createMockStructure('well', 'EXTRACTOR', 'WELL'), // Requires 1
			];

			const result = autoAssignPopulation(1, structures);

			expect(result.understaffedStructures).toHaveLength(2);
			expect(result.understaffedStructures[0].deficit).toBeGreaterThan(0);
		});

		test('should not assign optional workers when required workers missing', () => {
			const structures: StructureWithType[] = [
				createMockStructure('farm', 'EXTRACTOR', 'FARM'), // Requires 2, optional 3
			];

			const result = autoAssignPopulation(1, structures);

			expect(result.assignments.get('farm')).toBe(1); // Only required workers
			expect(result.remainingPopulation).toBe(0);
		});
	});

	describe('Edge Cases', () => {
		test('should handle empty structures array', () => {
			const result = autoAssignPopulation(10, []);

			expect(result.totalAssigned).toBe(0);
			expect(result.remainingPopulation).toBe(10);
			expect(result.understaffedStructures).toHaveLength(0);
			expect(result.fullyStaffedStructures).toHaveLength(0);
		});

		test('should handle only passive structures (HOUSE)', () => {
			const structures: StructureWithType[] = [
				createMockStructure('house1', 'BUILDING', 'HOUSE'),
				createMockStructure('house2', 'BUILDING', 'HOUSE'),
			];

			const result = autoAssignPopulation(10, structures);

			expect(result.totalAssigned).toBe(0);
			expect(result.remainingPopulation).toBe(10);
		});

		test('should handle single structure scenario', () => {
			const structures: StructureWithType[] = [createMockStructure('farm', 'EXTRACTOR', 'FARM')];

			const result = autoAssignPopulation(5, structures);

			expect(result.assignments.get('farm')).toBe(5);
			expect(result.totalAssigned).toBe(5);
		});

		test('should identify fully staffed structures correctly', () => {
			const structures: StructureWithType[] = [
				createMockStructure('farm', 'EXTRACTOR', 'FARM'), // Max 5 (2+3)
				createMockStructure('well', 'EXTRACTOR', 'WELL'), // Max 2 (1+1)
			];

			const result = autoAssignPopulation(10, structures);

			expect(result.fullyStaffedStructures).toContain('farm');
			expect(result.fullyStaffedStructures).toContain('well');
		});
	});
});

describe('calculateStaffingBonus', () => {
	test('should return 1 (no bonus) when assigned less than required', () => {
		const staffing = getStaffingRequirement('EXTRACTOR', 'FARM');

		const bonus = calculateStaffingBonus(1, staffing); // Assigned 1, requires 2

		expect(bonus).toBe(1);
	});

	test('should return 1 (no bonus) when assigned equals required', () => {
		const staffing = getStaffingRequirement('EXTRACTOR', 'FARM');

		const bonus = calculateStaffingBonus(2, staffing); // Assigned 2, requires 2

		expect(bonus).toBe(1);
	});

	test('should calculate linear bonus per worker above required', () => {
		const staffing = getStaffingRequirement('EXTRACTOR', 'FARM'); // +0.1 per worker

		const bonus = calculateStaffingBonus(4, staffing); // Assigned 4, requires 2 → 2 extra

		expect(bonus).toBe(1.2); // 1 + (2 × 0.1)
	});

	test('should cap bonus at max optional workers', () => {
		const staffing = getStaffingRequirement('EXTRACTOR', 'FARM'); // Max 5 (2+3)

		const bonus = calculateStaffingBonus(5, staffing); // Fully staffed

		expect(bonus).toBe(1.3); // 1 + (3 × 0.1)
	});

	test('should handle structures with no bonus (HOUSE)', () => {
		const staffing = getStaffingRequirement('BUILDING', 'HOUSE');

		const bonus = calculateStaffingBonus(0, staffing); // HOUSE requires 0

		expect(bonus).toBe(1);
	});

	test('should calculate HERB_GARDEN bonus correctly (+12%)', () => {
		const staffing = getStaffingRequirement('EXTRACTOR', 'HERB_GARDEN'); // +0.12 per worker

		const bonus = calculateStaffingBonus(2, staffing); // Assigned 2, requires 1 → 1 extra

		expect(bonus).toBe(1.12); // 1 + (1 × 0.12)
	});
});

describe('getUnstaffedStructures', () => {
	test('should return empty array when all structures fully staffed', () => {
		const structures: StructureWithType[] = [
			{ ...createMockStructure('farm', 'EXTRACTOR', 'FARM'), populationAssigned: 2 },
			{ ...createMockStructure('well', 'EXTRACTOR', 'WELL'), populationAssigned: 1 },
		];

		const understaffed = getUnstaffedStructures(structures);

		expect(understaffed).toHaveLength(0);
	});

	test('should identify structures with missing required workers', () => {
		const structures: StructureWithType[] = [
			{ ...createMockStructure('farm', 'EXTRACTOR', 'FARM'), populationAssigned: 1 }, // Requires 2
			{ ...createMockStructure('well', 'EXTRACTOR', 'WELL'), populationAssigned: 1 }, // OK
		];

		const understaffed = getUnstaffedStructures(structures);

		expect(understaffed).toHaveLength(1);
		expect(understaffed[0].structureId).toBe('farm');
		expect(understaffed[0].deficit).toBe(1); // Needs 1 more
	});

	test('should calculate deficit correctly for multiple structures', () => {
		const structures: StructureWithType[] = [
			{ ...createMockStructure('farm', 'EXTRACTOR', 'FARM'), populationAssigned: 0 }, // Requires 2
			{ ...createMockStructure('mine', 'EXTRACTOR', 'MINE'), populationAssigned: 1 }, // Requires 3
		];

		const understaffed = getUnstaffedStructures(structures);

		expect(understaffed).toHaveLength(2);
		expect(understaffed[0].deficit).toBe(2); // FARM needs 2
		expect(understaffed[1].deficit).toBe(2); // MINE needs 2
	});

	test('should not count structures as understaffed if optional workers missing', () => {
		const structures: StructureWithType[] = [
			{ ...createMockStructure('farm', 'EXTRACTOR', 'FARM'), populationAssigned: 2 }, // Has required, missing optional
		];

		const understaffed = getUnstaffedStructures(structures);

		expect(understaffed).toHaveLength(0); // Not understaffed (has required)
	});
});

describe('validateAssignment', () => {
	test('should return true when assignment within capacity', () => {
		const structure = createMockStructure('farm', 'EXTRACTOR', 'FARM'); // Max 5 (2+3)

		expect(validateAssignment(structure, 3)).toBe(true);
		expect(validateAssignment(structure, 5)).toBe(true);
	});

	test('should return false when assignment exceeds capacity', () => {
		const structure = createMockStructure('farm', 'EXTRACTOR', 'FARM'); // Max 5 (2+3)

		expect(validateAssignment(structure, 6)).toBe(false);
		expect(validateAssignment(structure, 100)).toBe(false);
	});

	test('should return true for zero assignment on passive structures', () => {
		const structure = createMockStructure('house', 'BUILDING', 'HOUSE'); // Requires 0

		expect(validateAssignment(structure, 0)).toBe(true);
	});

	test('should validate against exact capacity limits', () => {
		const structure = createMockStructure('mine', 'EXTRACTOR', 'MINE'); // Max 8 (3+5)

		expect(validateAssignment(structure, 8)).toBe(true); // Exactly at cap
		expect(validateAssignment(structure, 9)).toBe(false); // Over cap
	});
});

describe('calculateAllStaffingBonuses', () => {
	test('should calculate bonuses for all structures', () => {
		const structures: StructureWithType[] = [
			{ ...createMockStructure('farm', 'EXTRACTOR', 'FARM'), populationAssigned: 4 }, // +20%
			{ ...createMockStructure('well', 'EXTRACTOR', 'WELL'), populationAssigned: 2 }, // +10%
			{ ...createMockStructure('house', 'BUILDING', 'HOUSE'), populationAssigned: 0 }, // No bonus
		];

		const bonuses = calculateAllStaffingBonuses(structures);

		expect(bonuses.size).toBe(3);
		expect(bonuses.get('farm')).toBe(1.2); // 1 + (2 × 0.1)
		expect(bonuses.get('well')).toBe(1.1); // 1 + (1 × 0.1)
		expect(bonuses.get('house')).toBe(1); // No workers
	});

	test('should return 1 for understaffed structures', () => {
		const structures: StructureWithType[] = [
			{ ...createMockStructure('farm', 'EXTRACTOR', 'FARM'), populationAssigned: 1 }, // Requires 2
		];

		const bonuses = calculateAllStaffingBonuses(structures);

		expect(bonuses.get('farm')).toBe(1); // No bonus when understaffed
	});

	test('should handle empty structures array', () => {
		const bonuses = calculateAllStaffingBonuses([]);

		expect(bonuses.size).toBe(0);
	});
});
