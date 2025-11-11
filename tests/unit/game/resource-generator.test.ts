import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { generatePlotResources } from '../../../src/lib/game/resource-generator';

// Mock data helpers
function createMockTile(overrides = {}) {
	return {
		elevation: 10,
		temperature: 15,
		precipitation: 200,
		...overrides
	};
}

function createMockBiome(overrides = {}) {
	return {
		plotAreaMin: 100,
		plotAreaMax: 200,
		solarModifier: 3,
		windModifier: 3,
		foodModifier: 3,
		waterModifier: 3,
		woodModifier: 3,
		stoneModifier: 3,
		oreModifier: 3,
		...overrides
	};
}

describe('resource-generator', () => {
	// Mock Math.random to make tests deterministic
	let originalRandom: () => number;

	beforeEach(() => {
		originalRandom = Math.random;
		// Set a deterministic random value (0.5 = middle of range)
		Math.random = vi.fn(() => 0.5);
	});

	afterEach(() => {
		Math.random = originalRandom;
	});

	describe('generatePlotResources', () => {
		it('should generate all resource types', () => {
			const tile = createMockTile();
			const biome = createMockBiome();

			const resources = generatePlotResources(tile, biome);

			expect(resources).toHaveProperty('area');
			expect(resources).toHaveProperty('solar');
			expect(resources).toHaveProperty('wind');
			expect(resources).toHaveProperty('food');
			expect(resources).toHaveProperty('water');
			expect(resources).toHaveProperty('wood');
			expect(resources).toHaveProperty('stone');
			expect(resources).toHaveProperty('ore');
		});

		it('should generate resources within valid ranges', () => {
			const tile = createMockTile();
			const biome = createMockBiome();

			const resources = generatePlotResources(tile, biome);

			// Area is between biome min/max
			expect(resources.area).toBeGreaterThanOrEqual(biome.plotAreaMin);
			expect(resources.area).toBeLessThanOrEqual(biome.plotAreaMax);

			// All other resources are 1-10 scale
			expect(resources.solar).toBeGreaterThanOrEqual(1);
			expect(resources.solar).toBeLessThanOrEqual(10);
			expect(resources.wind).toBeGreaterThanOrEqual(1);
			expect(resources.wind).toBeLessThanOrEqual(10);
			expect(resources.food).toBeGreaterThanOrEqual(1);
			expect(resources.food).toBeLessThanOrEqual(10);
			expect(resources.water).toBeGreaterThanOrEqual(1);
			expect(resources.water).toBeLessThanOrEqual(10);
			expect(resources.wood).toBeGreaterThanOrEqual(1);
			expect(resources.wood).toBeLessThanOrEqual(10);
			expect(resources.stone).toBeGreaterThanOrEqual(1);
			expect(resources.stone).toBeLessThanOrEqual(10);
			expect(resources.ore).toBeGreaterThanOrEqual(1);
			expect(resources.ore).toBeLessThanOrEqual(10);
		});

		it('should handle ocean tiles with low elevation', () => {
			const oceanTile = createMockTile({ elevation: -10 });
			const biome = createMockBiome();

			const resources = generatePlotResources(oceanTile, biome);

			// Ocean tiles have reduced solar and food
			expect(resources.solar).toBeLessThan(5);
			expect(resources.food).toBeLessThan(5);
			// Ocean tiles have maximum water and high wind
			expect(resources.water).toBe(10);
			expect(resources.wind).toBeGreaterThan(5);
		});

		it('should handle mountain tiles with high elevation', () => {
			const mountainTile = createMockTile({ elevation: 30, temperature: 5, precipitation: 100 });
			const biome = createMockBiome();

			const resources = generatePlotResources(mountainTile, biome);

			// Mountains have high wind and solar
			expect(resources.wind).toBeGreaterThan(5);
			expect(resources.solar).toBeGreaterThanOrEqual(4);
			// Mountains have reduced food
			expect(resources.food).toBeLessThan(7);
		});

		it('should handle desert conditions', () => {
			const desertTile = createMockTile({ 
				elevation: 5, 
				temperature: 35, 
				precipitation: 50 
			});
			const desertBiome = createMockBiome({
				solarModifier: 5,
				waterModifier: 1,
				foodModifier: 1
			});

			const resources = generatePlotResources(desertTile, desertBiome);

			// Desert has high solar, low water, low food
			expect(resources.solar).toBeGreaterThan(5);
			expect(resources.water).toBeLessThan(5);
			expect(resources.food).toBeLessThan(5);
		});

		it('should handle tropical rainforest conditions', () => {
			const tropicalTile = createMockTile({ 
				elevation: 2, 
				temperature: 25, 
				precipitation: 400 
			});
			const tropicalBiome = createMockBiome({
				waterModifier: 5,
				woodModifier: 5,
				foodModifier: 4
			});

			const resources = generatePlotResources(tropicalTile, tropicalBiome);

			// Rainforest has high water, wood, and decent food
			expect(resources.water).toBeGreaterThan(6);
			expect(resources.wood).toBeGreaterThan(6);
			expect(resources.food).toBeGreaterThan(4);
		});
	});

	describe('solar generation', () => {
		it('should give bonus for high elevation', () => {
			const lowTile = createMockTile({ elevation: 5 });
			const highTile = createMockTile({ elevation: 30 });
			const biome = createMockBiome({ solarModifier: 3 });

			const lowResources = generatePlotResources(lowTile, biome);
			const highResources = generatePlotResources(highTile, biome);

			expect(highResources.solar).toBeGreaterThan(lowResources.solar);
		});

		it('should give bonus for optimal temperature', () => {
			const coldTile = createMockTile({ temperature: -5 });
			const optimalTile = createMockTile({ temperature: 20 });
			const hotTile = createMockTile({ temperature: 40 });
			const biome = createMockBiome();

			const coldResources = generatePlotResources(coldTile, biome);
			const optimalResources = generatePlotResources(optimalTile, biome);
			const hotResources = generatePlotResources(hotTile, biome);

			// Optimal temperature should have best solar
			expect(optimalResources.solar).toBeGreaterThanOrEqual(coldResources.solar);
			expect(optimalResources.solar).toBeGreaterThanOrEqual(hotResources.solar);
		});

		it('should penalize high precipitation', () => {
			const dryTile = createMockTile({ precipitation: 50 });
			const wetTile = createMockTile({ precipitation: 400 });
			const biome = createMockBiome({ solarModifier: 5 });

			const dryResources = generatePlotResources(dryTile, biome);
			const wetResources = generatePlotResources(wetTile, biome);

			// Dry areas should have more solar (less clouds)
			expect(dryResources.solar).toBeGreaterThan(wetResources.solar);
		});

		it('should handle ocean tiles with minimal solar', () => {
			const oceanTile = createMockTile({ elevation: -5 });
			const biome = createMockBiome({ solarModifier: 4 });

			const resources = generatePlotResources(oceanTile, biome);

			expect(resources.solar).toBeLessThan(3);
		});
	});

	describe('wind generation', () => {
		it('should be high for mountain peaks', () => {
			const mountainTile = createMockTile({ elevation: 30 });
			const biome = createMockBiome({ windModifier: 3 });

			const resources = generatePlotResources(mountainTile, biome);

			expect(resources.wind).toBeGreaterThanOrEqual(6);
		});

		it('should be high for ocean tiles', () => {
			const oceanTile = createMockTile({ elevation: -10 });
			const biome = createMockBiome({ windModifier: 3 });

			const resources = generatePlotResources(oceanTile, biome);

			expect(resources.wind).toBeGreaterThanOrEqual(6);
		});

		it('should increase with extreme temperatures', () => {
			const moderateTile = createMockTile({ temperature: 15 });
			const extremeTile = createMockTile({ temperature: 40 });
			const biome = createMockBiome({ windModifier: 3 });

			const moderateResources = generatePlotResources(moderateTile, biome);
			const extremeResources = generatePlotResources(extremeTile, biome);

			expect(extremeResources.wind).toBeGreaterThanOrEqual(moderateResources.wind);
		});

		it('should increase with high precipitation', () => {
			const dryTile = createMockTile({ precipitation: 50 });
			const wetTile = createMockTile({ precipitation: 350 });
			const biome = createMockBiome({ windModifier: 3 });

			const dryResources = generatePlotResources(dryTile, biome);
			const wetResources = generatePlotResources(wetTile, biome);

			expect(wetResources.wind).toBeGreaterThanOrEqual(dryResources.wind);
		});
	});

	describe('food generation', () => {
		it('should be optimal in temperate conditions', () => {
			const optimalTile = createMockTile({ 
				elevation: 5, 
				temperature: 18, 
				precipitation: 250 
			});
			const biome = createMockBiome({ foodModifier: 3, solarModifier: 4 });

			const resources = generatePlotResources(optimalTile, biome);

			expect(resources.food).toBeGreaterThan(6);
		});

		it('should be reduced in extreme cold', () => {
			const coldTile = createMockTile({ temperature: -10 });
			const biome = createMockBiome({ foodModifier: 3 });

			const resources = generatePlotResources(coldTile, biome);

			expect(resources.food).toBeLessThan(5);
		});

		it('should be reduced in extreme heat', () => {
			const hotTile = createMockTile({ temperature: 40 });
			const biome = createMockBiome({ foodModifier: 3 });

			const resources = generatePlotResources(hotTile, biome);

			expect(resources.food).toBeLessThan(5);
		});

		it('should be reduced in drought conditions', () => {
			const droughtTile = createMockTile({ precipitation: 30 });
			const biome = createMockBiome({ foodModifier: 3 });

			const resources = generatePlotResources(droughtTile, biome);

			expect(resources.food).toBeLessThan(5);
		});

		it('should be reduced on mountains', () => {
			const lowlandTile = createMockTile({ elevation: 5 });
			const mountainTile = createMockTile({ elevation: 25 });
			const biome = createMockBiome({ foodModifier: 3 });

			const lowlandResources = generatePlotResources(lowlandTile, biome);
			const mountainResources = generatePlotResources(mountainTile, biome);

			expect(lowlandResources.food).toBeGreaterThan(mountainResources.food);
		});

		it('should benefit from high solar', () => {
			const lowSolarBiome = createMockBiome({ solarModifier: 1, foodModifier: 3 });
			const highSolarBiome = createMockBiome({ solarModifier: 5, foodModifier: 3 });
			const tile = createMockTile();

			const lowSolarResources = generatePlotResources(tile, lowSolarBiome);
			const highSolarResources = generatePlotResources(tile, highSolarBiome);

			expect(highSolarResources.food).toBeGreaterThanOrEqual(lowSolarResources.food);
		});

		it('should be minimal in ocean tiles', () => {
			const oceanTile = createMockTile({ elevation: -10 });
			const biome = createMockBiome({ foodModifier: 3 });

			const resources = generatePlotResources(oceanTile, biome);

			expect(resources.food).toBeLessThan(3);
		});
	});

	describe('water generation', () => {
		it('should be maximum for ocean tiles', () => {
			const oceanTile = createMockTile({ elevation: -5 });
			const biome = createMockBiome();

			const resources = generatePlotResources(oceanTile, biome);

			expect(resources.water).toBe(10);
		});

		it('should increase with precipitation', () => {
			const dryTile = createMockTile({ precipitation: 50 });
			const wetTile = createMockTile({ precipitation: 350 });
			const biome = createMockBiome({ waterModifier: 3 });

			const dryResources = generatePlotResources(dryTile, biome);
			const wetResources = generatePlotResources(wetTile, biome);

			expect(wetResources.water).toBeGreaterThan(dryResources.water);
		});

		it('should be high near sea level', () => {
			const coastalTile = createMockTile({ elevation: 2 });
			const mountainTile = createMockTile({ elevation: 25 });
			const biome = createMockBiome({ waterModifier: 3 });

			const coastalResources = generatePlotResources(coastalTile, biome);
			const mountainResources = generatePlotResources(mountainTile, biome);

			expect(coastalResources.water).toBeGreaterThanOrEqual(mountainResources.water);
		});
	});

	describe('wood generation', () => {
		it('should benefit from adequate precipitation', () => {
			const dryTile = createMockTile({ precipitation: 50 });
			const moderateTile = createMockTile({ precipitation: 250 });
			const biome = createMockBiome({ woodModifier: 3 });

			const dryResources = generatePlotResources(dryTile, biome);
			const moderateResources = generatePlotResources(moderateTile, biome);

			expect(moderateResources.wood).toBeGreaterThan(dryResources.wood);
		});

		it('should be reduced in cold climates', () => {
			const coldTile = createMockTile({ temperature: -5 });
			const moderateTile = createMockTile({ temperature: 15 });
			const biome = createMockBiome({ woodModifier: 3 });

			const coldResources = generatePlotResources(coldTile, biome);
			const moderateResources = generatePlotResources(moderateTile, biome);

			expect(moderateResources.wood).toBeGreaterThan(coldResources.wood);
		});

		it('should be minimal in ocean tiles', () => {
			const oceanTile = createMockTile({ elevation: -10 });
			const biome = createMockBiome({ woodModifier: 3 });

			const resources = generatePlotResources(oceanTile, biome);

			expect(resources.wood).toBeLessThanOrEqual(1);
		});
	});

	describe('stone generation', () => {
		it('should increase with elevation', () => {
			const lowlandTile = createMockTile({ elevation: 5 });
			const mountainTile = createMockTile({ elevation: 30 });
			const biome = createMockBiome({ stoneModifier: 3 });

			const lowlandResources = generatePlotResources(lowlandTile, biome);
			const mountainResources = generatePlotResources(mountainTile, biome);

			expect(mountainResources.stone).toBeGreaterThan(lowlandResources.stone);
		});

		it('should be minimal in ocean tiles', () => {
			const oceanTile = createMockTile({ elevation: -10 });
			const biome = createMockBiome({ stoneModifier: 3 });

			const resources = generatePlotResources(oceanTile, biome);

			expect(resources.stone).toBe(1);
		});

		it('should be reduced in wet conditions', () => {
			const dryTile = createMockTile({ precipitation: 50 });
			const wetTile = createMockTile({ precipitation: 400 });
			const biome = createMockBiome({ stoneModifier: 3 });

			const dryResources = generatePlotResources(dryTile, biome);
			const wetResources = generatePlotResources(wetTile, biome);

			expect(dryResources.stone).toBeGreaterThanOrEqual(wetResources.stone);
		});
	});

	describe('ore generation', () => {
		it('should be high in mountains', () => {
			const mountainTile = createMockTile({ elevation: 28 });
			const biome = createMockBiome({ oreModifier: 3 });

			const resources = generatePlotResources(mountainTile, biome);

			expect(resources.ore).toBeGreaterThan(5);
		});

		it('should be minimal in ocean tiles', () => {
			const oceanTile = createMockTile({ elevation: -10 });
			const biome = createMockBiome({ oreModifier: 3 });

			const resources = generatePlotResources(oceanTile, biome);

			expect(resources.ore).toBeLessThanOrEqual(1);
		});

		it('should increase with elevation', () => {
			const lowTile = createMockTile({ elevation: 3 });
			const highTile = createMockTile({ elevation: 25 });
			const biome = createMockBiome({ oreModifier: 3 });

			const lowResources = generatePlotResources(lowTile, biome);
			const highResources = generatePlotResources(highTile, biome);

			expect(highResources.ore).toBeGreaterThan(lowResources.ore);
		});
	});

	describe('randomness', () => {
		it('should produce different results with different random values', () => {
			const tile = createMockTile();
			const biome = createMockBiome();

			// First generation with random = 0.5
			const resources1 = generatePlotResources(tile, biome);

			// Change random to different value
			Math.random = vi.fn(() => 0.8);
			const resources2 = generatePlotResources(tile, biome);

			// Some resources should be different due to randomness
			const hasDifference = 
				resources1.solar !== resources2.solar ||
				resources1.wind !== resources2.wind ||
				resources1.food !== resources2.food;

			expect(hasDifference).toBe(true);
		});
	});

	describe('edge cases', () => {
		it('should handle extreme negative elevation', () => {
			const deepOceanTile = createMockTile({ elevation: -100 });
			const biome = createMockBiome();

			const resources = generatePlotResources(deepOceanTile, biome);

			expect(resources.water).toBe(10);
			expect(resources.wood).toBeLessThanOrEqual(1);
			expect(resources.stone).toBe(1);
			expect(resources.ore).toBeLessThanOrEqual(1);
		});

		it('should handle extreme positive elevation', () => {
			const extremeMountainTile = createMockTile({ elevation: 50 });
			const biome = createMockBiome();

			const resources = generatePlotResources(extremeMountainTile, biome);

			expect(resources.wind).toBeGreaterThanOrEqual(6);
			expect(resources.stone).toBeGreaterThan(6);
			expect(resources.ore).toBeGreaterThan(6);
		});

		it('should handle zero values', () => {
			const zeroTile = createMockTile({ 
				elevation: 0, 
				temperature: 0, 
				precipitation: 0 
			});
			const biome = createMockBiome();

			const resources = generatePlotResources(zeroTile, biome);

			// Should still generate valid resources (1-10 range)
			expect(resources.solar).toBeGreaterThanOrEqual(1);
			expect(resources.wind).toBeGreaterThanOrEqual(1);
			expect(resources.food).toBeGreaterThanOrEqual(1);
		});

		it('should respect biome area bounds', () => {
			const tile = createMockTile();
			const smallBiome = createMockBiome({ plotAreaMin: 50, plotAreaMax: 75 });

			const resources = generatePlotResources(tile, smallBiome);

			expect(resources.area).toBeGreaterThanOrEqual(50);
			expect(resources.area).toBeLessThanOrEqual(75);
		});
	});
});
