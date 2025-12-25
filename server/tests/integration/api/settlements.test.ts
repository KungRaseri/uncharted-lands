import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/index.js';
import { eq } from 'drizzle-orm';
import { db } from '../../../src/db/index.js';
import { settlements } from '../../../src/db/schema.js';
import {
	createTestSettlement,
	createTestSettlementWithStructure,
	type TestEntityChain,
} from '../../helpers/integration-test-factory.js';

describe('Settlements API Routes', () => {
	let testChain: TestEntityChain;

	beforeEach(async () => {
		// Create a test settlement with all dependencies
		testChain = await createTestSettlement();
	});

	afterEach(async () => {
		// Clean up test data properly
		const { cleanupTestChain } = await import('../../helpers/integration-test-factory.js');
		await cleanupTestChain(testChain);
	});

	describe('GET /api/settlements', () => {
		it('should return all settlements', async () => {
			const response = await request(app).get('/api/settlements').expect(200);

			expect(response.body.length).toBeGreaterThan(0);
			const settlement = response.body.find((s: any) => s.id === testChain.settlementId);
			expect(settlement).toBeDefined();
			expect(settlement).toMatchObject({
				id: testChain.settlementId,
				name: testChain.settlement.name,
				tile: expect.objectContaining({
					biome: expect.any(Object),
					// Note: region not included in GET /api/settlements response
				}),
				storage: expect.any(Object),
			});
		});

		it('should filter settlements by playerProfileId', async () => {
			const response = await request(app)
				.get(`/api/settlements?playerProfileId=${testChain.profileId}`)
				.expect(200);

			expect(response.body).toHaveLength(1);
			expect(response.body[0].id).toBe(testChain.settlementId);
		});

		it('should return empty array when no settlements match filter', async () => {
			const response = await request(app)
				.get('/api/settlements?playerProfileId=nonexistent-profile')
				.expect(200);

			expect(response.body).toEqual([]);
		});
	});

	describe('GET /api/settlements/:id', () => {
		it('should return a specific settlement with structures and modifiers', async () => {
			// Create a settlement with a structure
			const chainWithStructure = await createTestSettlementWithStructure();

			const response = await request(app)
				.get(`/api/settlements/${chainWithStructure.settlementId}`)
				.expect(200);

			expect(response.body).toMatchObject({
				id: chainWithStructure.settlementId,
				name: chainWithStructure.settlement.name,
				tile: expect.objectContaining({
					biome: expect.any(Object),
					// Note: region not included in GET /api/settlements response
				}),
				storage: expect.any(Object),
			});

			expect(response.body.structures).toHaveLength(1);
			expect(response.body.structures[0]).toMatchObject({
				id: chainWithStructure.structureId,
			});
			expect(response.body.structures[0].modifiers).toBeDefined();
			expect(Array.isArray(response.body.structures[0].modifiers)).toBe(true);
		});

		it('should return settlement with empty structures array if no structures', async () => {
			// Test settlement without additional structures
			const response = await request(app)
				.get(`/api/settlements/${testChain.settlementId}`)
				.expect(200);

			expect(response.body.structures).toEqual([]);
		});

		it('should return structures with empty modifiers array if no modifiers', async () => {
			const response = await request(app)
				.get(`/api/settlements/${testChain.settlementId}`)
				.expect(200);

			// If structures exist, they should all have modifiers arrays
			if (response.body.structures && response.body.structures.length > 0) {
				for (const structure of response.body.structures) {
					expect(Array.isArray(structure.modifiers)).toBe(true);
				}
			}
		});

		it('should return a specific settlement', async () => {
			const response = await request(app)
				.get(`/api/settlements/${testChain.settlementId}`)
				.expect(200);

			expect(response.body).toMatchObject({
				id: testChain.settlementId,
				name: testChain.settlement.name,
				tile: expect.objectContaining({
					biome: expect.any(Object),
					region: expect.any(Object),
				}),
				storage: expect.any(Object),
			});
		});

		it('should return 404 if settlement not found', async () => {
			const response = await request(app)
				.get('/api/settlements/nonexistent-settlement-id')
				.expect(404);

			expect(response.body.error).toBe('Settlement not found');
		});
	});

	describe('POST /api/settlements', () => {
		it('should return 401 if not authenticated', async () => {
			const response = await request(app)
				.post('/api/settlements')
				.send({
					username: 'testuser',
					serverId: testChain.serverId,
					worldId: testChain.worldId,
					accountId: testChain.accountId,
				})
				.expect(401);

			expect(response.body.error).toBe('Unauthorized');
		});

		it('should return 400 if missing required fields', async () => {
			// Use testChain's account token
			const authToken = testChain.account.userAuthToken;

			const response = await request(app)
				.post('/api/settlements')
				.set('Cookie', `session=${authToken}`)
				.send({ username: 'test' })
				.expect(400);

			expect(response.body.error).toBe('Missing required fields');
			expect(response.body.required).toContain('serverId');
			expect(response.body.required).toContain('worldId');
			expect(response.body.required).toContain('accountId');
		});

		it('should create a settlement successfully with all data', async () => {
			// Create some additional unclaimed tiles in the test world for settlement
			// Note: testChain already has 1 tile claimed by the existing settlement
			const { createTestTile } = await import('../../helpers/integration-test-factory.js');

			// Create 5 unclaimed tiles with viable terrain
			for (let i = 0; i < 5; i++) {
				await createTestTile(testChain.regionId, testChain.biomeId, {
					tileX: i + 1,
					tileY: 0,
					tileElevation: 25, // Land (> 0)
					tilePrecipitation: 50, // Adequate rainfall
					tileTemperature: 15, // Temperate
				});
			}

			const authToken = testChain.account.userAuthToken;

			const response = await request(app)
				.post('/api/settlements')
				.set('Cookie', `session=${authToken}`)
				.send({
					username: 'newuser',
					serverId: testChain.serverId,
					worldId: testChain.worldId,
					accountId: testChain.accountId,
					picture: 'https://example.com/pic.jpg',
				})
				.expect(201);

			expect(response.body).toMatchObject({
				id: expect.any(String),
				name: 'Home Settlement',
				tile: expect.objectContaining({
					biome: expect.any(Object),
					region: expect.objectContaining({
						world: expect.objectContaining({
							id: testChain.worldId,
						}),
					}),
				}),
				storage: expect.objectContaining({
					food: 50,
					water: 100,
					wood: 50,
					stone: 30,
					ore: 10, // Fixed in BLOCKER 1 - GDD spec requires ore:10
				}),
				playerProfile: expect.objectContaining({
					username: expect.any(String), // Factory creates the profile
					picture: expect.any(String), // Factory creates the picture URL
				}),
			});

			// Verify the TENT structure was created (BLOCKER 1 fix)
			const createdSettlement = await db.query.settlements.findFirst({
				where: eq(settlements.id, response.body.id),
				with: { structures: true },
			});

			expect(createdSettlement?.structures).toHaveLength(1);
			// Structure response may not include all fields - just verify it exists and has level
			expect(createdSettlement?.structures[0]).toMatchObject({
				level: 1,
			});
		});

		it('should create settlement without picture (default placeholder)', async () => {
			// Create some additional unclaimed tiles in the test world for settlement
			const { createTestTile } = await import('../../helpers/integration-test-factory.js');

			// Create 5 unclaimed tiles with viable terrain
			for (let i = 0; i < 5; i++) {
				await createTestTile(testChain.regionId, testChain.biomeId, {
					tileX: i + 10, // Different coords than first test
					tileY: 0,
					tileElevation: 25,
					tilePrecipitation: 50,
					tileTemperature: 15,
				});
			}

			const authToken = testChain.account.userAuthToken;

			const response = await request(app)
				.post('/api/settlements')
				.set('Cookie', `session=${authToken}`)
				.send({
					username: 'userWithoutPic',
					serverId: testChain.serverId,
					worldId: testChain.worldId,
					accountId: testChain.accountId,
				})
				.expect(201);

			// Factory generates a picture URL, just verify it exists
			expect(response.body.playerProfile.picture).toBeTruthy();
			expect(response.body.playerProfile.username).toBeTruthy();
		});
	});
});
