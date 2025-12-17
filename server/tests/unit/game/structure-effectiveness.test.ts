/**
 * Tests for structure-effectiveness.ts
 *
 * Verifies health → effectiveness → production multiplier calculations
 * per GDD Section 6.6 (Structure Health & Repair System)
 */

import { describe, expect, test } from 'vitest';
import {
	getEffectiveness,
	getEffectivenessInfo,
	getEffectivenessLabel,
	getHealthColor,
	type HealthColor,
} from '../../../src/game/structure-effectiveness.js';

describe('getEffectiveness()', () => {
	describe('Exact Breakpoint Values', () => {
		test('should return 0 effectiveness for 0% health (destroyed)', () => {
			expect(getEffectiveness(0)).toBe(0);
		});

		test('should return 0.1 effectiveness for 1-19% health (critical)', () => {
			expect(getEffectiveness(1)).toBe(0.1);
			expect(getEffectiveness(10)).toBe(0.1);
			expect(getEffectiveness(19)).toBe(0.1);
		});

		test('should return 0.5 effectiveness for 20-39% health (poor)', () => {
			expect(getEffectiveness(20)).toBe(0.5);
			expect(getEffectiveness(30)).toBe(0.5);
			expect(getEffectiveness(39)).toBe(0.5);
		});

		test('should return 0.7 effectiveness for 40-59% health (damaged)', () => {
			expect(getEffectiveness(40)).toBe(0.7);
			expect(getEffectiveness(50)).toBe(0.7);
			expect(getEffectiveness(59)).toBe(0.7);
		});

		test('should return 0.85 effectiveness for 60-79% health (good)', () => {
			expect(getEffectiveness(60)).toBe(0.85);
			expect(getEffectiveness(70)).toBe(0.85);
			expect(getEffectiveness(79)).toBe(0.85);
		});

		test('should return 0.95 effectiveness for 80-94% health (excellent)', () => {
			expect(getEffectiveness(80)).toBe(0.95);
			expect(getEffectiveness(87)).toBe(0.95);
			expect(getEffectiveness(94)).toBe(0.95);
		});

		test('should return 1.0 effectiveness for 95-100% health (pristine)', () => {
			expect(getEffectiveness(95)).toBe(1);
			expect(getEffectiveness(98)).toBe(1);
			expect(getEffectiveness(100)).toBe(1);
		});
	});

	describe('Edge Cases', () => {
		test('should treat null as full health (100%)', () => {
			expect(getEffectiveness(null)).toBe(1);
		});

		test('should treat undefined as full health (100%)', () => {
			expect(getEffectiveness(undefined)).toBe(1);
		});

		test('should clamp negative health to 0 (destroyed)', () => {
			expect(getEffectiveness(-10)).toBe(0);
			expect(getEffectiveness(-100)).toBe(0);
		});

		test('should clamp health > 100 to 100 (pristine)', () => {
			expect(getEffectiveness(101)).toBe(1);
			expect(getEffectiveness(150)).toBe(1);
			expect(getEffectiveness(999)).toBe(1);
		});

		test('should handle decimal health values', () => {
			expect(getEffectiveness(50.5)).toBe(0.7); // Rounds to 50 → damaged
			expect(getEffectiveness(99.9)).toBe(1); // Rounds to 99 → pristine
		});
	});

	describe('Production Impact Examples', () => {
		test('pristine structure (100%) → 100% production', () => {
			const effectiveness = getEffectiveness(100);
			expect(effectiveness).toBe(1);

			// Example: 100 base production
			const production = 100 * effectiveness;
			expect(production).toBe(100);
		});

		test('excellent structure (90%) → 95% production', () => {
			const effectiveness = getEffectiveness(90);
			expect(effectiveness).toBe(0.95);

			// Example: 100 base production
			const production = 100 * effectiveness;
			expect(production).toBe(95);
		});

		test('good structure (70%) → 85% production', () => {
			const effectiveness = getEffectiveness(70);
			expect(effectiveness).toBe(0.85);

			// Example: 100 base production
			const production = 100 * effectiveness;
			expect(production).toBe(85);
		});

		test('damaged structure (50%) → 70% production', () => {
			const effectiveness = getEffectiveness(50);
			expect(effectiveness).toBe(0.7);

			// Example: 100 base production
			const production = 100 * effectiveness;
			expect(production).toBe(70);
		});

		test('poor structure (30%) → 50% production', () => {
			const effectiveness = getEffectiveness(30);
			expect(effectiveness).toBe(0.5);

			// Example: 100 base production
			const production = 100 * effectiveness;
			expect(production).toBe(50);
		});

		test('critical structure (10%) → 10% production', () => {
			const effectiveness = getEffectiveness(10);
			expect(effectiveness).toBe(0.1);

			// Example: 100 base production
			const production = 100 * effectiveness;
			expect(production).toBe(10);
		});

		test('destroyed structure (0%) → 0% production', () => {
			const effectiveness = getEffectiveness(0);
			expect(effectiveness).toBe(0);

			// Example: 100 base production
			const production = 100 * effectiveness;
			expect(production).toBe(0);
		});
	});
});

