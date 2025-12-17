/**
 * Passive Repair System
 *
 * Structures in settlements with a Workshop automatically restore 1% health per hour.
 * Only applies to structures with 21-99% health (critical structures require manual repair).
 *
 * Integration: Called from game loop every 216,000 ticks (1 hour at 60Hz)
 */

import { db } from '../db/index.js';
import { settlementStructures } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

/**
 * Type for settlement with structures loaded (from Drizzle query)
 */
interface SettlementWithStructures {
	id: string;
	name: string;
	structures: Array<{
		id: string;
		structureId: string;
		health: number | null;
		lastRepairedAt: Date | null;
		structure: {
			id: string;
			name: string;
			buildingType: string | null;
			extractorType: string | null;
		};
	}>;
}

/**
 * Configuration for passive repair system
 */
export const PASSIVE_REPAIR_CONFIG = {
	/** Health restored per hour (as percentage) */
	REPAIR_RATE_PER_HOUR: 1,

	/** Minimum health for passive repair (below this requires manual repair) */
	MIN_HEALTH_FOR_PASSIVE: 21,

	/** Maximum health (already pristine, no repair needed) */
	MAX_HEALTH: 100,

	/** Structure type that enables passive repair */
	REQUIRED_STRUCTURE: 'WORKSHOP',
} as const;

/**
 * Result of passive repair processing for a single settlement
 */
export interface PassiveRepairResult {
	settlementId: string;
	settlementName: string;
	hasWorkshop: boolean;
	structuresRepaired: Array<{
		structureId: string;
		structureName: string;
		oldHealth: number;
		newHealth: number;
		healthRestored: number;
	}>;
	totalStructuresRepaired: number;
}

/**
 * Result of passive repair processing for all settlements
 */
export interface PassiveRepairBatchResult {
	settlementsProcessed: number;
	settlementsWithWorkshop: number;
	totalStructuresRepaired: number;
	settlementResults: PassiveRepairResult[];
}

/**
 * Process passive repair for all settlements in a world
 *
 * @param worldId - The world to process passive repairs for
 * @returns Batch result with all settlements processed
 */
