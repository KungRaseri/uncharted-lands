import { describe, it, expect } from 'vitest';
import {
	formatElevation,
	formatTemperature,
	formatPrecipitation,
	formatArea,
	formatElevationAsPercent,
	formatRange,
	formatResourceAmount,
	formatEnergyValue
} from '$lib/utils/formatters';

describe('formatters', () => {
	describe('formatElevation', () => {
		it('should format elevation with 3 decimals by default', () => {
			expect(formatElevation(0.456789)).toBe('0.457');
		});

		it('should format elevation with custom decimals', () => {
			expect(formatElevation(0.456789, 2)).toBe('0.46');
			expect(formatElevation(0.456789, 4)).toBe('0.4568');
		});

		it('should handle negative elevation', () => {
			expect(formatElevation(-0.5)).toBe('-0.500');
		});

		it('should handle zero elevation', () => {
			expect(formatElevation(0)).toBe('0.000');
		});

		it('should handle elevation of 1', () => {
			expect(formatElevation(1)).toBe('1.000');
		});
	});

	describe('formatTemperature', () => {
		it('should format temperature with 3 decimals by default', () => {
			expect(formatTemperature(25.6789)).toBe('25.679');
		});

		it('should format temperature with custom decimals', () => {
			expect(formatTemperature(25.6789, 1)).toBe('25.7');
			expect(formatTemperature(25.6789, 2)).toBe('25.68');
		});

		it('should format temperature without unit by default', () => {
			expect(formatTemperature(25.6)).toBe('25.600');
		});

		it('should format temperature with unit when requested', () => {
			expect(formatTemperature(25.6, 1, true)).toBe('25.6°C');
		});

		it('should handle negative temperature', () => {
			expect(formatTemperature(-10.5, 1, true)).toBe('-10.5°C');
		});

		it('should handle zero temperature', () => {
			expect(formatTemperature(0, 1, true)).toBe('0.0°C');
		});
	});

	describe('formatPrecipitation', () => {
		it('should format precipitation with 3 decimals by default', () => {
			expect(formatPrecipitation(123.456789)).toBe('123.457');
		});

		it('should format precipitation with custom decimals', () => {
			expect(formatPrecipitation(123.456789, 1)).toBe('123.5');
			expect(formatPrecipitation(123.456789, 2)).toBe('123.46');
		});

		it('should format precipitation without unit by default', () => {
			expect(formatPrecipitation(50.5)).toBe('50.500');
		});

		it('should format precipitation with unit when requested', () => {
			expect(formatPrecipitation(50.5, 1, true)).toBe('50.5mm');
		});

		it('should handle zero precipitation', () => {
			expect(formatPrecipitation(0, 1, true)).toBe('0.0mm');
		});

		it('should handle high precipitation', () => {
			expect(formatPrecipitation(1000, 0, true)).toBe('1000mm');
		});
	});

	describe('formatArea', () => {
		it('should format area without decimals', () => {
			expect(formatArea(123.456)).toBe('123');
		});

		it('should format area without unit by default', () => {
			expect(formatArea(500)).toBe('500');
		});

		it('should format area with unit when requested', () => {
			expect(formatArea(500, true)).toBe('500 m²');
		});

		it('should round fractional areas', () => {
			expect(formatArea(123.9)).toBe('124');
			expect(formatArea(123.4)).toBe('123');
		});

		it('should handle zero area', () => {
			expect(formatArea(0, true)).toBe('0 m²');
		});

		it('should handle large areas', () => {
			expect(formatArea(10000, true)).toBe('10000 m²');
		});
	});

	describe('formatElevationAsPercent', () => {
		it('should format elevation as percentage with 1 decimal by default', () => {
			expect(formatElevationAsPercent(0.456)).toBe('45.6%');
		});

		it('should format elevation as percentage with custom decimals', () => {
			expect(formatElevationAsPercent(0.456, 0)).toBe('46%');
			expect(formatElevationAsPercent(0.456, 2)).toBe('45.60%');
		});

		it('should handle 0% elevation', () => {
			expect(formatElevationAsPercent(0)).toBe('0.0%');
		});

		it('should handle 100% elevation', () => {
			expect(formatElevationAsPercent(1)).toBe('100.0%');
		});

		it('should handle fractional percentages', () => {
			expect(formatElevationAsPercent(0.123, 1)).toBe('12.3%');
		});
	});

	describe('formatRange', () => {
		it('should format range with 2 decimals by default', () => {
			expect(formatRange(0.1, 0.9)).toBe('0.10 to 0.90');
		});

		it('should format range with custom decimals', () => {
			expect(formatRange(0.123, 0.987, 3)).toBe('0.123 to 0.987');
			expect(formatRange(0.123, 0.987, 1)).toBe('0.1 to 1.0');
		});

		it('should handle negative ranges', () => {
			expect(formatRange(-0.5, 0.5, 2)).toBe('-0.50 to 0.50');
		});

		it('should handle zero range', () => {
			expect(formatRange(0, 0, 2)).toBe('0.00 to 0.00');
		});

		it('should handle equal min and max', () => {
			expect(formatRange(0.5, 0.5, 3)).toBe('0.500 to 0.500');
		});
	});

	describe('formatResourceAmount', () => {
		it('should format resource amount without decimals', () => {
			expect(formatResourceAmount(123.456)).toBe('123');
		});

		it('should handle zero resources', () => {
			expect(formatResourceAmount(0)).toBe('0');
		});

		it('should handle large resource amounts', () => {
			expect(formatResourceAmount(99999)).toBe('99999');
		});

		it('should round fractional amounts', () => {
			expect(formatResourceAmount(10.9)).toBe('11');
			expect(formatResourceAmount(10.1)).toBe('10');
		});

		it('should handle negative resources (debt)', () => {
			expect(formatResourceAmount(-50)).toBe('-50');
		});
	});

	describe('formatEnergyValue', () => {
		it('should format energy value with 1 decimal', () => {
			expect(formatEnergyValue(12.345)).toBe('12.3');
		});

		it('should handle zero energy', () => {
			expect(formatEnergyValue(0)).toBe('0.0');
		});

		it('should handle whole numbers', () => {
			expect(formatEnergyValue(100)).toBe('100.0');
		});

		it('should round to 1 decimal', () => {
			expect(formatEnergyValue(12.98)).toBe('13.0');
			expect(formatEnergyValue(12.34)).toBe('12.3');
		});

		it('should handle decimal values', () => {
			expect(formatEnergyValue(0.5)).toBe('0.5');
		});
	});

	describe('formatter consistency', () => {
		it('should maintain precision across different value magnitudes', () => {
			expect(formatElevation(0.001, 3)).toBe('0.001');
			expect(formatElevation(0.999, 3)).toBe('0.999');
		});

		it('should handle edge cases uniformly', () => {
			expect(formatTemperature(0, 1, true)).toBe('0.0°C');
			expect(formatPrecipitation(0, 1, true)).toBe('0.0mm');
			expect(formatArea(0, true)).toBe('0 m²');
		});
	});
});
