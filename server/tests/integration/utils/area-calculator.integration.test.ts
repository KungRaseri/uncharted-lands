import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../../src/db/index.js';
import {
  getTownHallLevel,
  calculateAreaUsed,
  updateSettlementAreaUsage,
  getAreaStatistics,
  calculateAreaCapacity,
} from '../../../src/utils/area-calculator.js';
import {
  createTestSettlement,
  cleanupTestChain,
  type TestEntityChain,
} from '../../helpers/integration-test-factory.js';
import { settlementStructures, settlements } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

/**
 * Integration Tests: Area Calculator
 *
 * Tests database-dependent area calculation functions with real database.
 * Pure function tests (calculateAreaCapacity) are in unit tests.
 *
 * These tests verify:
 * - getTownHallLevel: Query Town Hall level from database
 * - calculateAreaUsed: Sum area costs from settlement structures
 * - updateSettlementAreaUsage: Update settlement area fields in database
 * - getAreaStatistics: Combine all area data into stats object
 */
describe('Area Calculator - Integration', () => {
  let testChain: TestEntityChain;
  
  // Master structure IDs from database (looked up once before tests)
  let townHallId: string;
  let houseId: string;
  let workshopId: string;
  let farmId: string;
  let quarryId: string;
  let marketplaceId: string;

  beforeEach(async () => {
    testChain = await createTestSettlement();
    
    // Look up master structure definitions (needed for foreign keys)
    const townHall = await db.query.structures.findFirst({
      where: (structures, { eq }) => eq(structures.name, 'Town Hall'),
    });
    const house = await db.query.structures.findFirst({
      where: (structures, { eq }) => eq(structures.name, 'House'),
    });
    const workshop = await db.query.structures.findFirst({
      where: (structures, { eq }) => eq(structures.name, 'Workshop'),
    });
    const farm = await db.query.structures.findFirst({
      where: (structures, { eq }) => eq(structures.name, 'Farm'),
    });
    const quarry = await db.query.structures.findFirst({
      where: (structures, { eq }) => eq(structures.name, 'Quarry'),
    });
    const marketplace = await db.query.structures.findFirst({
      where: (structures, { eq }) => eq(structures.name, 'Marketplace'),
    });
    
    if (!townHall || !house || !workshop || !farm || !quarry || !marketplace) {
      throw new Error('Master structure definitions not found. Run: npm run db:seed');
    }
    
    townHallId = townHall.id;
    houseId = house.id;
    workshopId = workshop.id;
    farmId = farm.id;
    quarryId = quarry.id;
    marketplaceId = marketplace.id;
  });

  afterEach(async () => {
    await cleanupTestChain(testChain);
  });

  describe('getTownHallLevel', () => {
    it('should return 0 when no Town Hall exists', async () => {
      const level = await getTownHallLevel(db, testChain.settlement.id);
      expect(level).toBe(0);
    });

    it('should return 1 for level 1 Town Hall', async () => {
      // Build Town Hall at level 1
      await db.insert(settlementStructures).values({
        id: createId(),
        settlementId: testChain.settlement.id,
        structureId: townHallId,
        level: 1,
        populationAssigned: 0,
      });

      const level = await getTownHallLevel(db, testChain.settlement.id);
      expect(level).toBe(1);
    });

    it('should return 5 for level 5 Town Hall', async () => {
      await db.insert(settlementStructures).values({
        id: createId(),
        settlementId: testChain.settlement.id,
        structureId: townHallId,
        level: 5,
        populationAssigned: 0,
      });

      const level = await getTownHallLevel(db, testChain.settlement.id);
      expect(level).toBe(5);
    });

    // Note: Test for multiple Town Halls removed because database unique constraint
    // correctly prevents duplicate unique buildings. This is enforced at DB level.
  });

  describe('calculateAreaUsed', () => {
    it('should return 0 for empty settlement', async () => {
      const used = await calculateAreaUsed(db, testChain.settlement.id);
      expect(used).toBe(0);
    });

    it('should return 100 for settlement with only Town Hall', async () => {
      await db.insert(settlementStructures).values({
        id: createId(),
        settlementId: testChain.settlement.id,
        structureId: townHallId,
        level: 1,
        populationAssigned: 0,
      });

      const used = await calculateAreaUsed(db, testChain.settlement.id);
      expect(used).toBe(100); // Town Hall costs 100 area
    });

    it('should sum area costs for multiple buildings', async () => {
      // Town Hall (100) + 2 Houses (50 each) = 200
      await db.insert(settlementStructures).values([
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: townHallId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: houseId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: houseId,
          level: 1,
          populationAssigned: 0,
        },
      ]);

      const used = await calculateAreaUsed(db, testChain.settlement.id);
      expect(used).toBe(200);
    });

    it('should ignore extractors (areaCost=0)', async () => {
      // Town Hall (100) + Farm (0) + Quarry (0) = 100
      await db.insert(settlementStructures).values([
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: townHallId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: farmId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: quarryId,
          level: 1,
          populationAssigned: 0,
        },
      ]);

      const used = await calculateAreaUsed(db, testChain.settlement.id);
      expect(used).toBe(100); // Only Town Hall counts
    });

    it('should handle mixed buildings and extractors', async () => {
      // Town Hall (100) + House (50) + Workshop (75) + 3 Farms (0 each) = 225
      await db.insert(settlementStructures).values([
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: townHallId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: houseId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: workshopId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: farmId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: farmId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: farmId,
          level: 1,
          populationAssigned: 0,
        },
      ]);

      const used = await calculateAreaUsed(db, testChain.settlement.id);
      expect(used).toBe(225);
    });
  });

  describe('updateSettlementAreaUsage', () => {
    it('should update settlement with correct areaUsed and areaCapacity', async () => {
      // Build Town Hall level 1 (capacity 600)
      await db.insert(settlementStructures).values({
        id: createId(),
        settlementId: testChain.settlement.id,
        structureId: townHallId,
        level: 1,
        populationAssigned: 0,
      });

      await updateSettlementAreaUsage(db, testChain.settlement.id);

      const [updated] = await db
        .select()
        .from(settlements)
        .where(eq(settlements.id, testChain.settlement.id));

      expect(updated.areaUsed).toBe(100); // Town Hall costs 100
      expect(updated.areaCapacity).toBe(600); // Level 1 = 500 + 100
    });

    it('should handle settlement with no buildings', async () => {
      await updateSettlementAreaUsage(db, testChain.settlement.id);

      const [updated] = await db
        .select()
        .from(settlements)
        .where(eq(settlements.id, testChain.settlement.id));

      expect(updated.areaUsed).toBe(0);
      expect(updated.areaCapacity).toBe(500); // Base capacity (level 0)
    });

    it('should update with multiple buildings', async () => {
      // Town Hall L2 (100) + 3 Houses (150) = 250 used, 700 capacity
      await db.insert(settlementStructures).values([
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: townHallId,
          level: 2,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: houseId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: houseId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: houseId,
          level: 1,
          populationAssigned: 0,
        },
      ]);

      await updateSettlementAreaUsage(db, testChain.settlement.id);

      const [updated] = await db
        .select()
        .from(settlements)
        .where(eq(settlements.id, testChain.settlement.id));

      expect(updated.areaUsed).toBe(250);
      expect(updated.areaCapacity).toBe(700); // 500 + (2 * 100)
    });

    it('should recalculate after building demolition', async () => {
      // Build 2 Houses
      const [house1, house2] = await db
        .insert(settlementStructures)
        .values([
          {
            id: createId(),
            settlementId: testChain.settlement.id,
            structureId: houseId,
            level: 1,
            populationAssigned: 0,
          },
          {
            id: createId(),
            settlementId: testChain.settlement.id,
            structureId: houseId,
            level: 1,
            populationAssigned: 0,
          },
        ])
        .returning();

      await updateSettlementAreaUsage(db, testChain.settlement.id);

      let [settlement] = await db
        .select()
        .from(settlements)
        .where(eq(settlements.id, testChain.settlement.id));

      expect(settlement.areaUsed).toBe(100); // 2 Houses

      // Demolish 1 House
      await db.delete(settlementStructures).where(eq(settlementStructures.id, house1.id));

      await updateSettlementAreaUsage(db, testChain.settlement.id);

      [settlement] = await db
        .select()
        .from(settlements)
        .where(eq(settlements.id, testChain.settlement.id));

      expect(settlement.areaUsed).toBe(50); // 1 House remaining
    });
  });

  describe('getAreaStatistics', () => {
    it('should return correct stats for settlement with no buildings', async () => {
      const stats = await getAreaStatistics(db, testChain.settlement.id);

      expect(stats).toEqual({
        areaUsed: 0,
        areaCapacity: 500,
        areaAvailable: 500,
        percentUsed: 0,
        townHallLevel: 0,
      });
    });

    it('should return correct stats for settlement with Town Hall', async () => {
      await db.insert(settlementStructures).values({
        id: createId(),
        settlementId: testChain.settlement.id,
        structureId: townHallId,
        level: 3,
        populationAssigned: 0,
      });

      // Update settlement area first
      await updateSettlementAreaUsage(db, testChain.settlement.id);

      const stats = await getAreaStatistics(db, testChain.settlement.id);

      expect(stats).toEqual({
        areaUsed: 100,
        areaCapacity: 800, // 500 + (3 * 100)
        areaAvailable: 700,
        percentUsed: 12.5,
        townHallLevel: 3,
      });
    });

    it('should return correct stats for settlement at capacity', async () => {
      // Build 10 Houses (500 area) with no Town Hall (capacity 500)
      await db.insert(settlementStructures).values(
        Array(10)
          .fill(null)
          .map(() => ({
            id: createId(),
            settlementId: testChain.settlement.id,
            structureId: houseId,
            level: 1,
            populationAssigned: 0,
          }))
      );

      await updateSettlementAreaUsage(db, testChain.settlement.id);

      const stats = await getAreaStatistics(db, testChain.settlement.id);

      expect(stats).toEqual({
        areaUsed: 500,
        areaCapacity: 500,
        areaAvailable: 0,
        percentUsed: 100,
        townHallLevel: 0,
      });
    });

    it('should return correct stats for complex settlement', async () => {
      // Town Hall L5 + Workshop + 2 Houses + 5 Extractors = 100 + 75 + 100 + 0 = 275
      // Capacity: 500 + (5 * 100) = 1000
      await db.insert(settlementStructures).values([
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: townHallId,
          level: 5,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: workshopId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: houseId,
          level: 1,
          populationAssigned: 0,
        },
        {
          id: createId(),
          settlementId: testChain.settlement.id,
          structureId: houseId,
          level: 1,
          populationAssigned: 0,
        },
        ...Array(5)
          .fill(null)
          .map(() => ({
            id: createId(),
            settlementId: testChain.settlement.id,
            structureId: farmId,
            level: 1,
            populationAssigned: 0,
          })),
      ]);

      await updateSettlementAreaUsage(db, testChain.settlement.id);

      const stats = await getAreaStatistics(db, testChain.settlement.id);

      expect(stats).toEqual({
        areaUsed: 275,
        areaCapacity: 1000,
        areaAvailable: 725,
        percentUsed: expect.closeTo(27.5, 0.01), // Allow floating point precision
        townHallLevel: 5,
      });
    });
  });
});
