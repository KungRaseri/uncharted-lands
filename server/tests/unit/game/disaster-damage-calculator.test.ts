/**
 * Unit Tests for Disaster Damage Calculator
 * Tests production modifier calculations from active disasters
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { calculateAllDisasterModifiers } from '../../../src/game/disaster-damage-calculator.js';

describe('calculateAllDisasterModifiers', () => {
	beforeEach(() => {
		// Reset time mocking before each test
		vi.useRealTimers();
	});

	describe('No Active Disasters', () => {
		test('should return all modifiers = 1 (100% production) when no disasters', () => {
			const result = calculateAllDisasterModifiers([], {}, Date.now());

			expect(result.resourceModifiers.food).toBe(1);
			expect(result.resourceModifiers.water).toBe(1);
			expect(result.resourceModifiers.wood).toBe(1);
			expect(result.resourceModifiers.stone).toBe(1);
			expect(result.resourceModifiers.ore).toBe(1);
			expect(result.totalPenalty).toBe(0);
		});

		test('should return all modifiers = 1 when disasters are in WARNING status', () => {
			const disasters = [{ type: 'DROUGHT', status: 'WARNING', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			expect(result.resourceModifiers.food).toBe(1);
			expect(result.resourceModifiers.water).toBe(1);
			expect(result.totalPenalty).toBe(0);
		});

		test('should return all modifiers = 1 when disasters are in RESOLVED status', () => {
			const disasters = [{ type: 'DROUGHT', status: 'RESOLVED', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			expect(result.resourceModifiers.food).toBe(1);
			expect(result.resourceModifiers.water).toBe(1);
			expect(result.totalPenalty).toBe(0);
		});
	});

	describe('Single Disaster - IMPACT Phase', () => {
		test('DROUGHT in IMPACT should reduce food to 50% and water to 70%', () => {
			const disasters = [{ type: 'DROUGHT', status: 'IMPACT', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			expect(result.resourceModifiers.food).toBeCloseTo(0.5, 2);
			expect(result.resourceModifiers.water).toBeCloseTo(0.7, 2);
			expect(result.resourceModifiers.wood).toBe(1);
			expect(result.resourceModifiers.stone).toBe(1);
			expect(result.resourceModifiers.ore).toBe(1);
			expect(result.totalPenalty).toBeGreaterThan(0);
		});

		test('WILDFIRE in IMPACT should reduce wood to 60% and food to 80%', () => {
			const disasters = [{ type: 'WILDFIRE', status: 'IMPACT', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			expect(result.resourceModifiers.wood).toBeCloseTo(0.6, 2);
			expect(result.resourceModifiers.food).toBeCloseTo(0.8, 2);
			expect(result.resourceModifiers.water).toBe(1);
			expect(result.resourceModifiers.stone).toBe(1);
			expect(result.resourceModifiers.ore).toBe(1);
		});

		test('EARTHQUAKE in IMPACT should reduce stone/ore to 50% and wood to 80%', () => {
			const disasters = [{ type: 'EARTHQUAKE', status: 'IMPACT', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			expect(result.resourceModifiers.stone).toBeCloseTo(0.5, 2);
			expect(result.resourceModifiers.ore).toBeCloseTo(0.5, 2);
			expect(result.resourceModifiers.wood).toBeCloseTo(0.8, 2);
			expect(result.resourceModifiers.food).toBe(1);
			expect(result.resourceModifiers.water).toBe(1);
		});

		test('FLOOD in IMPACT should reduce all resources to 70%', () => {
			const disasters = [{ type: 'FLOOD', status: 'IMPACT', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			expect(result.resourceModifiers.food).toBeCloseTo(0.7, 2);
			expect(result.resourceModifiers.water).toBeCloseTo(0.7, 2);
			expect(result.resourceModifiers.wood).toBeCloseTo(0.7, 2);
			expect(result.resourceModifiers.stone).toBeCloseTo(0.7, 2);
			expect(result.resourceModifiers.ore).toBeCloseTo(0.7, 2);
		});

		test('LOCUST_SWARM in IMPACT should reduce food to 30% (most severe single resource)', () => {
			const disasters = [{ type: 'LOCUST_SWARM', status: 'IMPACT', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			expect(result.resourceModifiers.food).toBeCloseTo(0.3, 2);
			expect(result.resourceModifiers.water).toBe(1);
			expect(result.resourceModifiers.wood).toBe(1);
			expect(result.resourceModifiers.stone).toBe(1);
			expect(result.resourceModifiers.ore).toBe(1);
		});

		test('APOCALYPSE in IMPACT should reduce all resources to 30% (most severe overall)', () => {
			const disasters = [{ type: 'APOCALYPSE', status: 'IMPACT', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			expect(result.resourceModifiers.food).toBeCloseTo(0.3, 2);
			expect(result.resourceModifiers.water).toBeCloseTo(0.3, 2);
			expect(result.resourceModifiers.wood).toBeCloseTo(0.3, 2);
			expect(result.resourceModifiers.stone).toBeCloseTo(0.3, 2);
			expect(result.resourceModifiers.ore).toBeCloseTo(0.3, 2);
		});
	});

	describe('Single Disaster - AFTERMATH Phase (Time-Based Intensity)', () => {
		test('AFTERMATH just started (0ms elapsed) should have 100% intensity (same as IMPACT)', () => {
			const currentTime = Date.now();
			const impactEndedAt = new Date(currentTime); // Just ended
			const resolvedAt = new Date(currentTime + 60 * 60 * 1000); // 60 minutes duration

			const disasters = [{ type: 'DROUGHT', status: 'AFTERMATH', impactEndedAt, resolvedAt }];

			const result = calculateAllDisasterModifiers(disasters, {}, currentTime);

			// Should be same as IMPACT (100% intensity)
			expect(result.resourceModifiers.food).toBeCloseTo(0.5, 2);
			expect(result.resourceModifiers.water).toBeCloseTo(0.7, 2);
		});

		test('AFTERMATH mid-way (30min elapsed) should have ~50% intensity', () => {
			const currentTime = Date.now();
			const impactEndedAt = new Date(currentTime - 30 * 60 * 1000); // 30 minutes ago
			const resolvedAt = new Date(impactEndedAt.getTime() + 60 * 60 * 1000); // 60 minutes total duration

			const disasters = [{ type: 'DROUGHT', status: 'AFTERMATH', impactEndedAt, resolvedAt }];

			const result = calculateAllDisasterModifiers(disasters, {}, currentTime);

			// 50% intensity: food penalty = 1 - (1 - 0.5) * 0.5 = 0.75
			expect(result.resourceModifiers.food).toBeCloseTo(0.75, 2);
			// 50% intensity: water penalty = 1 - (1 - 0.7) * 0.5 = 0.85
			expect(result.resourceModifiers.water).toBeCloseTo(0.85, 2);
		});

		test('AFTERMATH ending (60min elapsed) should have ~0% intensity (no penalty)', () => {
			const currentTime = Date.now();
			const impactEndedAt = new Date(currentTime - 60 * 60 * 1000); // 60 minutes ago
			const resolvedAt = new Date(impactEndedAt.getTime() + 60 * 60 * 1000); // 60 minutes total duration

			const disasters = [{ type: 'DROUGHT', status: 'AFTERMATH', impactEndedAt, resolvedAt }];

			const result = calculateAllDisasterModifiers(disasters, {}, currentTime);

			// 0% intensity: no penalty (modifiers = 1)
			expect(result.resourceModifiers.food).toBeCloseTo(1, 2);
			expect(result.resourceModifiers.water).toBeCloseTo(1, 2);
		});

		test('AFTERMATH very old (120min elapsed) should clamp to 0% intensity', () => {
			const currentTime = Date.now();
			const impactEndedAt = new Date(currentTime - 120 * 60 * 1000); // 120 minutes ago
			const resolvedAt = new Date(impactEndedAt.getTime() + 60 * 60 * 1000); // 60 minutes total duration

			const disasters = [{ type: 'DROUGHT', status: 'AFTERMATH', impactEndedAt, resolvedAt }];

			const result = calculateAllDisasterModifiers(disasters, {}, currentTime);

			// Intensity clamped to 0, no penalty
			expect(result.resourceModifiers.food).toBe(1);
			expect(result.resourceModifiers.water).toBe(1);
		});
	});

	describe('Multiple Disasters - Multiplicative Combination', () => {
		test('DROUGHT + WILDFIRE (both IMPACT) should multiply food penalties: 0.5 × 0.8 = 0.4', () => {
			const disasters = [
				{ type: 'DROUGHT', status: 'IMPACT', impactEndedAt: undefined },
				{ type: 'WILDFIRE', status: 'IMPACT', impactEndedAt: undefined },
			];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			// Food: DROUGHT (0.5) × WILDFIRE (0.8) = 0.4
			expect(result.resourceModifiers.food).toBeCloseTo(0.4, 2);
			// Water: DROUGHT (0.7) × WILDFIRE (1) = 0.7
			expect(result.resourceModifiers.water).toBeCloseTo(0.7, 2);
			// Wood: DROUGHT (1) × WILDFIRE (0.6) = 0.6
			expect(result.resourceModifiers.wood).toBeCloseTo(0.6, 2);
			expect(result.resourceModifiers.stone).toBe(1);
			expect(result.resourceModifiers.ore).toBe(1);
		});

		test('DROUGHT + FLOOD (both IMPACT) should multiply all affected resources', () => {
			const disasters = [
				{ type: 'DROUGHT', status: 'IMPACT', impactEndedAt: undefined },
				{ type: 'FLOOD', status: 'IMPACT', impactEndedAt: undefined },
			];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			// Food: DROUGHT (0.5) × FLOOD (0.7) = 0.35
			expect(result.resourceModifiers.food).toBeCloseTo(0.35, 2);
			// Water: DROUGHT (0.7) × FLOOD (0.7) = 0.49
			expect(result.resourceModifiers.water).toBeCloseTo(0.49, 2);
			// Wood: DROUGHT (1) × FLOOD (0.7) = 0.7
			expect(result.resourceModifiers.wood).toBeCloseTo(0.7, 2);
			// Stone: DROUGHT (1) × FLOOD (0.7) = 0.7
			expect(result.resourceModifiers.stone).toBeCloseTo(0.7, 2);
			// Ore: DROUGHT (1) × FLOOD (0.7) = 0.7
			expect(result.resourceModifiers.ore).toBeCloseTo(0.7, 2);
		});

		test('Three disasters (DROUGHT + WILDFIRE + EARTHQUAKE) should stack multiplicatively', () => {
			const disasters = [
				{ type: 'DROUGHT', status: 'IMPACT', impactEndedAt: undefined },
				{ type: 'WILDFIRE', status: 'IMPACT', impactEndedAt: undefined },
				{ type: 'EARTHQUAKE', status: 'IMPACT', impactEndedAt: undefined },
			];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			// Food: DROUGHT (0.5) × WILDFIRE (0.8) × EARTHQUAKE (1) = 0.4
			expect(result.resourceModifiers.food).toBeCloseTo(0.4, 2);
			// Wood: DROUGHT (1) × WILDFIRE (0.6) × EARTHQUAKE (0.8) = 0.48
			expect(result.resourceModifiers.wood).toBeCloseTo(0.48, 2);
			// Stone: DROUGHT (1) × WILDFIRE (1) × EARTHQUAKE (0.5) = 0.5
			expect(result.resourceModifiers.stone).toBeCloseTo(0.5, 2);
			// Ore: DROUGHT (1) × WILDFIRE (1) × EARTHQUAKE (0.5) = 0.5
			expect(result.resourceModifiers.ore).toBeCloseTo(0.5, 2);
		});
	});

	describe('Mixed Phases (IMPACT + AFTERMATH)', () => {
		test('DROUGHT (IMPACT) + WILDFIRE (AFTERMATH 50%) should combine with intensity', () => {
			const currentTime = Date.now();
			const impactEndedAt = new Date(currentTime - 30 * 60 * 1000); // 30 minutes ago
			const resolvedAt = new Date(impactEndedAt.getTime() + 60 * 60 * 1000); // 60 minutes duration = 50% intensity

			const disasters = [
				{ type: 'DROUGHT', status: 'IMPACT', impactEndedAt: undefined, resolvedAt: undefined },
				{ type: 'WILDFIRE', status: 'AFTERMATH', impactEndedAt, resolvedAt },
			];

			const result = calculateAllDisasterModifiers(disasters, {}, currentTime);

			// Food: DROUGHT (0.5, 100% intensity) × WILDFIRE (0.8, 50% intensity)
			// WILDFIRE at 50%: 1 - (1 - 0.8) * 0.5 = 0.9
			// Combined: 0.5 × 0.9 = 0.45
			expect(result.resourceModifiers.food).toBeCloseTo(0.45, 2);

			// Wood: DROUGHT (1) × WILDFIRE (0.6, 50% intensity)
			// WILDFIRE at 50%: 1 - (1 - 0.6) * 0.5 = 0.8
			expect(result.resourceModifiers.wood).toBeCloseTo(0.8, 2);
		});

		test('Two AFTERMATH disasters at different intensities should combine correctly', () => {
			const currentTime = Date.now();
			const recentImpactEnd = new Date(currentTime - 15 * 60 * 1000); // 15 min ago
			const recentResolvedAt = new Date(recentImpactEnd.getTime() + 60 * 60 * 1000); // 60 min duration = 75% intensity
			const oldImpactEnd = new Date(currentTime - 45 * 60 * 1000); // 45 min ago
			const oldResolvedAt = new Date(oldImpactEnd.getTime() + 60 * 60 * 1000); // 60 min duration = 25% intensity

			const disasters = [
				{
					type: 'DROUGHT',
					status: 'AFTERMATH',
					impactEndedAt: recentImpactEnd,
					resolvedAt: recentResolvedAt,
				},
				{
					type: 'WILDFIRE',
					status: 'AFTERMATH',
					impactEndedAt: oldImpactEnd,
					resolvedAt: oldResolvedAt,
				},
			];

			const result = calculateAllDisasterModifiers(disasters, {}, currentTime);

			// DROUGHT food penalty at 75% intensity: 1 - (1 - 0.5) * 0.75 = 0.625
			// WILDFIRE food penalty at 25% intensity: 1 - (1 - 0.8) * 0.25 = 0.95
			// Combined: 0.625 × 0.95 ≈ 0.594
			expect(result.resourceModifiers.food).toBeCloseTo(0.594, 2);
		});
	});

	describe('Edge Cases', () => {
		test('should ignore unknown disaster types', () => {
			const disasters = [{ type: 'UNKNOWN_DISASTER', status: 'IMPACT', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			expect(result.resourceModifiers.food).toBe(1);
			expect(result.resourceModifiers.water).toBe(1);
			expect(result.resourceModifiers.wood).toBe(1);
			expect(result.resourceModifiers.stone).toBe(1);
			expect(result.resourceModifiers.ore).toBe(1);
			expect(result.totalPenalty).toBe(0);
		});

		test('should handle missing impactEndedAt in AFTERMATH (treat as just ended)', () => {
			const disasters = [{ type: 'DROUGHT', status: 'AFTERMATH', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			// Without impactEndedAt, function should handle gracefully
			// Implementation may skip or treat as 100% intensity
			expect(result.resourceModifiers.food).toBeLessThanOrEqual(1);
			expect(result.resourceModifiers.food).toBeGreaterThanOrEqual(0);
		});

		test('should handle very large number of simultaneous disasters', () => {
			const disasters = Array.from({ length: 10 }, (_, i) => ({
				type: i % 2 === 0 ? 'DROUGHT' : 'WILDFIRE',
				status: 'IMPACT',
				impactEndedAt: undefined,
			}));

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			// Should still produce valid modifiers between 0 and 1
			expect(result.resourceModifiers.food).toBeGreaterThan(0);
			expect(result.resourceModifiers.food).toBeLessThanOrEqual(1);
		});

		test('should calculate totalPenalty correctly for multiple disasters', () => {
			const disasters = [
				{ type: 'DROUGHT', status: 'IMPACT', impactEndedAt: undefined },
				{ type: 'WILDFIRE', status: 'IMPACT', impactEndedAt: undefined },
			];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			// Total penalty should be average of both disasters' penalties
			expect(result.totalPenalty).toBeGreaterThan(0);
			expect(result.totalPenalty).toBeLessThanOrEqual(1);
		});
	});

	describe('Disaster Type Coverage', () => {
		const disasterTypes = [
			'DROUGHT',
			'WILDFIRE',
			'FLOOD',
			'EARTHQUAKE',
			'VOLCANIC_ERUPTION',
			'LANDSLIDE',
			'SINKHOLE',
			'AVALANCHE',
			'HURRICANE',
			'TORNADO',
			'TSUNAMI',
			'MONSOON',
			'SANDSTORM',
			'PLAGUE',
			'LOCUST_SWARM',
			'BLIGHT',
			'BLIZZARD',
			'HEATWAVE',
			'METEOR_STRIKE',
			'COLD_SNAP',
			'SUPERSTORM',
			'MEGAQUAKE',
			'APOCALYPSE',
		];

		test.each(disasterTypes)('%s should have production penalties defined', (disasterType) => {
			const disasters = [{ type: disasterType, status: 'IMPACT', impactEndedAt: undefined }];

			const result = calculateAllDisasterModifiers(disasters, {}, Date.now());

			// At least one resource should have a penalty (modifier < 1)
			const hasEffect = Object.values(result.resourceModifiers).some((modifier) => modifier < 1);
			expect(hasEffect).toBe(true);
		});
	});
});
