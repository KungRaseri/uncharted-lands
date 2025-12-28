/**
 * Settlement Area API Integration Tests
 * Tests for GET /api/settlement-area/:settlementId endpoint
 *
 * December 2025 - Building Area System
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../../../src/index.js';
import { db, settlementStructures } from '../../../src/db/index.js';
import type { TestEntityChain } from '../../helpers/integration-test-factory.js';
import { createTestSettlement, cleanupTestChain } from '../../helpers/integration-test-factory.js';
import crypto from 'node:crypto';

describe('Settlement Area API Routes', () => {
	let testChain: TestEntityChain | undefined;
	let townHallStructureId: string;
	let houseStructureId: string;
	let workshopStructureId: string;

	beforeEach(async () => {
		testChain = await createTestSettlement();

		// Look up structure IDs for tests
		const townHall = await db.query.structures.findFirst({
			where: (structure, { eq }) => eq(structure.name, 'Town Hall'),
		});
		const house = await db.query.structures.findFirst({
			where: (structure, { eq }) => eq(structure.name, 'House'),
		});
		const workshop = await db.query.structures.findFirst({
			where: (structure, { eq }) => eq(structure.name, 'Workshop'),
		});

		townHallStructureId = townHall!.id;
		houseStructureId = house!.id;
		workshopStructureId = workshop!.id;
	});

	afterEach(async () => {
		await cleanupTestChain(testChain);
	});

	describe('GET /api/settlement-area/:settlementId', () => {
		it('should return area statistics for empty settlement', async () => {
			const response = await request(app)
				.get(`/api/settlement-area/${testChain!.settlement.id}`)
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.data).toHaveProperty('areaUsed');
			expect(response.body.data).toHaveProperty('areaCapacity');
			expect(response.body.data).toHaveProperty('areaAvailable');
			expect(response.body.data).toHaveProperty('percentUsed');
			expect(response.body.data).toHaveProperty('townHallLevel');
			expect(response.body.data).toHaveProperty('buildings');

			// Empty settlement with TH level 0
			expect(response.body.data.areaUsed).toBe(0);
			expect(response.body.data.areaCapacity).toBe(500); // Base capacity
			expect(response.body.data.areaAvailable).toBe(500);
			expect(response.body.data.percentUsed).toBe(0);
			expect(response.body.data.townHallLevel).toBe(0);
			expect(response.body.data.buildings).toEqual([]);
		});

		it('should calculate area correctly with Town Hall', async () => {
			// Create Town Hall (100 area)
			await db.insert(settlementStructures).values({
				id: crypto.randomUUID(),
				settlementId: testChain!.settlement.id,
				structureId: townHallStructureId,
				level: 1,
				health: 100,
			});

			const response = await request(app)
				.get(`/api/settlement-area/${testChain!.settlement.id}`)
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(200);

			expect(response.body.data.areaUsed).toBe(100);
			expect(response.body.data.areaCapacity).toBe(600); // 500 + (1 * 100)
			expect(response.body.data.areaAvailable).toBe(500);
			expect(response.body.data.percentUsed).toBeCloseTo(16.67, 1);
			expect(response.body.data.townHallLevel).toBe(1);
			expect(response.body.data.buildings).toHaveLength(1);
			expect(response.body.data.buildings[0]).toMatchObject({
				name: 'Town Hall',
				level: 1,
				areaCost: 100,
				unique: true,
			});
		});

		it('should calculate area correctly with multiple buildings', async () => {
			// Create Town Hall (100 area)
			await db.insert(settlementStructures).values({
				id: crypto.randomUUID(),
				settlementId: testChain!.settlement.id,
				structureId: townHallStructureId,
				level: 2, // Level 2 TH
				health: 100,
			});

			// Create 3 Houses (3 × 50 = 150 area)
			for (let i = 0; i < 3; i++) {
				await db.insert(settlementStructures).values({
					id: crypto.randomUUID(),
					settlementId: testChain!.settlement.id,
					structureId: houseStructureId,
					level: 1,
					health: 100,
				});
			}

			const response = await request(app)
				.get(`/api/settlement-area/${testChain!.settlement.id}`)
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(200);

			// TH 100 + 3 Houses 150 = 250 area used
			expect(response.body.data.areaUsed).toBe(250);
			// TH level 2: 500 + (2 * 100) = 700
			expect(response.body.data.areaCapacity).toBe(700);
			expect(response.body.data.areaAvailable).toBe(450);
			expect(response.body.data.percentUsed).toBeCloseTo(35.71, 1);
			expect(response.body.data.townHallLevel).toBe(2);
			expect(response.body.data.buildings).toHaveLength(4);
		});

		it('should exclude extractors from area calculation and building list', async () => {
			// Create Farm (extractor, areaCost 0)
			const farm = await db.query.structures.findFirst({
				where: (structure, { eq }) => eq(structure.name, 'Farm'),
			});

			await db.insert(settlementStructures).values({
				id: crypto.randomUUID(),
				settlementId: testChain!.settlement.id,
				structureId: farm!.id,
				level: 1,
				health: 100,
			});

			// Create House (building, areaCost 50)
			await db.insert(settlementStructures).values({
				id: crypto.randomUUID(),
				settlementId: testChain!.settlement.id,
				structureId: houseStructureId,
				level: 1,
				health: 100,
			});

			const response = await request(app)
				.get(`/api/settlement-area/${testChain!.settlement.id}`)
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(200);

			// Only House should count (50 area)
			expect(response.body.data.areaUsed).toBe(50);
			// Only House should appear in buildings list (Farm excluded)
			expect(response.body.data.buildings).toHaveLength(1);
			expect(response.body.data.buildings[0].name).toBe('House');
		});

		it('should return 404 for nonexistent settlement', async () => {
			const response = await request(app)
				.get('/api/settlement-area/nonexistent-id')
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(404);

			expect(response.body.success).toBe(false);
			expect(response.body.code).toBe('SETTLEMENT_NOT_FOUND');
		});

		it('should return 403 if user does not own settlement', async () => {
			const otherChain = await createTestSettlement();

			const response = await request(app)
				.get(`/api/settlement-area/${testChain!.settlement.id}`)
				.set('Cookie', `session=${otherChain.account.userAuthToken}`)
				.expect(403);

			expect(response.body.success).toBe(false);
			expect(response.body.code).toBe('NOT_SETTLEMENT_OWNER');

			await cleanupTestChain(otherChain);
		});

		it('should return 401 without authentication', async () => {
			await request(app)
				.get(`/api/settlement-area/${testChain!.settlement.id}`)
				.expect(401);
		});

		it('should handle settlement at full capacity', async () => {
			// Create Town Hall (100 area)
			await db.insert(settlementStructures).values({
				id: crypto.randomUUID(),
				settlementId: testChain!.settlement.id,
				structureId: townHallStructureId,
				level: 1, // TH level 1 = 600 capacity
				health: 100,
			});

			// Create 10 Houses (10 × 50 = 500 area)
			// Total: 600/600 area used
			for (let i = 0; i < 10; i++) {
				await db.insert(settlementStructures).values({
					id: crypto.randomUUID(),
					settlementId: testChain!.settlement.id,
					structureId: houseStructureId,
					level: 1,
					health: 100,
				});
			}

			const response = await request(app)
				.get(`/api/settlement-area/${testChain!.settlement.id}`)
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(200);

			expect(response.body.data.areaUsed).toBe(600);
			expect(response.body.data.areaCapacity).toBe(600);
			expect(response.body.data.areaAvailable).toBe(0);
			expect(response.body.data.percentUsed).toBe(100);
			expect(response.body.data.townHallLevel).toBe(1);
			expect(response.body.data.buildings).toHaveLength(11); // TH + 10 Houses
		});

		it('should handle higher Town Hall levels increasing capacity', async () => {
			// Create Town Hall level 5
			await db.insert(settlementStructures).values({
				id: crypto.randomUUID(),
				settlementId: testChain!.settlement.id,
				structureId: townHallStructureId,
				level: 5, // TH level 5 = 500 + (5 * 100) = 1000 capacity
				health: 100,
			});

			const response = await request(app)
				.get(`/api/settlement-area/${testChain!.settlement.id}`)
				.set('Cookie', `session=${testChain!.account.userAuthToken}`)
				.expect(200);

			expect(response.body.data.areaUsed).toBe(100); // Just the TH
			expect(response.body.data.areaCapacity).toBe(1000); // 500 + (5 * 100)
			expect(response.body.data.areaAvailable).toBe(900);
			expect(response.body.data.percentUsed).toBe(10);
			expect(response.body.data.townHallLevel).toBe(5);
		});
	});
});
