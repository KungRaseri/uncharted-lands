/**
 * Building Area System Calculator
 * Calculates settlement area capacity and validates building placement
 *
 * Design: Town Hall level directly determines settlement tier and area capacity
 * Formula: 500 + (townHallLevel × 100)
 *
 * December 2025 - Building Area System Implementation
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';
import { settlements, settlementStructures, structures } from '../db/schema.js';
import type * as schema from '../db/schema.js';
import { STRUCTURES } from '../data/structures.js';

/**
 * Calculate the total area capacity for a settlement based on Town Hall level
 * Formula: 500 + (townHallLevel × 100)
 *
 * @param townHallLevel - The level of the Town Hall (0 if no Town Hall)
 * @returns Total area capacity in square units
 */
export function calculateAreaCapacity(townHallLevel: number): number {
	return 500 + townHallLevel * 100;
}

/**
 * Get the Town Hall level for a settlement
 * Returns 0 if no Town Hall exists (Outpost tier)
 *
 * @param db - Database connection
 * @param settlementId - Settlement ID to check
 * @returns Town Hall level (0 if none)
 */
export async function getTownHallLevel(
	db:
		| PostgresJsDatabase<typeof schema>
		| Parameters<Parameters<PostgresJsDatabase<typeof schema>['transaction']>[0]>[0],
	settlementId: string
): Promise<number> {
	// Find Town Hall structure definition
	const townHallDefinition = STRUCTURES.find(
		(s) => s.buildingType === 'TOWN_HALL' && s.category === 'BUILDING'
	);

	if (!townHallDefinition) {
		return 0; // No Town Hall definition found
	}

	// Query for Town Hall structure ID from database
	const townHallDbStructure = await db.query.structures.findFirst({
		where: eq(structures.name, townHallDefinition.name),
	});

	if (!townHallDbStructure) {
		return 0; // No Town Hall in database
	}

	// Find Town Hall instance in settlement
	const allStructures = await db.query.settlementStructures.findMany({
		where: eq(settlementStructures.settlementId, settlementId),
		with: {
			structure: true,
		},
	});

	// Find the Town Hall among all structures
	const townHall = allStructures.find(
		(s) => s.structureId === townHallDbStructure.id
	);

	if (!townHall) {
		return 0; // No Town Hall in this settlement
	}

	return townHall.level;
}

/**
 * Calculate the total area used by buildings in a settlement
 * Excludes extractors (areaCost = 0)
 *
 * @param db - Database connection
 * @param settlementId - Settlement ID to calculate
 * @returns Total area consumed by buildings
 */
export async function calculateAreaUsed(
	db:
		| PostgresJsDatabase<typeof schema>
		| Parameters<Parameters<PostgresJsDatabase<typeof schema>['transaction']>[0]>[0],
	settlementId: string
): Promise<number> {
	// Get all structures in the settlement
	const settlementBuildings = await db.query.settlementStructures.findMany({
		where: eq(settlementStructures.settlementId, settlementId),
		with: {
			structure: true,
		},
	});

	let totalArea = 0;

	for (const building of settlementBuildings) {
		const structure = building.structure as typeof schema.structures.$inferSelect;
		// Find the structure definition
		const structureDefinition = STRUCTURES.find(
			(s) => s.name === structure.name
		);

		if (structureDefinition) {
			totalArea += structureDefinition.areaCost;
		}
	}

	return totalArea;
}

/**
 * Update settlement area usage in database
 * Should be called after building or demolishing structures
 *
 * @param db - Database connection
 * @param settlementId - Settlement ID to update
 */
export async function updateSettlementAreaUsage(
	db:
		| PostgresJsDatabase<typeof schema>
		| Parameters<Parameters<PostgresJsDatabase<typeof schema>['transaction']>[0]>[0],
	settlementId: string
): Promise<void> {
	const areaUsed = await calculateAreaUsed(db, settlementId);
	const townHallLevel = await getTownHallLevel(db, settlementId);
	const areaCapacity = calculateAreaCapacity(townHallLevel);

	await db
		.update(settlements)
		.set({
			areaUsed,
			areaCapacity,
		})
		.where(eq(settlements.id, settlementId));
}

/**
 * Get area statistics for a settlement
 *
 * @param db - Database connection
 * @param settlementId - Settlement ID to query
 * @returns Area statistics object
 */
export async function getAreaStatistics(
	db: PostgresJsDatabase<typeof schema>,
	settlementId: string
): Promise<{
	areaUsed: number;
	areaCapacity: number;
	areaAvailable: number;
	percentUsed: number;
	townHallLevel: number;
}> {
	const settlement = await db.query.settlements.findFirst({
		where: eq(settlements.id, settlementId),
	});

	if (!settlement) {
		throw new Error('Settlement not found');
	}

	const areaUsed = settlement.areaUsed ?? 0;
	const areaCapacity = settlement.areaCapacity ?? 500;
	const areaAvailable = Math.max(0, areaCapacity - areaUsed);
	const percentUsed = areaCapacity > 0 ? (areaUsed / areaCapacity) * 100 : 0;

	const townHallLevel = await getTownHallLevel(db, settlementId);

	return {
		areaUsed,
		areaCapacity,
		areaAvailable,
		percentUsed,
		townHallLevel,
	};
}
