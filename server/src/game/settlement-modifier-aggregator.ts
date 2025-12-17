/**
 * Settlement Modifier Aggregator (Phase 4)
 *
 * Calculates and stores aggregated modifier values for settlements.
 * This pre-calculates totals to avoid expensive real-time calculations
 * when querying settlement stats.
 *
 * Key Features:
 * - Groups modifiers by type and sums values
 * - Tracks contributing structures (for UI display)
 * - Upserts to database (update existing or insert new)
 * - Triggered by structure create/upgrade/delete lifecycle events
 *
 * Usage:
 *   await aggregateSettlementModifiers(settlementId);
 *   const modifiers = await getSettlementModifiers(settlementId);
 */

import { db } from '../db/index.js';
import {
	settlementModifiers,
	settlementStructures,
	structures,
	type NewSettlementModifier,
	type SettlementModifier,
	type ContributingStructure,
} from '../db/schema.js';
import { calculateStructureModifiers } from './modifier-calculator.js';
import { eq, and } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

/**
 * Aggregate all modifiers for a settlement and store in database.
 *
 * Process:
 * 1. Get all structures in the settlement
 * 2. Calculate modifiers for each structure (using Phase 3 calculator)
 * 3. Group modifiers by type and sum values
 * 4. Track which structures contributed to each modifier type
 * 5. Upsert results to settlement_modifiers table
 *
 * @param settlementId - Settlement to aggregate modifiers for
 * @returns Array of aggregated modifier records
 *
 * @example
 * ```typescript
 * // After creating a new Farm structure:
 * await aggregateSettlementModifiers('settlement-123');
 *
 * // Result: settlement_modifiers table updated with:
 * // { modifierType: 'FOOD_PRODUCTION', totalValue: 15.50, sourceCount: 3, ... }
 * ```
 */
