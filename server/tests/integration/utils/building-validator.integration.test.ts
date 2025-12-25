/**
 * Building Validator - Integration Tests
 * Tests building placement validation with real database
 *
 * December 2025 - Building Area System Implementation
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { db } from '../../../src/db/index.js';
import { settlementStructures, settlements } from '../../../src/db/schema.js';
import { validateBuildingPlacement } from '../../../src/utils/building-validator.js';
import { createId } from '@paralleldrive/cuid2';
import type { TestEntityChain } from '../../helpers/integration-test-factory.js';
import { createTestSettlement, cleanupTestChain } from '../../helpers/integration-test-factory.js';

describe('Building Validator - Integration', () => {
	let testChain: TestEntityChain;
	let townHallId: string;
	let houseId: string;
	let workshopId: string;
	let marketplaceId: string;
	let farmId: string;

	beforeEach(async () => {
		testChain = await createTestSettlement();

		// Look up structure IDs from database
		const townHall = await db.query.structures.findFirst({
			where: (structures, { eq }) => eq(structures.name, 'Town Hall'),
		});
		const house = await db.query.structures.findFirst({
			where: (structures, { eq }) => eq(structures.name, 'House'),
		});
		const workshop = await db.query.structures.findFirst({
			where: (structures, { eq }) => eq(structures.name, 'Workshop'),
		});
		const marketplace = await db.query.structures.findFirst({
			where: (structures, { eq }) => eq(structures.name, 'Marketplace'),
		});
		const farm = await db.query.structures.findFirst({
			where: (structures, { eq }) => eq(structures.name, 'Farm'),
		});

		if (!townHall || !house || !workshop || !marketplace || !farm) {
			throw new Error('Master structure data not seeded. Run: npm run db:seed');
		}

		townHallId = townHall.id;
		houseId = house.id;
		workshopId = workshop.id;
		marketplaceId = marketplace.id;
		farmId = farm.id;
	});

	afterEach(async () => {
		await cleanupTestChain(testChain);
	});

	describe('Town Hall Level Validation', () => {
		it('should reject building requiring higher TH level', async () => {
			// Settlement has no Town Hall (level 0)
			// Workshop requires TH level 1
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Workshop');

			expect(result.valid).toBe(false);
			expect(result.error?.type).toBe('TOWN_HALL_LEVEL_TOO_LOW');
			expect(result.error?.message).toContain('Requires Town Hall level 1');
			expect(result.error?.details?.requiredLevel).toBe(1);
			expect(result.error?.details?.currentLevel).toBe(0);
		});

		it('should accept building when TH level meets requirement', async () => {
			// Add Town Hall level 1
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 1,
				populationAssigned: 0,
			});

			// Workshop requires TH level 1 - should pass
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Workshop');

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should accept building when TH level exceeds requirement', async () => {
			// Add Town Hall level 3
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 3,
				populationAssigned: 0,
			});

			// Workshop requires TH level 1, we have level 3 - should pass
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Workshop');

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});
	});

	describe('Unique Building Constraints', () => {
		it('should accept first Town Hall', async () => {
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Town Hall');

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should reject second Town Hall (unique constraint)', async () => {
			// Add first Town Hall
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 1,
				populationAssigned: 0,
			});

			// Try to add second Town Hall
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Town Hall');

			expect(result.valid).toBe(false);
			expect(result.error?.type).toBe('UNIQUE_CONSTRAINT_VIOLATED');
			expect(result.error?.message).toContain('Town Hall already exists');
			expect(result.error?.details?.existingStructure).toBe('Town Hall');
		});

		it('should reject second Workshop (unique constraint)', async () => {
			// Add Town Hall first (Workshop requires TH level 1)
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 1,
				populationAssigned: 0,
			});

			// Add first Workshop
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: workshopId,
				level: 1,
				populationAssigned: 0,
			});

			// Try to add second Workshop
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Workshop');

			expect(result.valid).toBe(false);
			expect(result.error?.type).toBe('UNIQUE_CONSTRAINT_VIOLATED');
			expect(result.error?.message).toContain('Workshop already exists');
		});

		it('should reject second Marketplace (unique constraint)', async () => {
			// Add Town Hall first (Marketplace requires TH level 2)
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 3,
				populationAssigned: 0,
			});

			// Add first Marketplace
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: marketplaceId,
				level: 1,
				populationAssigned: 0,
			});

			// Try to add second Marketplace
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Marketplace');

			expect(result.valid).toBe(false);
			expect(result.error?.type).toBe('UNIQUE_CONSTRAINT_VIOLATED');
			expect(result.error?.message).toContain('Marketplace already exists');
		});

		it('should accept multiple Houses (not unique)', async () => {
			// Add Town Hall first
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 1,
				populationAssigned: 0,
			});

			// Add first House
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: houseId,
				level: 1,
				populationAssigned: 0,
			});

			// Try to add second House - should pass (not unique)
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'House');

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});
	});

	describe('Area Availability Validation', () => {
		it('should reject building with insufficient area', async () => {
			// Add Town Hall level 1 (capacity = 600, TH uses 100, available = 500)
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 1,
				populationAssigned: 0,
			});

			// Add 10 Houses (50 area each = 500 total)
			for (let i = 0; i < 10; i++) {
				await db.insert(settlementStructures).values({
					id: createId(),
					settlementId: testChain.settlement.id,
					structureId: houseId,
					level: 1,
					populationAssigned: 0,
				});
			}

			// Try to add Workshop (75 area) - should fail (no space left)
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Workshop');

			expect(result.valid).toBe(false);
			expect(result.error?.type).toBe('INSUFFICIENT_AREA');
			expect(result.error?.message).toContain('Insufficient area: need 75, have 0');
			expect(result.error?.details?.required).toBe(75);
			expect(result.error?.details?.available).toBe(0);
		});

		it('should accept building when sufficient area available', async () => {
			// Add Town Hall level 1 (capacity = 600, TH uses 100, available = 500)
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 1,
				populationAssigned: 0,
			});

			// Add 5 Houses (50 area each = 250 total, 250 remaining)
			for (let i = 0; i < 5; i++) {
				await db.insert(settlementStructures).values({
					id: createId(),
					settlementId: testChain.settlement.id,
					structureId: houseId,
					level: 1,
					populationAssigned: 0,
				});
			}

			// Try to add Workshop (75 area) - should pass (250 available)
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Workshop');

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should accept building when area is exactly available', async () => {
			// Add Town Hall level 1 (capacity = 600, TH uses 100, available = 500)
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 1,
				populationAssigned: 0,
			});

			// Add 9 Houses (50 area each = 300 total, 200 remaining)
			for (let i = 0; i < 6; i++) {
				await db.insert(settlementStructures).values({
					id: createId(),
					settlementId: testChain.settlement.id,
					structureId: houseId,
					level: 1,
					populationAssigned: 0,
				});
			}

			// Try to add Workshop (75 area) - should pass (200 available)
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Workshop');

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});

		it('should ignore extractors (areaCost = 0) when calculating area', async () => {
			// Add Town Hall level 1
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 1,
				populationAssigned: 0,
			});

			// Add Farm (extractor, areaCost = 0)
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: farmId,
				level: 1,
				populationAssigned: 0,
			});

			// Try to add House - should have full 500 area available
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'House');

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});
	});

	describe('Combined Validation Logic', () => {
		it('should validate all checks in correct order (TH level → unique → area)', async () => {
			// No Town Hall yet
			// Try to add Marketplace (requires TH 2, unique, 75 area)
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Marketplace');

			// Should fail on TH level first (before checking unique or area)
			expect(result.valid).toBe(false);
			expect(result.error?.type).toBe('TOWN_HALL_LEVEL_TOO_LOW');
		});

		it('should reject on unique constraint before checking area', async () => {
			// Add Town Hall level 3
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 3,
				populationAssigned: 0,
			});

			// Add first Marketplace
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: marketplaceId,
				level: 1,
				populationAssigned: 0,
			});

			// Fill up remaining area with Houses to test that unique is checked first
			for (let i = 0; i < 6; i++) {
				await db.insert(settlementStructures).values({
					id: createId(),
					settlementId: testChain.settlement.id,
					structureId: houseId,
					level: 1,
					populationAssigned: 0,
				});
			}

			// Try to add second Marketplace (would fail area, but unique fails first)
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Marketplace');

			expect(result.valid).toBe(false);
			expect(result.error?.type).toBe('UNIQUE_CONSTRAINT_VIOLATED');
		});

		it('should accept when all validations pass', async () => {
			// Add Town Hall level 3
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: townHallId,
				level: 3,
				populationAssigned: 0,
			});

			// Add 3 Houses (150 area used, 550 available)
			for (let i = 0; i < 3; i++) {
				await db.insert(settlementStructures).values({
					id: createId(),
					settlementId: testChain.settlement.id,
					structureId: houseId,
					level: 1,
					populationAssigned: 0,
				});
			}

			// Try to add Marketplace (TH 2 ✓, unique ✓, 75 area ✓)
			const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Marketplace');

			expect(result.valid).toBe(true);
			expect(result.error).toBeUndefined();
		});
	});
});
