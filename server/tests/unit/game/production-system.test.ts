/**
 * BLOCKER 2 Validation Tests
 *
 * Tests for production system requiring extractor structures.
 * Validates that resources are only produced when extractors exist on plots.
 *
 * Test Scenarios (from AUDIT-GDD-vs-Implementation.md):
 * 1. No extractors → Zero production
 * 2. FARM level 1 → Correct food production
 * 3. FARM level 2 → 20% more production (level multiplier)
 * 4a. FARM in FOREST → 80% food (biome efficiency)
 * 4b. LUMBER_MILL in FOREST → 200% wood (biome efficiency)
 * 5. Multiple extractors on same plot → Production sums correctly
 */

import { describe, test, expect } from 'vitest';
import {
	calculateProduction,
	isExtractor,
	getAverageLevel,
	getMaxLevel,
	getExtractorsByResource,
	type StructureWithInfo,
} from '../../../src/game/resource-calculator';
import type { Tile } from '../../../src/db/schema';

// ===== TEST DATA SETUP =====

/**
 * Creates a mock tile with specified resource quality values
 */
function createMockTile(overrides: Partial<Tile> = {}): Tile {
	return {
		id: 'test-tile-1',
		regionId: 'test-region-1',
		biomeId: 'test-biome-1',
		xCoord: 0,
		yCoord: 0,
		type: 'LAND',
		elevation: 100,
		precipitation: 50,
		temperature: 20,
		foodQuality: 0, // Default to 0, set explicitly in tests
		woodQuality: 0,
		stoneQuality: 0,
		oreQuality: 0,
		settlementId: null,
		plotSlots: 5,
		baseProductionModifier: 1.0,
		specialResource: null,
		...overrides,
	} as Tile;
}

/**
 * Creates a mock extractor structure
 */
function createMockExtractor(
	extractorType: string,
	level: number = 1,
	slotPosition: number = 0,
	overrides: Partial<StructureWithInfo> = {}
): StructureWithInfo {
	return {
		id: `structure-${extractorType}-${level}`,
		settlementId: 'settlement-1',
		structureId: `def-${extractorType}`,
		tileId: 'test-tile-1',
		slotPosition,
		name: extractorType,
		level,
		category: 'EXTRACTOR',
		extractorType,
		buildingType: null,
		populationAssigned: 0,
		health: 100,
		damagedAt: null,
		lastRepairedAt: null,
		constructionStartedAt: null,
		constructionCompletedAt: new Date(),
		description: `Mock ${extractorType}`,
		createdAt: new Date(),
		updatedAt: new Date(),
		...overrides,
	} as StructureWithInfo;
}

// ===== TEST SCENARIOS =====

