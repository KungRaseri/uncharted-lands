/**
 * Building Placement Validation
 * Validates Town Hall level requirements, unique constraints, and area availability
 *
 * December 2025 - Building Area System Implementation
 */

import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { eq, and, sql } from 'drizzle-orm';
import { settlementStructures, structures } from '../db/schema.js';
import type * as schema from '../db/schema.js';
import { STRUCTURES } from '../data/structures.js';
import { getTownHallLevel, getAreaStatistics } from '../utils/area-calculator.js';

export interface AreaValidationError {
	type: 'INSUFFICIENT_AREA' | 'TOWN_HALL_LEVEL_TOO_LOW' | 'UNIQUE_CONSTRAINT_VIOLATED';
	message: string;
	details?: {
		required?: number;
		available?: number;
		requiredLevel?: number;
		currentLevel?: number;
		existingStructure?: string;
	};
}

export interface BuildingValidationResult {
	valid: boolean;
	error?: AreaValidationError;
}

/**
 * Validate that a building can be placed in a settlement
 * Checks:
 * 1. Town Hall level requirement
 * 2. Unique building constraint
 * 3. Available area
 *
 * @param db - Database connection
 * @param settlementId - Settlement ID
 * @param structureName - Name of structure to build (e.g., "Town Hall", "House")
 * @returns Validation result with error details if invalid
 */
export async function validateBuildingPlacement(
	db:
		| PostgresJsDatabase<typeof schema>
		| Parameters<Parameters<PostgresJsDatabase<typeof schema>['transaction']>[0]>[0],
	settlementId: string,
	structureName: string
): Promise<BuildingValidationResult> {
	// Find structure definition from master data
	const structureDefinition = STRUCTURES.find((s) => s.name === structureName);

	if (!structureDefinition) {
		return {
			valid: false,
			error: {
				type: 'TOWN_HALL_LEVEL_TOO_LOW',
				message: `Structure definition not found: ${structureName}`,
			},
		};
	}

	// 1. Check Town Hall level requirement
	const townHallLevel = await getTownHallLevel(db, settlementId);

	if (townHallLevel < structureDefinition.minTownHallLevel) {
		return {
			valid: false,
			error: {
				type: 'TOWN_HALL_LEVEL_TOO_LOW',
				message: `Requires Town Hall level ${structureDefinition.minTownHallLevel} (current: ${townHallLevel})`,
				details: {
					requiredLevel: structureDefinition.minTownHallLevel,
					currentLevel: townHallLevel,
				},
			},
		};
	}

	// 2. Check unique building constraint
	if (structureDefinition.unique && structureDefinition.category === 'BUILDING') {
		// Query for existing structure of this type in the settlement
		const dbStructure = await db.query.structures.findFirst({
			where: eq(structures.name, structureName),
		});

		if (dbStructure) {
			const existingStructure = await db.query.settlementStructures.findFirst({
				where: and(
					eq(settlementStructures.settlementId, settlementId),
					eq(settlementStructures.structureId, dbStructure.id)
				),
			});

			if (existingStructure) {
				return {
					valid: false,
					error: {
						type: 'UNIQUE_CONSTRAINT_VIOLATED',
						message: `${structureName} already exists in this settlement (unique building)`,
						details: {
							existingStructure: structureName,
						},
					},
				};
			}
		}
	}

	// 3. Check available area (only for buildings, not extractors)
	if (structureDefinition.category === 'BUILDING' && structureDefinition.areaCost > 0) {
		const areaStats = await getAreaStatistics(db, settlementId);

		// Calculate area reserved by buildings in construction queue
		const queuedBuildings = await db.query.constructionQueue.findMany({
			where: and(
				eq(schema.constructionQueue.settlementId, settlementId),
				sql`${schema.constructionQueue.status} != 'COMPLETE'` // Exclude completed constructions
			),
		});

		let reservedArea = 0;
		for (const queuedItem of queuedBuildings) {
			// Look up structure definition for each queued building
			const queuedStructure = STRUCTURES.find(s => s.name === queuedItem.structureType);
			if (queuedStructure && queuedStructure.category === 'BUILDING') {
				reservedArea += queuedStructure.areaCost;
			}
		}

		const availableAreaAfterQueue = areaStats.areaAvailable - reservedArea;

		if (availableAreaAfterQueue < structureDefinition.areaCost) {
			return {
				valid: false,
				error: {
					type: 'INSUFFICIENT_AREA',
					message: `Insufficient area: need ${structureDefinition.areaCost}, have ${availableAreaAfterQueue} (${reservedArea} reserved by queue)`,
					details: {
						required: structureDefinition.areaCost,
						available: availableAreaAfterQueue,
					},
				},
			};
		}
	}

	return { valid: true };
}
