/**
 * Construction Queue Processor
 *
 * Manages construction queue for settlements
 * - Processes completions every tick (60Hz)
 * - Starts next queued constructions when slots available
 * - Handles emergency construction (2x speed, 2.5x cost)
 *
 * @module game/construction-queue-processor
 */

import { db } from '../db/index.js';
import { STRUCTURE_COSTS } from '../data/structure-costs.js';
import {
	constructionQueue,
	settlements,
	settlementStructures,
	structures,
	tiles,
	regions,
	type ConstructionQueue,
} from '../db/schema.js';
import { eq, and, lte } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import type { Server as SocketIOServer } from 'socket.io';
import { logger } from '../utils/logger.js';

/**
 * Process construction queues for all settlements in a world
 * Called every tick (60 times per second)
 *
 * @param worldId - World to process
 * @param currentTime - Current timestamp (ms)
 * @param io - Socket.IO server instance for broadcasting
 */
export async function processConstructionQueues(
	worldId: string,
	currentTime: number,
	io: SocketIOServer
): Promise<void> {
	// 1. Get all active constructions that have completed
	// Note: settlements.worldId doesn't exist in schema
	// Hierarchy: Settlement → Tile → Region → World
	const activeConstructions = await db
		.select({
			constructionId: constructionQueue.id,
			settlementId: constructionQueue.settlementId,
			structureType: constructionQueue.structureType,
			existingStructureId: constructionQueue.existingStructureId,
			targetLevel: constructionQueue.targetLevel,
			tileId: constructionQueue.tileId,
			slotPosition: constructionQueue.slotPosition,
			startedAt: constructionQueue.startedAt,
			completesAt: constructionQueue.completesAt,
			worldId: regions.worldId,
		})
		.from(constructionQueue)
		.innerJoin(settlements, eq(constructionQueue.settlementId, settlements.id))
		.innerJoin(tiles, eq(settlements.tileId, tiles.id))
		.innerJoin(regions, eq(tiles.regionId, regions.id))
		.where(
			and(
				eq(regions.worldId, worldId),
				eq(constructionQueue.status, 'IN_PROGRESS'),
				lte(constructionQueue.completesAt, new Date(currentTime)) // Time's up
			)
		);

	// 2. Complete finished constructions
	for (const item of activeConstructions) {
		await completeConstruction(item.settlementId, item, item.worldId, currentTime, io);
	}

	// 3. Start next queued constructions (if slots available)
	// Note: settlements.worldId doesn't exist, need to query through tiles → regions
	// Using explicit select to avoid destructuring issues with JOIN results
	const worldSettlements = await db
		.select({
			settlementId: settlements.id,
			worldId: regions.worldId,
		})
		.from(settlements)
		.innerJoin(tiles, eq(settlements.tileId, tiles.id))
		.innerJoin(regions, eq(tiles.regionId, regions.id))
		.where(eq(regions.worldId, worldId));

	for (const { settlementId, worldId: wId } of worldSettlements) {
		await startNextQueuedConstruction(settlementId, wId, currentTime, io);
	}
}

type CompletedConstruction = {
	constructionId: string;
	settlementId: string;
	structureType: string;
	existingStructureId: string | null;
	targetLevel: number | null;
	tileId: string | null;
	slotPosition: number | null;
	startedAt: Date | null;
	completesAt: Date | null;
	worldId: string;
};

/**
 * Complete a construction that has finished
 */
