/**
 * Tests for World Creator
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createWorld, type WorldCreationOptions } from '../../../src/game/world-creator.js';
import * as worldGenerator from '../../../src/game/world-generator.js';
import * as resourceGenerator from '../../../src/game/resource-generator.js';
import * as dbModule from '../../../src/db/index.js';
import * as queries from '../../../src/db/queries.js';
import { createId } from '@paralleldrive/cuid2';

// Mock dependencies
vi.mock('../../../src/utils/logger.js', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
		debug: vi.fn(),
	},
}));

// Mock createId to return predictable test IDs
vi.mock('@paralleldrive/cuid2', () => ({
	createId: vi.fn(() => 'test-id'),
}));

vi.mock('../../../src/game/world-generator');
vi.mock('../../../src/game/resource-generator');
vi.mock('../../../src/db/queries');

// Helper function to create 2D arrays (declared at module level to avoid nesting)
const createMapArray = (size: number, value: number) =>
	new Array(size).fill(null).map(() => new Array(size).fill(value));

describe('World Creator', () => {
	// Mock database transaction
	const mockInsert = vi.fn(() => ({
		values: vi.fn(),
	}));

	const mockTransaction = vi.fn(async (callback) => {
		const txMock = {
			insert: mockInsert,
		};
		await callback(txMock);
	});

	beforeEach(() => {
		vi.clearAllMocks();

		// Setup default mocks
		vi.mocked(worldGenerator.generateWorldLayers).mockResolvedValue([
			{
				xCoord: 0,
				yCoord: 0,
				elevationMap: [
					[0.5, -0.3],
					[0.8, 0.1],
				],
				precipitationMap: [
					[0.6, 0.4],
					[0.7, 0.5],
				],
				temperatureMap: [
					[0.2, 0.3],
					[0.1, 0.4],
				],
			},
		]);

		vi.mocked(worldGenerator.normalizeValue).mockImplementation((value, min, max) => {
			return min + ((value + 1) / 2) * (max - min);
		});

		vi.mocked(queries.getAllBiomes).mockResolvedValue([
			{
				id: 'biome-1',
				name: 'Temperate Forest',
				precipitationMin: 100,
				precipitationMax: 300,
				temperatureMin: 5,
				temperatureMax: 20,
				plotsMin: 1,
				plotsMax: 10,
				plotAreaMin: 30,
				plotAreaMax: 50,
				solarModifier: 1,
				windModifier: 1,
				foodModifier: 1,
				waterModifier: 1,
				woodModifier: 1,
				stoneModifier: 1,
				oreModifier: 1,
			},
		]);

		vi.mocked(queries.findBiome).mockResolvedValue({
			id: 'biome-1',
			name: 'Temperate Forest',
			precipitationMin: 100,
			precipitationMax: 300,
			temperatureMin: 5,
			temperatureMax: 20,
			plotsMin: 1,
			plotsMax: 10,
			plotAreaMin: 30,
			plotAreaMax: 50,
			solarModifier: 1,
			windModifier: 1,
			foodModifier: 1,
			waterModifier: 1,
			woodModifier: 1,
			stoneModifier: 1,
			oreModifier: 1,
		});

		vi.mocked(resourceGenerator.determinePlotsTotal).mockReturnValue(3);
		vi.mocked(resourceGenerator.generatePlotResources).mockReturnValue({
			area: 100,
			solar: 50,
			wind: 30,
			food: 80,
			water: 90,
			wood: 70,
			stone: 40,
			ore: 20,
		});

		// Mock db.transaction
		Object.defineProperty(dbModule.db, 'transaction', {
			value: mockTransaction,
			writable: true,
			configurable: true,
		});
	});

	describe('createWorld', () => {
		const defaultOptions: WorldCreationOptions = {
			serverId: 'server-1',
			worldName: 'Test World',
			width: 100,
			height: 100,
			seed: 12345,
			elevationOptions: {
				octaves: 4,
				amplitude: 1,
				frequency: 1,
				persistence: 0.5,
				scale: (x) => x,
			},
			precipitationOptions: {
				octaves: 3,
				amplitude: 1,
				frequency: 1,
				persistence: 0.5,
				scale: (x) => x,
			},
			temperatureOptions: {
				octaves: 2,
				amplitude: 1,
				frequency: 1,
				persistence: 0.5,
				scale: (x) => x,
			},
		};

		it('should create a world with all components', async () => {
			const result = await createWorld(defaultOptions);

			expect(result).toMatchObject({
				worldId: 'test-id',
				regionCount: 1,
				tileCount: 4,
			});
			expect(result.duration).toBeGreaterThanOrEqual(0);
			expect(typeof result.duration).toBe('number');
		});

		it('should call generateWorldLayers with correct options', async () => {
			await createWorld(defaultOptions);

			expect(worldGenerator.generateWorldLayers).toHaveBeenCalledWith(
				{
					serverId: 'server-1',
					worldName: 'Test World',
					width: 100,
					height: 100,
					seed: 12345,
				},
				defaultOptions.elevationOptions,
				defaultOptions.precipitationOptions,
				defaultOptions.temperatureOptions
			);
		});

		it('should load biomes from database', async () => {
			await createWorld(defaultOptions);

			expect(queries.getAllBiomes).toHaveBeenCalledOnce();
		});

		it('should throw error if no biomes found', async () => {
			vi.mocked(queries.getAllBiomes).mockResolvedValue([]);

			await expect(createWorld(defaultOptions)).rejects.toThrow(
				'No biomes found in database. Please seed the database first.'
			);
		});

		it('should create world record with correct data', async () => {
			await createWorld(defaultOptions);

			expect(mockTransaction).toHaveBeenCalled();
			expect(mockInsert).toHaveBeenCalled();
		});

		it('should handle null serverId', async () => {
			const options = { ...defaultOptions, serverId: null };
			const result = await createWorld(options);

			expect(result.worldId).toBe('test-id');
		});

		it('should create regions with correct structure', async () => {
			vi.mocked(worldGenerator.generateWorldLayers).mockResolvedValue([
				{
					xCoord: 0,
					yCoord: 0,
					elevationMap: [[0.5]],
					precipitationMap: [[0.6]],
					temperatureMap: [[0.2]],
				},
				{
					xCoord: 1,
					yCoord: 0,
					elevationMap: [[0.4]],
					precipitationMap: [[0.5]],
					temperatureMap: [[0.3]],
				},
			]);

			const result = await createWorld(defaultOptions);

			expect(result.regionCount).toBe(2);
			expect(result.tileCount).toBe(2);
		});

		it('should classify tiles as OCEAN when elevation < 0', async () => {
			vi.mocked(worldGenerator.generateWorldLayers).mockResolvedValue([
				{
					xCoord: 0,
					yCoord: 0,
					elevationMap: [[-0.5]],
					precipitationMap: [[0.6]],
					temperatureMap: [[0.2]],
				},
			]);

			const result = await createWorld(defaultOptions);

			expect(result.tileCount).toBe(1);
		});

		it('should classify tiles as LAND when elevation >= 0', async () => {
			vi.mocked(worldGenerator.generateWorldLayers).mockResolvedValue([
				{
					xCoord: 0,
					yCoord: 0,
					elevationMap: [[0.5]],
					precipitationMap: [[0.6]],
					temperatureMap: [[0.2]],
				},
			]);

			const result = await createWorld(defaultOptions);

			expect(result.tileCount).toBe(1);
		});

		it('should normalize precipitation and temperature', async () => {
			await createWorld(defaultOptions);

			// normalizeValue should be called for each tile (4 tiles, 2 calls per tile)
			expect(worldGenerator.normalizeValue).toHaveBeenCalled();
			const calls = vi.mocked(worldGenerator.normalizeValue).mock.calls;

			// Check precipitation normalization (0, 450)
			const precipCalls = calls.filter(([_, min, max]) => min === 0 && max === 450);
			expect(precipCalls.length).toBeGreaterThan(0);

			// Check temperature normalization (-10, 32)
			const tempCalls = calls.filter(([_, min, max]) => min === -10 && max === 32);
			expect(tempCalls.length).toBeGreaterThan(0);
		});

		it('should find biome for each tile', async () => {
			await createWorld(defaultOptions);

			// Should be called once per tile (4 tiles)
			expect(queries.findBiome).toHaveBeenCalledTimes(4);
		});

		it('should throw error if biome not found for tile', async () => {
			vi.mocked(queries.findBiome).mockResolvedValue(undefined as any);

			await expect(createWorld(defaultOptions)).rejects.toThrow(
				/Failed to determine biome for tile/
			);
		});

		// Deleted obsolete plot-generation test - plots table removed, tile resource quality used instead

		// Deleted obsolete determinePlotsTotal test - function removed with plot system

		// Deleted obsolete "skip plots if biome not found" test - plot system removed
		// Note: If biome is not found, createWorld now throws an error (see "should throw error if biome not found" test)

		it('should save all records to database in transaction', async () => {
			await createWorld(defaultOptions);

			expect(mockTransaction).toHaveBeenCalledOnce();
			expect(mockInsert).toHaveBeenCalled();
		});

		it('should batch insert regions', async () => {
			const manyRegions = Array.from({ length: 250 }, (_, i) => ({
				xCoord: i % 10,
				yCoord: Math.floor(i / 10),
				elevationMap: [[0.5]],
				precipitationMap: [[0.6]],
				temperatureMap: [[0.2]],
			}));

			vi.mocked(worldGenerator.generateWorldLayers).mockResolvedValue(manyRegions);

			await createWorld(defaultOptions);

			// With 250 regions and batch size 100, should insert 3 times
			expect(mockTransaction).toHaveBeenCalled();
		});

		it('should batch insert tiles', async () => {
			const largeRegion = {
				xCoord: 0,
				yCoord: 0,
				elevationMap: new Array(30).fill(null).map(() => new Array(30).fill(0.5)),
				precipitationMap: new Array(30).fill(null).map(() => new Array(30).fill(0.6)),
				temperatureMap: new Array(30).fill(null).map(() => new Array(30).fill(0.2)),
			};

			vi.mocked(worldGenerator.generateWorldLayers).mockResolvedValue([largeRegion]);

			await createWorld(defaultOptions);

			// 30x30 = 900 tiles, should batch
			expect(mockTransaction).toHaveBeenCalled();
		});

		it('should batch insert plots', async () => {
			vi.mocked(resourceGenerator.determinePlotsTotal).mockReturnValue(100);

			await createWorld(defaultOptions);

			// 4 tiles × 100 plots = 400 plots, should batch
			expect(mockTransaction).toHaveBeenCalled();
		});

		it('should calculate correct duration', async () => {
			const result = await createWorld(defaultOptions);

			expect(result.duration).toBeGreaterThanOrEqual(0);
			expect(typeof result.duration).toBe('number');
		});

		it('should handle small worlds', async () => {
			const smallOptions = {
				...defaultOptions,
				width: 10,
				height: 10,
			};

			vi.mocked(worldGenerator.generateWorldLayers).mockResolvedValue([
				{
					xCoord: 0,
					yCoord: 0,
					elevationMap: [[0.5]],
					precipitationMap: [[0.6]],
					temperatureMap: [[0.2]],
				},
			]);

			const result = await createWorld(smallOptions);

			expect(result.regionCount).toBe(1);
			expect(result.tileCount).toBe(1);
		});

		it('should handle large worlds', async () => {
			const largeOptions = {
				...defaultOptions,
				width: 500,
				height: 500,
			};

			const largeRegions = new Array(25).fill(null).map((_, i) => ({
				xCoord: i % 5,
				yCoord: Math.floor(i / 5),
				elevationMap: createMapArray(10, 0.5),
				precipitationMap: createMapArray(10, 0.6),
				temperatureMap: createMapArray(10, 0.2),
			}));

			vi.mocked(worldGenerator.generateWorldLayers).mockResolvedValue(largeRegions);

			const result = await createWorld(largeOptions);

			expect(result.regionCount).toBe(25);
			expect(result.tileCount).toBe(25 * 10 * 10); // 2500 tiles
		});

		it('should use different seeds correctly', async () => {
			const options1 = { ...defaultOptions, seed: 11111 };
			const options2 = { ...defaultOptions, seed: 22222 };

			await createWorld(options1);
			await createWorld(options2);

			const calls = vi.mocked(worldGenerator.generateWorldLayers).mock.calls;
			expect(calls[0][0].seed).toBe(11111);
			expect(calls[1][0].seed).toBe(22222);
		});

		it('should pass noise options correctly', async () => {
			const customOptions: WorldCreationOptions = {
				...defaultOptions,
				elevationOptions: {
					octaves: 6,
					amplitude: 2,
					frequency: 0.5,
					persistence: 0.6,
					scale: (x) => x * 2,
				},
				precipitationOptions: {
					octaves: 4,
					amplitude: 1.5,
					frequency: 0.8,
					persistence: 0.4,
					scale: (x) => x,
				},
				temperatureOptions: {
					octaves: 3,
					amplitude: 1.2,
					frequency: 0.6,
					persistence: 0.3,
					scale: (x) => x,
				},
			};

			await createWorld(customOptions);

			expect(worldGenerator.generateWorldLayers).toHaveBeenCalledWith(
				expect.any(Object),
				customOptions.elevationOptions,
				customOptions.precipitationOptions,
				customOptions.temperatureOptions
			);
		});

		it('should generate unique IDs for all records', async () => {
			let idCounter = 0;
			vi.mocked(createId).mockImplementation(() => `id-${idCounter++}`);

			await createWorld(defaultOptions);

			// Should generate IDs for: 1 world + 1 region + 4 tiles + 12 plots = 18 IDs
			expect(createId).toHaveBeenCalled();
			expect(idCounter).toBeGreaterThan(0);
		});

		// Deleted obsolete "include all plot resource fields" test - plot resource generation removed
		// Tiles now have resource quality fields (foodQuality, woodQuality, etc.) set directly

		it('should handle mixed ocean and land tiles', async () => {
			vi.mocked(worldGenerator.generateWorldLayers).mockResolvedValue([
				{
					xCoord: 0,
					yCoord: 0,
					elevationMap: [
						[-0.5, 0.5],
						[0.2, -0.3],
					],
					precipitationMap: [
						[0.6, 0.6],
						[0.6, 0.6],
					],
					temperatureMap: [
						[0.2, 0.2],
						[0.2, 0.2],
					],
				},
			]);

			const result = await createWorld(defaultOptions);

			expect(result.tileCount).toBe(4); // 2 ocean + 2 land
		});

		// Deleted obsolete "return correct plot count" test - plot counting removed
		// Tile counting is verified in other tests (e.g., "should create a world with all components")
	});
});
