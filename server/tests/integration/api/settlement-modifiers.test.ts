/**
 * Integration Tests: Settlement Modifier Aggregation System (Phase 4)
 * 
 * Tests the complete settlement modifier lifecycle:
 * 1. API endpoints (GET modifiers, POST recalculate)
 * 2. Automatic aggregation on structu      // Create first structure (Farm)
      await request(app)
        .post('/api/structures/create')
        .set('Cookie', `session=${testChain.account.userAuthToken}`)
        .send({
          settlementId,
          structureId: masterFarm!.id,
          tileId: testChain.tileId,
          slotPosition: 0,
        })
        .expect(201);ons (create, upgrade, delete)
 * 3. Database state consistency
 * 
 * @module tests/integration/api/settlement-modifiers
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/index.js';
import { eq } from 'drizzle-orm';
import { db } from '../../../src/db/index.js';
import { settlementModifiers, settlementStructures } from '../../../src/db/schema.js';
import {
	createTestSettlement,
	createTestSettlementWithStructure,
	cleanupTestChain,
	type TestEntityChain,
} from '../../helpers/integration-test-factory.js';

// Module-level helpers for tracking test chains across describe blocks
let additionalChains: TestEntityChain[] = [];

async function createTrackedSettlementWithStructure(options?: { structureType?: string }) {
	const chain = await createTestSettlementWithStructure(options);
	additionalChains.push(chain);
	return chain;
}

/**
 * Test Suite 1: Settlement Modifiers API Endpoints
 *
 * Tests the REST API for querying and recalculating modifiers
 */
describe('Settlement Modifiers API', () => {
	let testChain: TestEntityChain;

	beforeEach(async () => {
		testChain = await createTestSettlement();
		additionalChains = [];
	});

	afterEach(async () => {
		// Clean up all additional chains created during test
		for (const chain of additionalChains) {
			await cleanupTestChain(chain);
		}
		// Clean up main test chain
		await cleanupTestChain(testChain);
	});

	describe('GET /api/settlements/:id/modifiers', () => {
		it('should return empty array for settlement with no structures', async () => {
			// Given: Settlement with no structures
			const settlementId = testChain.settlementId!;

			// When: Request modifiers
			const response = await request(app)
				.get(`/api/settlements/${settlementId}/modifiers`)
				.expect(200);

			// Then: Should return empty array
			expect(response.body).toEqual({ modifiers: [] });
		});

		it('should return cached modifiers for settlement with structures', async () => {
			// Given: Settlement with a Farm structure (adds FOOD_PRODUCTION modifier)
			const chainWithStructure = await createTrackedSettlementWithStructure({
				structureType: 'FARM',
			});
			const settlementId = chainWithStructure.settlementId!;

			// Wait for automatic aggregation (triggered by structure creation)
			await new Promise((resolve) => setTimeout(resolve, 100));

			// When: Request modifiers
			const response = await request(app)
				.get(`/api/settlements/${settlementId}/modifiers`)
				.expect(200);

			// Then: Should return cached modifiers
			expect(Array.isArray(response.body.modifiers)).toBe(true);
			expect(response.body.modifiers.length).toBeGreaterThan(0);

			// Should contain FOOD_PRODUCTION modifier from Farm
			const foodModifier = response.body.modifiers.find(
				(m: any) => m.modifierType === 'FOOD_PRODUCTION'
			);
			expect(foodModifier).toBeDefined();
			expect(Number(foodModifier.totalValue)).toBeGreaterThan(0);
			expect(Number(foodModifier.sourceCount)).toBe(1);
		});

		it('should track contributing structures correctly', async () => {
			// Given: Settlement with a Farm structure
			const chainWithStructure = await createTrackedSettlementWithStructure({
				structureType: 'FARM',
			});
			const settlementId = chainWithStructure.settlementId!;
			const structureId = chainWithStructure.structureId!;

			// Wait for automatic aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// When: Request modifiers
			const response = await request(app)
				.get(`/api/settlements/${settlementId}/modifiers`)
				.expect(200);

			// Then: contributingStructures should include the Farm
			const foodModifier = response.body.modifiers.find(
				(m: any) => m.modifierType === 'FOOD_PRODUCTION'
			);
			expect(foodModifier).toBeDefined();
			expect(Array.isArray(foodModifier.contributingStructures)).toBe(true);
			expect(foodModifier.contributingStructures).toHaveLength(1);
			expect(foodModifier.contributingStructures[0].structureId).toBe(structureId);
			expect(Number(foodModifier.contributingStructures[0].value)).toBeGreaterThan(0);
		});

		it('should return 404 for nonexistent settlement', async () => {
			// Given: Nonexistent settlement ID
			const fakeId = 'nonexistent-settlement-id';

			// When: Request modifiers
			const response = await request(app).get(`/api/settlements/${fakeId}/modifiers`).expect(200); // Returns 200 with empty array, not 404

			// Then: Should return empty modifiers array
			expect(response.body).toEqual({ modifiers: [] });
		});
	});

	describe('POST /api/settlements/:id/modifiers/recalculate', () => {
		it('should recalculate and return updated modifiers', async () => {
			// Given: Settlement with a structure
			const chainWithStructure = await createTrackedSettlementWithStructure({
				structureType: 'FARM',
			});
			const settlementId = chainWithStructure.settlementId!;

			// Wait for initial aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// When: Request recalculation
			const response = await request(app)
				.post(`/api/settlements/${settlementId}/modifiers/recalculate`)
				.expect(200);

			// Then: Should return updated modifiers
			expect(response.body.success).toBe(true);
			expect(Array.isArray(response.body.modifiers)).toBe(true);
			expect(response.body.modifiers.length).toBeGreaterThan(0);

			// Should have FOOD_PRODUCTION modifier
			const foodModifier = response.body.modifiers.find(
				(m: any) => m.modifierType === 'FOOD_PRODUCTION'
			);
			expect(foodModifier).toBeDefined();
			expect(Number(foodModifier.totalValue)).toBeGreaterThan(0);
		});

		it('should return 404 for nonexistent settlement', async () => {
			// Given: Nonexistent settlement ID
			const fakeId = 'nonexistent-settlement-id';

			// When: Request recalculation
			const response = await request(app)
				.post(`/api/settlements/${fakeId}/modifiers/recalculate`)
				.expect(404);

			// Then: Should return error
			expect(response.body.error).toBeDefined();
		});
	});
});

