/**
 * Integration Tests for Worlds API Routes
 * Updated: November 25, 2025 - Real app + session auth + factory pattern
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/index.js';
import { db } from '../../../src/db/index.js';
import { worlds } from '../../../src/db/schema.js';
import { eq } from 'drizzle-orm';
import {
	createTestPlotChain,
	cleanupTestChain,
	type TestEntityChain,
} from '../../helpers/integration-test-factory.js';

describe('Worlds API Routes', () => {
	let testChain: TestEntityChain | undefined;
	let adminChain: TestEntityChain | undefined;

	beforeEach(async () => {
		// Create admin account for admin-only routes
		adminChain = await createTestPlotChain({ accountRole: 'ADMINISTRATOR' });
	});

	afterEach(async () => {
		await cleanupTestChain(testChain);
		await cleanupTestChain(adminChain);
	});

	describe('GET /api/worlds', () => {
		it('should return 401 if not authenticated', async () => {
			const response = await request(app).get('/api/worlds').expect(401);

			expect(response.body.error).toBe('Unauthorized');
			expect(response.body.code).toBe('NO_SESSION');
		});

		it('should return all worlds with server information', async () => {
			// Create test world with real data
			testChain = await createTestPlotChain();

			const response = await request(app)
				.get('/api/worlds')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.expect(200);

			expect(Array.isArray(response.body)).toBe(true);
			expect(response.body.length).toBeGreaterThan(0);

			const world = response.body.find((w: any) => w.id === testChain!.world.id);
			expect(world).toBeDefined();
			expect(world.name).toBe(testChain!.world.name);
			expect(world.server).toBeDefined();
			expect(world.server.id).toBe(testChain!.server.id);
			expect(world.server.name).toBe(testChain!.server.name);
			// Route returns regions array with just IDs
			expect(Array.isArray(world.regions)).toBe(true);
		});
	});

	describe('GET /api/worlds/:id', () => {
		it('should return 401 if not authenticated', async () => {
			testChain = await createTestPlotChain();

			const response = await request(app).get(`/api/worlds/${testChain.world.id}`).expect(401);

			expect(response.body.error).toBe('Unauthorized');
			expect(response.body.code).toBe('NO_SESSION');
		});

		it('should return world details with statistics', async () => {
			testChain = await createTestPlotChain();

			const response = await request(app)
				.get(`/api/worlds/${testChain.world.id}`)
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.expect(200);

			// Verify world properties
			expect(response.body.id).toBe(testChain.world.id);
			expect(response.body.name).toBe(testChain.world.name);
			expect(response.body.server).toBeDefined();
			expect(response.body.server.id).toBe(testChain.server.id);

			// Verify calculated _count statistics
			expect(response.body._count).toBeDefined();
			expect(typeof response.body._count.regions).toBe('number');
			expect(typeof response.body._count.settlements).toBe('number');
			expect(typeof response.body._count.landTiles).toBe('number');
			expect(typeof response.body._count.oceanTiles).toBe('number');
		});

		it('should return 404 for non-existent world', async () => {
			const response = await request(app)
				.get('/api/worlds/nonexistent-world-id')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});
	});

	describe('POST /api/worlds', () => {
		it('should return 403 if not admin (regular user)', async () => {
			testChain = await createTestPlotChain(); // Creates regular user

			const response = await request(app)
				.post('/api/worlds')
				.set('Cookie', `session=${testChain.account.userAuthToken}`)
				.send({
					name: 'New World',
					serverId: testChain.server.id,
				})
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should create world successfully with basic settings', async () => {
			testChain = await createTestPlotChain(); // Creates server

			const response = await request(app)
				.post('/api/worlds')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.send({
					name: 'Integration Test World',
					serverId: testChain.server.id,
				})
				.expect(201);

			expect(response.body.id).toBeDefined();
			expect(response.body.name).toBe('Integration Test World');
			expect(response.body.serverId).toBe(testChain.server.id);
			expect(response.body.status).toBe('pending');
			expect(response.body.worldTemplateType).toBe('STANDARD'); // Default
			expect(response.body.worldTemplateConfig).toBeDefined();

			// Cleanup the world we just created
			await db.delete(worlds).where(eq(worlds.id, response.body.id));
		});

		it('should accept SURVIVAL template type', async () => {
			testChain = await createTestPlotChain();

			const response = await request(app)
				.post('/api/worlds')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.send({
					name: 'Survival World',
					serverId: testChain.server.id,
					gridSize: 100,
					worldTemplateType: 'SURVIVAL',
				})
				.expect(201);

			expect(response.body.worldTemplateType).toBe('SURVIVAL');
			expect(response.body.worldTemplateConfig).toBeDefined();
			expect(response.body.worldTemplateConfig.productionMultiplier).toBe(0.7);
			expect(response.body.worldTemplateConfig.consumptionMultiplier).toBe(1.3);

			await db.delete(worlds).where(eq(worlds.id, response.body.id));
		});

		it('should accept RELAXED template type', async () => {
			testChain = await createTestPlotChain();

			const response = await request(app)
				.post('/api/worlds')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.send({
					name: 'Relaxed World',
					serverId: testChain.server.id,
					gridSize: 100,
					worldTemplateType: 'RELAXED',
				})
				.expect(201);

			expect(response.body.worldTemplateType).toBe('RELAXED');
			expect(response.body.worldTemplateConfig.productionMultiplier).toBe(1.5);
			expect(response.body.worldTemplateConfig.consumptionMultiplier).toBe(0.7);

			await db.delete(worlds).where(eq(worlds.id, response.body.id));
		});

		it('should accept FANTASY template type', async () => {
			testChain = await createTestPlotChain();

			const response = await request(app)
				.post('/api/worlds')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.send({
					name: 'Fantasy World',
					serverId: testChain.server.id,
					gridSize: 100,
					worldTemplateType: 'FANTASY',
				})
				.expect(201);

			expect(response.body.worldTemplateType).toBe('FANTASY');
			expect(response.body.worldTemplateConfig.productionMultiplier).toBe(1.2);

			await db.delete(worlds).where(eq(worlds.id, response.body.id));
		});

		it('should accept APOCALYPSE template type', async () => {
			testChain = await createTestPlotChain();

			const response = await request(app)
				.post('/api/worlds')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.send({
					name: 'Apocalypse World',
					serverId: testChain.server.id,
					gridSize: 100,
					worldTemplateType: 'APOCALYPSE',
				})
				.expect(201);

			expect(response.body.worldTemplateType).toBe('APOCALYPSE');
			expect(response.body.worldTemplateConfig.productionMultiplier).toBe(0.5);
			expect(response.body.worldTemplateConfig.consumptionMultiplier).toBe(1.5);

			await db.delete(worlds).where(eq(worlds.id, response.body.id));
		});

		it('should return 400 for invalid world template type', async () => {
			testChain = await createTestPlotChain();

			const response = await request(app)
				.post('/api/worlds')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.send({
					name: 'Invalid Template World',
					serverId: testChain.server.id,
					gridSize: 100,
					worldTemplateType: 'INVALID_TYPE',
				})
				.expect(400);

			expect(response.body.error).toContain('Invalid world template type');
		});

		it('should return 400 if missing required fields', async () => {
			const response = await request(app)
				.post('/api/worlds')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.send({ name: 'Incomplete World' }) // Missing serverId
				.expect(400);

			expect(response.body.code).toBe('INVALID_INPUT');
		});
	});

	describe('PUT /api/worlds/:id', () => {
		it('should return 403 if not admin', async () => {
			testChain = await createTestPlotChain(); // Regular user

			const response = await request(app)
				.put(`/api/worlds/${testChain.world.id}`)
				.set('Cookie', `session=${testChain.account.userAuthToken}`)
				.send({ name: 'Updated Name' })
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should update world name successfully', async () => {
			testChain = await createTestPlotChain();

			const response = await request(app)
				.put(`/api/worlds/${testChain.world.id}`)
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.send({ name: 'Updated World Name' })
				.expect(200);

			expect(response.body.name).toBe('Updated World Name');
			expect(response.body.id).toBe(testChain.world.id);
		});

		it('should return 404 for non-existent world', async () => {
			const response = await request(app)
				.put('/api/worlds/nonexistent-world-id')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.send({ name: 'Updated' })
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});
	});

	describe('DELETE /api/worlds/:id', () => {
		it('should return 403 if not admin', async () => {
			testChain = await createTestPlotChain(); // Regular user

			const response = await request(app)
				.delete(`/api/worlds/${testChain.world.id}`)
				.set('Cookie', `session=${testChain.account.userAuthToken}`)
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should delete world successfully', async () => {
			testChain = await createTestPlotChain();
			const worldIdToDelete = testChain.world.id;
			const worldNameToDelete = testChain.world.name;

			const response = await request(app)
				.delete(`/api/worlds/${worldIdToDelete}`)
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain(worldNameToDelete);

			// Verify deletion by trying to fetch
			const fetchResponse = await request(app)
				.get(`/api/worlds/${worldIdToDelete}`)
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.expect(404);

			expect(fetchResponse.body.code).toBe('NOT_FOUND');

			// Prevent double cleanup
			testChain = undefined;
		});

		it('should return 404 for non-existent world', async () => {
			const response = await request(app)
				.delete('/api/worlds/nonexistent-world-id')
				.set('Cookie', `session=${adminChain!.account.userAuthToken}`)
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});
	});
});