export async function aggregateSettlementModifiers(
	settlementId: string
): Promise<SettlementModifier[]> {
	try {
		logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Starting aggregation', {
			settlementId,
		});

		// Wrap entire aggregation in a transaction to ensure atomicity
		return await db.transaction(async (tx) => {
			// Step 1: Get all structures in the settlement with their definitions
			const settlementStructuresData = await tx
				.select({
					id: settlementStructures.id,
					structureId: settlementStructures.structureId,
					level: settlementStructures.level,
					name: structures.name,
					buildingType: structures.buildingType,
					extractorType: structures.extractorType,
				})
				.from(settlementStructures)
				.innerJoin(structures, eq(settlementStructures.structureId, structures.id))
				.where(eq(settlementStructures.settlementId, settlementId));

			logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Found structures', {
				count: settlementStructuresData.length,
			});

			logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Structure data from query', {
				settlementId,
				structureCount: settlementStructuresData.length,
				structures: settlementStructuresData.map((s) => ({
					name: s.name,
					buildingType: s.buildingType,
					extractorType: s.extractorType,
					level: s.level,
				})),
			});

			// Step 2: Calculate modifiers for each structure
			// Map to store aggregated modifiers: { modifierType: { total, sources[], sourceCount } }
			const modifierMap = new Map<
				string,
				{
					totalValue: number;
					contributingStructures: ContributingStructure[];
					sourceCount: number;
				}
			>();

			for (const structure of settlementStructuresData) {
				// Use structure name in uppercase as the modifier config key
				// Config keys match structure names (e.g., 'TENT', 'HOUSE', 'FARM')
				const structureType = structure.name.toUpperCase().replace(/ /g, '_');

				if (!structureType) {
					logger.warn('[SETTLEMENT_MODIFIER_AGGREGATOR] Structure has no type', {
						structureId: structure.structureId,
						structureName: structure.name,
					});
					continue;
				}

				// Use Phase 3's calculateStructureModifiers to get all modifiers
				const modifiers = calculateStructureModifiers(structureType, structure.level);

				logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Calculated modifiers', {
					structureId: structure.structureId,
					structureName: structure.name,
					structureType,
					level: structure.level,
					modifierCount: modifiers.length,
				});

				// Step 3: Group modifiers by type and sum values
				for (const modifier of modifiers) {
					const existing = modifierMap.get(modifier.type);

					if (existing) {
						// Add to existing modifier
						existing.totalValue += modifier.value;
						existing.sourceCount += 1;
						existing.contributingStructures.push({
							structureId: structure.id,
							structureName: structure.name,
							level: structure.level,
							value: modifier.value,
						});
					} else {
						// Create new modifier entry
						modifierMap.set(modifier.type, {
							totalValue: modifier.value,
							sourceCount: 1,
							contributingStructures: [
								{
									structureId: structure.id,
									structureName: structure.name,
									level: structure.level,
									value: modifier.value,
								},
							],
						});
					}
				}
			}

			logger.debug('[SETTLEMENT_MODIFIER_AGGREGATOR] Aggregation complete', {
				modifierTypeCount: modifierMap.size,
			});

			// Step 4: Upsert results to database
			const results: SettlementModifier[] = [];

			for (const [modifierType, data] of modifierMap.entries()) {
				// Round total value to 2 decimal places
				const totalValue = Math.round(data.totalValue * 100) / 100;

				// Check if record exists
				const existing = await tx
					.select()
					.from(settlementModifiers)
					.where(
						and(
							eq(settlementModifiers.settlementId, settlementId),
							eq(settlementModifiers.modifierType, modifierType)
						)
					)
					.limit(1);

				if (existing.length > 0) {
					// Update existing record
					try {
						const [updated] = await tx
							.update(settlementModifiers)
							.set({
								totalValue: totalValue.toString(), // Convert to string for decimal type
								sourceCount: data.sourceCount,
								contributingStructures: data.contributingStructures,
								lastCalculatedAt: new Date(),
								updatedAt: new Date(),
							})
							.where(eq(settlementModifiers.id, existing[0].id))
							.returning();

						results.push(updated);

						logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Updated existing modifier', {
							id: existing[0].id,
							modifierType,
							totalValue,
							sourceCount: data.sourceCount,
						});
					} catch (updateError) {
						logger.error('[SETTLEMENT_MODIFIER_AGGREGATOR] Failed to update modifier', {
							settlementId,
							modifierType,
							error: updateError instanceof Error ? updateError.message : 'Unknown error',
							stack: updateError instanceof Error ? updateError.stack : undefined,
						});
						throw updateError;
					}
				} else {
					// Insert new record
					try {
						const newModifier: NewSettlementModifier = {
							settlementId,
							modifierType,
							totalValue: totalValue.toString(), // Convert to string for decimal type
							sourceCount: data.sourceCount,
							contributingStructures: data.contributingStructures,
						};

						logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] About to insert new modifier', {
							settlementId,
							modifierType,
							totalValue,
							sourceCount: data.sourceCount,
						});

						const [inserted] = await tx.insert(settlementModifiers).values(newModifier).returning();

						results.push(inserted);

						logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Inserted new modifier', {
							id: inserted.id,
							modifierType,
							totalValue,
							sourceCount: data.sourceCount,
						});
					} catch (insertError) {
						logger.error('[SETTLEMENT_MODIFIER_AGGREGATOR] Failed to insert modifier', {
							settlementId,
							modifierType,
							error: insertError instanceof Error ? insertError.message : 'Unknown error',
							stack: insertError instanceof Error ? insertError.stack : undefined,
						});
						throw insertError;
					}
				}
			}

			// Step 5: Delete any modifiers that no longer exist (all structures removed)
			const currentTypes = Array.from(modifierMap.keys());

			if (currentTypes.length === 0) {
				// No structures left - delete ALL modifiers for this settlement
				const deletedCount = await tx
					.delete(settlementModifiers)
					.where(eq(settlementModifiers.settlementId, settlementId));

				logger.info(
					'[SETTLEMENT_MODIFIER_AGGREGATOR] Deleted all modifiers (no structures remaining)',
					{
						settlementId,
						deletedCount,
					}
				);
			} else {
				// Structures exist - delete orphaned modifiers (types no longer present)
				// Get all existing modifier types for this settlement
				const existingModifiers = await tx
					.select({ modifierType: settlementModifiers.modifierType })
					.from(settlementModifiers)
					.where(eq(settlementModifiers.settlementId, settlementId));

				const existingTypes = existingModifiers.map((m) => m.modifierType);
				const orphanedTypes = existingTypes.filter((type) => !currentTypes.includes(type));

				if (orphanedTypes.length > 0) {
					// Delete orphaned modifiers one by one (until Drizzle supports notIn)
					for (const orphanedType of orphanedTypes) {
						await tx
							.delete(settlementModifiers)
							.where(
								and(
									eq(settlementModifiers.settlementId, settlementId),
									eq(settlementModifiers.modifierType, orphanedType)
								)
							);
					}

					logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Deleted orphaned modifiers', {
						settlementId,
						orphanedTypes,
						count: orphanedTypes.length,
					});
				}
			}

			logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Aggregation complete', {
				settlementId,
				modifierCount: results.length,
			});

			return results;
		}); // Close transaction
	} catch (error) {
		logger.error('[SETTLEMENT_MODIFIER_AGGREGATOR] Aggregation failed', {
			settlementId,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});
		throw error;
	}
}

