import { describe, it, expect } from 'vitest';
import { calculateAreaCapacity } from '../../../src/utils/area-calculator.js';

/**
 * Unit Tests: Area Calculator
 *
 * Tests the Building Area System calculation utilities:
 * - Area capacity formula: 500 + (TH level × 100)
 *
 * NOTE: Database-dependent functions (getTownHallLevel, calculateAreaUsed, etc.)
 * are tested in integration tests instead of unit tests.
 */
describe('Area Calculator', () => {
  describe('calculateAreaCapacity', () => {
    it('should return 500 for Town Hall level 0 (no Town Hall)', () => {
      expect(calculateAreaCapacity(0)).toBe(500);
    });

    it('should return 600 for Town Hall level 1', () => {
      expect(calculateAreaCapacity(1)).toBe(600);
    });

    it('should return 1000 for Town Hall level 5', () => {
      expect(calculateAreaCapacity(5)).toBe(1000);
    });

    it('should return 1500 for Town Hall level 10', () => {
      expect(calculateAreaCapacity(10)).toBe(1500);
    });

    it('should handle negative levels correctly (formula: 500 + level * 100)', () => {
      // For negative inputs, the formula returns 500 + (negative * 100)
      // e.g., -5 → 500 + (-5 * 100) = 500 - 500 = 0
      expect(calculateAreaCapacity(-5)).toBe(0);
    });
  });
});
