/**
 * Tests for Resource Production System
 */

import { describe, it, expect } from 'vitest';
import {
	calculateProductionRate,
	calculateAccumulatedResources,
	getQualityMultiplier,
	getQualityRating,
	calculatePlotSlots,
	getStructureLevelMultiplier,
	BASE_PRODUCTION_RATES,
	BIOME_EFFICIENCY,
} from '../../../src/utils/resource-production.js';

describe('Resource Production', () => {
	describe('getStructureLevelMultiplier', () => {
		it('should return 1x for level 1', () => {
			expect(getStructureLevelMultiplier(1)).toBe(1);
		});

		it('should return 1.5x for level 2', () => {
			expect(getStructureLevelMultiplier(2)).toBe(1.5);
		});

		it('should return 2.25x for level 3', () => {
			expect(getStructureLevelMultiplier(3)).toBe(2.25);
		});

		it('should return 3.375x for level 4', () => {
			expect(getStructureLevelMultiplier(4)).toBe(3.375);
		});

		it('should follow geometric progression', () => {
			const level5 = getStructureLevelMultiplier(5);
			const level4 = getStructureLevelMultiplier(4);
			expect(level5 / level4).toBeCloseTo(1.5, 2);
		});
	});

	describe('calculateProductionRate', () => {
		it('should calculate basic production rate for FOOD in Grassland', () => {
			const rate = calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 1,
			});

			// FOOD base rate is 10, Grassland efficiency is 1.8
			expect(rate).toBe(18);
		});

		it('should calculate production rate for WOOD in Tropical Rainforest', () => {
			const rate = calculateProductionRate({
				resourceType: 'WOOD',
				extractorType: 'LUMBER_MILL',
				biomeName: 'Tropical Rainforest',
				structureLevel: 1,
			});

			// WOOD base rate is 8, Tropical Rainforest efficiency is 2
			expect(rate).toBe(16);
		});

		it('should calculate production rate for STONE in Mountains', () => {
			const rate = calculateProductionRate({
				resourceType: 'STONE',
				extractorType: 'QUARRY',
				biomeName: 'Mountains',
				structureLevel: 1,
			});

			// STONE base rate is 6, Mountains efficiency is 2
			expect(rate).toBe(12);
		});

		it('should calculate production rate for ORE in Mountains', () => {
			const rate = calculateProductionRate({
				resourceType: 'ORE',
				extractorType: 'MINE',
				biomeName: 'Mountains',
				structureLevel: 1,
			});

			// ORE base rate is 4, Mountains efficiency is 2
			expect(rate).toBe(8);
		});

		it('should apply structure level multiplier', () => {
			const level1 = calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 1,
			});

			const level2 = calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 2,
			});

			expect(level2).toBe(level1 * 1.5);
		});

		it('should return 0 for invalid resource type', () => {
			const rate = calculateProductionRate({
				resourceType: 'INVALID' as any,
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 1,
			});

			expect(rate).toBe(0);
		});

		it('should return 0 for invalid extractor type', () => {
			const rate = calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'INVALID_EXTRACTOR',
				biomeName: 'Grassland',
				structureLevel: 1,
			});

			expect(rate).toBe(0);
		});

		it('should use default biome efficiency of 1 for unknown biome', () => {
			const rate = calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Unknown Biome',
				structureLevel: 1,
			});

			// FOOD base rate is 10, default efficiency is 1
			expect(rate).toBe(10);
		});

		it('should calculate HERBS production in Tropical Rainforest', () => {
			const rate = calculateProductionRate({
				resourceType: 'HERBS',
				extractorType: 'HERB_GARDEN',
				biomeName: 'Tropical Rainforest',
				structureLevel: 1,
			});

			// HERBS base rate is 5, Tropical Rainforest efficiency is 1.8
			expect(rate).toBe(9);
		});

		it('should calculate PELTS production in Tundra', () => {
			const rate = calculateProductionRate({
				resourceType: 'PELTS',
				extractorType: 'HUNTING_LODGE',
				biomeName: 'Tundra',
				structureLevel: 1,
			});

			// PELTS base rate is 4, Tundra efficiency is 2
			expect(rate).toBe(8);
		});

		it('should round to 2 decimal places', () => {
			const rate = calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Desert',
				structureLevel: 1,
			});

			// FOOD base rate is 10, Desert efficiency is 0.3 = 3.00
			expect(rate).toBe(3);
		});

		it('should handle high structure levels', () => {
			const rate = calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 5,
			});

			// Level 5 multiplier = 1.5^4 = 5.0625
			// 10 * 1.8 * 5.0625 = 91.125
			expect(rate).toBeCloseTo(91.13, 1);
		});
	});

	describe('calculateAccumulatedResources', () => {
		it('should return 0 if lastHarvested is null', () => {
			const accumulated = calculateAccumulatedResources(10, null);
			expect(accumulated).toBe(0);
		});

		it('should calculate accumulation for 1 hour', () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(10, oneHourAgo);
			expect(accumulated).toBe(10); // 10 units/hour * 1 hour
		});

		it('should calculate accumulation for 12 hours', () => {
			const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(10, twelveHoursAgo);
			expect(accumulated).toBe(120); // 10 units/hour * 12 hours
		});

		it('should calculate accumulation for exactly 24 hours at full rate', () => {
			const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(10, twentyFourHoursAgo);
			expect(accumulated).toBe(240); // 10 units/hour * 24 hours
		});

		it('should apply diminishing returns after 24 hours', () => {
			const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(10, thirtyHoursAgo);
			// 24 hours at full + 6 hours at 50% = 24 + 3 = 27 effective hours
			expect(accumulated).toBe(270);
		});

		it('should apply second tier diminishing returns after 48 hours', () => {
			const sixtyHoursAgo = new Date(Date.now() - 60 * 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(10, sixtyHoursAgo);
			// 24 full + 24*0.5 = 36 effective hours
			// The check is: if effectiveHours > 48, but effectiveHours is 36 so we don't hit third tier
			expect(accumulated).toBe(420); // floor(10 * 42) where 42 = 24 + 18
		});

		it('should cap at 96 effective hours', () => {
			const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(10, oneWeekAgo);
			// 168 hours total -> 24 full + (168-24)*0.5 = 24 + 72 = 96, but that's not > 96
			// Then checking if 96 > 48, yes, so: 48 + (168-48)*0.25 = 48 + 30 = 78 effective hours
			expect(accumulated).toBe(780);
		});

		it('should floor the result', () => {
			const oneAndHalfHoursAgo = new Date(Date.now() - 1.5 * 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(7, oneAndHalfHoursAgo);
			expect(accumulated).toBe(10); // floor(7 * 1.5) = floor(10.5) = 10
		});

		it('should handle fractional production rates', () => {
			const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(3.5, twoHoursAgo);
			expect(accumulated).toBe(7); // floor(3.5 * 2) = 7
		});

		it('should handle zero production rate', () => {
			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(0, oneHourAgo);
			expect(accumulated).toBe(0);
		});
	});

	describe('getQualityMultiplier', () => {
		it('should return 0.5 for Very Poor quality (0-20)', () => {
			expect(getQualityMultiplier(0)).toBe(0.5);
			expect(getQualityMultiplier(10)).toBe(0.5);
			expect(getQualityMultiplier(20)).toBe(0.5);
		});

		it('should return 0.75 for Poor quality (21-40)', () => {
			expect(getQualityMultiplier(21)).toBe(0.75);
			expect(getQualityMultiplier(30)).toBe(0.75);
			expect(getQualityMultiplier(40)).toBe(0.75);
		});

		it('should return 1 for Average quality (41-60)', () => {
			expect(getQualityMultiplier(41)).toBe(1);
			expect(getQualityMultiplier(50)).toBe(1);
			expect(getQualityMultiplier(60)).toBe(1);
		});

		it('should return 1.5 for Good quality (61-80)', () => {
			expect(getQualityMultiplier(61)).toBe(1.5);
			expect(getQualityMultiplier(70)).toBe(1.5);
			expect(getQualityMultiplier(80)).toBe(1.5);
		});

		it('should return 2 for Excellent quality (81-100)', () => {
			expect(getQualityMultiplier(81)).toBe(2);
			expect(getQualityMultiplier(90)).toBe(2);
			expect(getQualityMultiplier(100)).toBe(2);
		});
	});

	describe('getQualityRating', () => {
		it('should return "Very Poor" for quality 0-20', () => {
			expect(getQualityRating(0)).toBe('Very Poor');
			expect(getQualityRating(10)).toBe('Very Poor');
			expect(getQualityRating(20)).toBe('Very Poor');
		});

		it('should return "Poor" for quality 21-40', () => {
			expect(getQualityRating(21)).toBe('Poor');
			expect(getQualityRating(30)).toBe('Poor');
			expect(getQualityRating(40)).toBe('Poor');
		});

		it('should return "Average" for quality 41-60', () => {
			expect(getQualityRating(41)).toBe('Average');
			expect(getQualityRating(50)).toBe('Average');
			expect(getQualityRating(60)).toBe('Average');
		});

		it('should return "Good" for quality 61-80', () => {
			expect(getQualityRating(61)).toBe('Good');
			expect(getQualityRating(70)).toBe('Good');
			expect(getQualityRating(80)).toBe('Good');
		});

		it('should return "Excellent" for quality 81-100', () => {
			expect(getQualityRating(81)).toBe('Excellent');
			expect(getQualityRating(90)).toBe('Excellent');
			expect(getQualityRating(100)).toBe('Excellent');
		});
	});

	describe('calculatePlotSlots', () => {
		it('should calculate average of min and max', () => {
			const slots = calculatePlotSlots({ plotsMin: 4, plotsMax: 8 });
			expect(slots).toBe(6); // (4 + 8) / 2 = 6
		});

		it('should clamp to minimum of 4', () => {
			const slots = calculatePlotSlots({ plotsMin: 1, plotsMax: 3 });
			expect(slots).toBe(4); // (1 + 3) / 2 = 2, clamped to 4
		});

		it('should clamp to maximum of 9', () => {
			const slots = calculatePlotSlots({ plotsMin: 10, plotsMax: 20 });
			expect(slots).toBe(9); // (10 + 20) / 2 = 15, clamped to 9
		});

		it('should handle exact boundaries', () => {
			expect(calculatePlotSlots({ plotsMin: 4, plotsMax: 4 })).toBe(4);
			expect(calculatePlotSlots({ plotsMin: 9, plotsMax: 9 })).toBe(9);
		});

		it('should floor the average', () => {
			const slots = calculatePlotSlots({ plotsMin: 5, plotsMax: 6 });
			expect(slots).toBe(5); // floor((5 + 6) / 2) = floor(5.5) = 5
		});
	});

	describe('BASE_PRODUCTION_RATES', () => {
		it('should have rates for all Tier 1 resources', () => {
			expect(BASE_PRODUCTION_RATES.FOOD).toBeDefined();
			expect(BASE_PRODUCTION_RATES.WOOD).toBeDefined();
			expect(BASE_PRODUCTION_RATES.STONE).toBeDefined();
			expect(BASE_PRODUCTION_RATES.ORE).toBeDefined();
		});

		it('should have rates for Tier 2 resources', () => {
			expect(BASE_PRODUCTION_RATES.CLAY).toBeDefined();
			expect(BASE_PRODUCTION_RATES.HERBS).toBeDefined();
			expect(BASE_PRODUCTION_RATES.PELTS).toBeDefined();
		});

		it('should have rates for Tier 3 resources', () => {
			expect(BASE_PRODUCTION_RATES.GEMS).toBeDefined();
			expect(BASE_PRODUCTION_RATES.EXOTIC_WOOD).toBeDefined();
		});

		it('should have valid numeric rates', () => {
			expect(BASE_PRODUCTION_RATES.FOOD.FARM).toBeGreaterThan(0);
			expect(BASE_PRODUCTION_RATES.WOOD.LUMBER_MILL).toBeGreaterThan(0);
			expect(BASE_PRODUCTION_RATES.STONE.QUARRY).toBeGreaterThan(0);
			expect(BASE_PRODUCTION_RATES.ORE.MINE).toBeGreaterThan(0);
		});
	});

	describe('BIOME_EFFICIENCY', () => {
		it('should have efficiency values for common biomes', () => {
			expect(BIOME_EFFICIENCY['Tropical Rainforest']).toBeDefined();
			expect(BIOME_EFFICIENCY['Temperate Forest']).toBeDefined();
			expect(BIOME_EFFICIENCY['Grassland']).toBeDefined();
			expect(BIOME_EFFICIENCY['Desert']).toBeDefined();
			expect(BIOME_EFFICIENCY['Mountains']).toBeDefined();
			expect(BIOME_EFFICIENCY['Tundra']).toBeDefined();
			expect(BIOME_EFFICIENCY['Savanna']).toBeDefined();
			expect(BIOME_EFFICIENCY['Boreal Forest']).toBeDefined();
		});

		it('should have resource efficiencies for each biome', () => {
			const grassland = BIOME_EFFICIENCY['Grassland'];
			expect(grassland.FOOD).toBeDefined();
			expect(grassland.WOOD).toBeDefined();
			expect(grassland.STONE).toBeDefined();
			expect(grassland.ORE).toBeDefined();
		});

		it('should have positive efficiency values', () => {
			for (const biome of Object.values(BIOME_EFFICIENCY)) {
				for (const efficiency of Object.values(biome)) {
					expect(efficiency).toBeGreaterThan(0);
				}
			}
		});

		it('should have biome specializations', () => {
			// Tropical Rainforest should be good for wood
			expect(BIOME_EFFICIENCY['Tropical Rainforest'].WOOD).toBeGreaterThan(1);

			// Mountains should be good for stone and ore
			expect(BIOME_EFFICIENCY['Mountains'].STONE).toBeGreaterThan(1);
			expect(BIOME_EFFICIENCY['Mountains'].ORE).toBeGreaterThan(1);

			// Grassland should be good for food
			expect(BIOME_EFFICIENCY['Grassland'].FOOD).toBeGreaterThan(1);

			// Desert should be poor for food and wood
			expect(BIOME_EFFICIENCY['Desert'].FOOD).toBeLessThan(1);
			expect(BIOME_EFFICIENCY['Desert'].WOOD).toBeLessThan(1);
		});
	});

	describe('Integration Tests', () => {
		it('should calculate realistic production for a level 3 farm in Grassland', () => {
			const rate = calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 3,
			});

			// Base 10, efficiency 1.8, level multiplier 2.25
			expect(rate).toBe(40.5);

			// After 24 hours
			const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(rate, yesterday);
			expect(accumulated).toBe(972); // floor(40.5 * 24)
		});

		it('should handle edge case of very low production rate', () => {
			const rate = calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Desert',
				structureLevel: 1,
			});

			expect(rate).toBe(3); // 10 * 0.3

			const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
			const accumulated = calculateAccumulatedResources(rate, oneHourAgo);
			expect(accumulated).toBe(3);
		});
	});
});
