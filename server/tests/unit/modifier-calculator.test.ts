/**
 * Unit Tests: Modifier Calculator
 *
 * Tests dynamic modifier calculation from config (Phase 3)
 * - Scaling formula implementations
 * - Structure modifier calculation
 * - Prerequisite retrieval
 */

import { describe, it, expect } from 'vitest';
import {
	calculateModifierValue,
	calculateStructureModifiers,
	getPrerequisitesForStructure,
	structureHasModifiers,
	structureHasPrerequisites,
} from '../../src/game/modifier-calculator.js';
import { MODIFIER_NAMES } from '../../src/game/modifier-names.js';

describe('calculateModifierValue', () => {
	describe('LINEAR scaling', () => {
		it('should calculate correctly at level 1', () => {
			const config = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 10,
				formula: 'LINEAR' as const,
			};

			expect(calculateModifierValue(config, 1)).toBe(10);
		});

		it('should scale linearly with level', () => {
			const config = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 10,
				formula: 'LINEAR' as const,
			};

			expect(calculateModifierValue(config, 1)).toBe(10);
			expect(calculateModifierValue(config, 2)).toBe(20);
			expect(calculateModifierValue(config, 5)).toBe(50);
			expect(calculateModifierValue(config, 10)).toBe(100);
		});

		it('should work with decimal base values', () => {
			const config = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 2.5,
				formula: 'LINEAR' as const,
			};

			expect(calculateModifierValue(config, 1)).toBe(2.5);
			expect(calculateModifierValue(config, 4)).toBe(10);
		});
	});

	describe('EXPONENTIAL scaling', () => {
		it('should calculate correctly at level 1', () => {
			const config = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 5,
				formula: 'EXPONENTIAL' as const,
			};

			expect(calculateModifierValue(config, 1)).toBe(5);
		});

		it('should scale exponentially with 1.5 multiplier', () => {
			const config = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 5,
				formula: 'EXPONENTIAL' as const,
			};

			// Level 1: 5 * 1.5^0 = 5
			expect(calculateModifierValue(config, 1)).toBe(5);

			// Level 2: 5 * 1.5^1 = 7.5
			expect(calculateModifierValue(config, 2)).toBe(7.5);

			// Level 3: 5 * 1.5^2 = 11.25
			expect(calculateModifierValue(config, 3)).toBe(11.25);

			// Level 5: 5 * 1.5^4 = 25.31
			expect(calculateModifierValue(config, 5)).toBeCloseTo(25.31, 2);
		});
	});

	describe('DIMINISHING scaling', () => {
		it('should calculate correctly at level 1', () => {
			const config = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 5,
				formula: 'DIMINISHING' as const,
			};

			// Level 1: 5 * (1 + log2(2)) = 5 * 2 = 10
			expect(calculateModifierValue(config, 1)).toBe(10);
		});

		it('should scale with diminishing returns', () => {
			const config = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 5,
				formula: 'DIMINISHING' as const,
			};

			// Level 1: 5 * (1 + log2(2)) = 10
			expect(calculateModifierValue(config, 1)).toBe(10);

			// Level 2: 5 * (1 + log2(3)) ≈ 12.92
			expect(calculateModifierValue(config, 2)).toBeCloseTo(12.92, 2);

			// Level 5: 5 * (1 + log2(6)) ≈ 17.92
			expect(calculateModifierValue(config, 5)).toBeCloseTo(17.92, 2);

			// Level 10: 5 * (1 + log2(11)) ≈ 22.3 (rounded to 2 decimals)
			expect(calculateModifierValue(config, 10)).toBeCloseTo(22.3, 1);
		});

		it('should grow slower than LINEAR at high levels', () => {
			const linearConfig = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 5,
				formula: 'LINEAR' as const,
			};
			const diminishingConfig = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 5,
				formula: 'DIMINISHING' as const,
			};

			const linearValue = calculateModifierValue(linearConfig, 10);
			const diminishingValue = calculateModifierValue(diminishingConfig, 10);

			// Linear: 5 * 10 = 50
			// Diminishing: 5 * (1 + log2(11)) ≈ 22.38
			expect(linearValue).toBeGreaterThan(diminishingValue);
		});
	});

	describe('edge cases', () => {
		it('should handle level 0 (though not expected in game)', () => {
			const config = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 10,
				formula: 'LINEAR' as const,
			};

			expect(calculateModifierValue(config, 0)).toBe(0);
		});

		it('should round to 2 decimal places', () => {
			const config = {
				type: 'TEST',
				name: 'Test',
				description: 'Test',
				baseValue: 3.333,
				formula: 'LINEAR' as const,
			};

			const result = calculateModifierValue(config, 3);
			// 3.333 * 3 = 9.999, should round to 10
			expect(result).toBe(10);
		});
	});
});

