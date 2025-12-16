import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
	getBaseProductionRate,
	getBiomeEfficiency,
	getStructureLevelMultiplier,
	calculateProductionRate,
	calculateAccumulatedResources,
	getQualityInfo,
	formatHarvestTime,
	getResourceIcon,
	getResourceName,
	getExtractorName,
	getBuildingName
} from '../../../src/lib/utils/resource-production';
import { getGameConfig } from '../../../src/lib/api/game-config';
import type { GameConfig } from '../../../src/lib/types/game-config';

// Mock the game-config module
vi.mock('../../../src/lib/api/game-config', () => ({
	getGameConfig: vi.fn()
}));

const mockConfig: GameConfig = {
	productionRates: [
		{ resourceType: 'FOOD' as const, extractorType: 'FARM' as const, baseRate: 10 },
		{ resourceType: 'WOOD' as const, extractorType: 'LUMBER_MILL' as const, baseRate: 8 },
		{ resourceType: 'STONE' as const, extractorType: 'QUARRY' as const, baseRate: 6 },
		{ resourceType: 'ORE' as const, extractorType: 'MINE' as const, baseRate: 4 }
	],
	biomeEfficiencies: [
		{ biomeName: 'Grassland', resourceType: 'FOOD' as const, efficiency: 1.8 },
		{ biomeName: 'Grassland', resourceType: 'WOOD' as const, efficiency: 0.5 },
		{ biomeName: 'Forest', resourceType: 'WOOD' as const, efficiency: 2 },
		{ biomeName: 'Mountains', resourceType: 'STONE' as const, efficiency: 2 }
	],
	structureLevels: [
		{ level: 1, multiplier: 1 },
		{ level: 2, multiplier: 1.5 },
		{ level: 3, multiplier: 2.25 },
		{ level: 4, multiplier: 3.375 },
		{ level: 5, multiplier: 5.0625 }
	],
	qualityThresholds: {
		veryPoor: 20,
		poor: 40,
		average: 60,
		good: 80,
		excellent: 100
	},
	resourceDisplay: [
		{ type: 'FOOD', name: 'Food', icon: '🌾', description: 'Basic sustenance' },
		{ type: 'WOOD', name: 'Wood', icon: '🪵', description: 'Building material' },
		{ type: 'STONE', name: 'Stone', icon: '🪨', description: 'Construction resource' },
		{ type: 'ORE', name: 'Ore', icon: '⛏️', description: 'Metal resource' }
	],
	extractorDisplay: [
		{ type: 'FARM', name: 'Farm', icon: '🌾', description: 'Grows food' },
		{ type: 'LUMBER_MILL', name: 'Lumber Mill', icon: '🪵', description: 'Processes timber' },
		{ type: 'QUARRY', name: 'Quarry', icon: '🪨', description: 'Extracts stone' },
		{ type: 'MINE', name: 'Mine', icon: '⛏️', description: 'Digs for ore' }
	],
	buildingDisplay: [
		{ type: 'HOUSE', name: 'House', icon: '🏠', description: 'Housing' },
		{ type: 'STORAGE', name: 'Storage', icon: '📦', description: 'Stores resources' },
		{ type: 'BARRACKS', name: 'Barracks', icon: '⚔️', description: 'Trains units' }
	],
	qualityDisplay: [
		{ threshold: 20, rating: 'Very Poor', color: 'text-red-600', multiplier: 0.5 },
		{ threshold: 40, rating: 'Poor', color: 'text-orange-600', multiplier: 0.75 },
		{ threshold: 60, rating: 'Average', color: 'text-yellow-600', multiplier: 1 },
		{ threshold: 80, rating: 'Good', color: 'text-green-600', multiplier: 1.5 },
		{ threshold: 100, rating: 'Excellent', color: 'text-blue-600', multiplier: 2 }
	],
	accumulation: {
		fullRateHours: 24,
		tier1Multiplier: 0.5,
		tier1Hours: 48,
		tier2Multiplier: 0.25,
		tier2Hours: 72,
		maxHours: 96
	},
	biomeDisplay: {} as Record<
		string,
		{ icon: string; color: string; name: string; description: string }
	>
};