/**
 * Test Suite 2: Settlement Modifier Aggregation Lifecycle
 *
 * Tests automatic modifier updates on structure operations
 */
describe('Settlement Modifier Aggregation (Lifecycle)', () => {
	let testChain: TestEntityChain;

	beforeEach(async () => {
		testChain = await createTestSettlement();
		additionalChains = []; // Reset module-level array
	});

	afterEach(async () => {
		// Clean up all additional chains created during test
		for (const chain of additionalChains) {
			await cleanupTestChain(chain);
		}
		// Clean up main test chain
		await cleanupTestChain(testChain);
	});

	describe('Structure Creation', () => {
		it('should trigger aggregation when structure created', async () => {
			// Given: Settlement with no modifiers initially
			const settlementId = testChain.settlementId!;

			// Verify no modifiers exist initially
			const initialModifiers = await db.query.settlementModifiers.findMany({
				where: eq(settlementModifiers.settlementId, settlementId),
			});
			expect(initialModifiers).toHaveLength(0);

			// When: Create a Farm structure via API
			const masterFarm = await db.query.structures.findFirst({
				where: (structures, { eq }) => eq(structures.name, 'Farm'),
			});
			expect(masterFarm).toBeDefined();

			await request(app)
				.post('/api/structures/create')
				.set('Cookie', `session=${testChain.account.userAuthToken}`)
				.send({
					settlementId,
					structureId: masterFarm!.id,
					tileId: testChain.tileId,
					slotPosition: 0,
				})
				.expect(201);

			// Wait for aggregation to complete
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Then: Modifiers should be automatically created
			const finalModifiers = await db.query.settlementModifiers.findMany({
				where: eq(settlementModifiers.settlementId, settlementId),
			});
			expect(finalModifiers.length).toBeGreaterThan(0);

			// Should contain FOOD_PRODUCTION modifier
			const foodModifier = finalModifiers.find((m) => m.modifierType === 'FOOD_PRODUCTION');
			expect(foodModifier).toBeDefined();
			expect(Number(foodModifier!.totalValue)).toBeGreaterThan(0);
		});

		it('should sum modifiers from multiple structures of same type', async () => {
			// Given: Settlement with two Farms
			const settlementId = testChain.settlementId!;

			const masterFarm = await db.query.structures.findFirst({
				where: (structures, { eq }) => eq(structures.name, 'Farm'),
			});
			expect(masterFarm).toBeDefined();

			// Create first Farm
			await request(app)
				.post('/api/structures/create')
				.set('Cookie', `session=${testChain.account.userAuthToken}`)
				.send({
					settlementId,
					structureId: masterFarm!.id,
					tileId: testChain.tileId,
					slotPosition: 0,
				})
				.expect(201);

			// Wait for aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get initial modifier value
			const initialModifiers = await db.query.settlementModifiers.findFirst({
				where: eq(settlementModifiers.settlementId, settlementId),
			});
			expect(initialModifiers).toBeDefined();
			const initialValue = initialModifiers!.totalValue;

			// Create second Farm (need another tile for second extractor)
			// For simplicity, use a different slot position on the same tile
			await request(app)
				.post('/api/structures/create')
				.set('Cookie', `session=${testChain.account.userAuthToken}`)
				.send({
					settlementId,
					structureId: masterFarm!.id,
					tileId: testChain.tileId,
					slotPosition: 1,
				})
				.expect(201);

			// Wait for aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// When: Check final modifier value
			const finalModifiers = await db.query.settlementModifiers.findFirst({
				where: eq(settlementModifiers.settlementId, settlementId),
			});

			// Then: totalValue should be sum of both Farms
			expect(finalModifiers).toBeDefined();
			expect(Number(finalModifiers!.totalValue)).toBeGreaterThan(Number(initialValue));
			expect(Number(finalModifiers!.sourceCount)).toBe(2);
		});
	});

	describe('Structure Upgrade', () => {
		it('should update modifiers when structure upgraded', async () => {
			// Given: Settlement with a Farm (Level 1)
			const chainWithStructure = await createTrackedSettlementWithStructure({
				structureType: 'FARM',
			});
			const settlementId = chainWithStructure.settlementId!;
			const structureId = chainWithStructure.structureId!;

			// Wait for initial aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get initial modifier value
			const initialModifiers = await db.query.settlementModifiers.findFirst({
				where: eq(settlementModifiers.settlementId, settlementId),
			});
			expect(initialModifiers).toBeDefined();
			const initialValue = initialModifiers!.totalValue;

			// When: Upgrade the Farm to Level 2
			await request(app)
				.post(`/api/structures/${structureId}/upgrade`)
				.set('Cookie', `session=${chainWithStructure.account.userAuthToken}`)
				.expect(200);

			// Wait for aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Then: Modifier value should increase (higher level = more production)
			const finalModifiers = await db.query.settlementModifiers.findFirst({
				where: eq(settlementModifiers.settlementId, settlementId),
			});
			expect(finalModifiers).toBeDefined();
			expect(Number(finalModifiers!.totalValue)).toBeGreaterThan(Number(initialValue));

			// Verify structure was actually upgraded
			const upgradedStructure = await db.query.settlementStructures.findFirst({
				where: eq(settlementStructures.id, structureId),
			});
			expect(upgradedStructure!.level).toBe(2);
		});
	});

	describe('Structure Deletion', () => {
		it('should update modifiers when structure deleted', async () => {
			// Given: Settlement with two Farms
			const settlementId = testChain.settlementId!;

			const masterFarm = await db.query.structures.findFirst({
				where: (structures, { eq }) => eq(structures.name, 'Farm'),
			});
			expect(masterFarm).toBeDefined();

			// Create first Farm
			const farm1Response = await request(app)
				.post('/api/structures/create')
				.set('Cookie', `session=${testChain.account.userAuthToken}`)
				.send({
					settlementId,
					structureId: masterFarm!.id,
					tileId: testChain.tileId,
					slotPosition: 0,
				})
				.expect(201);
			const farm1Id = farm1Response.body.structure.id;

			// Create second Farm
			await request(app)
				.post('/api/structures/create')
				.set('Cookie', `session=${testChain.account.userAuthToken}`)
				.send({
					settlementId,
					structureId: masterFarm!.id,
					tileId: testChain.tileId,
					slotPosition: 1,
				})
				.expect(201);

			// Wait for aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Get initial modifier value (should be sum of 2 Farms)
			const initialModifiers = await db.query.settlementModifiers.findFirst({
				where: eq(settlementModifiers.settlementId, settlementId),
			});
			expect(initialModifiers).toBeDefined();
			expect(Number(initialModifiers!.sourceCount)).toBe(2);
			const initialValue = initialModifiers!.totalValue;

			// When: Delete first Farm
			await request(app)
				.delete(`/api/structures/${farm1Id}`)
				.set('Cookie', `session=${testChain.account.userAuthToken}`)
				.expect(200);

			// Wait for aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Then: Modifier value should decrease (only 1 Farm remaining)
			const finalModifiers = await db.query.settlementModifiers.findFirst({
				where: eq(settlementModifiers.settlementId, settlementId),
			});
			expect(finalModifiers).toBeDefined();
			expect(Number(finalModifiers!.totalValue)).toBeLessThan(Number(initialValue));
			expect(Number(finalModifiers!.sourceCount)).toBe(1);

			// Verify structure was actually deleted
			const deletedStructure = await db.query.settlementStructures.findFirst({
				where: eq(settlementStructures.id, farm1Id),
			});
			expect(deletedStructure).toBeUndefined();
		});

		it('should remove modifiers when last structure deleted', async () => {
			// Given: Settlement with one Farm
			const chainWithStructure = await createTrackedSettlementWithStructure({
				structureType: 'FARM',
			});
			const settlementId = chainWithStructure.settlementId!;
			const structureId = chainWithStructure.structureId!;

			// Wait for initial aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Verify modifier exists
			const initialModifiers = await db.query.settlementModifiers.findMany({
				where: eq(settlementModifiers.settlementId, settlementId),
			});
			expect(initialModifiers.length).toBeGreaterThan(0);

			// When: Delete the Farm
			await request(app)
				.delete(`/api/structures/${structureId}`)
				.set('Cookie', `session=${chainWithStructure.account.userAuthToken}`)
				.expect(200);

			// Wait for aggregation
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Then: All modifiers should be removed (no structures remaining)
			const finalModifiers = await db.query.settlementModifiers.findMany({
				where: eq(settlementModifiers.settlementId, settlementId),
			});
			expect(finalModifiers).toHaveLength(0);
		});
	});
});