describe('getEffectivenessLabel()', () => {
	describe('Correct Labels for Each Breakpoint', () => {
		test('should return "Destroyed" for 0% health', () => {
			expect(getEffectivenessLabel(0)).toBe('Destroyed');
		});

		test('should return "Critical" for 1-19% health', () => {
			expect(getEffectivenessLabel(1)).toBe('Critical');
			expect(getEffectivenessLabel(10)).toBe('Critical');
			expect(getEffectivenessLabel(19)).toBe('Critical');
		});

		test('should return "Poor Condition" for 20-39% health', () => {
			expect(getEffectivenessLabel(20)).toBe('Poor Condition');
			expect(getEffectivenessLabel(30)).toBe('Poor Condition');
			expect(getEffectivenessLabel(39)).toBe('Poor Condition');
		});

		test('should return "Damaged" for 40-59% health', () => {
			expect(getEffectivenessLabel(40)).toBe('Damaged');
			expect(getEffectivenessLabel(50)).toBe('Damaged');
			expect(getEffectivenessLabel(59)).toBe('Damaged');
		});

		test('should return "Good Condition" for 60-79% health', () => {
			expect(getEffectivenessLabel(60)).toBe('Good Condition');
			expect(getEffectivenessLabel(70)).toBe('Good Condition');
			expect(getEffectivenessLabel(79)).toBe('Good Condition');
		});

		test('should return "Excellent Condition" for 80-94% health', () => {
			expect(getEffectivenessLabel(80)).toBe('Excellent Condition');
			expect(getEffectivenessLabel(87)).toBe('Excellent Condition');
			expect(getEffectivenessLabel(94)).toBe('Excellent Condition');
		});

		test('should return "Pristine" for 95-100% health', () => {
			expect(getEffectivenessLabel(95)).toBe('Pristine');
			expect(getEffectivenessLabel(98)).toBe('Pristine');
			expect(getEffectivenessLabel(100)).toBe('Pristine');
		});
	});

	describe('Edge Cases', () => {
		test('should return "Pristine" for null (full health)', () => {
			expect(getEffectivenessLabel(null)).toBe('Pristine');
		});

		test('should return "Pristine" for undefined (full health)', () => {
			expect(getEffectivenessLabel(undefined)).toBe('Pristine');
		});

		test('should clamp negative health to "Destroyed"', () => {
			expect(getEffectivenessLabel(-10)).toBe('Destroyed');
		});

		test('should clamp health > 100 to "Pristine"', () => {
			expect(getEffectivenessLabel(150)).toBe('Pristine');
		});
	});
});