describe('calculateStructureModifiers', () => {
	it('should calculate Tent modifiers at level 1', () => {
		// TENT provides +2 population capacity per level (LINEAR)
		const modifiers = calculateStructureModifiers('TENT', 1);

		expect(Array.isArray(modifiers)).toBe(true);
		expect(modifiers).toHaveLength(1);

		const popCapMod = modifiers.find((m) => m.type === MODIFIER_NAMES.POPULATION_CAPACITY);
		expect(popCapMod).toBeDefined();
		expect(popCapMod?.value).toBe(2); // 2 * 1
	});

	it('should calculate Farm modifiers at level 1', () => {
		const modifiers = calculateStructureModifiers('Farm', 1);

		expect(Array.isArray(modifiers)).toBe(true);
		expect(modifiers.length).toBeGreaterThan(0);

		// Farm has FOOD_PRODUCTION (LINEAR, base 10) and HAPPINESS (DIMINISHING, base 2)
		const foodMod = modifiers.find((m) => m.type === MODIFIER_NAMES.FOOD_PRODUCTION);
		const happinessMod = modifiers.find((m) => m.type === MODIFIER_NAMES.HAPPINESS_BONUS);

		expect(foodMod).toBeDefined();
		expect(foodMod?.value).toBe(10); // 10 * 1

		expect(happinessMod).toBeDefined();
		expect(happinessMod?.value).toBe(4); // 2 * (1 + log2(2)) = 4
	});

	it('should calculate Farm modifiers at level 5', () => {
		const modifiers = calculateStructureModifiers('Farm', 5);

		const foodMod = modifiers.find((m) => m.type === MODIFIER_NAMES.FOOD_PRODUCTION);
		const happinessMod = modifiers.find((m) => m.type === MODIFIER_NAMES.HAPPINESS_BONUS);

		expect(foodMod?.value).toBe(50); // 10 * 5
		expect(happinessMod?.value).toBeCloseTo(7.17, 2); // 2 * (1 + log2(6))
	});

	it('should include all expected fields', () => {
		const modifiers = calculateStructureModifiers('Farm', 1);

		expect(modifiers.length).toBeGreaterThan(0);

		for (const mod of modifiers) {
			expect(mod).toHaveProperty('type');
			expect(mod).toHaveProperty('name');
			expect(mod).toHaveProperty('description');
			expect(mod).toHaveProperty('value');

			expect(typeof mod.type).toBe('string');
			expect(typeof mod.name).toBe('string');
			expect(typeof mod.description).toBe('string');
			expect(typeof mod.value).toBe('number');
		}
	});

	it('should calculate Workshop modifiers with EXPONENTIAL scaling', () => {
		const modifiers = calculateStructureModifiers('Workshop', 1);

		// Workshop has UPGRADE_SPEED (EXPONENTIAL, base 5)
		const upgradeMod = modifiers.find((m) => m.type === MODIFIER_NAMES.UPGRADE_SPEED);

		expect(upgradeMod).toBeDefined();
		expect(upgradeMod?.value).toBe(5); // 5 * 1.5^0 = 5 at level 1

		// Level 5
		const modifiersL5 = calculateStructureModifiers('Workshop', 5);
		const upgradeModL5 = modifiersL5.find((m) => m.type === MODIFIER_NAMES.UPGRADE_SPEED);
		expect(upgradeModL5?.value).toBeCloseTo(25.31, 2); // 5 * 1.5^4
	});

	it('should handle structures with multiple modifiers', () => {
		const modifiers = calculateStructureModifiers('Town Hall', 1);

		// Town Hall has HAPPINESS (DIMINISHING, base 5) and PRODUCTION_EFFICIENCY (DIMINISHING, base 2)
		expect(modifiers.length).toBeGreaterThanOrEqual(2);

		const happinessMod = modifiers.find((m) => m.type === MODIFIER_NAMES.HAPPINESS_BONUS);
		const prodEfficiencyMod = modifiers.find(
			(m) => m.type === MODIFIER_NAMES.PRODUCTION_EFFICIENCY
		);

		expect(happinessMod).toBeDefined();
		expect(prodEfficiencyMod).toBeDefined();
	});
});

