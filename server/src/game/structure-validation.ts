/**
 * Structure Validation Utilities
 * Validates resource requirements and deducts resources for structure construction
 *
 * ✅ Phase 4: Refactored to use database queries instead of hardcoded structure-costs
 * - Changed function signatures to accept Structure object (not string)
 * - Query StructureRequirement table for costs
 * - Removed hardcoded getStructureCost import
 */

import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { settlementStorage, settlements, structureRequirements } from '../db/schema.js';
import type * as schema from '../db/schema.js';
import { logger } from '../utils/logger.js';

/**
 * Resource shortage information
 */
export interface ResourceShortage {
	type: 'wood' | 'stone' | 'ore' | 'food' | 'water';
	required: number;
	available: number;
	missing: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
	success: boolean;
	error?: string;
	shortages?: ResourceShortage[];
	deductedResources?: {
		wood: number;
		stone: number;
		ore: number;
	};
}

/**
 * Validate that a settlement has sufficient resources to build a structure,
 * and deduct the resources if validation passes.
 *
 * This function MUST be called within a database transaction to ensure atomicity.
 *
 * ✅ Phase 4: Refactored signature
 * - OLD: validateAndDeductResources(tx, settlementId, structureType: string)
 * - NEW: validateAndDeductResources(tx, settlementId, structure: Structure)
 *
 * @param tx - The database transaction
 * @param settlementId - The settlement attempting to build
 * @param structure - The Structure object (from database query)
 * @returns Validation result with success status, error message, or shortage details
 */
export async function validateAndDeductResources(
	tx:
		| PostgresJsDatabase<typeof schema>
		| Parameters<Parameters<PostgresJsDatabase<typeof schema>['transaction']>[0]>[0],
	settlementId: string,
	structure: typeof schema.structures.$inferSelect
): Promise<ValidationResult> {
	logger.debug('[VALIDATION] Starting resource validation', {
		settlementId,
		structureId: structure.id,
		structureName: structure.name,
		structureCategory: structure.category,
	});

	// 1. Get structure costs from StructureRequirement table (database query)
	const requirementRecords = await tx.query.structureRequirements.findMany({
		where: eq(structureRequirements.structureId, structure.id),
		with: {
			resource: true,
		},
	});

	logger.debug('[VALIDATION] Found requirement records', {
		structureId: structure.id,
		recordCount: requirementRecords.length,
		records: requirementRecords.map(r => ({
			resourceName: (r.resource as any)?.name,
			quantity: r.quantity
		}))
	});

	// Build costs object from database records
	const costs: Record<string, number> = {};
	for (const req of requirementRecords) {
		// Access resource name from the joined resource table
		const resourceName = (req.resource as typeof schema.resources.$inferSelect)?.name;
		if (resourceName && req.quantity) {
			costs[resourceName.toLowerCase()] = req.quantity;
		}
	}

	logger.debug('[VALIDATION] Parsed costs', { costs });

	// 2. Query settlement with storage
	const settlement = await tx.query.settlements.findFirst({
		where: eq(settlements.id, settlementId),
		with: {
			storage: true,
		},
	});

	if (!settlement) {
		logger.error('[VALIDATION] Settlement not found', { settlementId });
		throw new Error('Settlement not found');
	}

	if (!settlement.storage) {
		logger.error('[VALIDATION] Settlement storage not found', { settlementId });
		throw new Error('Settlement storage not found');
	}

	const storage = settlement.storage;
	logger.debug('[VALIDATION] Current resources', {
		settlementId,
		wood: storage.wood,
		stone: storage.stone,
		ore: storage.ore,
	});

	// 3. Validate sufficient resources
	const shortages: ResourceShortage[] = [];

	// Only check costs that are defined (handle optional properties)
	const woodCost = costs.wood ?? 0;
	const stoneCost = costs.stone ?? 0;
	const oreCost = costs.ore ?? 0;

	logger.debug('[VALIDATION] Checking resource availability', {
		costs: { wood: woodCost, stone: stoneCost, ore: oreCost },
		available: { wood: storage.wood, stone: storage.stone, ore: storage.ore },
	});

	if (storage.wood < woodCost) {
		shortages.push({
			type: 'wood',
			required: woodCost,
			available: storage.wood,
			missing: woodCost - storage.wood,
		});
	}

	if (storage.stone < stoneCost) {
		shortages.push({
			type: 'stone',
			required: stoneCost,
			available: storage.stone,
			missing: stoneCost - storage.stone,
		});
	}

	if (storage.ore < oreCost) {
		shortages.push({
			type: 'ore',
			required: oreCost,
			available: storage.ore,
			missing: oreCost - storage.ore,
		});
	}

	if (shortages.length > 0) {
		logger.warn('[VALIDATION] Resource shortages detected', {
			settlementId,
			structureName: structure.name,
			shortages,
			requiredCosts: { wood: woodCost, stone: stoneCost, ore: oreCost },
			availableResources: { wood: storage.wood, stone: storage.stone, ore: storage.ore },
		});
		return {
			success: false,
			error: 'Insufficient resources to build structure',
			shortages,
			deductedResources: { wood: 0, stone: 0, ore: 0 },
		};
	}

	// 4. Deduct resources (in the same transaction)
	// Use concrete numeric subtraction so tests that mock tx.update(table, data)
	// receive the updated values directly.
	const newWood = storage.wood - woodCost;
	const newStone = storage.stone - stoneCost;
	const newOre = storage.ore - oreCost;

	// Deduct resources from settlement storage using correct Drizzle ORM syntax
	await tx
		.update(settlementStorage)
		.set({
			wood: newWood,
			stone: newStone,
			ore: newOre,
		})
		.where(eq(settlementStorage.settlementId, settlementId));

	return {
		success: true,
		deductedResources: {
			wood: woodCost,
			stone: stoneCost,
			ore: oreCost,
		},
		shortages: [],
	};
}