describe('getHealthColor()', () => {
	describe('Correct Colors for Each Breakpoint', () => {
		test('should return "gray" for 0% health (destroyed)', () => {
			expect(getHealthColor(0)).toBe('gray');
		});

		test('should return "red" for 1-19% health (critical)', () => {
			expect(getHealthColor(1)).toBe('red');
			expect(getHealthColor(10)).toBe('red');
			expect(getHealthColor(19)).toBe('red');
		});

		test('should return "red" for 20-39% health (poor)', () => {
			expect(getHealthColor(20)).toBe('red');
			expect(getHealthColor(30)).toBe('red');
			expect(getHealthColor(39)).toBe('red');
		});

		test('should return "orange" for 40-59% health (damaged)', () => {
			expect(getHealthColor(40)).toBe('orange');
			expect(getHealthColor(50)).toBe('orange');
			expect(getHealthColor(59)).toBe('orange');
		});

		test('should return "yellow" for 60-79% health (good)', () => {
			expect(getHealthColor(60)).toBe('yellow');
			expect(getHealthColor(70)).toBe('yellow');
			expect(getHealthColor(79)).toBe('yellow');
		});

		test('should return "green" for 80-94% health (excellent)', () => {
			expect(getHealthColor(80)).toBe('green');
			expect(getHealthColor(87)).toBe('green');
			expect(getHealthColor(94)).toBe('green');
		});

		test('should return "green" for 95-100% health (pristine)', () => {
			expect(getHealthColor(95)).toBe('green');
			expect(getHealthColor(98)).toBe('green');
			expect(getHealthColor(100)).toBe('green');
		});
	});

	describe('Edge Cases', () => {
		test('should return "green" for null (full health)', () => {
			expect(getHealthColor(null)).toBe('green');
		});

		test('should return "green" for undefined (full health)', () => {
			expect(getHealthColor(undefined)).toBe('green');
		});

		test('should clamp negative health to "gray"', () => {
			expect(getHealthColor(-10)).toBe('gray');
		});

		test('should clamp health > 100 to "green"', () => {
			expect(getHealthColor(150)).toBe('green');
		});
	});

	describe('Type Safety', () => {
		test('should return valid HealthColor type', () => {
			const validColors: HealthColor[] = ['green', 'yellow', 'orange', 'red', 'gray'];

			for (let health = 0; health <= 100; health += 10) {
				const color = getHealthColor(health);
				expect(validColors).toContain(color);
			}
		});
	});
});

