import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/index.js';
import { db } from '../../../src/db/index.js';
import { settlementStructures, settlementStorage } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import {
	createTestSettlement,
	createTestSettlementWithStructure,
	cleanupTestChain,
	type TestEntityChain,
} from '../../helpers/integration-test-factory.js';

describe('Structures API Routes', () => {
	let testChain: TestEntityChain | undefined;

	beforeEach(async () => {
		testChain = await createTestSettlement();
	});

	afterEach(async () => {
		await cleanupTestChain(testChain);
	});

	describe('GET /api/structures/:id', () => {
		it('should return structure details', async () => {
			const structureChain = await createTestSettlementWithStructure({ structureType: 'TENT' });

			const response = await request(app)
				.get(`/api/structures/${structureChain.structure!.id}`)
				.set('Cookie', `session=${structureChain.account.userAuthToken}`)
				.expect(200);

			expect(response.body.id).toBe(structureChain.structure!.id);
			expect(response.body.category).toBe('BUILDING');
			expect(response.body.buildingType).toBe('HOUSE'); // Tent's buildingType is HOUSE in the database

			// Verify in database
			const dbStructure = await db.query.settlementStructures.findFirst({
				where: eq(settlementStructures.id, structureChain.structure!.id),
			});
			expect(dbStructure).toBeDefined();
			expect(dbStructure!.id).toBe(structureChain.structure!.id);

			await cleanupTestChain(structureChain);
		});

		it('should return 404 if structure not found', async () => {
			const response = await request(app)
				.get('/api/structures/nonexistent-id')
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(404);

			expect(response.body.code).toBe('STRUCTURE_NOT_FOUND');
		});

		it('should return 401 without authentication', async () => {
			const structureChain = await createTestSettlementWithStructure({ structureType: 'TENT' });

			const response = await request(app)
				.get(`/api/structures/${structureChain.structure!.id}`)
				.expect(401);

			expect(response.body.code).toBe('NO_SESSION');

			await cleanupTestChain(structureChain);
		});
	});

	describe('GET /api/structures/by-settlement/:settlementId', () => {
		it('should return all structures for a settlement', async () => {
			// Add structures to the base settlement
			// Need to look up master structure definitions first
			const tentStructure = await db.query.structures.findFirst({
				where: (structures, { eq }) => eq(structures.name, 'Tent'),
			});
			const houseStructure = await db.query.structures.findFirst({
				where: (structures, { eq }) => eq(structures.name, 'House'),
			});

			if (!tentStructure || !houseStructure) {
				throw new Error('Master structure definitions not found');
			}

			const structure1Id = createId();
			await db.insert(settlementStructures).values({
				id: structure1Id,
				structureId: tentStructure.id, // FK to master structure
				settlementId: testChain!.settlement.id,
				level: 1,
				health: 100,
			});

			const structure2Id = createId();
			await db.insert(settlementStructures).values({
				id: structure2Id,
				structureId: houseStructure.id, // FK to master structure
				settlementId: testChain!.settlement.id,
				level: 1,
				health: 100,
			});

			const response = await request(app)
				.get(`/api/structures/by-settlement/${testChain!.settlement.id}`)
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThanOrEqual(2);

			const ids = response.body.map((s: any) => s.id);
			expect(ids).toContain(structure1Id);
			expect(ids).toContain(structure2Id);
		});

		it('should return empty array if no structures', async () => {
			const emptySettlement = await createTestSettlement();

			const response = await request(app)
				.get(`/api/structures/by-settlement/${emptySettlement.settlement.id}`)
				.set('Cookie', `session=${emptySettlement.account.userAuthToken}`)
				.expect(200);

			expect(response.body).toEqual([]);

			await cleanupTestChain(emptySettlement);
		});
	});

	describe('POST /api/structures/:id/upgrade', () => {
		it('should upgrade structure level', async () => {
			const structureChain = await createTestSettlementWithStructure({ structureType: 'TENT' });
			const originalLevel = structureChain.structure!.level;

			const response = await request(app)
				.post(`/api/structures/${structureChain.structure!.id}/upgrade`)
				.set('Cookie', `session=${structureChain.account.userAuthToken}`)
				.expect(200);

			expect(response.body.level).toBe(originalLevel + 1);

			// Verify in database
			const dbStructure = await db.query.settlementStructures.findFirst({
				where: eq(settlementStructures.id, structureChain.structure!.id),
			});
			expect(dbStructure!.level).toBe(originalLevel + 1);

			await cleanupTestChain(structureChain);
		});

		it('should return 404 if structure not found', async () => {
			const response = await request(app)
				.post('/api/structures/nonexistent-id/upgrade')
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(404);

			expect(response.body.code).toBe('STRUCTURE_NOT_FOUND');
		});

		it('should return 403 if user does not own settlement', async () => {
			const structureChain = await createTestSettlementWithStructure({ structureType: 'TENT' });
			const otherChain = await createTestSettlement();

			const response = await request(app)
				.post(`/api/structures/${structureChain.structure!.id}/upgrade`)
				.set('Cookie', `session=${otherChain.account.userAuthToken}`)
				.expect(403);

			expect(response.body.code).toBe('NOT_SETTLEMENT_OWNER');

			await cleanupTestChain(structureChain);
			await cleanupTestChain(otherChain);
		});
	});

	describe('DELETE /api/structures/:id', () => {
		it('should demolish structure', async () => {
			const structureChain = await createTestSettlementWithStructure({ structureType: 'TENT' });
			const structureId = structureChain.structure!.id;

			const response = await request(app)
				.delete(`/api/structures/${structureId}`)
				.set('Cookie', `session=${structureChain.account.userAuthToken}`)
				.expect(200);

			expect(response.body.success).toBe(true);

			// Verify deletion in database
			const dbStructure = await db.query.settlementStructures.findFirst({
				where: eq(settlementStructures.id, structureId),
			});
			expect(dbStructure).toBeUndefined();

			await cleanupTestChain(structureChain);
		});

		it('should return 404 if structure not found', async () => {
			const response = await request(app)
				.delete('/api/structures/nonexistent-id')
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(404);

			expect(response.body.code).toBe('STRUCTURE_NOT_FOUND');
		});

		it('should return 403 if user does not own settlement', async () => {
			const structureChain = await createTestSettlementWithStructure({ structureType: 'TENT' });
			const otherChain = await createTestSettlement();

			const response = await request(app)
				.delete(`/api/structures/${structureChain.structure!.id}`)
				.set('Cookie', `session=${otherChain.account.userAuthToken}`)
				.expect(403);

			expect(response.body.code).toBe('NOT_SETTLEMENT_OWNER');

			await cleanupTestChain(structureChain);
			await cleanupTestChain(otherChain);
		});
	});

	describe('POST /api/structures/create', () => {
		it('should create structure and deduct resources from settlement storage', async () => {
			// Get initial storage values
			const initialStorage = await db.query.settlementStorage.findFirst({
				where: (storage, { eq }) => eq(storage.settlementId, testChain!.settlement.id),
			});

			expect(initialStorage).toBeDefined();
			const initialWood = initialStorage!.wood;
			const initialStone = initialStorage!.stone;
			const initialOre = initialStorage!.ore;

			// Get the Farm structure definition from database
			const farmStructure = await db.query.structures.findFirst({
				where: (structure, { eq }) => eq(structure.name, 'Farm'),
			});
			expect(farmStructure).toBeDefined();

			// Create a Farm (costs: wood 20, stone 10)
			const response = await request(app)
				.post('/api/structures/create')
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.send({
					settlementId: testChain!.settlement.id,
					structureId: farmStructure!.id,
					tileId: testChain!.settlement.tileId,
					slotPosition: 0,
				})
				.expect(201); // 201 Created for successful resource creation

			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('structure');
			expect(response.body.structure).toHaveProperty('id');
			expect(response.body.structure.structureId).toBe(farmStructure!.id);

		// Verify structure was created in database
		const dbStructure = await db.query.settlementStructures.findFirst({
			where: eq(settlementStructures.id, response.body.structure.id),
		});
		expect(dbStructure).toBeDefined();
		expect(dbStructure!.settlementId).toBe(testChain!.settlement.id);			// Verify resources were deducted from storage
			const updatedStorage = await db.query.settlementStorage.findFirst({
				where: (storage, { eq }) => eq(storage.settlementId, testChain!.settlement.id),
			});

			expect(updatedStorage).toBeDefined();
			// Farm costs: wood 20, stone 10, ore 0
			expect(updatedStorage!.wood).toBe(initialWood - 20);
			expect(updatedStorage!.stone).toBe(initialStone - 10);
			expect(updatedStorage!.ore).toBe(initialOre); // Ore not used for Farm
		});

		it('should return 400 if insufficient resources', async () => {
			// Set storage to very low values
			await db
				.update(settlementStorage)
				.set({ wood: 5, stone: 3, ore: 0 })
				.where(eq(settlementStorage.settlementId, testChain!.settlement.id));

			// Get the Farm structure definition
			const farmStructure = await db.query.structures.findFirst({
				where: (structure, { eq }) => eq(structure.name, 'Farm'),
			});
			expect(farmStructure).toBeDefined();

			// Try to create a Farm (costs: wood 20, stone 10)
			const response = await request(app)
				.post('/api/structures/create')
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.send({
					settlementId: testChain!.settlement.id,
					structureId: farmStructure!.id,
					tileId: testChain!.settlement.tileId,
					slotPosition: 0,
				})
				.expect(400);

			expect(response.body.success).toBe(false);
			expect(response.body).toHaveProperty('shortages');
			expect(response.body.shortages.length).toBeGreaterThan(0);
		});

		it('should return 404 if settlement not found', async () => {
			// Get a structure to use
			const farmStructure = await db.query.structures.findFirst({
				where: (structure, { eq }) => eq(structure.name, 'Farm'),
			});
			expect(farmStructure).toBeDefined();

			const response = await request(app)
				.post('/api/structures/create')
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.send({
					settlementId: 'nonexistent-id',
					structureId: farmStructure!.id,
					tileId: testChain!.settlement.tileId,
					slotPosition: 0,
				})
				.expect(404);

			expect(response.body.code).toBe('SETTLEMENT_NOT_FOUND');
		});

		it('should return 403 if user does not own settlement', async () => {
			const otherChain = await createTestSettlement();

			// Get a structure to use
			const farmStructure = await db.query.structures.findFirst({
				where: (structure, { eq }) => eq(structure.name, 'Farm'),
			});
			expect(farmStructure).toBeDefined();

			const response = await request(app)
				.post('/api/structures/create')
				.set('Cookie', `session=${otherChain.account.userAuthToken}`)
				.send({
					settlementId: testChain!.settlement.id,
					structureId: farmStructure!.id,
					tileId: testChain!.settlement.tileId,
					slotPosition: 0,
				})
				.expect(403);

			expect(response.body.code).toBe('NOT_SETTLEMENT_OWNER');

			await cleanupTestChain(otherChain);
		});
	});

	describe('GET /api/structures/metadata', () => {
		it('should return all structure metadata', async () => {
			const response = await request(app).get('/api/structures/metadata').expect(200);

			expect(response.body).toHaveProperty('success', true);
			expect(response.body).toHaveProperty('data');
			expect(response.body).toHaveProperty('timestamp');
			expect(Array.isArray(response.body.data)).toBe(true);

			// Real structure-costs.js has 32 structures (not 2 mocked ones)
			expect(response.body.data.length).toBeGreaterThan(0);

			// Verify a structure has the expected shape
			const firstStructure = response.body.data[0];
			expect(firstStructure).toHaveProperty('id');
			expect(firstStructure).toHaveProperty('name');
			expect(firstStructure).toHaveProperty('displayName');
			expect(firstStructure).toHaveProperty('category');
			expect(firstStructure).toHaveProperty('costs');
			expect(typeof firstStructure.costs).toBe('object');
		});

		it('should include all required fields in metadata response', async () => {
			const response = await request(app).get('/api/structures/metadata').expect(200);

			expect(Array.isArray(response.body.data)).toBe(true);
			expect(response.body.data.length).toBeGreaterThan(0);

			const structure = response.body.data[0];

			// Verify all required fields are present
			expect(structure).toHaveProperty('id');
			expect(structure).toHaveProperty('name');
			expect(structure).toHaveProperty('displayName');
			expect(structure).toHaveProperty('description');
			expect(structure).toHaveProperty('category');
			expect(structure).toHaveProperty('tier');
			expect(structure).toHaveProperty('costs');
			expect(structure).toHaveProperty('constructionTimeSeconds');
			expect(structure).toHaveProperty('populationRequired');
			expect(structure).toHaveProperty('modifiers');

			// Verify cost structure (real costs only include non-zero values)
			expect(structure.costs).toBeDefined();
			expect(typeof structure.costs).toBe('object');

			// Verify all cost values are numbers
			for (const cost of Object.values(structure.costs)) {
				expect(typeof cost).toBe('number');
			}
		});
	});
});
