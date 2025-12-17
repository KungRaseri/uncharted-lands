/**
 * Tests for Resource Generator
 */

import { describe, it, expect } from 'vitest';
import {
	generatePlotResources,
	determinePlotsTotal,
	type Tile,
	type Biome,
} from '../../../src/game/resource-generator.js';

describe('resource-generator', () => {
	// Mock tile data for different scenarios
	const temperateTile: Tile = {
		elevation: 10,
		precipitation: 200,
		temperature: 20,
	};

	const mountainousTile: Tile = {
		elevation: 30,
		precipitation: 150,
		temperature: 5,
	};

	const oceanTile: Tile = {
		elevation: -10,
		precipitation: 250,
		temperature: 15,
	};

	const desertTile: Tile = {
		elevation: 2,
		precipitation: 30,
		temperature: 35,
	};

	// Mock biome data
	const temperateForestBiome: Biome = {
		plotAreaMin: 30,
		plotAreaMax: 50,
		solarModifier: 5,
		windModifier: 3,
		foodModifier: 5,
		waterModifier: 5,
		woodModifier: 7,
		stoneModifier: 3,
		oreModifier: 2,
		plotsMin: 3,
		plotsMax: 8,
		precipitationMin: 150,
		precipitationMax: 300,
		temperatureMin: 10,
		temperatureMax: 25,
	};

	const mountainBiome: Biome = {
		plotAreaMin: 20,
		plotAreaMax: 40,
		solarModifier: 7,
		windModifier: 8,
		foodModifier: 2,
		waterModifier: 4,
		woodModifier: 3,
		stoneModifier: 8,
		oreModifier: 7,
		plotsMin: 2,
		plotsMax: 5,
		precipitationMin: 100,
		precipitationMax: 250,
		temperatureMin: -10,
		temperatureMax: 15,
	};

	const oceanBiome: Biome = {
		plotAreaMin: 10,
		plotAreaMax: 30,
		solarModifier: 3,
		windModifier: 7,
		foodModifier: 4,
		waterModifier: 10,
		woodModifier: 0,
		stoneModifier: 1,
		oreModifier: 0,
		plotsMin: 0,
		plotsMax: 0,
		precipitationMin: 200,
		precipitationMax: 400,
		temperatureMin: 0,
		temperatureMax: 25,
	};

	describe('generatePlotResources', () => {
		it('should generate all resource types', () => {
			const resources = generatePlotResources(temperateTile, temperateForestBiome);

			expect(resources).toHaveProperty('area');
			expect(resources).toHaveProperty('solar');
			expect(resources).toHaveProperty('wind');
			expect(resources).toHaveProperty('food');
			expect(resources).toHaveProperty('water');
			expect(resources).toHaveProperty('wood');
			expect(resources).toHaveProperty('stone');
			expect(resources).toHaveProperty('ore');
		});

		it('should generate values within valid ranges', () => {
			const resources = generatePlotResources(temperateTile, temperateForestBiome);

			// All resources should be between 0 and 10 (or 1-10 for most)
			expect(resources.solar).toBeGreaterThanOrEqual(1);
			expect(resources.solar).toBeLessThanOrEqual(10);
			expect(resources.wind).toBeGreaterThanOrEqual(1);
			expect(resources.wind).toBeLessThanOrEqual(10);
			expect(resources.food).toBeGreaterThanOrEqual(1);
			expect(resources.food).toBeLessThanOrEqual(10);
			expect(resources.water).toBeGreaterThanOrEqual(1);
			expect(resources.water).toBeLessThanOrEqual(10);
			expect(resources.wood).toBeGreaterThanOrEqual(0);
			expect(resources.wood).toBeLessThanOrEqual(10);
			expect(resources.stone).toBeGreaterThanOrEqual(1);
			expect(resources.stone).toBeLessThanOrEqual(10);
			expect(resources.ore).toBeGreaterThanOrEqual(0);
			expect(resources.ore).toBeLessThanOrEqual(10);

			// Area should be within biome range
			expect(resources.area).toBeGreaterThanOrEqual(temperateForestBiome.plotAreaMin);
			expect(resources.area).toBeLessThanOrEqual(temperateForestBiome.plotAreaMax);
		});

		it('should generate reduced resources for ocean tiles', () => {
			const resources = generatePlotResources(oceanTile, oceanBiome);

			// Ocean tiles should have reduced solar and very low/no wood
			expect(resources.solar).toBeLessThanOrEqual(5);
			expect(resources.wood).toBe(0);
			expect(resources.ore).toBe(0);

			// But high water
			expect(resources.water).toBe(10);
		});

		it('should generate high stone and ore for mountain tiles', () => {
			const resources = generatePlotResources(mountainousTile, mountainBiome);

			// Mountains should have high stone and ore
			expect(resources.stone).toBeGreaterThanOrEqual(6);
			expect(resources.ore).toBeGreaterThan(0);

			// High wind due to elevation
			expect(resources.wind).toBeGreaterThanOrEqual(5);
		});

		it('should generate low water for desert tiles', () => {
			const resources = generatePlotResources(desertTile, temperateForestBiome);

			// Desert should have lower water due to low precipitation
			expect(resources.water).toBeLessThanOrEqual(6);

			// And reduced food
			expect(resources.food).toBeLessThanOrEqual(7);
		});
	});

	describe('determinePlotsTotal', () => {
		it('should return 0 plots for ocean tiles (elevation < 0)', () => {
			const plots = determinePlotsTotal(oceanTile, temperateForestBiome);
			expect(plots).toBe(0);
		});

		it('should return plots within biome range for land tiles', () => {
			const plots = determinePlotsTotal(temperateTile, temperateForestBiome);

			expect(plots).toBeGreaterThanOrEqual(temperateForestBiome.plotsMin);
			expect(plots).toBeLessThanOrEqual(temperateForestBiome.plotsMax);
		});

		it('should generate more plots for low elevation tiles', () => {
			const lowTile: Tile = { elevation: 2, precipitation: 200, temperature: 20 };

			// Run multiple times to get average (due to randomness)
			let totalPlots = 0;
			const iterations = 100;
			for (let i = 0; i < iterations; i++) {
				totalPlots += determinePlotsTotal(lowTile, temperateForestBiome);
			}
			const avgLowElevation = totalPlots / iterations;

			// Compare with high elevation
			const highTile: Tile = { elevation: 28, precipitation: 200, temperature: 20 };
			totalPlots = 0;
			for (let i = 0; i < iterations; i++) {
				totalPlots += determinePlotsTotal(highTile, temperateForestBiome);
			}
			const avgHighElevation = totalPlots / iterations;

			// Low elevation should have more plots on average
			expect(avgLowElevation).toBeGreaterThan(avgHighElevation);
		});

		it('should reduce plots for mountain tiles', () => {
			const plots = determinePlotsTotal(mountainousTile, mountainBiome);

			// Mountain plots should be reduced (elevation >= 25 applies 0.6 multiplier)
			expect(plots).toBeLessThanOrEqual(mountainBiome.plotsMax);
		});

		it('should never return less than 1 plot for land tiles', () => {
			// Even with very high elevation
			const veryHighTile: Tile = { elevation: 50, precipitation: 100, temperature: 0 };
			const plots = determinePlotsTotal(veryHighTile, mountainBiome);

			expect(plots).toBeGreaterThanOrEqual(1);
		});
	});

	describe('resource generation consistency', () => {
		it('should generate similar resources for similar tiles', () => {
			const tile1: Tile = { elevation: 15, precipitation: 200, temperature: 20 };
			const tile2: Tile = { elevation: 15, precipitation: 200, temperature: 20 };

			// Generate multiple resources and check they're in similar ranges
			const resources1 = generatePlotResources(tile1, temperateForestBiome);
			const resources2 = generatePlotResources(tile2, temperateForestBiome);

			// Due to variance, values won't be exact but should be close (within ~40% due to 0.2 variance * 2)
			const maxDifferenceRatio = 0.5;

			expect(Math.abs(resources1.solar - resources2.solar) / resources1.solar).toBeLessThan(
				maxDifferenceRatio
			);
			expect(Math.abs(resources1.food - resources2.food) / resources1.food).toBeLessThan(
				maxDifferenceRatio
			);
		});

		it('should handle edge cases with extreme values', () => {
			const extremeTile: Tile = {
				elevation: 100,
				precipitation: 500,
				temperature: 50,
			};

			// Should not crash and should return valid values
			const resources = generatePlotResources(extremeTile, temperateForestBiome);

			expect(resources.solar).toBeGreaterThanOrEqual(1);
			expect(resources.solar).toBeLessThanOrEqual(10);
			expect(resources.water).toBeGreaterThanOrEqual(1);
			expect(resources.water).toBeLessThanOrEqual(10);
		});
	});

	describe('biome-specific resource characteristics', () => {
		it('should generate forest-appropriate resources for temperate forest biome', () => {
			const resources = generatePlotResources(temperateTile, temperateForestBiome);

			// Forests should have decent wood
			expect(resources.wood).toBeGreaterThan(0);

			// And decent food/water
			expect(resources.food).toBeGreaterThan(3);
			expect(resources.water).toBeGreaterThan(3);
		});

		it('should generate mountain-appropriate resources for mountain biome', () => {
			const resources = generatePlotResources(mountainousTile, mountainBiome);

			// Mountains should favor stone and ore
			expect(resources.stone).toBeGreaterThan(resources.wood);

			// High wind and solar
			expect(resources.wind).toBeGreaterThanOrEqual(6);
			expect(resources.solar).toBeGreaterThan(4);
		});

		it('should respect biome modifiers in resource generation', () => {
			// Use a biome with low modifiers
			const lowModifierBiome: Biome = {
				...temperateForestBiome,
				foodModifier: 1,
				waterModifier: 1,
				woodModifier: 1,
			};

			const resourcesLow = generatePlotResources(temperateTile, lowModifierBiome);

			// Use a biome with high modifiers
			const highModifierBiome: Biome = {
				...temperateForestBiome,
				foodModifier: 9,
				waterModifier: 9,
				woodModifier: 9,
			};

			const resourcesHigh = generatePlotResources(temperateTile, highModifierBiome);

			// High modifier biome should generally produce more resources
			expect(resourcesHigh.food).toBeGreaterThanOrEqual(resourcesLow.food);
			expect(resourcesHigh.water).toBeGreaterThanOrEqual(resourcesLow.water);
			expect(resourcesHigh.wood).toBeGreaterThanOrEqual(resourcesLow.wood);
		});
	});
});
