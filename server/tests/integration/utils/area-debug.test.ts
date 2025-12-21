import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '../../../src/db/index.js';
import { settlementStructures } from '../../../src/db/schema.js';
import { validateBuildingPlacement } from '../../../src/utils/building-validator.js';
import { getAreaStatistics } from '../../../src/utils/area-calculator.js';
import { createId } from '@paralleldrive/cuid2';
import { createTestSettlement, type TestEntityChain } from '../../helpers/integration-test-factory.js';

describe('Area Validation Debug', () => {
	let testChain: TestEntityChain;
	let townHallId: string;
	let houseId: string;
	let workshopId: string;

	beforeEach(async () => {
		testChain = await createTestSettlement();

		const townHall = await db.query.structures.findFirst({
			where: (structures, { eq }) => eq(structures.name, 'Town Hall'),
		});
		const house = await db.query.structures.findFirst({
			where: (structures, { eq }) => eq(structures.name, 'House'),
		});
		const workshop = await db.query.structures.findFirst({
			where: (structures, { eq }) => eq(structures.name, 'Workshop'),
		});

		if (!townHall || !house || !workshop) {
			throw new Error('Master structure data not seeded');
		}

		townHallId = townHall.id;
		houseId = house.id;
		workshopId = workshop.id;

		console.log('Structure IDs loaded:', { townHallId, houseId, workshopId });
		console.log('Structure costs:', {
			townHall: townHall.areaCost,
			house: house.areaCost,
			workshop: workshop.areaCost,
		});
	});

	it('should debug area calculation', async () => {
		// Add Town Hall level 1
		await db.insert(settlementStructures).values({
			id: createId(),
			settlementId: testChain.settlement.id,
			structureId: townHallId,
			level: 1,
			populationAssigned: 0,
		});

		console.log('After adding TH:');
		let stats = await getAreaStatistics(db, testChain.settlement.id);
		console.log(stats);

		// Debug: Call calculateAreaUsed directly
		const { calculateAreaUsed } = await import('../../../src/utils/area-calculator.js');
		const areaUsed = await calculateAreaUsed(db, testChain.settlement.id);
		console.log('Direct calculateAreaUsed result:', areaUsed);

		// Debug: Check what structures are in the settlement
		const structures = await db.query.settlementStructures.findMany({
			where: (s, { eq }) => eq(s.settlementId, testChain.settlement.id),
			with: { structure: true },
		});
		console.log('Structures in settlement:', structures.map(s => ({ name: s.structure.name, areaCost: s.structure.areaCost })));

		// Add 10 Houses
		for (let i = 0; i < 10; i++) {
			await db.insert(settlementStructures).values({
				id: createId(),
				settlementId: testChain.settlement.id,
				structureId: houseId,
				level: 1,
				populationAssigned: 0,
			});
		}

		console.log('After adding 10 Houses:');
		stats = await getAreaStatistics(db, testChain.settlement.id);
		console.log(stats);

		// Try to validate Workshop
		const result = await validateBuildingPlacement(db, testChain.settlement.id, 'Workshop');
		console.log('Validation result:', result);

		expect(result.valid).toBe(false);
	});
});
