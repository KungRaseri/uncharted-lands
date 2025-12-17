/**
 * Integration tests for consumption system
 *
 * Tests consumption over time with actual game loop mechanics
 * Validates GDD Section 6.4 compliance in realistic scenarios
 *
 * @see docs/game-design/GDD-Monolith.md Section 6.4
 */

import { describe, it, expect } from 'vitest';
import {
	calculateConsumption,
	hasResourcesForPopulation,
	getConsumptionSummary,
} from '../../../src/game/consumption-calculator.js';
import type { Resources } from '../../../src/game/resource-calculator.js';
import { MODIFIER_NAMES } from '../../../src/game/modifier-names.js';

describe('Consumption Integration Tests', () => {
	describe('Consumption Over Time', () => {
		it('should consume correct amount over 1 game hour (3600 ticks)', () => {
			const population = 100;
			const structureCount = 10;
			const ticksPerHour = 3600;

			const consumption = calculateConsumption(population, structureCount, ticksPerHour);

			// GDD Section 6.4: 18 food/person/hour, 36 water/person/hour
			expect(consumption.food).toBeCloseTo(1800, 0); // 100 × 18
			expect(consumption.water).toBeCloseTo(3600, 0); // 100 × 36

			// GDD Section 6.4: 3.6 wood/structure/hour, 1.8 stone, 0.9 ore
			expect(consumption.wood).toBeCloseTo(36, 0); // 10 × 3.6
			expect(consumption.stone).toBeCloseTo(18, 0); // 10 × 1.8
			expect(consumption.ore).toBeCloseTo(9, 0); // 10 × 0.9
		});

		it('should consume correct amount over 24 game hours (86,400 ticks)', () => {
			const population = 50;
			const structureCount = 20;
			const ticksPer24Hours = 3600 * 24; // 86,400 ticks

			const consumption = calculateConsumption(population, structureCount, ticksPer24Hours);

			// 24 hours: population × rate × 24
			expect(consumption.food).toBeCloseTo(50 * 18 * 24, 0); // 21,600
			expect(consumption.water).toBeCloseTo(50 * 36 * 24, 0); // 43,200

			// 24 hours: structures × rate × 24
			expect(consumption.wood).toBeCloseTo(20 * 3.6 * 24, 0); // 1,728
			expect(consumption.stone).toBeCloseTo(20 * 1.8 * 24, 0); // 864
			expect(consumption.ore).toBeCloseTo(20 * 0.9 * 24, 0); // 432
		});

		it('should scale consumption with world template multipliers', () => {
			const population = 10;
			const structureCount = 5;
			const ticksPerHour = 3600;

			// Test different difficulty levels
			const relaxed = calculateConsumption(population, structureCount, ticksPerHour, 0.7); // 30% less
			const normal = calculateConsumption(population, structureCount, ticksPerHour, 1); // Standard
			const hardcore = calculateConsumption(population, structureCount, ticksPerHour, 1.5); // 50% more

			// Verify scaling for food (18/hour per person × 10 people)
			expect(relaxed.food).toBeCloseTo(180 * 0.7, 0); // 126
			expect(normal.food).toBeCloseTo(180, 0); // 180
			expect(hardcore.food).toBeCloseTo(180 * 1.5, 0); // 270

			// Verify scaling for wood (3.6/hour per structure × 5 structures)
			expect(relaxed.wood).toBeCloseTo(18 * 0.7, 0); // 12.6
			expect(normal.wood).toBeCloseTo(18, 0); // 18
			expect(hardcore.wood).toBeCloseTo(18 * 1.5, 0); // 27
		});

		it('should accumulate consumption accurately over multiple ticks', () => {
			const population = 5;
			const structureCount = 2;

			// Simulate 60 individual ticks (1 second of game time)
			let totalConsumption: Resources = {
				food: 0,
				water: 0,
				wood: 0,
				stone: 0,
				ore: 0,
			};

			for (let i = 0; i < 60; i++) {
				const tickConsumption = calculateConsumption(population, structureCount, 1);
				totalConsumption.food += tickConsumption.food;
				totalConsumption.water += tickConsumption.water;
				totalConsumption.wood += tickConsumption.wood;
				totalConsumption.stone += tickConsumption.stone;
				totalConsumption.ore += tickConsumption.ore;
			}

			// Should equal single call with tickCount=60
			const bulkConsumption = calculateConsumption(population, structureCount, 60);

			expect(totalConsumption.food).toBeCloseTo(bulkConsumption.food, 5);
			expect(totalConsumption.water).toBeCloseTo(bulkConsumption.water, 5);
			expect(totalConsumption.wood).toBeCloseTo(bulkConsumption.wood, 5);
			expect(totalConsumption.stone).toBeCloseTo(bulkConsumption.stone, 5);
			expect(totalConsumption.ore).toBeCloseTo(bulkConsumption.ore, 5);
		});
	});

	describe('Resource Sufficiency Checks', () => {
		it('should prevent negative resources with insufficiency detection', () => {
			const population = 100;
			const structureCount = 10;

			// Resources that can last < 1 hour
			const insufficientResources: Resources = {
				food: 100, // Need 1,800/hour
				water: 200, // Need 3,600/hour
				wood: 5, // Need 36/hour
				stone: 2, // Need 18/hour
				ore: 1, // Need 9/hour
			};

			const sufficient = hasResourcesForPopulation(
				population,
				structureCount,
				insufficientResources
			);

			expect(sufficient).toBe(false);

			// Verify each resource individually would trigger insufficiency
			expect(insufficientResources.food).toBeLessThan(1800);
			expect(insufficientResources.water).toBeLessThan(3600);
			expect(insufficientResources.wood).toBeLessThan(36);
			expect(insufficientResources.stone).toBeLessThan(18);
			expect(insufficientResources.ore).toBeLessThan(9);
		});

		it('should allow consumption when resources are abundant (7+ days)', () => {
			const population = 50;
			const structureCount = 10;

			// 7 days worth of resources (GDD late-game target)
			const hourlyConsumption = calculateConsumption(population, structureCount, 3600);
			const abundantResources: Resources = {
				food: hourlyConsumption.food * 24 * 7, // 7 days
				water: hourlyConsumption.water * 24 * 7,
				wood: hourlyConsumption.wood * 24 * 7,
				stone: hourlyConsumption.stone * 24 * 7,
				ore: hourlyConsumption.ore * 24 * 7,
			};

			const sufficient = hasResourcesForPopulation(population, structureCount, abundantResources);

			expect(sufficient).toBe(true);

			// Verify 7-day supplies (GDD late-game balance goal)
			expect(abundantResources.food).toBeCloseTo(50 * 18 * 24 * 7, 0); // 151,200
			expect(abundantResources.water).toBeCloseTo(50 * 36 * 24 * 7, 0); // 302,400
		});

		it('should handle edge case of exactly sufficient resources', () => {
			const population = 10;
			const structureCount = 5;

			// Exactly 1 hour of resources
			const exactResources: Resources = {
				food: 180, // 10 × 18
				water: 360, // 10 × 36
				wood: 18, // 5 × 3.6
				stone: 9, // 5 × 1.8
				ore: 4.5, // 5 × 0.9
			};

			const sufficient = hasResourcesForPopulation(population, structureCount, exactResources);

			// Should be true (resources >= consumption)
			expect(sufficient).toBe(true);
		});

		it('should handle zero consumption edge case', () => {
			const population = 0;
			const structureCount = 0;

			const emptyResources: Resources = {
				food: 0,
				water: 0,
				wood: 0,
				stone: 0,
				ore: 0,
			};

			// With no population or structures, no consumption
			const sufficient = hasResourcesForPopulation(population, structureCount, emptyResources);

			expect(sufficient).toBe(true);
		});
	});

	describe('Consumption Summary Integration', () => {
		it('should provide accurate per-capita hourly rates for UI display', () => {
			const mockStructures = [
				{
					id: 'house-1',
					name: 'House',
					description: 'Basic housing',
					category: 'BUILDING' as const,
					level: 1,
					modifiers: [
						{
							id: 'mod-1',
							structureId: 'house-1',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: '+5 population capacity',
							value: 5,
						},
					],
				},
			];

			const summary = getConsumptionSummary(mockStructures);

			// Per-capita hourly rates should match GDD Section 6.4
			expect(summary.perCapitaPerHour.food).toBeCloseTo(18, 0);
			expect(summary.perCapitaPerHour.water).toBeCloseTo(36, 0);
		});

		it('should provide accurate per-structure hourly rates for UI display', () => {
			const mockStructures = [
				{
					id: 'farm-1',
					name: 'Farm',
					description: 'Food production',
					category: 'EXTRACTOR' as const,
					level: 1,
					modifiers: [],
				},
			];

			const summary = getConsumptionSummary(mockStructures);

			// Per-structure hourly rates should match GDD Section 6.4
			expect(summary.perStructurePerHour.wood).toBeCloseTo(3.6, 1);
			expect(summary.perStructurePerHour.stone).toBeCloseTo(1.8, 1);
			expect(summary.perStructurePerHour.ore).toBeCloseTo(0.9, 1);
		});

		it('should calculate total consumption correctly for complex settlement', () => {
			const mockStructures = [
				// 3 houses = 15 capacity
				{
					id: 'house-1',
					name: 'House',
					description: 'Basic housing',
					category: 'BUILDING' as const,
					level: 1,
					modifiers: [
						{
							id: 'mod-1',
							structureId: 'house-1',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: '+5 population capacity',
							value: 5,
						},
					],
				},
				{
					id: 'house-2',
					name: 'House',
					description: 'Basic housing',
					category: 'BUILDING' as const,
					level: 1,
					modifiers: [
						{
							id: 'mod-2',
							structureId: 'house-2',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: '+5 population capacity',
							value: 5,
						},
					],
				},
				{
					id: 'house-3',
					name: 'House',
					description: 'Basic housing',
					category: 'BUILDING' as const,
					level: 1,
					modifiers: [
						{
							id: 'mod-3',
							structureId: 'house-3',
							name: MODIFIER_NAMES.POPULATION_CAPACITY,
							description: '+5 population capacity',
							value: 5,
						},
					],
				},
				// 2 farms
				{
					id: 'farm-1',
					name: 'Farm',
					description: 'Food production',
					category: 'EXTRACTOR' as const,
					level: 1,
					modifiers: [],
				},
				{
					id: 'farm-2',
					name: 'Farm',
					description: 'Food production',
					category: 'EXTRACTOR' as const,
					level: 1,
					modifiers: [],
				},
			];

			const summary = getConsumptionSummary(mockStructures);

			// Verify population calculation
			expect(summary.population).toBe(25); // 10 base + 3×5 capacity
			expect(summary.structureCount).toBe(5);

			// Consumption for 60 ticks (1 second)
			// Population: 25 × (0.005 food + 0.01 water) × 60 = 7.5 food, 15 water
			expect(summary.consumption.food).toBeCloseTo(7.5, 1);
			expect(summary.consumption.water).toBeCloseTo(15, 1);

			// Structures: 5 × (0.001 wood + 0.0005 stone + 0.00025 ore) × 60
			expect(summary.consumption.wood).toBeCloseTo(0.3, 2);
			expect(summary.consumption.stone).toBeCloseTo(0.15, 2);
			expect(summary.consumption.ore).toBeCloseTo(0.075, 3);
		});
	});

	describe('Precision and Edge Cases', () => {
		it('should handle fractional population without rounding errors', () => {
			// Even though population should be integers, test precision
			const population = 1;
			const consumption1 = calculateConsumption(population, 0, 3600);

			// 1 person × 18 food/hour = 18
			expect(consumption1.food).toBeCloseTo(18, 5);
			expect(consumption1.water).toBeCloseTo(36, 5);
		});

		it('should handle very large populations efficiently', () => {
			const population = 10000;
			const structureCount = 1000;
			const consumption = calculateConsumption(population, structureCount, 3600);

			// 10,000 × 18 = 180,000 food/hour
			expect(consumption.food).toBeCloseTo(180000, 0);
			// 1,000 × 3.6 = 3,600 wood/hour
			expect(consumption.wood).toBeCloseTo(3600, 0);
		});

		it('should handle very small tick counts (single tick precision)', () => {
			const population = 100;
			const singleTickConsumption = calculateConsumption(population, 0, 1);

			// Single tick = (18/3600) × 100 = 0.5
			expect(singleTickConsumption.food).toBeCloseTo(0.5, 5);
			expect(singleTickConsumption.water).toBeCloseTo(1, 5);
		});

		it('should maintain precision over extended periods (7 days)', () => {
			const population = 50;
			const structureCount = 10;
			const ticksPer7Days = 3600 * 24 * 7; // 604,800 ticks

			const consumption = calculateConsumption(population, structureCount, ticksPer7Days);

			// 50 × 18 × 24 × 7 = 151,200 food
			expect(consumption.food).toBeCloseTo(151200, 0);
			// 50 × 36 × 24 × 7 = 302,400 water
			expect(consumption.water).toBeCloseTo(302400, 0);
			// 10 × 3.6 × 24 × 7 = 6,048 wood
			expect(consumption.wood).toBeCloseTo(6048, 0);
		});
	});

	describe('World Template Multiplier Scenarios', () => {
		it('should apply multipliers correctly for relaxed mode (0.7x)', () => {
			const population = 20;
			const structureCount = 5;
			const ticksPerHour = 3600;

			const consumption = calculateConsumption(population, structureCount, ticksPerHour, 0.7);

			// 20 × 18 × 0.7 = 252
			expect(consumption.food).toBeCloseTo(252, 0);
			// 20 × 36 × 0.7 = 504
			expect(consumption.water).toBeCloseTo(504, 0);
		});

		it('should apply multipliers correctly for hardcore mode (1.5x)', () => {
			const population = 20;
			const structureCount = 5;
			const ticksPerHour = 3600;

			const consumption = calculateConsumption(population, structureCount, ticksPerHour, 1.5);

			// 20 × 18 × 1.5 = 540
			expect(consumption.food).toBeCloseTo(540, 0);
			// 20 × 36 × 1.5 = 1,080
			expect(consumption.water).toBeCloseTo(1080, 0);
		});

		it('should handle extreme multipliers (2.0x apocalypse mode)', () => {
			const population = 10;
			const structureCount = 3;
			const ticksPerHour = 3600;

			const consumption = calculateConsumption(population, structureCount, ticksPerHour, 2);

			// 10 × 18 × 2.0 = 360
			expect(consumption.food).toBeCloseTo(360, 0);
			// 3 × 3.6 × 2.0 = 21.6
			expect(consumption.wood).toBeCloseTo(21.6, 1);
		});
	});
});

