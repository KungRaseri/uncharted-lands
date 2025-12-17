/**
 * Damage → Production Chain Integration Tests (Part 6.7)
 *
 * Tests the complete disaster → damage → production reduction → repair → production restoration chain.
 *
 * Validates:
 * 1. Disasters damage structures → production decreases proportionally
 * 2. Repairs restore health → production increases proportionally
 * 3. Real database integration with settlement, structure, and production systems
 */

import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { db } from '../../../src/db/index.js';
import { settlementStructures } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { calculateProduction } from '../../../src/game/resource-calculator.js';
import {
	createTestSettlementWithStructure,
	cleanupTestChain,
	type TestEntityChain,
} from '../../helpers/integration-test-factory.js';

describe('Damage → Production Chain Integration', () => {
	let testChain: TestEntityChain | undefined;

	// Setup test settlement with farm at 100% health
	beforeAll(async () => {
		testChain = await createTestSettlementWithStructure({
			settlementName: 'Damage Test Settlement',
			structureType: 'FARM',
			structureCategory: 'EXTRACTOR',
			structureHealth: 100, // Start pristine
		});
	});

	// Cleanup
	afterAll(async () => {
		await cleanupTestChain(testChain);
	});

	describe('Integration Test 1: Disaster → Damage → Production Decrease', () => {
		test('should reduce production after disaster damages structure', async () => {
			// Guard: Ensure testChain was created
			if (!testChain) {
				throw new Error('testChain is undefined - setup failed');
			}

			// 1. Calculate initial production at 100% health
			const farmBeforeDamage = await db.query.settlementStructures.findFirst({
				where: eq(settlementStructures.id, testChain.structureId!),
			});

			expect(farmBeforeDamage).toBeDefined();
			expect(farmBeforeDamage!.health).toBe(100);

			// Use tile from testChain (plot table removed)
			const tileData = testChain.tile;

			expect(tileData).toBeDefined();

			// Calculate production with pristine farm
			const initialProduction = calculateProduction(
				tileData!,
				[
					{
						id: farmBeforeDamage!.id,
						structureId: farmBeforeDamage!.structureId,
						settlementId: farmBeforeDamage!.settlementId,
						tileId: farmBeforeDamage!.tileId,
						slotPosition: farmBeforeDamage!.slotPosition,
						level: farmBeforeDamage!.level,
						populationAssigned: farmBeforeDamage!.populationAssigned,
						health: farmBeforeDamage!.health,
						damagedAt: farmBeforeDamage!.damagedAt,
						lastRepairedAt: farmBeforeDamage!.lastRepairedAt,
						createdAt: farmBeforeDamage!.createdAt,
						updatedAt: farmBeforeDamage!.updatedAt,
						category: 'EXTRACTOR' as const,
						buildingType: null,
						extractorType: 'FARM',
					},
				],
				1 // 1 tick
			);

			expect(initialProduction.food).toBeGreaterThan(0);
			const fullProduction = initialProduction.food;

			// 2. Simulate disaster damage (reduce health to 50%)
			await db
				.update(settlementStructures)
				.set({
					health: 50,
					damagedAt: new Date(), // Date object, not timestamp number
					updatedAt: new Date(),
				})
				.where(eq(settlementStructures.id, testChain.structureId!));

			// 3. Calculate production after damage
			const farmAfterDamage = await db.query.settlementStructures.findFirst({
				where: eq(settlementStructures.id, testChain.structureId!),
			});

			expect(farmAfterDamage).toBeDefined();
			expect(farmAfterDamage!.health).toBe(50);

			const damagedProduction = calculateProduction(
				tileData!,
				[
					{
						id: farmAfterDamage!.id,
						structureId: farmAfterDamage!.structureId,
						settlementId: farmAfterDamage!.settlementId,
						tileId: farmAfterDamage!.tileId,
						slotPosition: farmAfterDamage!.slotPosition,
						level: farmAfterDamage!.level,
						populationAssigned: farmAfterDamage!.populationAssigned,
						health: farmAfterDamage!.health,
						damagedAt: farmAfterDamage!.damagedAt,
						lastRepairedAt: farmAfterDamage!.lastRepairedAt,
						createdAt: farmAfterDamage!.createdAt,
						updatedAt: farmAfterDamage!.updatedAt,
						category: 'EXTRACTOR' as const,
						buildingType: null,
						extractorType: 'FARM',
					},
				],
				1
			);

			// 4. Verify production reduced by ~30% (50% health → 70% effectiveness)
			const expectedReduction = fullProduction * 0.7; // 70% effectiveness at 50% health
			expect(damagedProduction.food).toBeCloseTo(expectedReduction, 5);
			expect(damagedProduction.food).toBeLessThan(fullProduction);
		});
	});

	describe('Integration Test 2: Repair → Production Restoration', () => {
		test('should restore production after structure repaired', async () => {
			// Guard: Ensure testChain was created
			if (!testChain) {
				throw new Error('testChain is undefined - setup failed');
			}

			// 1. First damage the structure (test should be independent)
			await db
				.update(settlementStructures)
				.set({
					health: 50,
					damagedAt: new Date(),
					updatedAt: new Date(),
				})
				.where(eq(settlementStructures.id, testChain.structureId!));

			// Verify structure is damaged
			const farmBeforeRepair = await db.query.settlementStructures.findFirst({
				where: eq(settlementStructures.id, testChain.structureId!),
			});

			expect(farmBeforeRepair).toBeDefined();
			expect(farmBeforeRepair!.health).toBe(50);

			// Use tile from testChain (plot table removed)
			const tileData = testChain.tile;

			expect(tileData).toBeDefined();

			// Calculate damaged production
			const damagedProduction = calculateProduction(
				tileData!,
				[
					{
						id: farmBeforeRepair!.id,
						structureId: farmBeforeRepair!.structureId,
						settlementId: farmBeforeRepair!.settlementId,
						tileId: farmBeforeRepair!.tileId,
						slotPosition: farmBeforeRepair!.slotPosition,
						level: farmBeforeRepair!.level,
						populationAssigned: farmBeforeRepair!.populationAssigned,
						health: farmBeforeRepair!.health,
						damagedAt: farmBeforeRepair!.damagedAt,
						lastRepairedAt: farmBeforeRepair!.lastRepairedAt,
						createdAt: farmBeforeRepair!.createdAt,
						updatedAt: farmBeforeRepair!.updatedAt,
						category: 'EXTRACTOR' as const,
						buildingType: null,
						extractorType: 'FARM',
					},
				],
				1
			);

			// 2. Repair to 100% health
			await db
				.update(settlementStructures)
				.set({
					health: 100,
					lastRepairedAt: new Date(), // Date object, not timestamp number
					updatedAt: new Date(),
				})
				.where(eq(settlementStructures.id, testChain.structureId!));

			// 3. Verify production restored to full
			const farmAfterRepair = await db.query.settlementStructures.findFirst({
				where: eq(settlementStructures.id, testChain.structureId!),
			});

			expect(farmAfterRepair).toBeDefined();
			expect(farmAfterRepair!.health).toBe(100);

			const repairedProduction = calculateProduction(
				tileData!,
				[
					{
						id: farmAfterRepair!.id,
						structureId: farmAfterRepair!.structureId,
						settlementId: farmAfterRepair!.settlementId,
						tileId: farmAfterRepair!.tileId,
						slotPosition: farmAfterRepair!.slotPosition,
						level: farmAfterRepair!.level,
						populationAssigned: farmAfterRepair!.populationAssigned,
						health: farmAfterRepair!.health,
						damagedAt: farmAfterRepair!.damagedAt,
						lastRepairedAt: farmAfterRepair!.lastRepairedAt,
						createdAt: farmAfterRepair!.createdAt,
						updatedAt: farmAfterRepair!.updatedAt,
						category: 'EXTRACTOR' as const,
						buildingType: null,
						extractorType: 'FARM',
					},
				],
				1
			);

			// Verify production increased after repair
			expect(repairedProduction.food).toBeGreaterThan(damagedProduction.food);

			// Verify production restored to 100% (1.0x effectiveness)
			const expectedFullProduction = damagedProduction.food / 0.7; // Reverse the 70% effectiveness
			expect(repairedProduction.food).toBeCloseTo(expectedFullProduction, 5);
		});
	});
});