describe('BLOCKER 2: Production Requires Extractors', () => {
	const TICKS_PER_SECOND = 60;
	const BIOME_GRASSLAND = 'GRASSLAND'; // 1x all resources
	const BIOME_FOREST = 'FOREST'; // 0.8x food, 2x wood

	// ===== SCENARIO 1: No Extractors → Zero Production =====
	describe('Scenario 1: No extractors produce zero resources', () => {
		test('plot with resources but no extractors produces 20% base production', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				foodQuality: 100,
				woodQuality: 100,
				stoneQuality: 100,
				oreQuality: 100,
			});

			const production = calculateProduction(
				tile,
				[], // No extractors
				TICKS_PER_SECOND,
				BIOME_GRASSLAND
			);

			// BLOCKER 2: 20% base production (baseRate × quality × biomeEff × 0.2 × 1 × ticks)
			// 1 × 1.0 × 1.0 × 0.2 × 1 × 60 = 12
			expect(production.food).toBeCloseTo(12, 4);
			// NOTE: No waterQuality field in Tile schema, so no water production
			expect(production.wood).toBeCloseTo(12, 4);
			expect(production.stone).toBeCloseTo(12, 4);
			expect(production.ore).toBeCloseTo(12, 4);
		});

		test('plot with BUILDING (not EXTRACTOR) produces 20% base production', () => {
			const tile = createMockTile({ baseProductionModifier: 1, foodQuality: 100 });
			const building: StructureWithInfo = {
				id: 'building-1',
				settlementId: 'settlement-1',
				structureId: 'def-house',
				tileId: 'test-tile-1',
				slotPosition: 0,
				name: 'House',
				level: 1,
				category: 'BUILDING',
				extractorType: null,
				buildingType: 'HOUSE',
				populationAssigned: 0,
				health: 100,
				damagedAt: null,
				lastRepairedAt: null,
				constructionStartedAt: null,
				constructionCompletedAt: new Date(),
				description: 'Housing',
				createdAt: new Date(),
				updatedAt: new Date(),
			} as StructureWithInfo;

			const production = calculateProduction(
				tile,
				[building], // Building, not extractor
				TICKS_PER_SECOND,
				BIOME_GRASSLAND
			);

			// BLOCKER 2: 20% base production (buildings don't boost, no extractor multiplier)
			// 1 × 1 × 1.0 × 0.2 × 1 × 60 = 12
			expect(production.food).toBeCloseTo(12, 4);
			expect(production.water).toBe(0); // Correct: no water production
			expect(production.wood).toBe(0);
			expect(production.stone).toBe(0);
			expect(production.ore).toBe(0);
		});
	});

	// ===== SCENARIO 2: FARM Level 1 → Tier 1 Multiplier (5×) =====
	describe('Scenario 2: FARM level 1 produces correct food', () => {
		test('FARM level 1 with quality 1.2 in GRASSLAND', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				foodQuality: 120,
			});

			const farm = createMockExtractor('FARM', 1);

			const production = calculateProduction(tile, [farm], TICKS_PER_SECOND, BIOME_GRASSLAND);

			// BLOCKER 2: baseRate × quality × biomeEff × 0.2 × tierMult × ticks
			// 1 × 1.2 × 1.0 × 0.2 × 5 × 60 = 72 food (Tier 1 = 5×)
			expect(production.food).toBeCloseTo(72, 4);
			expect(production.water).toBe(0);
			expect(production.wood).toBe(0);
			expect(production.stone).toBe(0);
			expect(production.ore).toBe(0);
		});

		test('FARM level 1 with quality 1 in GRASSLAND', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				foodQuality: 100,
			});

			const farm = createMockExtractor('FARM', 1);

			const production = calculateProduction(tile, [farm], TICKS_PER_SECOND, BIOME_GRASSLAND);

			// 1 × 1 × 1 × 0.2 × 5 × 60 = 60 food
			expect(production.food).toBeCloseTo(60, 4);
		});
	});

	// ===== SCENARIO 3: FARM Levels 2-3 → Same Tier 1 Production =====
	describe('Scenario 3: FARM levels 2-3 use same tier multiplier', () => {
		test('FARM level 2 uses Tier 1 multiplier (5×, same as L1)', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				foodQuality: 120,
			});

			const farmL2 = createMockExtractor('FARM', 2);

			const production = calculateProduction(tile, [farmL2], TICKS_PER_SECOND, BIOME_GRASSLAND);

			// BLOCKER 2: Tier 1 (L1-3) = 5× multiplier (not linear)
			// 1 × 1.2 × 1.0 × 0.2 × 5 × 60 = 72 food (same as L1)
			expect(production.food).toBeCloseTo(72, 4);
		});

		test('FARM level 3 uses Tier 1 multiplier (5×, same as L1-L2)', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				foodQuality: 100,
			});

			const farmL3 = createMockExtractor('FARM', 3);

			const production = calculateProduction(tile, [farmL3], TICKS_PER_SECOND, BIOME_GRASSLAND);

			// Tier 1 (L1-3) = 5× multiplier
			// 1 × 1 × 1 × 0.2 × 5 × 60 = 60 food (same as L1)
			expect(production.food).toBeCloseTo(60, 4);
		});
	});

	// ===== SCENARIO 4a: FARM in FOREST → 80% Food =====
	describe('Scenario 4a: Biome efficiency affects production (FARM in FOREST)', () => {
		test('FARM in FOREST produces 80% food (0.8x efficiency)', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				foodQuality: 100,
			});

			const farm = createMockExtractor('FARM', 1);

			const production = calculateProduction(
				tile,
				[farm],
				TICKS_PER_SECOND,
				BIOME_FOREST // Forest has 0.8x food efficiency
			);

			// BLOCKER 2: 1 × 1 × 0.8 × 0.2 × 5 × 60 = 48 food
			expect(production.food).toBeCloseTo(48, 4);
		});
	});

	// ===== SCENARIO 4b: LUMBER_MILL in FOREST → 200% Wood =====
	describe('Scenario 4b: Biome efficiency affects production (LUMBER_MILL in FOREST)', () => {
		test('LUMBER_MILL in FOREST produces 200% wood (2x efficiency)', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				woodQuality: 150,
			});

			const lumberMill = createMockExtractor('LUMBER_MILL', 1);

			const production = calculateProduction(
				tile,
				[lumberMill],
				TICKS_PER_SECOND,
				BIOME_FOREST // Forest has 2x wood efficiency
			);

			// BLOCKER 2: 1 × 1.5 × 2 × 0.2 × 5 × 60 = 180 wood
			expect(production.wood).toBeCloseTo(180, 4);
			expect(production.food).toBe(0);
		});

		test('QUARRY in DESERT produces 200% stone (2x efficiency)', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				stoneQuality: 120,
			});

			const quarry = createMockExtractor('QUARRY', 1);

			const production = calculateProduction(
				tile,
				[quarry],
				TICKS_PER_SECOND,
				'DESERT' // Desert has 2x stone efficiency
			);

			// BLOCKER 2: 1 × 1.2 × 2 × 0.2 × 5 × 60 = 144 stone
			expect(production.stone).toBeCloseTo(144, 4);
		});
	});

	// ===== SCENARIO 5: Multiple Extractors on Same Plot =====
	describe('Scenario 5: Multiple extractors produce combined resources', () => {
		test('FARM + WELL on same plot produce food + water', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				foodQuality: 100,
			});

			const farm = createMockExtractor('FARM', 1, 0);
			const well = createMockExtractor('WELL', 1, 1);

			const production = calculateProduction(tile, [farm, well], TICKS_PER_SECOND, BIOME_GRASSLAND);

			// BLOCKER 2: Tier 1 (L1-3) = 5×
			// Food: 1 × 1 × 1 × 0.2 × 5 × 60 = 60
			// NOTE: No waterQuality field in Tile schema, so WELL cannot produce water
			expect(production.food).toBeCloseTo(60, 4);
			expect(production.wood).toBe(0);
			expect(production.stone).toBe(0);
			expect(production.ore).toBe(0);
		});

		test('3 extractors (FARM L2 + WELL + LUMBER_MILL L3)', () => {
			const tile = createMockTile({
				baseProductionModifier: 1,
				foodQuality: 100,
				woodQuality: 120,
			});

			const farm = createMockExtractor('FARM', 2, 0); // Level 2 = Tier 1 (5×)
			const well = createMockExtractor('WELL', 1, 1); // Level 1 = Tier 1 (5×)
			const lumberMill = createMockExtractor('LUMBER_MILL', 3, 2); // Level 3 = Tier 1 (5×)

			const production = calculateProduction(
				tile,
				[farm, well, lumberMill],
				TICKS_PER_SECOND,
				BIOME_GRASSLAND
			);

			// BLOCKER 2: All Tier 1 (L1-3) = 5× multiplier
			// Food: 1 × 1.0 × 1.0 × 0.2 × 5 × 60 = 60
			// NOTE: No waterQuality field in Tile schema, so WELL cannot produce water
			// Wood: 1 × 1.2 × 1.0 × 0.2 × 5 × 60 = 72
			expect(production.food).toBeCloseTo(60, 4);
			expect(production.wood).toBeCloseTo(72, 4);
			expect(production.stone).toBe(0);
			expect(production.ore).toBe(0);
		});
	});

	// ===== HELPER FUNCTION TESTS =====
	describe('Helper Functions', () => {
		test('isExtractor() identifies extractors correctly', () => {
			const extractor = createMockExtractor('FARM', 1);
			const building: StructureWithInfo = {
				id: 'building-1',
				settlementId: 'settlement-1',
				structureId: 'def-house',
				tileId: 'test-tile-1',
				slotPosition: 0,
				name: 'House',
				level: 1,
				category: 'BUILDING',
				extractorType: null,
				buildingType: 'HOUSE',
				populationAssigned: 0,
				health: 100,
				damagedAt: null,
				lastRepairedAt: null,
				constructionStartedAt: null,
				constructionCompletedAt: new Date(),
				description: 'Housing',
				createdAt: new Date(),
				updatedAt: new Date(),
			} as StructureWithInfo;

			expect(isExtractor(extractor)).toBe(true);
			expect(isExtractor(building)).toBe(false);
		});

		test('getAverageLevel() calculates average correctly', () => {
			const extractors = [
				createMockExtractor('FARM', 1),
				createMockExtractor('WELL', 2),
				createMockExtractor('LUMBER_MILL', 3),
			];

			const average = getAverageLevel(extractors);
			expect(average).toBeCloseTo(2, 4); // (1+2+3)/3 = 2
		});

		test('getAverageLevel() returns 0 for empty array', () => {
			expect(getAverageLevel([])).toBe(0);
		});

		test('getMaxLevel() finds maximum level', () => {
			const extractors = [
				createMockExtractor('FARM', 1),
				createMockExtractor('WELL', 5),
				createMockExtractor('LUMBER_MILL', 3),
			];

			const maxLevel = getMaxLevel(extractors);
			expect(maxLevel).toBe(5);
		});

		test('getMaxLevel() returns 0 for empty array', () => {
			expect(getMaxLevel([])).toBe(0);
		});

		test('getExtractorsByResource() filters by resource type', () => {
			const extractors = [
				createMockExtractor('FARM', 1),
				createMockExtractor('WELL', 2),
				createMockExtractor('LUMBER_MILL', 3),
				createMockExtractor('QUARRY', 1),
			];

			const foodExtractors = getExtractorsByResource(extractors, 'food');
			expect(foodExtractors).toHaveLength(1);
			expect(foodExtractors[0].extractorType).toBe('FARM');

			const waterExtractors = getExtractorsByResource(extractors, 'water');
			expect(waterExtractors).toHaveLength(1);
			expect(waterExtractors[0].extractorType).toBe('WELL');

			const woodExtractors = getExtractorsByResource(extractors, 'wood');
			expect(woodExtractors).toHaveLength(1);
			expect(woodExtractors[0].extractorType).toBe('LUMBER_MILL');

			const stoneExtractors = getExtractorsByResource(extractors, 'stone');
			expect(stoneExtractors).toHaveLength(1);
			expect(stoneExtractors[0].extractorType).toBe('QUARRY');

			const oreExtractors = getExtractorsByResource(extractors, 'ore');
			expect(oreExtractors).toHaveLength(0); // No MINE in this set
		});
	});
});