describe('getPrerequisitesForStructure', () => {
	it('should return empty array for structures without prerequisites', () => {
		const prereqs = getPrerequisitesForStructure('Farm');

		expect(Array.isArray(prereqs)).toBe(true);
		expect(prereqs).toHaveLength(0);
	});

	it('should return prerequisites for Workshop', () => {
		const prereqs = getPrerequisitesForStructure('Workshop');

		expect(Array.isArray(prereqs)).toBe(true);
		expect(prereqs.length).toBeGreaterThan(0);

		// Workshop requires Town Hall level 1
		const townHallPrereq = prereqs.find((p) => p.requiredStructureName === 'Town Hall');
		expect(townHallPrereq).toBeDefined();
		expect(townHallPrereq?.requiredLevel).toBe(1);
	});

	it('should return prerequisites for Marketplace', () => {
		const prereqs = getPrerequisitesForStructure('Marketplace');

		expect(Array.isArray(prereqs)).toBe(true);
		expect(prereqs.length).toBeGreaterThan(0);

		// Marketplace requires Town Hall level 1
		const townHallPrereq = prereqs.find((p) => p.requiredStructureName === 'Town Hall');
		expect(townHallPrereq).toBeDefined();
		expect(townHallPrereq?.requiredLevel).toBe(1);
	});

	it('should include expected fields', () => {
		const prereqs = getPrerequisitesForStructure('Workshop');

		for (const prereq of prereqs) {
			expect(prereq).toHaveProperty('requiredStructureName');
			expect(prereq).toHaveProperty('requiredLevel');

			expect(typeof prereq.requiredStructureName).toBe('string');
			expect(typeof prereq.requiredLevel).toBe('number');
			expect(prereq.requiredLevel).toBeGreaterThan(0);
		}
	});
});

describe('structureHasModifiers', () => {
	it('should return true for structures with modifiers', () => {
		expect(structureHasModifiers('TENT')).toBe(true);
		expect(structureHasModifiers('Farm')).toBe(true);
		expect(structureHasModifiers('Workshop')).toBe(true);
		expect(structureHasModifiers('Town Hall')).toBe(true);
	});

	it('should return false for non-existent structures', () => {
		expect(structureHasModifiers('NONEXISTENT_STRUCTURE')).toBe(false);
	});
});

describe('structureHasPrerequisites', () => {
	it('should return true for structures with prerequisites', () => {
		expect(structureHasPrerequisites('Workshop')).toBe(true);
		expect(structureHasPrerequisites('Marketplace')).toBe(true);
	});

	it('should return false for structures without prerequisites', () => {
		expect(structureHasPrerequisites('TENT')).toBe(false);
		expect(structureHasPrerequisites('Farm')).toBe(false);
		expect(structureHasPrerequisites('TOWN_HALL')).toBe(false);
	});

	it('should return false for non-existent structures', () => {
		expect(structureHasPrerequisites('NONEXISTENT_STRUCTURE')).toBe(false);
	});
});
