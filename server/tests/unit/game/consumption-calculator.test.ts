/**
 * Tests for Consumption Calculator
 */

import { describe, it, expect } from 'vitest';
import {
	calculatePopulationCapacity,
	calculatePopulation,
	calculateConsumption,
	calculateMorale,
	getConsumptionSummary,
	hasResourcesForPopulation,
	verifyConsumptionRates,
	CONSUMPTION_RATES,
	type Structure,
} from '../../../src/game/consumption-calculator.js';

describe('Consumption Calculator', () => {
	describe('GDD Compliance Verification', () => {
		it('should match GDD consumption rates exactly', () => {
			const result = verifyConsumptionRates();
			expect(result).toBe(true);
		});

		it('consumption constants should match GDD Section 6.4 specifications', () => {
			// Verify per-tick constants translate to correct hourly rates
			const ticksPerHour = 3600; // 60 ticks/second × 60 seconds/minute × 1 minute (game time runs 60x faster)

			// Population consumption (GDD Section 6.4)
			// Food: 18 units/person/hour
			expect(CONSUMPTION_RATES.FOOD_PER_PERSON_PER_TICK * ticksPerHour).toBeCloseTo(18, 2);
			// Water: 36 units/person/hour
			expect(CONSUMPTION_RATES.WATER_PER_PERSON_PER_TICK * ticksPerHour).toBeCloseTo(36, 2);

			// Structure maintenance (GDD Section 6.4)
			// Wood: 3.6 units/structure/hour
			expect(CONSUMPTION_RATES.WOOD_PER_STRUCTURE_PER_TICK * ticksPerHour).toBeCloseTo(3.6, 2);
			// Stone: 1.8 units/structure/hour
			expect(CONSUMPTION_RATES.STONE_PER_STRUCTURE_PER_TICK * ticksPerHour).toBeCloseTo(1.8, 2);
			// Ore: 0.9 units/structure/hour
			expect(CONSUMPTION_RATES.ORE_PER_STRUCTURE_PER_TICK * ticksPerHour).toBeCloseTo(0.9, 2);
		});
	});

	describe('calculatePopulationCapacity', () => {
		it('should return base capacity with no structures', () => {
			const capacity = calculatePopulationCapacity([]);
			expect(capacity).toBe(CONSUMPTION_RATES.BASE_POPULATION_CAPACITY);
		});

		it('should add population capacity modifiers', () => {
			const structures: Structure[] = [
				{
					name: 'House',
					modifiers: [{ name: 'Population Capacity', value: 5 }],
				},
				{
					name: 'House',
					modifiers: [{ name: 'Population Capacity', value: 5 }],
				},
			];

			const capacity = calculatePopulationCapacity(structures);
			expect(capacity).toBe(CONSUMPTION_RATES.BASE_POPULATION_CAPACITY + 10);
		});

		it('should ignore non-population modifiers', () => {
			const structures: Structure[] = [
				{
					name: 'Farm',
					modifiers: [
						{ name: 'Food Production', value: 10 },
						{ name: 'Population Capacity', value: 3 },
					],
				},
			];

			const capacity = calculatePopulationCapacity(structures);
			expect(capacity).toBe(CONSUMPTION_RATES.BASE_POPULATION_CAPACITY + 3);
		});

		it('should handle negative modifiers (minimum 0)', () => {
			const structures: Structure[] = [
				{
					name: 'Disaster',
					modifiers: [{ name: 'Population Capacity', value: -1000 }],
				},
			];

			const capacity = calculatePopulationCapacity(structures);
			expect(capacity).toBe(0);
		});
	});

	describe('calculatePopulation', () => {
		it('should match capacity when no current population provided', () => {
			const structures: Structure[] = [
				{
					name: 'House',
					modifiers: [{ name: 'Population Capacity', value: 5 }],
				},
			];

			const population = calculatePopulation(structures);
			const capacity = calculatePopulationCapacity(structures);
			expect(population).toBe(capacity);
		});

		it('should work with empty structures', () => {
			const population = calculatePopulation([]);
			expect(population).toBe(CONSUMPTION_RATES.BASE_POPULATION_CAPACITY);
		});
	});

	describe('calculateConsumption', () => {
		it('should calculate zero consumption for zero population and zero structures', () => {
			const consumption = calculateConsumption(0, 0, 60);

			expect(consumption.food).toBe(0);
			expect(consumption.water).toBe(0);
			expect(consumption.wood).toBe(0);
			expect(consumption.stone).toBe(0);
			expect(consumption.ore).toBe(0);
		});

		it('should calculate consumption for 1 person for 1 tick', () => {
			const consumption = calculateConsumption(1, 0, 1);

			expect(consumption.food).toBeCloseTo(CONSUMPTION_RATES.FOOD_PER_PERSON_PER_TICK);
			expect(consumption.water).toBeCloseTo(CONSUMPTION_RATES.WATER_PER_PERSON_PER_TICK);
		});

		it('should calculate consumption for multiple people', () => {
			const population = 10;
			const consumption = calculateConsumption(population, 0, 1);

			expect(consumption.food).toBeCloseTo(CONSUMPTION_RATES.FOOD_PER_PERSON_PER_TICK * population);
			expect(consumption.water).toBeCloseTo(
				CONSUMPTION_RATES.WATER_PER_PERSON_PER_TICK * population
			);
		});

		it('should scale consumption by tick count', () => {
			const population = 5;
			const ticks = 60; // 1 second
			const consumption = calculateConsumption(population, 0, ticks);

			expect(consumption.food).toBeCloseTo(
				CONSUMPTION_RATES.FOOD_PER_PERSON_PER_TICK * population * ticks
			);
			expect(consumption.water).toBeCloseTo(
				CONSUMPTION_RATES.WATER_PER_PERSON_PER_TICK * population * ticks
			);
		});

		it('should calculate hourly consumption correctly', () => {
			const population = 10;
			const ticksPerHour = 3600; // 60 ticks/second × 60 seconds/minute × 1 minute
			const consumption = calculateConsumption(population, 0, ticksPerHour);

			// GDD Section 6.4: 18 food/person/hour, 36 water/person/hour
			expect(consumption.food).toBeCloseTo(180, 0); // 10 people × 18 food/hour
			expect(consumption.water).toBeCloseTo(360, 0); // 10 people × 36 water/hour
		});

		it('should calculate structure maintenance consumption', () => {
			const structureCount = 5;
			const ticksPerHour = 3600;
			const consumption = calculateConsumption(0, structureCount, ticksPerHour);

			// GDD Section 6.4: Structure maintenance per hour
			// Wood: 3.6/structure/hour
			// Stone: 1.8/structure/hour
			// Ore: 0.9/structure/hour
			expect(consumption.wood).toBeCloseTo(18, 1); // 5 structures × 3.6/hour
			expect(consumption.stone).toBeCloseTo(9, 1); // 5 structures × 1.8/hour
			expect(consumption.ore).toBeCloseTo(4.5, 1); // 5 structures × 0.9/hour
		});
	});

	describe('calculateMorale', () => {
		it('should return base morale (50) with no structures', () => {
			const morale = calculateMorale([]);
			expect(morale).toBe(50);
		});

		it('should add morale boost modifiers', () => {
			const structures: Structure[] = [
				{
					name: 'Tavern',
					modifiers: [{ name: 'Morale Boost', value: 10 }],
				},
				{
					name: 'Theater',
					modifiers: [{ name: 'Morale Boost', value: 15 }],
				},
			];

			const morale = calculateMorale(structures);
			expect(morale).toBe(75);
		});

		it('should clamp morale to 100 maximum', () => {
			const structures: Structure[] = [
				{
					name: 'Paradise',
					modifiers: [{ name: 'Morale Boost', value: 200 }],
				},
			];

			const morale = calculateMorale(structures);
			expect(morale).toBe(100);
		});

		it('should clamp morale to 0 minimum', () => {
			const structures: Structure[] = [
				{
					name: 'Disaster',
					modifiers: [{ name: 'Morale Boost', value: -200 }],
				},
			];

			const morale = calculateMorale(structures);
			expect(morale).toBe(0);
		});
	});

	describe('getConsumptionSummary', () => {
		it('should return complete summary', () => {
			const structures: Structure[] = [
				{
					name: 'House',
					modifiers: [{ name: 'Population Capacity', value: 5 }],
				},
				{
					name: 'Tavern',
					modifiers: [{ name: 'Morale Boost', value: 10 }],
				},
			];

			const summary = getConsumptionSummary(structures);

			expect(summary.population).toBe(15); // Base 10 + 5
			expect(summary.capacity).toBe(15);
			expect(summary.morale).toBe(60); // Base 50 + 10
			expect(summary.consumption).toBeDefined();
			expect(summary.perCapitaPerSecond).toBeDefined();
			expect(summary.perCapitaPerHour).toBeDefined();
		});

		it('should calculate per-capita rates correctly', () => {
			const summary = getConsumptionSummary([]);

			// Per second = per tick × 60
			expect(summary.perCapitaPerSecond.food).toBeCloseTo(
				CONSUMPTION_RATES.FOOD_PER_PERSON_PER_TICK * 60
			);
			expect(summary.perCapitaPerSecond.water).toBeCloseTo(
				CONSUMPTION_RATES.WATER_PER_PERSON_PER_TICK * 60
			);

			// Per hour = per tick × 3600
			// GDD Section 6.4: 18 food/person/hour, 36 water/person/hour
			expect(summary.perCapitaPerHour.food).toBeCloseTo(18, 0);
			expect(summary.perCapitaPerHour.water).toBeCloseTo(36, 0);
		});
	});

	describe('hasResourcesForPopulation', () => {
		it('should return true when resources are sufficient for 1 hour', () => {
			const population = 10;
			const structureCount = 5;
			const resources = {
				food: 200, // 10 people × 18 food/hour = 180 needed
				water: 400, // 10 people × 36 water/hour = 360 needed
				wood: 20, // 5 structures × 3.6 wood/hour = 18 needed
				stone: 10, // 5 structures × 1.8 stone/hour = 9 needed
				ore: 5, // 5 structures × 0.9 ore/hour = 4.5 needed
			};

			const sufficient = hasResourcesForPopulation(population, structureCount, resources);
			expect(sufficient).toBe(true);
		});

		it('should return false when food is insufficient', () => {
			const population = 10;
			const structureCount = 0;
			const resources = {
				food: 10, // Not enough (need 180)
				water: 400,
				wood: 0,
				stone: 0,
				ore: 0,
			};

			const sufficient = hasResourcesForPopulation(population, structureCount, resources);
			expect(sufficient).toBe(false);
		});

		it('should return false when water is insufficient', () => {
			const population = 10;
			const structureCount = 0;
			const resources = {
				food: 200,
				water: 10, // Not enough (need 360)
				wood: 0,
				stone: 0,
				ore: 0,
			};

			const sufficient = hasResourcesForPopulation(population, structureCount, resources);
			expect(sufficient).toBe(false);
		});

		it('should return true for zero population and zero structures', () => {
			const resources = {
				food: 0,
				water: 0,
				wood: 0,
				stone: 0,
				ore: 0,
			};

			const sufficient = hasResourcesForPopulation(0, 0, resources);
			expect(sufficient).toBe(true);
		});

		it('should return true when resources exactly meet hourly needs', () => {
			const population = 1;
			const structureCount = 1;
			const resources = {
				food: 18, // Exactly 1 hour for 1 person (18/hour)
				water: 36, // Exactly 1 hour for 1 person (36/hour)
				wood: 3.6, // Exactly 1 hour for 1 structure (3.6/hour)
				stone: 1.8, // Exactly 1 hour for 1 structure (1.8/hour)
				ore: 0.9, // Exactly 1 hour for 1 structure (0.9/hour)
			};

			const sufficient = hasResourcesForPopulation(population, structureCount, resources);
			expect(sufficient).toBe(true);
		});
	});
});