export async function processPassiveRepairs(worldId: string): Promise<PassiveRepairBatchResult> {
	const startTime = Date.now();

	try {
		// Get all settlements in this world by querying through the relationship chain:
		// settlements -> tile -> region -> world
		const worldSettlements = await db.query.settlements.findMany({
			with: {
				structures: {
					with: {
						structure: true, // Load the Structure definition to get buildingType
					},
				},
				tile: {
					with: {
						region: true,
					},
				},
			},
		});

		// Filter settlements that belong to the specified world
		const filteredSettlements = worldSettlements.filter(
			(settlement) => settlement.tile?.region?.worldId === worldId
		);

		const settlementResults: PassiveRepairResult[] = [];
		let settlementsWithWorkshop = 0;
		let totalStructuresRepaired = 0;

		// Process each settlement
		for (const settlement of filteredSettlements) {
			const result = await processSettlementPassiveRepair(settlement as SettlementWithStructures);
			settlementResults.push(result);

			if (result.hasWorkshop) {
				settlementsWithWorkshop++;
				totalStructuresRepaired += result.totalStructuresRepaired;
			}
		}

		const duration = Date.now() - startTime;

		logger.info('[PASSIVE REPAIR] Batch processing complete', {
			worldId,
			settlementsProcessed: filteredSettlements.length,
			settlementsWithWorkshop,
			totalStructuresRepaired,
			durationMs: duration,
		});

		return {
			settlementsProcessed: filteredSettlements.length,
			settlementsWithWorkshop,
			totalStructuresRepaired,
			settlementResults,
		};
	} catch (error) {
		logger.error('[PASSIVE REPAIR] Batch processing failed', {
			worldId,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

/**
 * Process passive repair for a single settlement
 *
 * @param settlement - Settlement with structures
 * @returns Result with repaired structures
 */
async function processSettlementPassiveRepair(
	settlement: SettlementWithStructures
): Promise<PassiveRepairResult> {
	const result: PassiveRepairResult = {
		settlementId: settlement.id,
		settlementName: settlement.name,
		hasWorkshop: false,
		structuresRepaired: [],
		totalStructuresRepaired: 0,
	};

	// Check if settlement has a Workshop
	const hasWorkshop = settlement.structures.some(
		(s) =>
			s.structure.buildingType === PASSIVE_REPAIR_CONFIG.REQUIRED_STRUCTURE ||
			s.structure.name === 'Workshop'
	);

	result.hasWorkshop = hasWorkshop;

	if (!hasWorkshop) {
		logger.debug('[PASSIVE REPAIR] Settlement has no Workshop, skipping', {
			settlementId: settlement.id,
			settlementName: settlement.name,
		});
		return result;
	}

	// Find all structures eligible for passive repair (health 21-99%)
	const eligibleStructures = settlement.structures.filter((s) => {
		const health = s.health ?? 100;
		return (
			health >= PASSIVE_REPAIR_CONFIG.MIN_HEALTH_FOR_PASSIVE &&
			health < PASSIVE_REPAIR_CONFIG.MAX_HEALTH
		);
	});

	if (eligibleStructures.length === 0) {
		logger.debug('[PASSIVE REPAIR] No eligible structures to repair', {
			settlementId: settlement.id,
			settlementName: settlement.name,
			totalStructures: settlement.structures.length,
		});
		return result;
	}

	// Repair each eligible structure
	const now = new Date();

	for (const structure of eligibleStructures) {
		const oldHealth = structure.health ?? 100;
		const healthToRestore = PASSIVE_REPAIR_CONFIG.REPAIR_RATE_PER_HOUR;
		const newHealth = Math.min(PASSIVE_REPAIR_CONFIG.MAX_HEALTH, oldHealth + healthToRestore);

		// Update structure in database
		await db
			.update(settlementStructures)
			.set({
				health: newHealth,
				lastRepairedAt: now,
				updatedAt: now,
			})
			.where(eq(settlementStructures.id, structure.id));

		result.structuresRepaired.push({
			structureId: structure.id,
			structureName: structure.structureId, // e.g., 'FARM', 'HOUSE'
			oldHealth,
			newHealth,
			healthRestored: healthToRestore,
		});

		logger.debug('[PASSIVE REPAIR] Structure repaired', {
			settlementId: settlement.id,
			structureId: structure.id,
			structureName: structure.structureId,
			oldHealth,
			newHealth,
			healthRestored: healthToRestore,
		});
	}

	result.totalStructuresRepaired = result.structuresRepaired.length;

	if (result.totalStructuresRepaired > 0) {
		logger.info('[PASSIVE REPAIR] Settlement structures repaired', {
			settlementId: settlement.id,
			settlementName: settlement.name,
			structuresRepaired: result.totalStructuresRepaired,
		});
	}

	return result;
}

/**
 * Check if a structure is eligible for passive repair
 *
 * @param health - Current structure health (0-100)
 * @returns True if structure can be passively repaired
 */
export function isEligibleForPassiveRepair(health: number): boolean {
	return (
		health >= PASSIVE_REPAIR_CONFIG.MIN_HEALTH_FOR_PASSIVE &&
		health < PASSIVE_REPAIR_CONFIG.MAX_HEALTH
	);
}

/**
 * Calculate hours until structure is fully repaired via passive repair
 *
 * @param currentHealth - Current structure health (0-100)
 * @returns Hours until 100% health, or null if not eligible
 */
export function calculatePassiveRepairTime(currentHealth: number): number | null {
	if (!isEligibleForPassiveRepair(currentHealth)) {
		return null;
	}

	const healthToRestore = PASSIVE_REPAIR_CONFIG.MAX_HEALTH - currentHealth;
	const hoursNeeded = Math.ceil(healthToRestore / PASSIVE_REPAIR_CONFIG.REPAIR_RATE_PER_HOUR);

	return hoursNeeded;
}
