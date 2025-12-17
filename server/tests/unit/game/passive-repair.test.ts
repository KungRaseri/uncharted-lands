import { describe, test, expect } from 'vitest';
import {
	isEligibleForPassiveRepair,
	calculatePassiveRepairTime,
	PASSIVE_REPAIR_CONFIG,
} from '../../../src/game/passive-repair.js';

describe('Passive Repair System', () => {
	describe('PASSIVE_REPAIR_CONFIG', () => {
		test('repair rate is 1% per hour', () => {
			expect(PASSIVE_REPAIR_CONFIG.REPAIR_RATE_PER_HOUR).toBe(1);
		});

		test('minimum health for passive repair is 21%', () => {
			expect(PASSIVE_REPAIR_CONFIG.MIN_HEALTH_FOR_PASSIVE).toBe(21);
		});

		test('maximum health is 100%', () => {
			expect(PASSIVE_REPAIR_CONFIG.MAX_HEALTH).toBe(100);
		});

		test('required structure is WORKSHOP', () => {
			expect(PASSIVE_REPAIR_CONFIG.REQUIRED_STRUCTURE).toBe('WORKSHOP');
		});
	});

	describe('isEligibleForPassiveRepair', () => {
		test('returns false for health below 21% (critical)', () => {
			expect(isEligibleForPassiveRepair(0)).toBe(false);
			expect(isEligibleForPassiveRepair(10)).toBe(false);
			expect(isEligibleForPassiveRepair(20)).toBe(false);
		});

		test('returns true for health 21-99% (eligible)', () => {
			expect(isEligibleForPassiveRepair(21)).toBe(true);
			expect(isEligibleForPassiveRepair(50)).toBe(true);
			expect(isEligibleForPassiveRepair(75)).toBe(true);
			expect(isEligibleForPassiveRepair(99)).toBe(true);
		});

		test('returns false for health 100% (pristine)', () => {
			expect(isEligibleForPassiveRepair(100)).toBe(false);
		});

		test('handles edge cases', () => {
			// Exactly at min threshold
			expect(isEligibleForPassiveRepair(21)).toBe(true);

			// Just below min threshold
			expect(isEligibleForPassiveRepair(20.9)).toBe(false);

			// Just below max
			expect(isEligibleForPassiveRepair(99.9)).toBe(true);

			// At max
			expect(isEligibleForPassiveRepair(100)).toBe(false);
		});
	});

	describe('calculatePassiveRepairTime', () => {
		test('returns null for health below 21% (not eligible)', () => {
			expect(calculatePassiveRepairTime(0)).toBe(null);
			expect(calculatePassiveRepairTime(10)).toBe(null);
			expect(calculatePassiveRepairTime(20)).toBe(null);
		});

		test('returns null for health 100% (already pristine)', () => {
			expect(calculatePassiveRepairTime(100)).toBe(null);
		});

		test('calculates correct hours for eligible structures', () => {
			// 99% → 100% = 1 hour
			expect(calculatePassiveRepairTime(99)).toBe(1);

			// 98% → 100% = 2 hours
			expect(calculatePassiveRepairTime(98)).toBe(2);

			// 95% → 100% = 5 hours
			expect(calculatePassiveRepairTime(95)).toBe(5);

			// 90% → 100% = 10 hours
			expect(calculatePassiveRepairTime(90)).toBe(10);

			// 75% → 100% = 25 hours
			expect(calculatePassiveRepairTime(75)).toBe(25);

			// 50% → 100% = 50 hours
			expect(calculatePassiveRepairTime(50)).toBe(50);

			// 21% → 100% = 79 hours
			expect(calculatePassiveRepairTime(21)).toBe(79);
		});

		test('rounds up to nearest hour', () => {
			// 99.5% → 100% = 0.5 hours → ceil to 1 hour
			expect(calculatePassiveRepairTime(99.5)).toBe(1);

			// 98.1% → 100% = 1.9 hours → ceil to 2 hours
			expect(calculatePassiveRepairTime(98.1)).toBe(2);

			// 95.7% → 100% = 4.3 hours → ceil to 5 hours
			expect(calculatePassiveRepairTime(95.7)).toBe(5);
		});

		test('handles edge cases at thresholds', () => {
			// Exactly at min threshold (21%)
			expect(calculatePassiveRepairTime(21)).toBe(79);

			// Just above max (should be null)
			expect(calculatePassiveRepairTime(100)).toBe(null);

			// Just below min (should be null)
			expect(calculatePassiveRepairTime(20.9)).toBe(null);
		});
	});

	describe('Passive Repair Scenarios', () => {
		test('structure with 80% health repairs in 20 hours', () => {
			const currentHealth = 80;
			const isEligible = isEligibleForPassiveRepair(currentHealth);
			const hoursToRepair = calculatePassiveRepairTime(currentHealth);

			expect(isEligible).toBe(true);
			expect(hoursToRepair).toBe(20);
		});

		test('structure with 15% health cannot passively repair', () => {
			const currentHealth = 15;
			const isEligible = isEligibleForPassiveRepair(currentHealth);
			const hoursToRepair = calculatePassiveRepairTime(currentHealth);

			expect(isEligible).toBe(false);
			expect(hoursToRepair).toBe(null);
		});

		test('pristine structure does not need repair', () => {
			const currentHealth = 100;
			const isEligible = isEligibleForPassiveRepair(currentHealth);
			const hoursToRepair = calculatePassiveRepairTime(currentHealth);

			expect(isEligible).toBe(false);
			expect(hoursToRepair).toBe(null);
		});

		test('structure at 21% (minimum) can passively repair', () => {
			const currentHealth = 21;
			const isEligible = isEligibleForPassiveRepair(currentHealth);
			const hoursToRepair = calculatePassiveRepairTime(currentHealth);

			expect(isEligible).toBe(true);
			expect(hoursToRepair).toBe(79); // 79 hours to reach 100%
		});

		test('structure at 99% repairs in 1 hour', () => {
			const currentHealth = 99;
			const isEligible = isEligibleForPassiveRepair(currentHealth);
			const hoursToRepair = calculatePassiveRepairTime(currentHealth);

			expect(isEligible).toBe(true);
			expect(hoursToRepair).toBe(1);
		});
	});

	describe('GDD Compliance', () => {
		test('GDD Section 3.4: "1% health per hour with Workshop"', () => {
			// GDD specifies 1% restoration per hour
			expect(PASSIVE_REPAIR_CONFIG.REPAIR_RATE_PER_HOUR).toBe(1);
		});

		test('GDD Section 3.4: "Only works on structures above 20% health"', () => {
			// GDD specifies > 20%, which means >= 21%
			expect(PASSIVE_REPAIR_CONFIG.MIN_HEALTH_FOR_PASSIVE).toBe(21);

			// Verify 20% is not eligible
			expect(isEligibleForPassiveRepair(20)).toBe(false);

			// Verify 21% is eligible
			expect(isEligibleForPassiveRepair(21)).toBe(true);
		});

		test('GDD Section 3.4: "Requires Workshop structure"', () => {
			// GDD specifies Workshop as prerequisite
			expect(PASSIVE_REPAIR_CONFIG.REQUIRED_STRUCTURE).toBe('WORKSHOP');
		});

		test('GDD Section 3.4: Structure health ranges (0-100%)', () => {
			// Maximum health is 100%
			expect(PASSIVE_REPAIR_CONFIG.MAX_HEALTH).toBe(100);

			// Structures at 100% don't need repair
			expect(isEligibleForPassiveRepair(100)).toBe(false);

			// Structures can be damaged to 0%
			expect(isEligibleForPassiveRepair(0)).toBe(false);
		});
	});
});