async function completeConstruction(
	settlementId: string,
	construction: CompletedConstruction,
	worldId: string,
	currentTime: number,
	io: SocketIOServer
): Promise<void> {
	try {
		// Check if this is an upgrade or new construction
		if (construction.existingStructureId && construction.targetLevel) {
			// UPGRADE: Update existing structure level
			await db
				.update(settlementStructures)
				.set({
					level: construction.targetLevel,
				})
				.where(eq(settlementStructures.id, construction.existingStructureId));

			// Mark construction as complete
			await db
				.update(constructionQueue)
				.set({
					status: 'COMPLETE',
					updatedAt: new Date(currentTime),
				})
				.where(eq(constructionQueue.id, construction.constructionId));

			// Emit upgrade complete event
			io.to(`world:${worldId}`).emit('structure:upgraded', {
				settlementId,
				structureId: construction.existingStructureId,
				level: construction.targetLevel,
				structureName: construction.structureType,
				timestamp: currentTime,
			});

			logger.debug(
				`[CONSTRUCTION] Completed upgrade of ${construction.structureType} to level ${construction.targetLevel}`
			);
		} else {
			// NEW CONSTRUCTION: Create new structure
			
			// 1. Look up the Structure record to get the actual structure ID
			const structureRecord = await db
				.select({ id: structures.id })
				.from(structures)
				.where(eq(structures.name, construction.structureType))
				.limit(1);

			if (!structureRecord.length) {
				logger.error(`[CONSTRUCTION] Structure not found: ${construction.structureType}`, {
					constructionId: construction.constructionId,
				});
				return;
			}

			// 2. Create the actual structure in database
			const newStructure = await db
				.insert(settlementStructures)
				.values({
					id: createId(),
					settlementId,
					structureId: structureRecord[0].id, // FK to structures table (actual ID)
					level: 1,
					health: 100, // Structures start at full health
					populationAssigned: 0, // Population assignment (future)
					// For extractors: include tileId and slotPosition from construction queue
					tileId: construction.tileId || null,
					slotPosition: construction.slotPosition !== null ? construction.slotPosition : null,
				})
				.returning();

			// 2. Mark construction as complete
			await db
				.update(constructionQueue)
				.set({
					status: 'COMPLETE',
					updatedAt: new Date(currentTime),
				})
				.where(eq(constructionQueue.id, construction.constructionId));

			// 3. Emit Socket.IO event
			// Note: worldId passed as parameter (settlements.worldId doesn't exist in schema)
			io.to(`world:${worldId}`).emit('construction-complete', {
				settlementId,
				structureId: newStructure[0].id,
				structureType: construction.structureType,
				constructionTime:
					construction.completesAt!.getTime() - construction.startedAt!.getTime(),
				timestamp: currentTime,
			});

			logger.debug(
				`[CONSTRUCTION] Completed ${construction.structureType} for settlement ${settlementId}`
			);
		}

		// 4. Start next queued construction if slots available
		await startNextQueuedConstruction(settlementId, worldId, currentTime, io);
	} catch (error) {
		logger.error(`[CONSTRUCTION] Error completing construction ${construction.constructionId}:`, error);
	}
}

/**
 * Start next queued construction if slots available
 */
async function startNextQueuedConstruction(
	settlementId: string,
	worldId: string,
	currentTime: number,
	io: SocketIOServer
): Promise<void> {
	try {
		// 1. Count active constructions
		const activeCount = await db
			.select()
			.from(constructionQueue)
			.where(
				and(
					eq(constructionQueue.settlementId, settlementId),
					eq(constructionQueue.status, 'IN_PROGRESS')
				)
			);

		// 2. If slot available (max 1 active construction - true queue)
		if (activeCount.length < 1) {
			// 3. Get next queued construction (lowest position)
			const nextQueued = await db
				.select({
					construction: constructionQueue,
					structure: structures
				})
				.from(constructionQueue)
				.leftJoin(structures, eq(constructionQueue.structureType, structures.name))
				.where(
					and(
						eq(constructionQueue.settlementId, settlementId),
						eq(constructionQueue.status, 'QUEUED')
					)
				)
				.orderBy(constructionQueue.position)
				.limit(1);

			if (nextQueued.length > 0) {
				const { construction, structure } = nextQueued[0];

				// 4. Calculate completion time
				const baseTime = getConstructionTime(construction.structureType);
				const completionTime = construction.isEmergency
					? currentTime + baseTime / 2 // 2x faster
					: currentTime + baseTime;

				// 5. Start construction
				await db
					.update(constructionQueue)
					.set({
						status: 'IN_PROGRESS',
						startedAt: new Date(currentTime),
						completesAt: new Date(completionTime),
						updatedAt: new Date(currentTime),
					})
					.where(eq(constructionQueue.id, construction.id));

				// 6. Emit Socket.IO event
				// Note: worldId passed as parameter (settlements.worldId doesn't exist in schema)
				io.to(`world:${worldId}`).emit('construction-started', {
					settlementId,
					constructionId: construction.id,
					structureType: construction.structureType,
					buildingType: structure?.buildingType,
					extractorType: structure?.extractorType,
					completesAt: completionTime,
					isEmergency: construction.isEmergency === 1,
					timestamp: currentTime,
				});

				logger.debug(
					`[CONSTRUCTION] Started ${construction.structureType} for settlement ${settlementId}`
				);
			}
		}
	} catch (error) {
		logger.error(
			`[CONSTRUCTION] Error starting next construction for settlement ${settlementId}:`,
			error
		);
	}
}

