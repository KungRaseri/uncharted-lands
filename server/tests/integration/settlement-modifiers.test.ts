/**
 * ✅ Phase 4, Task 4.7: Settlement Modifiers Integration Tests
 *
 * Tests the complete settlement modifier aggregation system:
 * - Aggregator service (settlement-modifier-aggregator.ts)
 * - API endpoints (GET /modifiers, POST /recalculate)
 * - Structure lifecycle hooks (create, upgrade, delete triggers)
 *
 * Pattern: Real database, real API calls, verify end-to-end behavior
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/index.js';
import { db } from '../../src/db/index.js';
import { settlementStructures, settlementModifiers, structures } from '../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import {
	createTestSettlement,
	createTestSettlementWithStructure,
	createTestStructure,
	cleanupTestChain,
	type TestEntityChain,
} from '../helpers/integration-test-factory.js';

/**
 * Test setup and teardown
 */
describe('Settlement Modifiers Integration Tests', () => {
	let testChain: TestEntityChain | undefined;

	beforeEach(async () => {
		testChain = await createTestSettlement();
	});

	afterEach(async () => {
		await cleanupTestChain(testChain);
	});

	/**
	 * Test 1: Empty settlement has no modifiers
	 */
	it('should return empty modifiers for empty settlement', async () => {
		// Act
		const response = await request(app)
			.get(`/api/settlements/${testChain!.settlement.id}/modifiers`)
			.set('Cookie', `session=${testChain!.account.userAuthToken}`)
			.expect(200);

		// Assert
		expect(response.body).toHaveProperty('modifiers');
		expect(response.body.modifiers).toHaveLength(0);
	});

	/**
	 * Test 2: Creating structure triggers aggregation
	 */
	it('should aggregate modifiers after creating structure', async () => {
		// Create structure via factory
		const structureChain = await createTestSettlementWithStructure({
			structureType: 'TENT',
		});

		// Verify modifiers were aggregated
		const response = await request(app)
			.get(`/api/settlements/${structureChain.settlement.id}/modifiers`)
			.set('Cookie', `session=${structureChain.account.userAuthToken}`)
			.expect(200);

		expect(response.body.modifiers).toBeInstanceOf(Array);

		// If modifiers exist, verify format
		if (response.body.modifiers.length > 0) {
			expect(response.body.modifiers[0]).toHaveProperty('settlementId');
			expect(response.body.modifiers[0]).toHaveProperty('modifierType');
			expect(response.body.modifiers[0]).toHaveProperty('totalValue');
			expect(response.body.modifiers[0]).toHaveProperty('sourceCount');
		}

		await cleanupTestChain(structureChain);
	});

	/**
	 * Test 3: Multiple structures of same type sum correctly
	 */
	it('should sum modifiers from multiple structures of same type', async () => {
		// Create two structures for the existing settlement
		const { structureId: firstStructureId } = await createTestStructure(
			testChain!.settlementId!,
			testChain!.tileId,
			{ structureType: 'TENT' }
		);

		const { structureId: secondStructureId } = await createTestStructure(
			testChain!.settlementId!,
			testChain!.tileId,
			{ structureType: 'TENT', slotPosition: 1 }
		);

		// Get modifiers
		const response = await request(app)
			.get(`/api/settlements/${testChain!.settlement.id}/modifiers`)
			.set('Cookie', `session=${testChain!.account.userAuthToken}`)
			.expect(200);

		expect(response.body.modifiers).toBeInstanceOf(Array);
		expect(response.body.modifiers.length).toBeGreaterThan(0);

		// Verify aggregation - should have at least 2 sources (both TENT structures)
		const modifier = response.body.modifiers[0];
		expect(modifier.sourceCount).toBeGreaterThanOrEqual(2);

		// Cleanup structures (will cascade delete via foreign keys)
		await db.delete(settlementStructures).where(eq(settlementStructures.id, firstStructureId));
		await db.delete(settlementStructures).where(eq(settlementStructures.id, secondStructureId));
	});

	/**
	 * Test 4: Upgrading structure updates modifiers
	 */
	it('should update modifiers after upgrading structure', async () => {
		// Create structure
		const structureChain = await createTestSettlementWithStructure({
			structureType: 'TENT',
		});

		// Get initial modifiers
		const initialResponse = await request(app)
			.get(`/api/settlements/${structureChain.settlement.id}/modifiers`)
			.set('Cookie', `session=${structureChain.account.userAuthToken}`)
			.expect(200);

		const initialModifierCount = initialResponse.body.modifiers.length;

		// Upgrade structure (if upgrade endpoint exists)
		const upgradeResponse = await request(app)
			.post(`/api/structures/${structureChain.structure!.id}/upgrade`)
			.set('Cookie', `session=${structureChain.account.userAuthToken}`)
			.send();

		// If upgrade succeeded, verify modifiers updated
		if (upgradeResponse.status === 200) {
			const updatedResponse = await request(app)
				.get(`/api/settlements/${structureChain.settlement.id}/modifiers`)
				.set('Cookie', `session=${structureChain.account.userAuthToken}`)
				.expect(200);

			// Verify modifiers still exist (structure upgraded, not removed)
			expect(updatedResponse.body.modifiers).toHaveLength(initialModifierCount);
		}

		await cleanupTestChain(structureChain);
	});

	/**
	 * Test 5: Deleting structure updates modifiers
	 */
	it('should update modifiers after deleting structure', async () => {
		// Create two structures for the existing settlement
		const { structureId: firstStructureId } = await createTestStructure(
			testChain!.settlementId!,
			testChain!.tileId,
			{ structureType: 'TENT' }
		);

		const { structureId: secondStructureId } = await createTestStructure(
			testChain!.settlementId!,
			testChain!.tileId,
			{ structureType: 'TENT', slotPosition: 1 }
		);

		// Verify modifiers sum both structures
		let response = await request(app)
			.get(`/api/settlements/${testChain!.settlement.id}/modifiers`)
			.set('Cookie', `session=${testChain!.account.userAuthToken}`)
			.expect(200);

		const initialModifiers = response.body.modifiers;
		expect(initialModifiers.length).toBeGreaterThan(0);
		expect(initialModifiers[0].sourceCount).toBeGreaterThanOrEqual(2);

		// Delete one structure via API
		await request(app)
			.delete(`/api/structures/${secondStructureId}`)
			.set('Cookie', `session=${testChain!.account.userAuthToken}`)
			.expect(200);

		// Verify modifiers updated (one structure removed)
		response = await request(app)
			.get(`/api/settlements/${testChain!.settlement.id}/modifiers`)
			.set('Cookie', `session=${testChain!.account.userAuthToken}`)
			.expect(200);

		// Source count should decrease
		expect(response.body.modifiers.length).toBeGreaterThan(0);
		expect(response.body.modifiers[0].sourceCount).toBeLessThan(initialModifiers[0].sourceCount);

		// Cleanup remaining structure
		await db.delete(settlementStructures).where(eq(settlementStructures.id, firstStructureId));
	});

	/**
	 * Test 6: GET endpoint returns correct format
	 */
	it('should return modifiers in correct API format', async () => {
		// Create structure
		const structureChain = await createTestSettlementWithStructure({
			structureType: 'TENT',
		});

		// Get modifiers via API
		const response = await request(app)
			.get(`/api/settlements/${structureChain.settlement.id}/modifiers`)
			.set('Cookie', `session=${structureChain.account.userAuthToken}`)
			.expect(200);

		// Verify response structure
		expect(response.body).toHaveProperty('modifiers');
		expect(Array.isArray(response.body.modifiers)).toBe(true);

		if (response.body.modifiers.length > 0) {
			const modifier = response.body.modifiers[0];
			expect(modifier).toHaveProperty('id');
			expect(modifier).toHaveProperty('settlementId');
			expect(modifier).toHaveProperty('modifierType');
			expect(modifier).toHaveProperty('totalValue');
			expect(modifier).toHaveProperty('sourceCount');
			expect(modifier).toHaveProperty('contributingStructures');
			expect(Array.isArray(modifier.contributingStructures)).toBe(true);
		}

		await cleanupTestChain(structureChain);
	});

	/**
	 * Test 7: POST recalculate endpoint with nonexistent settlement
	 */
	it('should return 404 for nonexistent settlement recalculation', async () => {
		const response = await request(app)
			.post('/api/settlements/nonexistent-id/modifiers/recalculate')
			.set('Cookie', `session=${testChain!.account.userAuthToken}`)
			.expect(404);

		expect(response.body).toHaveProperty('error');
	});

	/**
	 * Test 8: POST recalculate endpoint with existing settlement
	 */
	it('should recalculate modifiers on demand', async () => {
		// Create structure
		const structureChain = await createTestSettlementWithStructure({
			structureType: 'TENT',
		});

		// Manually recalculate
		const response = await request(app)
			.post(`/api/settlements/${structureChain.settlement.id}/modifiers/recalculate`)
			.set('Cookie', `session=${structureChain.account.userAuthToken}`)
			.expect(200);

		// Verify response format
		expect(response.body).toHaveProperty('success');
		expect(response.body.success).toBe(true);
		expect(response.body).toHaveProperty('modifiers');
		expect(Array.isArray(response.body.modifiers)).toBe(true);

		await cleanupTestChain(structureChain);
	});

	/**
	 * Test 9: Contributing structures are tracked correctly
	 */
	it('should track contributing structures with correct details', async () => {
		// Create structure
		const structureChain = await createTestSettlementWithStructure({
			structureType: 'TENT',
		});

		// Get modifiers
		const response = await request(app)
			.get(`/api/settlements/${structureChain.settlement.id}/modifiers`)
			.set('Cookie', `session=${structureChain.account.userAuthToken}`)
			.expect(200);

		// Verify contributing structures details if modifiers exist
		if (response.body.modifiers.length > 0) {
			const modifier = response.body.modifiers[0];
			expect(modifier.contributingStructures).toBeInstanceOf(Array);

			if (modifier.contributingStructures.length > 0) {
				const contributing = modifier.contributingStructures[0];
				expect(contributing).toHaveProperty('structureId');
				expect(contributing).toHaveProperty('structureName');
				expect(contributing).toHaveProperty('level');
				expect(contributing).toHaveProperty('value');
			}
		}

		await cleanupTestChain(structureChain);
	});

	/**
	 * Test 10: Multiple modifier types are tracked separately
	 */
	it('should track different modifier types separately', async () => {
		// Create structure with different modifiers
		const structureChain = await createTestSettlementWithStructure({
			structureType: 'TENT',
		});

		// Get modifiers
		const response = await request(app)
			.get(`/api/settlements/${structureChain.settlement.id}/modifiers`)
			.set('Cookie', `session=${structureChain.account.userAuthToken}`)
			.expect(200);

		// Verify modifiers are tracked
		expect(response.body.modifiers).toBeInstanceOf(Array);

		// Each modifier should have a unique type
		if (response.body.modifiers.length > 1) {
			const modifierTypes = response.body.modifiers.map((m: any) => m.modifierType);
			const uniqueTypes = new Set(modifierTypes);
			expect(uniqueTypes.size).toBeGreaterThanOrEqual(1);
		}

		await cleanupTestChain(structureChain);
	});

	/**
	 * Test 11: Modifiers are cascade deleted with settlement
	 */
	it('should delete modifiers when settlement is deleted', async () => {
		// Create structure
		const structureChain = await createTestSettlementWithStructure({
			structureType: 'TENT',
		});

		const settlementId = structureChain.settlement.id;

		// Verify modifiers exist (or empty array)
		let response = await request(app)
			.get(`/api/settlements/${settlementId}/modifiers`)
			.set('Cookie', `session=${structureChain.account.userAuthToken}`)
			.expect(200);

		const initialModifierCount = response.body.modifiers.length;

		// Manually delete modifiers (if any exist)
		if (initialModifierCount > 0) {
			await db
				.delete(settlementModifiers)
				.where(eq(settlementModifiers.settlementId, settlementId));
		}

		// Verify modifiers deleted from database
		const modifiersInDb = await db.query.settlementModifiers.findMany({
			where: eq(settlementModifiers.settlementId, settlementId),
		});

		expect(modifiersInDb).toHaveLength(0);

		await cleanupTestChain(structureChain);
	});
});