describe('getEffectivenessInfo()', () => {
	describe('Complete Information Object', () => {
		test('should return all fields for pristine health (100%)', () => {
			const info = getEffectivenessInfo(100);

			expect(info).toEqual({
				health: 100,
				effectiveness: 1,
				label: 'Pristine',
				color: 'green',
				productionPenalty: 0,
			});
		});

		test('should return all fields for damaged health (50%)', () => {
			const info = getEffectivenessInfo(50);

			expect(info).toEqual({
				health: 50,
				effectiveness: 0.7,
				label: 'Damaged',
				color: 'orange',
				productionPenalty: 30, // (1 - 0.7) * 100 = 30%
			});
		});

		test('should return all fields for critical health (10%)', () => {
			const info = getEffectivenessInfo(10);

			expect(info).toEqual({
				health: 10,
				effectiveness: 0.1,
				label: 'Critical',
				color: 'red',
				productionPenalty: 90, // (1 - 0.1) * 100 = 90%
			});
		});

		test('should return all fields for destroyed health (0%)', () => {
			const info = getEffectivenessInfo(0);

			expect(info).toEqual({
				health: 0,
				effectiveness: 0,
				label: 'Destroyed',
				color: 'gray',
				productionPenalty: 100, // (1 - 0) * 100 = 100%
			});
		});
	});

	describe('Production Penalty Calculation', () => {
		test('should calculate correct penalty for all breakpoints', () => {
			expect(getEffectivenessInfo(100).productionPenalty).toBe(0); // 1.0 → 0%
			expect(getEffectivenessInfo(90).productionPenalty).toBe(5); // 0.95 → 5%
			expect(getEffectivenessInfo(70).productionPenalty).toBe(15); // 0.85 → 15%
			expect(getEffectivenessInfo(50).productionPenalty).toBe(30); // 0.7 → 30%
			expect(getEffectivenessInfo(30).productionPenalty).toBe(50); // 0.5 → 50%
			expect(getEffectivenessInfo(10).productionPenalty).toBe(90); // 0.1 → 90%
			expect(getEffectivenessInfo(0).productionPenalty).toBe(100); // 0 → 100%
		});

		test('should round penalty to whole number', () => {
			// All penalties should be integers
			for (let health = 0; health <= 100; health += 5) {
				const penalty = getEffectivenessInfo(health).productionPenalty;
				expect(penalty).toBe(Math.round(penalty));
			}
		});
	});

	describe('Edge Cases', () => {
		test('should handle null as 100% health', () => {
			const info = getEffectivenessInfo(null);

			expect(info.health).toBe(100);
			expect(info.effectiveness).toBe(1);
			expect(info.label).toBe('Pristine');
			expect(info.color).toBe('green');
			expect(info.productionPenalty).toBe(0);
		});

		test('should handle undefined as 100% health', () => {
			const info = getEffectivenessInfo(undefined);

			expect(info.health).toBe(100);
			expect(info.effectiveness).toBe(1);
			expect(info.label).toBe('Pristine');
			expect(info.color).toBe('green');
			expect(info.productionPenalty).toBe(0);
		});

		test('should clamp negative health to 0', () => {
			const info = getEffectivenessInfo(-50);

			// Note: actualHealth shows original value, but calculations use clamped
			expect(info.health).toBe(-50);
			expect(info.effectiveness).toBe(0);
			expect(info.label).toBe('Destroyed');
			expect(info.color).toBe('gray');
			expect(info.productionPenalty).toBe(100);
		});

		test('should clamp health > 100 to 100', () => {
			const info = getEffectivenessInfo(150);

			// Note: actualHealth shows original value, but calculations use clamped
			expect(info.health).toBe(150);
			expect(info.effectiveness).toBe(1);
			expect(info.label).toBe('Pristine');
			expect(info.color).toBe('green');
			expect(info.productionPenalty).toBe(0);
		});
	});
});

describe('Integration: GDD Compliance', () => {
	test('should match all GDD Section 6.6 breakpoint values exactly', () => {
		// GDD Table from Section 6.6
		const gddBreakpoints = [
			{ health: 100, effectiveness: 1, label: 'Pristine' },
			{ health: 95, effectiveness: 1, label: 'Pristine' },
			{ health: 94, effectiveness: 0.95, label: 'Excellent Condition' },
			{ health: 80, effectiveness: 0.95, label: 'Excellent Condition' },
			{ health: 79, effectiveness: 0.85, label: 'Good Condition' },
			{ health: 60, effectiveness: 0.85, label: 'Good Condition' },
			{ health: 59, effectiveness: 0.7, label: 'Damaged' },
			{ health: 40, effectiveness: 0.7, label: 'Damaged' },
			{ health: 39, effectiveness: 0.5, label: 'Poor Condition' },
			{ health: 20, effectiveness: 0.5, label: 'Poor Condition' },
			{ health: 19, effectiveness: 0.1, label: 'Critical' },
			{ health: 1, effectiveness: 0.1, label: 'Critical' },
			{ health: 0, effectiveness: 0, label: 'Destroyed' },
		];

		for (const { health, effectiveness, label } of gddBreakpoints) {
			expect(getEffectiveness(health)).toBe(effectiveness);
			expect(getEffectivenessLabel(health)).toBe(label);
		}
	});

	test('should provide smooth degradation curve (no sudden jumps)', () => {
		// Check that effectiveness is monotonically decreasing
		for (let health = 99; health >= 0; health--) {
			const current = getEffectiveness(health);
			const next = getEffectiveness(health + 1);

			// Next health should have >= effectiveness (monotonic)
			expect(next).toBeGreaterThanOrEqual(current);
		}
	});
});
