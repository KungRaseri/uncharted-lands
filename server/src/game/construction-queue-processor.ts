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
import {
	constructionQueue,
	settlements,
	settlementStructures,
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
		.select()
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
	for (const {
		constructionQueue: construction,
		settlements: settlement,
		regions: region,
	} of activeConstructions) {
		await completeConstruction(settlement, construction, region.worldId, currentTime, io);
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

/**
 * Complete a construction that has finished
 */
async function completeConstruction(
	settlement: typeof settlements.$inferSelect,
	construction: ConstructionQueue,
	worldId: string,
	currentTime: number,
	io: SocketIOServer
): Promise<void> {
	try {
		// 1. Create the actual structure in database
		const newStructure = await db
			.insert(settlementStructures)
			.values({
				id: createId(),
				settlementId: settlement.id,
				structureId: construction.structureType, // FK to structures table
				level: 1,
				health: 100, // Structures start at full health
				populationAssigned: 0, // Population assignment (future)
			})
			.returning();

		// 2. Mark construction as complete
		await db
			.update(constructionQueue)
			.set({
				status: 'COMPLETE',
				updatedAt: new Date(currentTime),
			})
			.where(eq(constructionQueue.id, construction.id));

		// 3. Emit Socket.IO event
		// Note: worldId passed as parameter (settlements.worldId doesn't exist in schema)
		io.to(`world:${worldId}`).emit('construction-complete', {
			settlementId: settlement.id,
			structureId: newStructure[0].id,
			structureType: construction.structureType,
			constructionTime: construction.completesAt!.getTime() - construction.startedAt!.getTime(),
			timestamp: currentTime,
		});

		logger.debug(
			`[CONSTRUCTION] Completed ${construction.structureType} for settlement ${settlement.id}`
		);

		// 4. Start next queued construction if slots available
		await startNextQueuedConstruction(settlement.id, worldId, currentTime, io);
	} catch (error) {
		logger.error(`[CONSTRUCTION] Error completing construction ${construction.id}:`, error);
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

		// 2. If slots available (max 3 simultaneous)
		if (activeCount.length < 3) {
			// 3. Get next queued construction (lowest position)
			const nextQueued = await db
				.select()
				.from(constructionQueue)
				.where(
					and(
						eq(constructionQueue.settlementId, settlementId),
						eq(constructionQueue.status, 'QUEUED')
					)
				)
				.orderBy(constructionQueue.position)
				.limit(1);

			if (nextQueued.length > 0) {
				const construction = nextQueued[0];

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
 * Based on GDD Section 6.3 - Construction Time Balance
 */
export function getConstructionTime(structureType: string): number {
	const times: Record<string, number> = {
		// Tier 1: Basic (0-5 minutes)
		TENT: 0, // Instant
		FARM: 180000, // 3 minutes
		LUMBER_MILL: 180000, // 3 minutes
		QUARRY: 180000, // 3 minutes
		MINE: 240000, // 4 minutes
		STORAGE: 300000, // 5 minutes
		WELL: 180000, // 3 minutes

		// Tier 2: Intermediate (5-30 minutes)
		HOUSE: 600000, // 10 minutes
		WORKSHOP: 900000, // 15 minutes
		MARKETPLACE: 1800000, // 30 minutes
		NPC_EMBASSY: 1200000, // 20 minutes
		TRADE_CARAVAN_STATION: 1200000, // 20 minutes

		// Tier 3: Advanced (1-4 hours)
		TOWN_HALL: 3600000, // 1 hour
		RESEARCH_LAB: 5400000, // 1.5 hours
		HOSPITAL: 7200000, // 2 hours
		LIBRARY: 3600000, // 1 hour
		RELIEF_CENTER: 4800000, // 1.3 hours
		DISASTER_COMMAND_CENTER: 14400000, // 4 hours

		// Tier 4: Disaster Defense (2-8 hours)
		EMERGENCY_SHELTER: 7200000, // 2 hours
		WATCHTOWER: 10800000, // 3 hours
		SEISMOLOGY_STATION: 21600000, // 6 hours
		METEOROLOGY_CENTER: 21600000, // 6 hours
		NPC_GUEST_QUARTERS: 7200000, // 2 hours

		// Tier 5: Guild & Specialization (12 hours - 30 days)
		GUILD_HEADQUARTERS: 86400000, // 24 hours
		GUILD_OUTPOST: 7200000, // 2 hours
		GUILD_WORKSHOP: 43200000, // 12 hours
		GUILD_MONUMENT: 2592000000, // 30 days
		ALLIANCE_PAVILION: 28800000, // 8 hours
		ADVANCED_GREENHOUSE: 43200000, // 12 hours
		DEEP_MINING_COMPLEX: 57600000, // 16 hours
		FORTRESS: 86400000, // 24 hours
		GRAND_MARKET: 43200000, // 12 hours
		ADVANCED_ACADEMY: 57600000, // 16 hours
	};

	// Default: 10 minutes for unknown structures
	return times[structureType] || 600000;
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
