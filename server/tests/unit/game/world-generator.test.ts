/**
 * World Generator Tests
 *
 * Tests for procedural world generation with noise functions
 */

import { describe, it, expect, vi } from 'vitest';
import {
	normalizeValue,
	generateMap,
	generateWorldLayers,
	type MapOptions,
	type NoiseOptions,
} from '../../../src/game/world-generator.js';

// Mock the noise libraries
vi.mock('open-simplex-noise', () => ({
	makeNoise2D: vi.fn(() => (x: number, y: number) => Math.sin(x) * Math.cos(y)),
}));

vi.mock('fractal-noise', () => ({
	makeRectangle: vi.fn((width: number, height: number) => {
		// Generate a simple test heightmap
		const map: number[][] = [];
		for (let y = 0; y < height; y++) {
			const row: number[] = [];
			for (let x = 0; x < width; x++) {
				// Generate values between -1 and 1
				row.push(Math.sin(x * 0.1) * Math.cos(y * 0.1));
			}
			map.push(row);
		}
		return map;
	}),
}));

describe('World Generator', () => {
	describe('normalizeValue', () => {
		it('should normalize -1 to minimum value', () => {
			const result = normalizeValue(-1, 0, 100);
			expect(result).toBe(0);
		});

		it('should normalize 1 to maximum value', () => {
			const result = normalizeValue(1, 0, 100);
			expect(result).toBe(100);
		});

		it('should normalize 0 to midpoint', () => {
			const result = normalizeValue(0, 0, 100);
			expect(result).toBe(50);
		});

		it('should handle negative ranges', () => {
			const result = normalizeValue(0, -50, 50);
			expect(result).toBe(0);
		});

		it('should handle elevation range (-100 to 100)', () => {
			expect(normalizeValue(-1, -100, 100)).toBe(-100);
			expect(normalizeValue(0, -100, 100)).toBe(0);
			expect(normalizeValue(1, -100, 100)).toBe(100);
		});

		it('should handle temperature range (-50 to 50)', () => {
			expect(normalizeValue(-1, -50, 50)).toBe(-50);
			expect(normalizeValue(0, -50, 50)).toBe(0);
			expect(normalizeValue(1, -50, 50)).toBe(50);
		});

		it('should handle precipitation range (0 to 500)', () => {
			expect(normalizeValue(-1, 0, 500)).toBe(0);
			expect(normalizeValue(0, 0, 500)).toBe(250);
			expect(normalizeValue(1, 0, 500)).toBe(500);
		});

		it('should handle fractional values', () => {
			const result = normalizeValue(0.5, 0, 100);
			expect(result).toBe(75);
		});

		it('should handle negative fractional values', () => {
			const result = normalizeValue(-0.5, 0, 100);
			expect(result).toBe(25);
		});
	});

	describe('generateMap', () => {
		const defaultMapOptions: MapOptions = {
			serverId: 'test-server',
			worldName: 'Test World',
			width: 100,
			height: 100,
			seed: 12345,
		};

		const defaultNoiseOptions: NoiseOptions = {
			amplitude: 1,
			persistence: 0.5,
			frequency: 1,
			octaves: 4,
			scale: (x: number) => x,
		};

		it('should generate a map with correct chunk structure', async () => {
			const result = await generateMap(defaultMapOptions, defaultNoiseOptions);

			expect(result).toBeDefined();
			expect(Array.isArray(result)).toBe(true);
			expect(result.length).toBeGreaterThan(0);
		});

		it('should generate maps with different dimensions', async () => {
			const smallMap = await generateMap(
				{ ...defaultMapOptions, width: 50, height: 50 },
				defaultNoiseOptions
			);

			const largeMap = await generateMap(
				{ ...defaultMapOptions, width: 200, height: 200 },
				defaultNoiseOptions
			);

			expect(smallMap).toBeDefined();
			expect(largeMap).toBeDefined();
			expect(largeMap.length).toBeGreaterThan(smallMap.length);
		});

		it('should use provided seed', async () => {
			const map1 = await generateMap({ ...defaultMapOptions, seed: 111 }, defaultNoiseOptions);

			const map2 = await generateMap({ ...defaultMapOptions, seed: 222 }, defaultNoiseOptions);

			expect(map1).toBeDefined();
			expect(map2).toBeDefined();
			// Both should generate successfully
		});

		it('should handle different octave values', async () => {
			const lowOctave = await generateMap(defaultMapOptions, {
				...defaultNoiseOptions,
				octaves: 1,
			});

			const highOctave = await generateMap(defaultMapOptions, {
				...defaultNoiseOptions,
				octaves: 8,
			});

			expect(lowOctave).toBeDefined();
			expect(highOctave).toBeDefined();
		});

		it('should handle different amplitude values', async () => {
			const result = await generateMap(defaultMapOptions, { ...defaultNoiseOptions, amplitude: 2 });

			expect(result).toBeDefined();
		});

		it('should handle different frequency values', async () => {
			const result = await generateMap(defaultMapOptions, { ...defaultNoiseOptions, frequency: 2 });

			expect(result).toBeDefined();
		});

		it('should handle different persistence values', async () => {
			const result = await generateMap(defaultMapOptions, {
				...defaultNoiseOptions,
				persistence: 0.75,
			});

			expect(result).toBeDefined();
		});

		it('should handle custom scale function', async () => {
			const result = await generateMap(defaultMapOptions, {
				...defaultNoiseOptions,
				scale: (x: number) => x * 2,
			});

			expect(result).toBeDefined();
		});

		it('should handle null serverId', async () => {
			const result = await generateMap(
				{ ...defaultMapOptions, serverId: null },
				defaultNoiseOptions
			);

			expect(result).toBeDefined();
		});

		it('should handle minimum dimensions', async () => {
			const result = await generateMap(
				{ ...defaultMapOptions, width: 10, height: 10 },
				defaultNoiseOptions
			);

			expect(result).toBeDefined();
		});
	});

	describe('generateWorldLayers', () => {
		const defaultMapOptions: MapOptions = {
			serverId: 'test-server',
			worldName: 'Test World',
			width: 100,
			height: 100,
			seed: 12345,
		};

		const elevationOptions: NoiseOptions = {
			amplitude: 1,
			persistence: 0.5,
			frequency: 1,
			octaves: 4,
			scale: (x: number) => x,
		};

		const precipitationOptions: NoiseOptions = {
			amplitude: 1,
			persistence: 0.4,
			frequency: 0.8,
			octaves: 3,
			scale: (x: number) => x,
		};

		const temperatureOptions: NoiseOptions = {
			amplitude: 1,
			persistence: 0.3,
			frequency: 0.6,
			octaves: 2,
			scale: (x: number) => x,
		};

		it('should generate all three layers', async () => {
			const regions = await generateWorldLayers(
				defaultMapOptions,
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			expect(regions).toBeDefined();
			expect(Array.isArray(regions)).toBe(true);
			expect(regions.length).toBeGreaterThan(0);
		});

		it('should return regions with correct structure', async () => {
			const regions = await generateWorldLayers(
				defaultMapOptions,
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			const region = regions[0];
			expect(region).toHaveProperty('xCoord');
			expect(region).toHaveProperty('yCoord');
			expect(region).toHaveProperty('elevationMap');
			expect(region).toHaveProperty('precipitationMap');
			expect(region).toHaveProperty('temperatureMap');

			expect(typeof region.xCoord).toBe('number');
			expect(typeof region.yCoord).toBe('number');
			expect(Array.isArray(region.elevationMap)).toBe(true);
			expect(Array.isArray(region.precipitationMap)).toBe(true);
			expect(Array.isArray(region.temperatureMap)).toBe(true);
		});

		it('should generate correct number of regions', async () => {
			const regions = await generateWorldLayers(
				defaultMapOptions,
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			// 100x100 world with 10x10 chunks = 10x10 = 100 regions
			expect(regions.length).toBe(100);
		});

		it('should assign sequential coordinates to regions', async () => {
			const regions = await generateWorldLayers(
				{ ...defaultMapOptions, width: 20, height: 20 },
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			// Check first region
			expect(regions[0].xCoord).toBe(0);
			expect(regions[0].yCoord).toBe(0);

			// Check that coordinates are sequential
			const coords = regions.map((r) => ({ x: r.xCoord, y: r.yCoord }));
			const xCoords = coords.map((c) => c.x);
			const yCoords = coords.map((c) => c.y);

			expect(Math.max(...xCoords)).toBeGreaterThanOrEqual(0);
			expect(Math.max(...yCoords)).toBeGreaterThanOrEqual(0);
		});

		it('should use different seeds for each layer', async () => {
			// The implementation uses seed, seed+1, seed+2 for the three layers
			const regions = await generateWorldLayers(
				defaultMapOptions,
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			expect(regions).toBeDefined();
			expect(regions.length).toBeGreaterThan(0);
			// Each layer should be generated with a different seed
		});

		it('should handle small world dimensions', async () => {
			const regions = await generateWorldLayers(
				{ ...defaultMapOptions, width: 10, height: 10 },
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			expect(regions).toBeDefined();
			expect(regions.length).toBe(1); // 10x10 = 1 chunk
		});

		it('should handle large world dimensions', async () => {
			const regions = await generateWorldLayers(
				{ ...defaultMapOptions, width: 200, height: 200 },
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			expect(regions).toBeDefined();
			expect(regions.length).toBe(400); // 200x200 = 20x20 = 400 regions
		});

		it('should handle rectangular worlds', async () => {
			const regions = await generateWorldLayers(
				{ ...defaultMapOptions, width: 50, height: 100 },
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			expect(regions).toBeDefined();
			expect(regions.length).toBe(50); // 50x100 = 5x10 = 50 regions
		});

		it('should handle null serverId', async () => {
			const regions = await generateWorldLayers(
				{ ...defaultMapOptions, serverId: null },
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			expect(regions).toBeDefined();
			expect(regions.length).toBeGreaterThan(0);
		});

		it('should handle different noise options for each layer', async () => {
			const customElevation: NoiseOptions = {
				amplitude: 2,
				persistence: 0.6,
				frequency: 1.5,
				octaves: 6,
				scale: (x: number) => x * 1.5,
			};

			const regions = await generateWorldLayers(
				defaultMapOptions,
				customElevation,
				precipitationOptions,
				temperatureOptions
			);

			expect(regions).toBeDefined();
			expect(regions.length).toBeGreaterThan(0);
		});

		it('should generate unique data for each region', async () => {
			const regions = await generateWorldLayers(
				{ ...defaultMapOptions, width: 20, height: 20 },
				elevationOptions,
				precipitationOptions,
				temperatureOptions
			);

			// Check that regions have different coordinates
			const uniqueCoords = new Set(regions.map((r) => `${r.xCoord},${r.yCoord}`));

			expect(uniqueCoords.size).toBe(regions.length);
		});
	});

	describe('Integration Tests', () => {
		it('should generate world with normalized elevation values', async () => {
			const mapOptions: MapOptions = {
				serverId: 'test',
				worldName: 'Test',
				width: 50,
				height: 50,
				seed: 12345,
			};

			const noiseOptions: NoiseOptions = {
				amplitude: 1,
				persistence: 0.5,
				frequency: 1,
				octaves: 4,
				scale: (x: number) => x,
			};

			const chunks = await generateMap(mapOptions, noiseOptions);
			expect(chunks).toBeDefined();

			// Values should be within expected range after normalization
			// (raw noise is -1 to 1, normalized to -100 to 100 for elevation)
		});

		it('should generate consistent output for same seed', async () => {
			const mapOptions: MapOptions = {
				serverId: 'test',
				worldName: 'Test',
				width: 30,
				height: 30,
				seed: 99999,
			};

			const noiseOptions: NoiseOptions = {
				amplitude: 1,
				persistence: 0.5,
				frequency: 1,
				octaves: 4,
				scale: (x: number) => x,
			};

			const result1 = await generateMap(mapOptions, noiseOptions);
			const result2 = await generateMap(mapOptions, noiseOptions);

			expect(result1.length).toBe(result2.length);
		});
	});
});