/**
 * Get construction time for structure type (in milliseconds)
 *
 * Single source of truth: server/src/data/structure-costs.ts
 */
export function getConstructionTime(structureType: string): number {
	const structureDef = STRUCTURE_COSTS.find((s) => s.id === structureType || s.name === structureType);
	
	if (structureDef) {
		// Convert seconds to milliseconds
		return structureDef.constructionTimeSeconds * 1000;
	}

	// Default: 10 minutes for unknown structures
	return 600000;
}

/**
 * Get structure category from type
 */
export function getStructureCategory(structureType: string): string {
	const extractors = [
		'FARM',
		'LUMBER_MILL',
		'QUARRY',
		'MINE',
		'WELL',
		'FISHING_DOCK',
		'HUNTING_LODGE',
		'HERB_GARDEN',
	];

	return extractors.includes(structureType) ? 'EXTRACTOR' : 'BUILDING';
}

/**
 * Broadcast construction progress for active constructions
 * Called every second to update clients with real-time progress
 * Now uses batched emissions (1 event per world instead of N events per construction)
 *
 * @param worldId - World to process
 * @param currentTime - Current timestamp (ms)
 * @param io - Socket.IO server instance for broadcasting
 */
export async function broadcastConstructionProgress(
	worldId: string,
	currentTime: number,
	io: SocketIOServer
): Promise<void> {
	try {
		// Get all active constructions for this world
		const activeConstructions = await db
			.select({
				construction: constructionQueue,
				settlement: settlements,
			})
			.from(constructionQueue)
			.innerJoin(settlements, eq(constructionQueue.settlementId, settlements.id))
			.innerJoin(tiles, eq(settlements.tileId, tiles.id))
			.innerJoin(regions, eq(tiles.regionId, regions.id))
			.where(
				and(
					eq(regions.worldId, worldId),
					eq(constructionQueue.status, 'IN_PROGRESS')
				)
			);

		// Build progress data for all constructions (batch calculation)
		const progressData = activeConstructions.map(({ construction, settlement }) => {
			const startTime = construction.startedAt?.getTime() || currentTime;
			const endTime = construction.completesAt?.getTime() || currentTime;
			const elapsed = currentTime - startTime;
			const total = endTime - startTime;
			
			// Calculate progress percentage (0-100)
			const progress = total > 0 
				? Math.min(100, Math.max(0, Math.floor((elapsed / total) * 100)))
				: 0;
			
			// Calculate time remaining in seconds
			const timeRemaining = Math.max(0, Math.ceil((endTime - currentTime) / 1000));

			return {
				settlementId: settlement.id,
				projectId: construction.id,
				progress,
				timeRemaining,
			};
		});

		// Emit ONE batched event with all progress data
		// This reduces socket overhead from N emits to 1 emit per world per second
		if (progressData.length > 0) {
			io.to(`world:${worldId}`).emit('construction-progress-batch', {
				worldId,
				timestamp: currentTime,
				constructions: progressData,
			});
		}
	} catch (error) {
		logger.error(
			`[CONSTRUCTION] Error broadcasting progress for world ${worldId}:`,
			error
		);
	}
}