/**
 * Get all aggregated modifiers for a settlement.
 *
 * Returns cached/pre-calculated modifier totals from the database.
 * Much faster than calculating on-the-fly.
 *
 * @param settlementId - Settlement to get modifiers for
 * @returns Array of aggregated modifiers
 *
 * @example
 * ```typescript
 * const modifiers = await getSettlementModifiers('settlement-123');
 * // [
 * //   { modifierType: 'FOOD_PRODUCTION', totalValue: 15.50, sourceCount: 3, ... },
 * //   { modifierType: 'WOOD_PRODUCTION', totalValue: 8.25, sourceCount: 2, ... },
 * // ]
 * ```
 */
export async function getSettlementModifiers(settlementId: string): Promise<SettlementModifier[]> {
	try {
		const modifiers = await db
			.select()
			.from(settlementModifiers)
			.where(eq(settlementModifiers.settlementId, settlementId));

		logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Retrieved modifiers', {
			settlementId,
			count: modifiers.length,
			modifiers: modifiers.map((m) => ({ type: m.modifierType, value: m.totalValue })),
		});

		return modifiers;
	} catch (error) {
		logger.error('[SETTLEMENT_MODIFIER_AGGREGATOR] Failed to get modifiers', {
			settlementId,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}

/**
 * Recalculate modifiers for all settlements.
 *
 * Admin/maintenance function. Use sparingly (expensive operation).
 *
 * @returns Number of settlements processed
 *
 * @example
 * ```typescript
 * // After updating modifier calculation logic, recalculate all:
 * const count = await recalculateAllSettlementModifiers();
 * console.log(`Recalculated ${count} settlements`);
 * ```
 */
export async function recalculateAllSettlementModifiers(): Promise<number> {
	try {
		logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Recalculating all settlements');

		// Get all settlement IDs
		const settlements = await db.query.settlements.findMany({
			columns: { id: true },
		});

		let processed = 0;
		for (const settlement of settlements) {
			await aggregateSettlementModifiers(settlement.id);
			processed++;
		}

		logger.info('[SETTLEMENT_MODIFIER_AGGREGATOR] Recalculation complete', {
			settlementsProcessed: processed,
		});

		return processed;
	} catch (error) {
		logger.error('[SETTLEMENT_MODIFIER_AGGREGATOR] Recalculation failed', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		throw error;
	}
}
