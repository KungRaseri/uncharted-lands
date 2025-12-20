/**
 * Production Effectiveness Integration Tests (Part 6.7)
 *
 * Tests that structure health affects resource production according to GDD Section 6.6.
 *
 * Formula Integration:
 * Production = BaseRate × PlotResource × Quality × BiomeEfficiency × LevelMultiplier × Effectiveness × Ticks × WorldMultiplier
 *
 * Effectiveness Breakpoints (from actual implementation):
 * - 95-100% health → 1x effectiveness (100% production) - Pristine
 * - 80-94% health → 0.95x effectiveness (95% production) - Excellent
 * - 60-79% health → 0.85x effectiveness (85% production) - Good
 * - 40-59% health → 0.7x effectiveness (70% production) - Damaged
 * - 20-39% health → 0.5x effectiveness (50% production) - Poor
 * - 1-19% health → 0.1x effectiveness (10% production) - Critical
 * - 0% health → 0.0x effectiveness (0% production) - Destroyed
 */

import { describe, test, expect } from 'vitest';
import {
	calculateProduction,
	type StructureWithInfo,
} from '../../../src/game/resource-calculator.js';
import type { Tile } from '../../../src/db/schema.js';

describe('Production Effectiveness Integration (Part 6.7)', () => {
	// Test setup helpers - updated to use Tile instead of Plot
	const createMockTile = (): Tile => ({
		id: 'tile-1',
		regionId: 'region-1',
		biomeId: 'grassland',
		xCoord: 10,
		yCoord: 10,
		type: 'LAND', // Field is 'type', not 'tileType'
		elevation: 50,
		precipitation: 60,
		temperature: 20,
		foodQuality: 100, // High food quality for testing (0-100 scale)
		woodQuality: 30,
		stoneQuality: 20,
		oreQuality: 10,
		settlementId: 'settlement-1',
		plotSlots: 5,
		baseProductionModifier: 1,
		specialResource: null,
		// NOTE: Tile table has no createdAt/updatedAt fields and NO waterQuality field
	});

	const createFarmExtractor = (health: number): StructureWithInfo => ({
		id: 'extractor-farm',
		structureId: 'structure-farm',
		settlementId: 'settlement-1',
		tileId: 'tile-1', // Changed from plotId to tileId
		slotPosition: 0, // Added slot position
		level: 1,
		populationAssigned: 0,
		health, // Variable health for testing
		damagedAt: null,
		lastRepairedAt: null,
		createdAt: new Date(),
		updatedAt: new Date(),
		category: 'EXTRACTOR' as const,
		buildingType: null,
		extractorType: 'FARM',
	});

	describe('Health → Effectiveness → Production Chain', () => {
		test('100% health → 100% production (pristine)', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(100);

			const production = calculateProduction(
				tile,
				[extractor],
				1 // 1 tick
			);

			// Base = (Quality/100) × BiomeEff × 0.2 = (100/100) × 1 × 0.2 = 0.2
			// Tier 1 L1 = 0.5x multiplier
			// Formula: 0.2 × 0.5 × 1 (effectiveness) × 1 (ticks) = 0.1
			expect(production.food).toBeCloseTo(0.1, 5);
		});

		test('80% health → 95% production (excellent condition)', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(80);

			const production = calculateProduction(tile, [extractor], 1);

			// Expected: 0.1 (full production) × 0.95 (95% effectiveness) = 0.095
			expect(production.food).toBeCloseTo(0.095, 5);
		});

		test('60% health → 85% production (good condition)', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(60);

			const production = calculateProduction(tile, [extractor], 1);

			// Expected: 0.1 × 0.85 = 0.085
			expect(production.food).toBeCloseTo(0.085, 5);
		});

		test('40% health → 70% production (damaged)', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(40);

			const production = calculateProduction(tile, [extractor], 1);

			// Expected: 0.1 × 0.7 = 0.07
			expect(production.food).toBeCloseTo(0.07, 5);
		});

		test('20% health → 50% production (poor condition)', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(20);

			const production = calculateProduction(tile, [extractor], 1);

			// Expected: 0.1 × 0.5 = 0.05
			expect(production.food).toBeCloseTo(0.05, 5);
		});

		test('10% health → 10% production (critical)', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(10);

			const production = calculateProduction(tile, [extractor], 1);

			// Expected: 0.1 × 0.1 = 0.01
			expect(production.food).toBeCloseTo(0.01, 5);
		});

		test('0% health → 0% production (destroyed)', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(0);

			const production = calculateProduction(tile, [extractor], 1);

			// Expected: 1.0 × 0.0 = 0.0
			expect(production.food).toBe(0);
		});
	});

	describe('Null/Undefined Health Handling', () => {
		test('null health → 100% production (default pristine)', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(100);
			extractor.health = null as any; // Simulate null health

			const production = calculateProduction(tile, [extractor], 1);

			// Null health should default to 100% effectiveness
			expect(production.food).toBeCloseTo(0.1, 5);
		});
	});

	describe('Multiple Extractors with Different Health Levels', () => {
		test('should use highest-level extractor only (implementation changed to Highest-Level-Wins)', () => {
			const tile = createMockTile();
			const extractors: StructureWithInfo[] = [
				createFarmExtractor(100), // 0.1 × 1.0 = 0.1
				createFarmExtractor(60), // 0.1 × 0.85 = 0.085 (not used)
				createFarmExtractor(20), // 0.1 × 0.5 = 0.05 (not used)
			];

			const production = calculateProduction(tile, extractors, 1);

			// Implementation uses "Highest-Level-Wins" logic (see resource-calculator.ts line 213-225)
			// When multiple extractors of same type exist, only the one with highest level is used
			// All three farms are level 1, so it picks the first one (100% health)
			// Expected: Only the 100% health farm produces: 0.1
			expect(production.food).toBeCloseTo(0.1, 5);
		});
	});
	describe('Edge Cases & Real-World Scenarios', () => {
		test('farm at 54% health produces correct amount', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(54);

			const production = calculateProduction(tile, [extractor], 1);

			// 54% health is in 40-59% range → 0.7x effectiveness (flat rate, no interpolation)
			// Formula: 0.1 × 0.7 = 0.07
			expect(production.food).toBeCloseTo(0.07, 5);
		});

		test('multiple resource types with same health', () => {
			const tile = createMockTile();
			const farm = createFarmExtractor(60); // 85% effectiveness
			const lumberMill: StructureWithInfo = {
				...createFarmExtractor(60),
				id: 'extractor-lumber',
				structureId: 'structure-lumber',
				extractorType: 'LUMBER_MILL',
			};

			const production = calculateProduction(tile, [farm, lumberMill], 1);

			// Both extractors use same tier multiplier (0.5x for Tier 1 L1)
			// Food (FARM): (100/100) × 1 × 0.2 × 0.5 × 0.85 × 1 = 0.085
			// Wood (LUMBER_MILL): (30/100) × 1 × 0.2 × 0.5 × 0.85 × 1 = 0.0255
			expect(production.food).toBeCloseTo(0.085, 5);
			expect(production.wood).toBeCloseTo(0.0255, 5); // 30% quality = 0.3 × 0.085
		});
		test('health changes over time affect production proportionally', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(100);

			// Start at full health
			let production = calculateProduction(tile, [extractor], 1);
			expect(production.food).toBeCloseTo(0.1, 5);

			// Damage to 50%
			extractor.health = 50;
			production = calculateProduction(tile, [extractor], 1);
			expect(production.food).toBeLessThan(0.1);
			// 50% health is in 40-59% range → 0.7x effectiveness (flat rate)
			expect(production.food).toBeCloseTo(0.07, 5);
		});
	});
	describe('Integration with Other Multipliers', () => {
		test('effectiveness stacks with tier multiplier (tier-based with level bonuses)', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(60);
			extractor.level = 3; // Level 3 = Tier 1 = 0.5 + (3-1) × 0.05 = 0.6x multiplier

			const production = calculateProduction(tile, [extractor], 1);

			// Implementation uses tier-based multipliers with level bonuses
			// Level 3 is in Tier 1 (levels 1-5) = 0.5 + 0.10 = 0.6x multiplier
			// Formula: (100/100) × 1 × 0.2 × 0.6 × 0.85 = 0.102
			expect(production.food).toBeCloseTo(0.102, 5);
		});

		test('effectiveness stacks with world template multiplier', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(60);

			const production = calculateProduction(
				tile,
				[extractor],
				1,
				null, // biomeName
				1.5 // world template multiplier (RELAXED mode)
			);

			// 0.1 × 0.85 (60% health) × 1.5 (relaxed mode) = 0.1275
			expect(production.food).toBeCloseTo(0.1275, 5);
		});

		test('effectiveness stacks with tick count', () => {
			const tile = createMockTile();
			const extractor = createFarmExtractor(40);

			const production = calculateProduction(tile, [extractor], 60); // 1 second = 60 ticks

			// 0.1 × 0.7 (40% health) × 60 (ticks) = 4.2
			expect(production.food).toBeCloseTo(4.2, 5);
		});
	});

	describe('Implementation Compliance Validation', () => {
		test('matches actual structure-effectiveness.ts HEALTH_BREAKPOINTS', () => {
			const tile = createMockTile();

			const testCases = [
				{ health: 100, expectedProduction: 0.1 }, // 0.1 × 1.0
				{ health: 80, expectedProduction: 0.095 }, // 0.1 × 0.95
				{ health: 60, expectedProduction: 0.085 }, // 0.1 × 0.85
				{ health: 40, expectedProduction: 0.07 }, // 0.1 × 0.7
				{ health: 20, expectedProduction: 0.05 }, // 0.1 × 0.5
				{ health: 10, expectedProduction: 0.01 }, // 0.1 × 0.1
				{ health: 0, expectedProduction: 0 }, // 0.1 × 0
			];

			for (const { health, expectedProduction } of testCases) {
				const extractor = createFarmExtractor(health);
				const production = calculateProduction(tile, [extractor], 1);

				// Base production = 0.1, so effectiveness = final production / 0.1
				expect(production.food).toBeCloseTo(expectedProduction, 5);
			}
		});
	});
});