/**
 * Check if a settlement has sufficient resources WITHOUT deducting them.
 * Useful for UI validation before attempting to build.
 *
 * ✅ Phase 4: Refactored signature
 * - OLD: checkResourceAvailability(tx, settlementId, structureType: string)
 * - NEW: checkResourceAvailability(tx, settlementId, structure: Structure)
 *
 * @param tx - The database transaction or connection
 * @param settlementId - The settlement to check
 * @param structure - The Structure object (from database query)
 * @returns Validation result (success or shortages)
 */
export async function checkResourceAvailability(
	tx:
		| PostgresJsDatabase<typeof schema>
		| Parameters<Parameters<PostgresJsDatabase<typeof schema>['transaction']>[0]>[0],
	settlementId: string,
	structure: typeof schema.structures.$inferSelect
): Promise<ValidationResult> {
	// 1. Get structure costs from StructureRequirement table (database query)
	const requirementRecords = await tx.query.structureRequirements.findMany({
		where: eq(structureRequirements.structureId, structure.id),
		with: {
			resource: true,
		},
	});

	// Build costs object from database records
	const costs: Record<string, number> = {};
	for (const req of requirementRecords) {
		// Access resource name from the joined resource table
		const resourceName = (req.resource as typeof schema.resources.$inferSelect)?.name;
		if (resourceName && req.quantity) {
			costs[resourceName.toLowerCase()] = req.quantity;
		}
	}

	// 2. Query settlement storage
	const settlement = await tx.query.settlements.findFirst({
		where: eq(settlements.id, settlementId),
		with: { storage: true },
	});

	if (!settlement) {
		throw new Error('Settlement not found');
	}

	if (!settlement.storage) {
		throw new Error('Settlement storage not found');
	}

	const storage = settlement.storage;

	// 3. Check for shortages
	const shortages: ResourceShortage[] = [];

	// Only check costs that are defined (handle optional properties)
	const woodCost = costs.wood ?? 0;
	const stoneCost = costs.stone ?? 0;
	const oreCost = costs.ore ?? 0;

	if (storage.wood < woodCost) {
		shortages.push({
			type: 'wood',
			required: woodCost,
			available: storage.wood,
			missing: woodCost - storage.wood,
		});
	}

	if (storage.stone < stoneCost) {
		shortages.push({
			type: 'stone',
			required: stoneCost,
			available: storage.stone,
			missing: stoneCost - storage.stone,
		});
	}

	if (storage.ore < oreCost) {
		shortages.push({
			type: 'ore',
			required: oreCost,
			available: storage.ore,
			missing: oreCost - storage.ore,
		});
	}

	if (shortages.length > 0) {
		return {
			success: false,
			error: 'Insufficient resources to build structure',
			shortages,
			deductedResources: { wood: 0, stone: 0, ore: 0 },
		};
	}

	return {
		success: true,
	};
}
