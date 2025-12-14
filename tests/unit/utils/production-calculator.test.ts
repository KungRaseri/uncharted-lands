import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateProduction } from '../../../src/lib/utils/production-calculator';
import { getProductionRates } from '../../../src/lib/api/game-config';

// Types (mirror local interfaces from production-calculator.ts)
interface SettlementStructure {
	id: string;
	structureId: string;
	category: string;
	level: number;
	health: number;
	tileId: string | null;
	name: string;
}

interface Tile {
	id: string;
	xCoord: number;
	yCoord: number;
	foodQuality?: number;
	waterQuality?: number;
	woodQuality?: number;
	stoneQuality?: number;
	oreQuality?: number;
}

// Mock the game-config API
vi.mock('../../../src/lib/api/game-config', () => ({
	getProductionRates: vi.fn()
}));

describe('Production Calculator (API Integration)', () => {
	const mockProductionRates = {
		food: 10,
		water: 15,
		wood: 8,
		stone: 6,
		ore: 4
	};

	beforeEach(() => {
		// Reset mock before each test
		vi.mocked(getProductionRates).mockResolvedValue(mockProductionRates);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('API Integration', () => {
		it('should fetch production rates from API on first call', async () => {
			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 1,
					health: 100,
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Farm',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			const tiles = new Map<string, Tile>([
				[
					'tile-1',
					{
						id: 'tile-1',
						worldId: 'world-1',
						regionId: 'region-1',
						biomeId: 'GRASSLAND',
						x: 0,
						y: 0,
						tileType: 'LAND',
						elevation: 50,
						precipitation: 50,
						temperature: 50,
						foodQuality: 80,
						waterQuality: 70,
						woodQuality: 60,
						stoneQuality: 50,
						oreQuality: 40,
						clayQuality: 30,
						herbsQuality: 20,
						peltsQuality: 10,
						gemsQuality: 5,
						exoticWoodQuality: 0,
						settlementId: null,
						plotSlots: 5,
						baseProductionModifier: 1.0,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			]);

			const result = await calculateProduction(structures, tiles);

			// Verify API was called
			expect(getProductionRates).toHaveBeenCalledTimes(1);

			// Verify production data structure
			expect(result).toHaveProperty('rates');
			expect(result).toHaveProperty('extractors');
		});

		it('should use cached rates on subsequent calls (no duplicate API calls)', async () => {
			// Clear any existing cache by resetting the mock call count
			vi.clearAllMocks();

			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 1,
					health: 100,
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Farm',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			// First call - will call API
			const result1 = await calculateProduction(structures, undefined);
			const firstCallCount = vi.mocked(getProductionRates).mock.calls.length;

			// Second call - should use cache
			const result2 = await calculateProduction(structures, undefined);

			// Third call - should still use cache
			const result3 = await calculateProduction(structures, undefined);

			// API should be called at most once (cached after first call)
			// Note: May be 0 if cache was warm from previous test, or 1 if fresh
			expect(vi.mocked(getProductionRates).mock.calls.length).toBeLessThanOrEqual(
				Math.max(firstCallCount, 1)
			);

			// Results should be consistent
			expect(result1.rates.food).toBe(result2.rates.food);
			expect(result2.rates.food).toBe(result3.rates.food);
		});

		it('should handle API errors gracefully with fallback rates', async () => {
			// Mock API failure
			vi.mocked(getProductionRates).mockRejectedValueOnce(new Error('Network error'));

			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 1,
					health: 100,
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Farm',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			// Implementation uses graceful degradation - should not throw
			// Uses fallback quality (50) when API fails
			const result = await calculateProduction(structures, undefined);

			// Should still calculate production using fallback values
			// baseRate: 10 (from mock), quality: 50%, level: 1, health: 100%
			// Production = 10 * 0.5 * 1 * 1 = 5
			expect(result.rates.food).toBe(5);
			expect(result.extractors).toHaveLength(1);
		});
	});

	describe('Production Calculations with API Rates', () => {
		it('should calculate FOOD production using API baseRate (10)', async () => {
			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 1,
					health: 100,
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Farm',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			const tiles = new Map<string, Tile>([
				[
					'tile-1',
					{
						id: 'tile-1',
						worldId: 'world-1',
						regionId: 'region-1',
						biomeId: 'GRASSLAND',
						x: 0,
						y: 0,
						tileType: 'LAND',
						elevation: 50,
						precipitation: 50,
						temperature: 50,
						foodQuality: 100, // Perfect quality
						waterQuality: 100,
						woodQuality: 100,
						stoneQuality: 100,
						oreQuality: 100,
						clayQuality: 100,
						herbsQuality: 100,
						peltsQuality: 100,
						gemsQuality: 100,
						exoticWoodQuality: 100,
						settlementId: null,
						plotSlots: 5,
						baseProductionModifier: 1.0,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			]);

			const result = await calculateProduction(structures, tiles);

			// Formula: baseRate (10) × quality (1.0) × level (1) × health (1.0) = 10
			expect(result.rates.food).toBe(10);
			expect(result.extractors).toHaveLength(1);
			expect(result.extractors[0].production).toBe(10);
		});

		it('should calculate WATER production using API baseRate (15)', async () => {
			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'WELL',
					category: 'EXTRACTOR',
					level: 1,
					health: 100,
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Well',
					description: 'Produces water',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			const tiles = new Map<string, Tile>([
				[
					'tile-1',
					{
						id: 'tile-1',
						worldId: 'world-1',
						regionId: 'region-1',
						biomeId: 'GRASSLAND',
						x: 0,
						y: 0,
						tileType: 'LAND',
						elevation: 50,
						precipitation: 50,
						temperature: 50,
						foodQuality: 100,
						waterQuality: 100, // Perfect quality
						woodQuality: 100,
						stoneQuality: 100,
						oreQuality: 100,
						clayQuality: 100,
						herbsQuality: 100,
						peltsQuality: 100,
						gemsQuality: 100,
						exoticWoodQuality: 100,
						settlementId: null,
						plotSlots: 5,
						baseProductionModifier: 1.0,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			]);

			const result = await calculateProduction(structures, tiles);

			// Formula: baseRate (15) × quality (1.0) × level (1) × health (1.0) = 15
			expect(result.rates.water).toBe(15);
			expect(result.extractors).toHaveLength(1);
			expect(result.extractors[0].production).toBe(15);
		});

		it('should calculate production with quality multiplier', async () => {
			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 1,
					health: 100,
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Farm',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			const tiles = new Map<string, Tile>([
				[
					'tile-1',
					{
						id: 'tile-1',
						worldId: 'world-1',
						regionId: 'region-1',
						biomeId: 'GRASSLAND',
						x: 0,
						y: 0,
						tileType: 'LAND',
						elevation: 50,
						precipitation: 50,
						temperature: 50,
						foodQuality: 50, // 50% quality
						waterQuality: 50,
						woodQuality: 50,
						stoneQuality: 50,
						oreQuality: 50,
						clayQuality: 50,
						herbsQuality: 50,
						peltsQuality: 50,
						gemsQuality: 50,
						exoticWoodQuality: 50,
						settlementId: null,
						plotSlots: 5,
						baseProductionModifier: 1.0,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			]);

			const result = await calculateProduction(structures, tiles);

			// Formula: baseRate (10) × quality (0.5) × level (1) × health (1.0) = 5
			expect(result.rates.food).toBe(5);
		});

		it('should calculate production with level multiplier', async () => {
			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 3, // Level 3 extractor
					health: 100,
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Farm',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			const tiles = new Map<string, Tile>([
				[
					'tile-1',
					{
						id: 'tile-1',
						worldId: 'world-1',
						regionId: 'region-1',
						biomeId: 'GRASSLAND',
						x: 0,
						y: 0,
						tileType: 'LAND',
						elevation: 50,
						precipitation: 50,
						temperature: 50,
						foodQuality: 100,
						waterQuality: 100,
						woodQuality: 100,
						stoneQuality: 100,
						oreQuality: 100,
						clayQuality: 100,
						herbsQuality: 100,
						peltsQuality: 100,
						gemsQuality: 100,
						exoticWoodQuality: 100,
						settlementId: null,
						plotSlots: 5,
						baseProductionModifier: 1.0,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			]);

			const result = await calculateProduction(structures, tiles);

			// Formula: baseRate (10) × quality (1.0) × level (3) × health (1.0) = 30
			expect(result.rates.food).toBe(30);
		});

		it('should calculate production with health multiplier', async () => {
			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 1,
					health: 50, // 50% health (damaged)
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Farm',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			const tiles = new Map<string, Tile>([
				[
					'tile-1',
					{
						id: 'tile-1',
						worldId: 'world-1',
						regionId: 'region-1',
						biomeId: 'GRASSLAND',
						x: 0,
						y: 0,
						tileType: 'LAND',
						elevation: 50,
						precipitation: 50,
						temperature: 50,
						foodQuality: 100,
						waterQuality: 100,
						woodQuality: 100,
						stoneQuality: 100,
						oreQuality: 100,
						clayQuality: 100,
						herbsQuality: 100,
						peltsQuality: 100,
						gemsQuality: 100,
						exoticWoodQuality: 100,
						settlementId: null,
						plotSlots: 5,
						baseProductionModifier: 1.0,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			]);

			const result = await calculateProduction(structures, tiles);

			// Formula: baseRate (10) × quality (1.0) × level (1) × health (0.5) = 5
			expect(result.rates.food).toBe(5);
		});

		it('should aggregate production from multiple extractors', async () => {
			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 1,
					health: 100,
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Farm 1',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				},
				{
					id: 'struct-2',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 2,
					health: 100,
					tileId: 'tile-2',
					slotPosition: 0,
					name: 'Farm 2',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			const tiles = new Map<string, Tile>([
				[
					'tile-1',
					{
						id: 'tile-1',
						worldId: 'world-1',
						regionId: 'region-1',
						biomeId: 'GRASSLAND',
						x: 0,
						y: 0,
						tileType: 'LAND',
						elevation: 50,
						precipitation: 50,
						temperature: 50,
						foodQuality: 100,
						waterQuality: 100,
						woodQuality: 100,
						stoneQuality: 100,
						oreQuality: 100,
						clayQuality: 100,
						herbsQuality: 100,
						peltsQuality: 100,
						gemsQuality: 100,
						exoticWoodQuality: 100,
						settlementId: null,
						plotSlots: 5,
						baseProductionModifier: 1.0,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				],
				[
					'tile-2',
					{
						id: 'tile-2',
						worldId: 'world-1',
						regionId: 'region-1',
						biomeId: 'GRASSLAND',
						x: 1,
						y: 0,
						tileType: 'LAND',
						elevation: 50,
						precipitation: 50,
						temperature: 50,
						foodQuality: 100,
						waterQuality: 100,
						woodQuality: 100,
						stoneQuality: 100,
						oreQuality: 100,
						clayQuality: 100,
						herbsQuality: 100,
						peltsQuality: 100,
						gemsQuality: 100,
						exoticWoodQuality: 100,
						settlementId: null,
						plotSlots: 5,
						baseProductionModifier: 1.0,
						createdAt: new Date(),
						updatedAt: new Date()
					}
				]
			]);

			const result = await calculateProduction(structures, tiles);

			// Farm 1: baseRate (10) × quality (1.0) × level (1) × health (1.0) = 10
			// Farm 2: baseRate (10) × quality (1.0) × level (2) × health (1.0) = 20
			// Total: 30
			expect(result.rates.food).toBe(30);
			expect(result.extractors).toHaveLength(2);
		});
	});

	describe('Edge Cases', () => {
		it('should handle no structures gracefully', async () => {
			const result = await calculateProduction([], undefined);

			expect(result.rates.food).toBe(0);
			expect(result.rates.water).toBe(0);
			expect(result.rates.wood).toBe(0);
			expect(result.rates.stone).toBe(0);
			expect(result.rates.ore).toBe(0);
			expect(result.extractors).toHaveLength(0);
		});

		it('should handle non-extractor structures (skip them)', async () => {
			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'HOUSE',
					category: 'BUILDING', // Not an extractor
					level: 1,
					health: 100,
					tileId: null,
					slotPosition: null,
					name: 'House',
					description: 'Provides housing',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			const result = await calculateProduction(structures, undefined);

			// Should skip non-extractors
			expect(result.rates.food).toBe(0);
			expect(result.extractors).toHaveLength(0);
		});

		it('should handle missing tile data gracefully', async () => {
			const structures: SettlementStructure[] = [
				{
					id: 'struct-1',
					settlementId: 'settlement-1',
					structureId: 'FARM',
					category: 'EXTRACTOR',
					level: 1,
					health: 100,
					tileId: 'tile-1',
					slotPosition: 0,
					name: 'Farm',
					description: 'Produces food',
					createdAt: new Date(),
					updatedAt: new Date()
				}
			];

			// No tiles provided - should use fallback quality (50%)
			const result = await calculateProduction(structures, undefined);

			// Should use 50% quality fallback
			// baseRate: 10 (from mock), quality: 50%, level: 1, health: 100%
			// Production = 10 * 0.5 * 1 * 1 = 5
			expect(result.rates.food).toBe(5);
			expect(result.extractors).toHaveLength(1);
			expect(result.extractors[0].quality).toBe(50); // Fallback quality
		});
	});
});