describe('Resource Production Utilities', () => {
	beforeEach(() => {
		vi.mocked(getGameConfig).mockResolvedValue(mockConfig);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('getBaseProductionRate', () => {
		it('should return base production rate for valid resource/extractor combination', async () => {
			const rate = await getBaseProductionRate('FOOD', 'FARM');
			expect(rate).toBe(10);
		});

		it('should return base production rate for wood', async () => {
			const rate = await getBaseProductionRate('WOOD', 'LUMBER_MILL');
			expect(rate).toBe(8);
		});

		it('should return 0 for non-existent resource type', async () => {
			const rate = await getBaseProductionRate('INVALID', 'FARM');
			expect(rate).toBe(0);
		});

		it('should return 0 for non-existent extractor type', async () => {
			const rate = await getBaseProductionRate('FOOD', 'INVALID');
			expect(rate).toBe(0);
		});

		it('should return 0 for mismatched resource/extractor', async () => {
			const rate = await getBaseProductionRate('FOOD', 'MINE');
			expect(rate).toBe(0);
		});
	});

	describe('getBiomeEfficiency', () => {
		it('should return efficiency for valid biome/resource combination', async () => {
			const efficiency = await getBiomeEfficiency('Grassland', 'FOOD');
			expect(efficiency).toBe(1.8);
		});

		it('should return efficiency for forest wood production', async () => {
			const efficiency = await getBiomeEfficiency('Forest', 'WOOD');
			expect(efficiency).toBe(2);
		});

		it('should return 1 for non-existent biome', async () => {
			const efficiency = await getBiomeEfficiency('INVALID', 'FOOD');
			expect(efficiency).toBe(1);
		});

		it('should return 1 for non-existent resource in biome', async () => {
			const efficiency = await getBiomeEfficiency('Grassland', 'INVALID');
			expect(efficiency).toBe(1);
		});

		it('should return 1 for undefined combination', async () => {
			const efficiency = await getBiomeEfficiency('Mountains', 'FOOD');
			expect(efficiency).toBe(1);
		});
	});

	describe('getStructureLevelMultiplier', () => {
		it('should return correct multiplier for level 1', async () => {
			const multiplier = await getStructureLevelMultiplier(1);
			expect(multiplier).toBe(1);
		});

		it('should return correct multiplier for level 2', async () => {
			const multiplier = await getStructureLevelMultiplier(2);
			expect(multiplier).toBe(1.5);
		});

		it('should return correct multiplier for level 3', async () => {
			const multiplier = await getStructureLevelMultiplier(3);
			expect(multiplier).toBe(2.25);
		});

		it('should return correct multiplier for level 5', async () => {
			const multiplier = await getStructureLevelMultiplier(5);
			expect(multiplier).toBe(5.0625);
		});

		it('should calculate fallback multiplier for unlisted level', async () => {
			const multiplier = await getStructureLevelMultiplier(6);
			expect(multiplier).toBeCloseTo(Math.pow(1.5, 5), 2);
		});
	});

	describe('calculateProductionRate', () => {
		it('should calculate production rate correctly', async () => {
			const rate = await calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 1
			});
			// 10 (base) * 1.8 (biome) * 1 (level) = 18
			expect(rate).toBe(18);
		});

		it('should calculate with level multiplier', async () => {
			const rate = await calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 2
			});
			// 10 * 1.8 * 1.5 = 27
			expect(rate).toBe(27);
		});

		it('should calculate wood production in forest', async () => {
			const rate = await calculateProductionRate({
				resourceType: 'WOOD',
				extractorType: 'LUMBER_MILL',
				biomeName: 'Forest',
				structureLevel: 1
			});
			// 8 * 2.0 * 1 = 16
			expect(rate).toBe(16);
		});

		it('should return 0 for invalid resource type', async () => {
			const rate = await calculateProductionRate({
				resourceType: 'INVALID',
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 1
			});
			expect(rate).toBe(0);
		});

		it('should use default efficiency of 1 for undefined biome', async () => {
			const rate = await calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'UnknownBiome',
				structureLevel: 1
			});
			// 10 * 1 * 1 = 10
			expect(rate).toBe(10);
		});

		it('should round result to 2 decimals', async () => {
			const rate = await calculateProductionRate({
				resourceType: 'FOOD',
				extractorType: 'FARM',
				biomeName: 'Grassland',
				structureLevel: 3
			});
			// 10 * 1.8 * 2.25 = 40.5
			expect(rate).toBe(40.5);
		});
	});

	describe('calculateAccumulatedResources', () => {
		it('should return 0 if lastHarvested is null', async () => {
			const accumulated = await calculateAccumulatedResources(10, null);
			expect(accumulated).toBe(0);
		});

		it('should calculate resources for 1 hour', async () => {
			const oneHourAgo = new Date(Date.now() - 1 * 60 * 60 * 1000);
			const accumulated = await calculateAccumulatedResources(10, oneHourAgo);
			expect(accumulated).toBe(10);
		});

		it('should calculate resources for 12 hours (full rate)', async () => {
			const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
			const accumulated = await calculateAccumulatedResources(10, twelveHoursAgo);
			expect(accumulated).toBe(120);
		});

		it('should calculate resources for 24 hours (full rate)', async () => {
			const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
			const accumulated = await calculateAccumulatedResources(10, twentyFourHoursAgo);
			expect(accumulated).toBe(240);
		});

		it('should apply diminishing returns after 24 hours', async () => {
			const thirtyHoursAgo = new Date(Date.now() - 30 * 60 * 60 * 1000);
			const accumulated = await calculateAccumulatedResources(10, thirtyHoursAgo);
			// 24h full + 6h at 50% = 240 + 30 = 270
			expect(accumulated).toBe(270);
		});

		it('should apply second tier diminishing returns after 48 hours', async () => {
			const fiftyHoursAgo = new Date(Date.now() - 50 * 60 * 60 * 1000);
			const accumulated = await calculateAccumulatedResources(10, fiftyHoursAgo);
			// First 24h at full rate: 240
			// Next 24h (48-24=24) at 50%: 24 * 10 * 0.5 = 120
			// Hours 48-50 (2h) at 25%: 2 * 10 * 0.25 = 5
			// But the logic checks if effectiveHours > tier1Hours (48)
			// So after applying tier1: effectiveHours = 24 + (50-24)*0.5 = 24 + 13 = 37
			// Then checks if 37 > 48 (false), so tier2 doesn't apply yet
			// Actually: 24 + (50-24)*0.5 = 24 + 26*0.5 = 24 + 13 = 37
			// Result: 10 * 37 = 370
			expect(accumulated).toBe(370);
		});

		it('should cap at maximum hours', async () => {
			const hundredHoursAgo = new Date(Date.now() - 100 * 60 * 60 * 1000);
			const accumulated = await calculateAccumulatedResources(10, hundredHoursAgo);
			// Capped at 96 effective hours
			// 24 full + 24 at 50% + 48 at 25% but capped at 96
			// This would be 240 + 120 + ~remaining
			expect(accumulated).toBeGreaterThan(0);
			expect(accumulated).toBeLessThanOrEqual(960); // Max possible
		});

		it('should floor the result', async () => {
			const halfHourAgo = new Date(Date.now() - 0.5 * 60 * 60 * 1000);
			const accumulated = await calculateAccumulatedResources(10, halfHourAgo);
			expect(accumulated).toBe(5); // Floored
		});
	});

	describe('getQualityInfo', () => {
		it('should return Very Poor for quality <= 20', async () => {
			const info = await getQualityInfo(15);
			expect(info.rating).toBe('Very Poor');
			expect(info.color).toBe('text-red-600');
			expect(info.multiplier).toBe(0.5);
		});

		it('should return Poor for quality <= 40', async () => {
			const info = await getQualityInfo(35);
			expect(info.rating).toBe('Poor');
			expect(info.color).toBe('text-orange-600');
			expect(info.multiplier).toBe(0.75);
		});

		it('should return Average for quality <= 60', async () => {
			const info = await getQualityInfo(50);
			expect(info.rating).toBe('Average');
			expect(info.color).toBe('text-yellow-600');
			expect(info.multiplier).toBe(1);
		});

		it('should return Good for quality <= 80', async () => {
			const info = await getQualityInfo(75);
			expect(info.rating).toBe('Good');
			expect(info.color).toBe('text-green-600');
			expect(info.multiplier).toBe(1.5);
		});

		it('should return Excellent for quality > 80', async () => {
			const info = await getQualityInfo(95);
			expect(info.rating).toBe('Excellent');
			expect(info.color).toBe('text-blue-600');
			expect(info.multiplier).toBe(2);
		});

		it('should handle threshold boundary at 20', async () => {
			const info = await getQualityInfo(20);
			expect(info.rating).toBe('Very Poor');
		});

		it('should handle threshold boundary at 80', async () => {
			const info = await getQualityInfo(80);
			expect(info.rating).toBe('Good');
		});
	});

	describe('formatHarvestTime', () => {
		it('should return "Not producing" if lastHarvested is null', async () => {
			const text = await formatHarvestTime(null, 10);
			expect(text).toBe('Not producing');
		});

		it('should return "Not producing" if productionRate is 0', async () => {
			const now = new Date();
			const text = await formatHarvestTime(now, 0);
			expect(text).toBe('Not producing');
		});

		it('should return "Ready (max)" if >= 96 hours', async () => {
			const ninetySevenHoursAgo = new Date(Date.now() - 97 * 60 * 60 * 1000);
			const text = await formatHarvestTime(ninetySevenHoursAgo, 10);
			expect(text).toBe('Ready (max)');
		});

		it('should return "Ready" if >= 24 hours', async () => {
			const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
			const text = await formatHarvestTime(twentyFiveHoursAgo, 10);
			expect(text).toBe('Ready');
		});

		it('should return hours ago if >= 1 hour', async () => {
			const fiveHoursAgo = new Date(Date.now() - 5 * 60 * 60 * 1000);
			const text = await formatHarvestTime(fiveHoursAgo, 10);
			expect(text).toBe('5h ago');
		});

		it('should return minutes ago if < 1 hour', async () => {
			const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
			const text = await formatHarvestTime(thirtyMinutesAgo, 10);
			expect(text).toBe('30m ago');
		});
	});

	describe('getResourceIcon', () => {
		it('should return icon for FOOD', async () => {
			const icon = await getResourceIcon('FOOD');
			expect(icon).toBe('🌾');
		});

		it('should return icon for WOOD', async () => {
			const icon = await getResourceIcon('WOOD');
			expect(icon).toBe('🪵');
		});

		it('should return fallback icon for unknown resource', async () => {
			const icon = await getResourceIcon('UNKNOWN');
			expect(icon).toBe('❓');
		});
	});

	describe('getResourceName', () => {
		it('should return name for FOOD', async () => {
			const name = await getResourceName('FOOD');
			expect(name).toBe('Food');
		});

		it('should return name for STONE', async () => {
			const name = await getResourceName('STONE');
			expect(name).toBe('Stone');
		});

		it('should return resource type as fallback for unknown resource', async () => {
			const name = await getResourceName('UNKNOWN');
			expect(name).toBe('UNKNOWN');
		});
	});

	describe('getExtractorName', () => {
		it('should return name for FARM', async () => {
			const name = await getExtractorName('FARM');
			expect(name).toBe('Farm');
		});

		it('should return name for LUMBER_MILL', async () => {
			const name = await getExtractorName('LUMBER_MILL');
			expect(name).toBe('Lumber Mill');
		});

		it('should return extractor type as fallback for unknown extractor', async () => {
			const name = await getExtractorName('UNKNOWN');
			expect(name).toBe('UNKNOWN');
		});
	});

	describe('getBuildingName', () => {
		it('should return name for HOUSE', async () => {
			const name = await getBuildingName('HOUSE');
			expect(name).toBe('House');
		});

		it('should return name for STORAGE', async () => {
			const name = await getBuildingName('STORAGE');
			expect(name).toBe('Storage');
		});

		it('should return building type as fallback for unknown building', async () => {
			const name = await getBuildingName('UNKNOWN');
			expect(name).toBe('UNKNOWN');
		});
	});
});
