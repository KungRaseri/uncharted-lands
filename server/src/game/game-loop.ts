/**
 * Game Loop System
 *
 * Manages the 60Hz tick system for automatic resource generation
 * and other time-based game mechanics
 *
 * DISASTER SYSTEM INTEGRATION (November 2025 - Phase 4):
 * - Hourly disaster checks at tick % (TICK_RATE * 3600)   // ===== DEBUG LOGGING FOR PRODUCTION TICKS =====
  // Log timing state every second (every 60 ticks) to help diagnose issues
  if (currentTick % 60 === 0) {
    logger.debug('[GAME LOOP] ⏰ Timing Check', {
      tick: currentTick,
      secondsSinceEpoch,
      isResourceProductionTime,
      isPopulationUpdateTime,
      shouldEmitProjection,
      resourceIntervalSec: RESOURCE_INTERVAL_SEC,
      populationIntervalSec: POPULATION_INTERVAL_SEC,
      ticksSinceLastResource,
      ticksSinceLastPopulation,
      nextResourceTick: RESOURCE_TICKS_INTERVAL - ticksSinceLastResource,
      nextPopulationTick: POPULATION_TICKS_INTERVAL - ticksSinceLastPopulation,
    });
  }ster event processing at 10Hz (every 6 ticks)
 */

import type { Server as SocketIOServer } from 'socket.io';
import type { Timeout } from 'node:timers';
import { eq, or, and, inArray } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import {
	updateSettlementStorage,
	getSettlementWithDetails,
	getSettlementStructures,
	getSettlementPopulation,
	updateSettlementPopulation,
} from '../db/queries.js';
import { calculateProduction, addResources, subtractResources } from './resource-calculator.js';
import {
	calculatePopulation,
	calculateConsumption,
	hasResourcesForPopulation,
	type Structure,
} from './consumption-calculator.js';
import { calculateAllDisasterModifiers } from './disaster-damage-calculator.js';
import { getWorldTemplateConfig, type WorldTemplateType } from '../types/world-templates.js';
import {
	calculatePopulationState,
	applyPopulationGrowth,
	calculateImmigrationAmount,
	calculateEmigrationAmount,
	getPopulationSummary,
} from './population-calculator.js';
import {
	calculateStorageCapacity,
	clampToCapacity,
	calculateWaste,
	isNearCapacity,
} from './storage-calculator.js';
import {
	autoAssignPopulation,
	calculateAllStaffingBonuses,
	type StructureWithType,
} from './population-assignment.js';
import { processHourlyDisasterChecks } from './disaster-scheduler.js';
import { processDisasters } from './disaster-processor.js';
import { processPassiveRepairs } from './passive-repair.js';
import { processConstructionQueues } from './construction-queue-processor.js';
import { settlementStructures, disasterEvents } from '../db/schema.js';
import { db } from '../db/index.js';

// Game loop configuration
const TICK_RATE = Number.parseInt(process.env.TICK_RATE || '60', 10); // Default: 60 ticks per second
const TICK_INTERVAL_MS = 1000 / TICK_RATE; // ~16.67ms per tick (at 60 ticks/sec)

// Configurable game loop intervals (in seconds)
const RESOURCE_INTERVAL_SEC = Number.parseInt(process.env.RESOURCE_INTERVAL_SEC || '3600', 10); // Default: 1 hour (production)
const SOCKET_EMIT_INTERVAL_SEC = Number.parseInt(process.env.SOCKET_EMIT_INTERVAL_SEC || '1', 10); // Default: 1 second (real-time projection)
const POPULATION_INTERVAL_SEC = Number.parseInt(process.env.POPULATION_INTERVAL_SEC || '1800', 10); // Default: 30 minutes (half-hour offset)

// Track active game loop
let gameLoopInterval: Timeout | null = null;
let currentTick = 0;
let isRunning = false;
let lastStatusLog = 0;
const STATUS_LOG_INTERVAL = TICK_RATE * 300; // Log status every 5 minutes (300 seconds)

// Track last production/population ticks to prevent multiple triggers per interval
let lastResourceProductionTick = 0;
let lastPopulationUpdateTick = 0;

// NOTE: activeSettlements Map REMOVED in December 2025 refactor
// Game loop now processes ALL settlements in READY worlds (world-based processing)
// This ensures offline resource accumulation per GDD requirements

/**
 * Round resource values for display (no fractional resources in UI)
 *
 * @param resources - Resources object with potentially fractional values
 * @returns Resources object with rounded values
 */
function roundResources(resources: {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}): { food: number; water: number; wood: number; stone: number; ore: number } {
	return {
		food: Math.round(resources.food),
		water: Math.round(resources.water),
		wood: Math.round(resources.wood),
		stone: Math.round(resources.stone),
		ore: Math.round(resources.ore),
	};
}

/**
 * Start the game loop
 */
export function startGameLoop(io: SocketIOServer): void {
	if (isRunning) {
		logger.warn('[GAME LOOP] ⚠️  Attempted to start game loop that is already running');
		return;
	}

	logger.info('[GAME LOOP] 🎮 Starting game loop...', {
		tickRate: `${TICK_RATE} ticks/second`,
		tickInterval: `${TICK_INTERVAL_MS.toFixed(2)}ms`,
	});

	isRunning = true;
	currentTick = 0;

	gameLoopInterval = setInterval(async () => {
		try {
			await processTick(io);
		} catch (error) {
			logger.error('[GAME LOOP] ✗ Error processing tick', error, { tick: currentTick });
		}
	}, TICK_INTERVAL_MS);

	logger.info('[GAME LOOP] ✓ Game loop started successfully');
}

/**
 * Stop the game loop
 */
export function stopGameLoop(): void {
	if (!isRunning) {
		logger.warn('[GAME LOOP] ⚠️  Attempted to stop game loop that is not running');
		return;
	}

	logger.info('[GAME LOOP] 🛑 Stopping game loop...', {
		finalTick: currentTick,
	});

	if (gameLoopInterval) {
		clearInterval(gameLoopInterval);
		gameLoopInterval = null;
	}

	isRunning = false;
	currentTick = 0;

	logger.info('[GAME LOOP] ✓ Game loop stopped successfully');
}

/**
 * Process a single tick
 */
async function processTick(io: SocketIOServer): Promise<void> {
	currentTick++;

	// Log status periodically
	if (currentTick - lastStatusLog >= STATUS_LOG_INTERVAL) {
		logger.info('[GAME LOOP] 📊 Status update', {
			tick: currentTick,
			uptime: `${Math.floor(currentTick / TICK_RATE / 60)}m ${Math.floor((currentTick / TICK_RATE) % 60)}s`,
			connections: io.engine.clientsCount,
		});
		lastStatusLog = currentTick;
	}

	// ===== DISASTER SYSTEM PROCESSING (Phase 4 - November 2025) =====

	// Process disaster events at 10Hz (every 6 ticks)
	// GDD Reference: Section 5.6.4 (Disaster Event Processing)
	if (currentTick % 6 === 0) {
		const currentTime = Date.now();
		await processDisasters(io, currentTime);
	}

	// ===== CONSTRUCTION QUEUE PROCESSING (Phase 3 - November 2025) =====

	// Process construction queues every second (every 60 ticks)
	// GDD Reference: Section 5.6.3 (Construction Queue Processing)
	// NOTE: Changed from every tick to every second to prevent memory leak
	// - Constructions complete at second-level precision (acceptable for UX)
	// - Reduces database queries from 900/sec to 15/sec (60x improvement)
	// - Prevents heap overflow with multiple active worlds
	if (currentTick % 60 === 0) {
		const currentTime = Date.now();

		// Get all active worlds to process their construction queues
		const { worlds: worldsTable } = await import('../db/schema.js');
		const activeWorlds = await db.query.worlds.findMany({
			where: eq(worldsTable.status, 'READY'),
		});

		// Process each world's construction queue
		for (const world of activeWorlds) {
			try {
				await processConstructionQueues(world.id, currentTime, io);
			} catch (error) {
				logger.error('[CONSTRUCTION QUEUE] Error processing construction queues', {
					worldId: world.id,
					error: error instanceof Error ? error.message : 'Unknown error',
					stack: error instanceof Error ? error.stack : undefined,
				});
			}
		}
	}

	// Check for new disasters hourly (every 3600 seconds)
	// GDD Reference: Section 3.5.4 (Disaster System)
	const HOURLY_TICKS = TICK_RATE * 3600; // 60 ticks/sec × 3600 sec = 216,000 ticks
	if (currentTick % HOURLY_TICKS === 0) {
		const currentTime = Date.now();
		await processHourlyDisasterChecks(currentTime);

		// Process passive repairs (1% health per hour for structures 21-99% health with Workshop)
		// GDD Reference: Section 3.4.6 (Passive Repair System)
		try {
			// Get all active worlds (same pattern as disaster checks)
			const { worlds: worldsTable } = await import('../db/schema.js');
			const activeWorlds = await db.query.worlds.findMany({
				where: eq(worldsTable.status, 'READY'),
			});

			logger.info(
				`[PASSIVE REPAIR] Processing hourly passive repairs for ${activeWorlds.length} worlds`
			);

			// Process each world independently
			for (const world of activeWorlds) {
				const repairResult = await processPassiveRepairs(world.id);
				if (repairResult.totalStructuresRepaired > 0) {
					logger.info('[PASSIVE REPAIR] Repairs completed', {
						worldId: world.id,
						worldName: world.name,
						settlementsProcessed: repairResult.settlementsProcessed,
						settlementsWithWorkshop: repairResult.settlementsWithWorkshop,
						structuresRepaired: repairResult.totalStructuresRepaired,
					});
				}
			}
		} catch (error) {
			logger.error('[PASSIVE REPAIR] Error processing hourly passive repairs', {
				error: error instanceof Error ? error.message : 'Unknown error',
				stack: error instanceof Error ? error.stack : undefined,
			});
		}
	}

	// ===== RESOURCE PRODUCTION & POPULATION UPDATES (Refactored December 2025) =====

	// Calculate current time for alignment checks
	const currentTime = Date.now();
	const secondsSinceEpoch = Math.floor(currentTime / 1000);

	// FIX: Use tick-based intervals instead of time-based modulo to prevent multiple triggers
	// Problem: All 60 ticks within a second share the same secondsSinceEpoch value
	// If that second % interval === 0, all 60 ticks trigger (600x multiplier bug!)
	// Solution: Track last tick we fired and ensure RESOURCE_INTERVAL_SEC has passed
	const ticksSinceLastResource = currentTick - lastResourceProductionTick;
	const ticksSinceLastPopulation = currentTick - lastPopulationUpdateTick;

	const RESOURCE_TICKS_INTERVAL = TICK_RATE * RESOURCE_INTERVAL_SEC; // e.g., 60 * 10 = 600 ticks
	const POPULATION_TICKS_INTERVAL = TICK_RATE * POPULATION_INTERVAL_SEC; // e.g., 60 * 10 = 600 ticks

	const isResourceProductionTime = ticksSinceLastResource >= RESOURCE_TICKS_INTERVAL;
	const isPopulationUpdateTime = ticksSinceLastPopulation >= POPULATION_TICKS_INTERVAL;

	// Emit real-time projections every SOCKET_EMIT_INTERVAL_SEC (default: 1 second)
	const shouldEmitProjection = currentTick % (TICK_RATE * SOCKET_EMIT_INTERVAL_SEC) === 0;

	// ===== DEBUG LOGGING FOR PRODUCTION TICKS =====
	// Log timing checks every 60 ticks (every second)
	if (currentTick % 60 === 0) {
		logger.debug('[GAME LOOP] ⏰ Timing Check', {
			tick: currentTick,
			secondsSinceEpoch,
			isResourceProductionTime,
			isPopulationUpdateTime,
			shouldEmitProjection,
			resourceIntervalSec: RESOURCE_INTERVAL_SEC,
			populationIntervalSec: POPULATION_INTERVAL_SEC,
			nextResourceTick: RESOURCE_INTERVAL_SEC - (secondsSinceEpoch % RESOURCE_INTERVAL_SEC),
			nextPopulationTick:
				POPULATION_INTERVAL_SEC - (secondsSinceEpoch % POPULATION_INTERVAL_SEC),
		});
	}

	// ===== LOG CRITICAL EVENTS =====
	if (isResourceProductionTime) {
		logger.info('[GAME LOOP] 🎯 RESOURCE PRODUCTION TICK TRIGGERED', {
			tick: currentTick,
			timestamp: new Date(currentTime).toISOString(),
			ticksSinceLastResource,
			intervalSec: RESOURCE_INTERVAL_SEC,
			intervalTicks: RESOURCE_TICKS_INTERVAL,
		});
		// Update tracking variable to prevent re-trigger until next interval
		lastResourceProductionTick = currentTick;
	}

	if (isPopulationUpdateTime) {
		logger.info('[GAME LOOP] 👥 POPULATION UPDATE TICK TRIGGERED', {
			tick: currentTick,
			timestamp: new Date(currentTime).toISOString(),
			ticksSinceLastPopulation,
			intervalSec: POPULATION_INTERVAL_SEC,
			intervalTicks: POPULATION_TICKS_INTERVAL,
		});
		// Update tracking variable to prevent re-trigger until next interval
		lastPopulationUpdateTick = currentTick;
	}

	if (shouldEmitProjection && currentTick % (TICK_RATE * 10) === 0) {
		// Log every 10 seconds to avoid spam
		logger.debug('[GAME LOOP] 📡 Socket emission interval (projection)', {
			tick: currentTick,
			emitIntervalSec: SOCKET_EMIT_INTERVAL_SEC,
		});
	}

	// Process world-based updates if it's time
	if (isResourceProductionTime || isPopulationUpdateTime || shouldEmitProjection) {
		logger.debug('[GAME LOOP] 🔄 Processing world-based updates', {
			tick: currentTick,
			isResourceProductionTime,
			isPopulationUpdateTime,
			shouldEmitProjection,
		});

		await processWorldBasedUpdates(io, {
			isResourceProductionTime,
			isPopulationUpdateTime,
			shouldEmitProjection,
			currentTime,
			secondsSinceEpoch,
		});
	}
}

/**
 * Process resource/population updates for ALL settlements in READY worlds
 * This replaces the old activeSettlements Map approach with world-based processing
 *
 * Key differences from old system:
 * - Processes ALL settlements regardless of player connection (offline accumulation)
 * - Queries settlements by world instead of tracking in memory
 * - Aligns production to clock hours (configurable intervals)
 * - Emits real-time projections between actual production
 */
async function processWorldBasedUpdates(
	io: SocketIOServer,
	timing: {
		isResourceProductionTime: boolean;
		isPopulationUpdateTime: boolean;
		shouldEmitProjection: boolean;
		currentTime: number;
		secondsSinceEpoch: number;
	}
): Promise<void> {
	try {
		// Get all READY worlds
		const { worlds: worldsTable } = await import('../db/schema.js');
		const activeWorlds = await db.query.worlds.findMany({
			where: eq(worldsTable.status, 'ready'),
		});

		logger.debug('[GAME LOOP] 🌍 Active worlds check', {
			worldCount: activeWorlds.length,
			isResourceTime: timing.isResourceProductionTime,
			isPopulationTime: timing.isPopulationUpdateTime,
			shouldEmitProjection: timing.shouldEmitProjection,
		});

		if (activeWorlds.length === 0) {
			return; // No active worlds to process
		}

		// Process each world's settlements
		for (const world of activeWorlds) {
			try {
				// Get all settlements in this world by joining through tiles and regions
				// Path: Settlements -> Tiles -> Regions -> Worlds
				// (settlements.tileId -> tiles.id, tiles.regionId -> regions.id, regions.worldId -> worlds.id)
				const {
					settlements: settlementsTable,
					tiles: tilesTable,
					regions: regionsTable,
				} = await import('../db/schema.js');

				// First, get all regions in this world
				const worldRegions = await db.query.regions.findMany({
					where: eq(regionsTable.worldId, world.id),
					columns: {
						id: true,
					},
				});

				if (worldRegions.length === 0) {
					logger.debug('[GAME LOOP] 🏘️  No regions found for world', {
						worldId: world.id,
						worldName: world.name,
					});
					continue;
				}

				const regionIds = worldRegions.map((r) => r.id);

				// Find all tiles in those regions
				const worldTiles = await db.query.tiles.findMany({
					where: inArray(tilesTable.regionId, regionIds),
					columns: {
						id: true,
					},
				});

				if (worldTiles.length === 0) {
					logger.debug('[GAME LOOP] 🏘️  No tiles found for world regions', {
						worldId: world.id,
						worldName: world.name,
						regionCount: regionIds.length,
					});
					continue;
				}

				const tileIds = worldTiles.map((t) => t.id);

				// Find all settlements on those tiles
				const settlements = await db.query.settlements.findMany({
					where: inArray(settlementsTable.tileId, tileIds),
				});

				logger.debug('[GAME LOOP] 🏘️  Processing world settlements', {
					worldId: world.id,
					worldName: world.name,
					settlementCount: settlements.length,
				});

				if (settlements.length === 0) {
					continue; // No settlements in this world
				}

				// Process settlements in batches to avoid overwhelming database
				const batchSize = 10;
				for (let i = 0; i < settlements.length; i += batchSize) {
					const batch = settlements.slice(i, i + batchSize);
					await Promise.all(
						batch.map((settlement) =>
							processSettlementWorldBased(settlement.id, world.id, io, timing)
						)
					);
				}
			} catch (error) {
				logger.error('[GAME LOOP] Error processing world settlements', {
					worldId: world.id,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}
	} catch (error) {
		logger.error('[GAME LOOP] Error in world-based processing', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

/**
 * Process a settlement in the world-based system (Refactored December 2025)
 *
 * This function replaces the old processSettlement and adapts it for timing-based processing:
 * - Queries settlement data directly (no activeSettlements Map)
 * - Emits real-time projections OR actual updates based on timing flags
 * - Writes to database only on actual production/population ticks
 * - Checks room occupancy before Socket.IO emission
 *
 * @param settlementId - Settlement to process
 * @param worldId - World the settlement belongs to
 * @param io - Socket.IO server instance
 * @param timing - Timing flags for this tick
 */
async function processSettlementWorldBased(
	settlementId: string,
	worldId: string,
	io: SocketIOServer,
	timing: {
		isResourceProductionTime: boolean;
		isPopulationUpdateTime: boolean;
		shouldEmitProjection: boolean;
		currentTime: number;
		secondsSinceEpoch: number;
	}
): Promise<void> {
	try {
		// Check if anyone is in the world room before processing
		const roomSize = io.sockets.adapter.rooms.get(`world:${worldId}`)?.size || 0;

		// If no clients in room and not a production tick, skip emission
		// (Still process production ticks to update database even if no one is watching)
		if (roomSize === 0 && !timing.isResourceProductionTime && !timing.isPopulationUpdateTime) {
			return; // Skip projection emission for empty rooms
		}

		// Fetch settlement details
		const settlementData = await getSettlementWithDetails(settlementId);

		if (!settlementData?.settlement || !settlementData.storage || !settlementData.tile) {
			logger.warn('[GAME LOOP] Settlement data incomplete, skipping', {
				settlementId,
			});
			return;
		}

		const { storage, tile, biome, world } = settlementData;
		const worldTemplateType = world?.worldTemplateType || 'STANDARD';

		// Get template config and extract multipliers
		const templateConfig = getWorldTemplateConfig(worldTemplateType as WorldTemplateType);
		const consumptionMultiplier = templateConfig.consumptionMultiplier;
		const productionMultiplier = templateConfig.productionMultiplier;

		// Fetch settlement structures
		const structureData = await getSettlementStructures(settlementId);

		// Transform structure data into format expected by calculators
		// NOTE: Query uses LEFT JOINs on structures, structureRequirements, and structureModifiers
		// This can create duplicate rows when a structure has multiple requirements (e.g., TENT has 3 requirements)
		// We need to deduplicate both structures AND modifiers to avoid counting the same modifier multiple times

		logger.debug('[TRANSFORM DEBUG] Input rows:', {
			rowCount: structureData.length,
			rows: structureData.map((row, i) => ({
				index: i,
				structureId: row.structure.id,
				structureName: row.structureDef?.name,
				hasModifier: !!row.modifiers,
				modifierId: row.modifiers?.id,
				modifierName: row.modifiers?.name,
				modifierValue: row.modifiers?.value,
			})),
		});

		const structures: Structure[] = structureData.reduce((acc, row) => {
			if (!row.structureDef) return acc;

			// Find or create structure entry
			let structure = acc.find((s) => s.name === row.structureDef?.name);
			if (!structure) {
				structure = {
					name: row.structureDef.name,
					modifiers: [],
				};
				acc.push(structure);
				logger.debug(`[TRANSFORM DEBUG] Created new structure: ${row.structureDef.name}`);
			}

			// Add modifier if it exists and hasn't been added yet
			if (row.modifiers) {
				const modifierExists = structure.modifiers.some(
					(m) => m.name === row.modifiers!.name && m.value === row.modifiers!.value
				);
				if (!modifierExists) {
					structure.modifiers.push({
						name: row.modifiers.name,
						value: row.modifiers.value,
					});
					logger.debug(`[TRANSFORM DEBUG] Added modifier to ${structure.name}:`, {
						name: row.modifiers.name,
						value: row.modifiers.value,
					});
				} else {
					logger.debug(
						`[TRANSFORM DEBUG] Skipped duplicate modifier for ${structure.name}:`,
						{
							name: row.modifiers.name,
						}
					);
				}
			} else {
				logger.debug(`[TRANSFORM DEBUG] Row ${structureData.indexOf(row)} has no modifier`);
			}

			return acc;
		}, [] as Structure[]);

		logger.debug('[TRANSFORM DEBUG] Final structures:', {
			structures: structures.map((s) => ({
				name: s.name,
				modifierCount: s.modifiers.length,
				modifiers: s.modifiers,
			})),
		});

		// DEBUG: Log structures with modifiers for capacity calculation
		logger.debug('[GAME LOOP] 🏗️ Structures for capacity calculation', {
			settlementId,
			structureCount: structures.length,
			structures: structures.map((s) => ({
				name: s.name,
				modifiers: s.modifiers,
			})),
		});

		// Filter extractors on this specific tile
		const extractors = structureData
			.filter(
				(row) =>
					row.structure.tileId === tile.id && row.structureDef?.category === 'EXTRACTOR'
			)
			.map((row) => ({
				...row.structure,
				category: row.structureDef?.category,
				extractorType: row.structureDef?.extractorType,
				buildingType: row.structureDef?.buildingType,
			}));

		// ==================================================================
		// RESOURCE PRODUCTION (On production tick OR projection)
		// ==================================================================

		// Get settlement population
		const populationData = await getSettlementPopulation(settlementId);
		const totalPopulation = populationData?.currentPopulation || 0;

		// Map all settlement structures to StructureWithType format for assignment
		const allStructuresForAssignment: StructureWithType[] = structureData.map((row) => ({
			...row.structure,
			category: (row.structureDef?.category as 'EXTRACTOR' | 'BUILDING') || 'BUILDING',
			buildingType: row.structureDef?.buildingType || undefined,
			extractorType: row.structureDef?.extractorType || undefined,
		}));

		// Run auto-assignment algorithm (only on production ticks, not projections)
		if (timing.isResourceProductionTime) {
			const assignmentResult = autoAssignPopulation(
				totalPopulation,
				allStructuresForAssignment
			);

			// Update database with new assignments
			for (const [structureId, assigned] of assignmentResult.assignments) {
				await db
					.update(settlementStructures)
					.set({ populationAssigned: assigned })
					.where(eq(settlementStructures.id, structureId));
			}

			// Log assignment statistics
			if (
				assignmentResult.totalAssigned > 0 ||
				assignmentResult.understaffedStructures.length > 0
			) {
				logger.debug('[GAME LOOP] Population assignment', {
					settlementId,
					totalPopulation,
					assigned: assignmentResult.totalAssigned,
					remaining: assignmentResult.remainingPopulation,
				});
			}
		}

		// Calculate staffing bonuses for production
		const staffingBonuses = calculateAllStaffingBonuses(allStructuresForAssignment);

		// Calculate production for this interval
		// For projections: calculate fractional production (time since last hour)
		// For production ticks: calculate full hour's production
		const secondsSinceLastProduction = timing.isResourceProductionTime
			? RESOURCE_INTERVAL_SEC // Full interval
			: timing.secondsSinceEpoch % RESOURCE_INTERVAL_SEC; // Partial interval

		// FIX: Convert seconds to ticks at TICK_RATE (60 Hz)
		// At 60 ticks/second, 10 seconds = 600 ticks, not 10!
		const ticksForThisInterval = secondsSinceLastProduction * TICK_RATE;

		// Calculate base production
		const baseProduction = calculateProduction(
			tile,
			extractors,
			ticksForThisInterval,
			biome?.name,
			productionMultiplier
		);

		// Query active disasters affecting this world
		const activeDisasters = await db.query.disasterEvents.findMany({
			where: and(
				eq(disasterEvents.worldId, world?.id || ''),
				or(eq(disasterEvents.status, 'IMPACT'), eq(disasterEvents.status, 'AFTERMATH'))
			),
		});

		// Calculate disaster production modifiers
		const disasterModifiers = calculateAllDisasterModifiers(
			activeDisasters.map((d) => ({
				type: d.type,
				status: d.status,
				impactEndedAt: d.impactEndedAt ?? undefined,
			})),
			{ settlementId, playerId: world?.id || '', worldId, lastUpdateTick: 0 },
			timing.currentTime
		);

		// Apply disaster penalties to base production
		let production = {
			food: baseProduction.food * disasterModifiers.resourceModifiers.food,
			water: baseProduction.water * disasterModifiers.resourceModifiers.water,
			wood: baseProduction.wood * disasterModifiers.resourceModifiers.wood,
			stone: baseProduction.stone * disasterModifiers.resourceModifiers.stone,
			ore: baseProduction.ore * disasterModifiers.resourceModifiers.ore,
		};

		// Apply staffing bonuses
		for (const extractor of extractors) {
			const bonus = staffingBonuses.get(extractor.id) || 1;
			const extractorType = extractor.extractorType;

			if (extractorType === 'FARM') production.food *= bonus;
			else if (extractorType === 'WELL') production.water *= bonus;
			else if (extractorType === 'LUMBER_MILL') production.wood *= bonus;
			else if (extractorType === 'QUARRY') production.stone *= bonus;
			else if (extractorType === 'MINE') production.ore *= bonus;
		}

		// Calculate consumption for this interval
		const population = calculatePopulation(structures);
		const structureCount = structures.length;
		const consumption = calculateConsumption(
			population,
			structureCount,
			ticksForThisInterval,
			consumptionMultiplier
		);

		// Calculate net resource changes
		const netProduction = subtractResources(production, consumption);

		// Get current resources
		const currentResources = {
			food: storage.food,
			water: storage.water,
			wood: storage.wood,
			stone: storage.stone,
			ore: storage.ore,
		};

		// Calculate storage capacity
		const capacity = calculateStorageCapacity(structures);

		// ==================================================================
		// DATABASE WRITE (On production tick only, NOT on projections)
		// ==================================================================
		if (timing.isResourceProductionTime) {
			logger.debug('[GAME LOOP] 💾 RESOURCE PRODUCTION TICK', {
				settlementId,
				production,
				consumption,
				netProduction,
				population,
				ticksForInterval: ticksForThisInterval,
			});

			// Add net production to current resources
			const proposedResources = addResources(currentResources, netProduction);

			// Calculate waste (resources exceeding capacity)
			const waste = calculateWaste(currentResources, netProduction, capacity);

			// Clamp resources to capacity
			const finalResources = clampToCapacity(proposedResources, capacity);

			// Round resources to integers for database storage
			const roundedResources = {
				food: Math.floor(finalResources.food),
				water: Math.floor(finalResources.water),
				wood: Math.floor(finalResources.wood),
				stone: Math.floor(finalResources.stone),
				ore: Math.floor(finalResources.ore),
			};

			// Update storage in database
			await updateSettlementStorage(storage.id, roundedResources);

			logger.debug('[GAME LOOP] ✅ Resources updated in database', {
				settlementId,
				before: currentResources,
				after: roundedResources,
				waste,
			});

			// Round production/consumption/net for event emission
			const roundedProduction = roundResources(production);
			const roundedConsumption = roundResources(consumption);
			const roundedNetProduction = roundResources(netProduction);

			// Broadcast resource update to world
			const resourceUpdatePayload = {
				type: 'auto-production',
				settlementId,
				resources: roundedResources,
				production: roundedProduction,
				consumption: roundedConsumption,
				netProduction: roundedNetProduction,
				population,
				timestamp: timing.currentTime,
			};

			if (roomSize > 0) {
				io.to(`world:${worldId}`).emit('resource-update', resourceUpdatePayload);
				logger.debug('[GAME LOOP] 📡 Emitted resource-update event', {
					settlementId,
					roomSize,
				});
			}

			// Broadcast waste event if any resources were wasted
			if (
				waste.food > 0 ||
				waste.water > 0 ||
				waste.wood > 0 ||
				waste.stone > 0 ||
				waste.ore > 0
			) {
				if (roomSize > 0) {
					io.to(`world:${worldId}`).emit('resource-waste', {
						settlementId,
						waste,
						capacity,
						timestamp: timing.currentTime,
					});
				}

				logger.debug('[GAME LOOP] Resources wasted due to capacity', {
					settlementId,
					waste,
				});
			}

			// Check storage capacity warnings (>90% full)
			const nearCapacity = isNearCapacity(finalResources, capacity);
			const hasWarnings = Object.values(nearCapacity).some(Boolean);

			if (hasWarnings && roomSize > 0) {
				io.to(`world:${worldId}`).emit('storage-warning', {
					settlementId,
					nearCapacity,
					resources: finalResources,
					capacity,
					timestamp: timing.currentTime,
				});
			}

			// Check if settlement has enough resources for population (1 hour buffer)
			const hasResources = hasResourcesForPopulation(
				population,
				structureCount,
				finalResources
			);

			if (!hasResources && population > 0 && roomSize > 0) {
				io.to(`world:${worldId}`).emit('resource-shortage', {
					settlementId,
					population,
					resources: finalResources,
					timestamp: timing.currentTime,
				});

				logger.warn('[GAME LOOP] Settlement has insufficient resources', {
					settlementId,
					population,
					resources: finalResources,
				});
			}

			logger.debug('[GAME LOOP] Settlement resources updated', {
				settlementId,
				production,
				consumption,
				netProduction,
				population,
				finalResources,
			});
		}

		// ==================================================================
		// REAL-TIME PROJECTION (On projection ticks, NOT on production)
		// ==================================================================
		else if (timing.shouldEmitProjection && roomSize > 0) {
			logger.debug('[GAME LOOP] 📊 PROJECTION TICK', {
				settlementId,
				secondsSinceLastProduction,
				partialProduction: netProduction,
			});

			// Calculate projected resources (current + partial production)
			const projectedResources = addResources(currentResources, netProduction);
			const finalProjected = clampToCapacity(projectedResources, capacity);

			// Round all values for display (no fractional resources in UI)
			const roundedProjected = roundResources(finalProjected);
			const roundedProduction = roundResources(production);
			const roundedConsumption = roundResources(consumption);
			const roundedNetProduction = roundResources(netProduction);

			// Emit projection event
			io.to(`world:${worldId}`).emit('resource-preview', {
				settlementId,
				resources: roundedProjected,
				production: roundedProduction,
				consumption: roundedConsumption,
				netProduction: roundedNetProduction,
				population,
				secondsUntilNextProduction: RESOURCE_INTERVAL_SEC - secondsSinceLastProduction,
				timestamp: timing.currentTime,
			});

			logger.debug('[GAME LOOP] 📡 Emitted resource-preview event', {
				settlementId,
				roomSize,
			});
		}

		// ==================================================================
		// POPULATION UPDATE (On population tick only)
		// ==================================================================
		if (timing.isPopulationUpdateTime) {
			logger.debug('[GAME LOOP] 👥 POPULATION TICK', {
				settlementId,
				currentPopulation: population,
			});

			await processPopulation(settlementId, worldId, structures, currentResources, io);
		}
	} catch (error) {
		logger.error('[GAME LOOP] Error processing settlement:', error, {
			settlementId,
		});
	}
}

/**
 * Process population growth for a single settlement
 */
async function processPopulation(
	settlementId: string,
	worldId: string,
	structures: Structure[],
	resources: { food: number; water: number; wood: number; stone: number; ore: number },
	io: SocketIOServer
): Promise<void> {
	try {
		logger.debug('[GAME LOOP] 🔍 Processing population for settlement', {
			settlementId,
		});

		// Get current population data
		const popData = await getSettlementPopulation(settlementId);

		logger.debug('[GAME LOOP] Current population data', {
			settlementId,
			currentPopulation: popData.currentPopulation,
			happiness: popData.happiness,
			lastGrowthTick: popData.lastGrowthTick,
		});

		logger.debug('[POP STATE DEBUG] About to calculate population state', {
			settlementId,
			structuresCount: structures.length,
			structureNames: structures.map((s) => s.name),
			hasModifiers: structures.some((s) => s.modifiers?.length > 0),
			firstStructureModifiers: structures[0]?.modifiers,
		});

		// Calculate current population state
		const popState = calculatePopulationState(
			popData.currentPopulation,
			structures,
			resources,
			popData.lastGrowthTick.getTime()
		);

		logger.debug('[POP STATE DEBUG] Population state calculated', {
			settlementId,
			capacity: popState.capacity,
			happiness: popState.happiness,
		});

		logger.debug('[GAME LOOP] Population state calculated', {
			settlementId,
			popState,
		});

		// Apply natural growth
		const timeSinceLastUpdate = Date.now() - popData.lastGrowthTick.getTime();
		const newPopulation = applyPopulationGrowth(
			popData.currentPopulation,
			popState.growthRate,
			timeSinceLastUpdate
		);

		logger.debug('[GAME LOOP] Population growth applied', {
			settlementId,
			before: popData.currentPopulation,
			after: newPopulation,
			timeSinceLastUpdate,
			growthRate: popState.growthRate,
		});

		// Check for immigration event (if happy enough)
		let immigrantCount = 0;
		if (Math.random() < popState.immigrationChance && newPopulation < popState.capacity) {
			immigrantCount = calculateImmigrationAmount();

			// Emit settler arrived event
			io.to(`world:${worldId}`).emit('settler-arrived', {
				settlementId,
				population: newPopulation + immigrantCount,
				immigrantCount,
				happiness: Math.floor(popState.happiness),
				timestamp: Date.now(),
			});

			logger.info('[GAME LOOP] Settlers arrived at settlement', {
				settlementId,
				immigrantCount,
				newTotal: newPopulation + immigrantCount,
			});
		}

		// Check for emigration event (if unhappy)
		let emigrantCount = 0;
		if (Math.random() < popState.emigrationChance && newPopulation > 1) {
			emigrantCount = calculateEmigrationAmount(newPopulation);

			// Emit population warning event
			io.to(`world:${worldId}`).emit('population-warning', {
				settlementId,
				population: newPopulation - emigrantCount,
				happiness: Math.floor(popState.happiness),
				warning: 'emigration_risk',
				message: `${emigrantCount} settlers left due to low happiness`,
				timestamp: Date.now(),
			});

			logger.warn('[GAME LOOP] Settlers emigrated from settlement', {
				settlementId,
				emigrantCount,
				newTotal: newPopulation - emigrantCount,
				happiness: popState.happiness,
			});
		}

		// Calculate final population
		const finalPopulation = Math.max(
			1,
			Math.min(popState.capacity, newPopulation + immigrantCount - emigrantCount)
		);

		// Update database only if population changed
		if (
			finalPopulation !== popData.currentPopulation ||
			popState.happiness !== popData.happiness
		) {
			logger.debug('[GAME LOOP] 💾 Updating population in database', {
				settlementId,
				before: popData.currentPopulation,
				after: finalPopulation,
				happinessBefore: popData.happiness,
				happinessAfter: popState.happiness,
			});

			await updateSettlementPopulation(settlementId, {
				currentPopulation: finalPopulation,
				happiness: Math.floor(popState.happiness),
				lastGrowthTick: new Date(),
			});

			logger.debug('[GAME LOOP] ✅ Population updated in database', {
				settlementId,
			});

			// Emit population growth event
			if (finalPopulation !== popData.currentPopulation) {
				io.to(`world:${worldId}`).emit('population-growth', {
					settlementId,
					oldPopulation: popData.currentPopulation,
					newPopulation: finalPopulation,
					happiness: Math.floor(popState.happiness),
					growthRate: popState.growthRate,
					timestamp: Date.now(),
				});

				logger.debug('[GAME LOOP] 📡 Emitted population-growth event', {
					settlementId,
					population: finalPopulation,
				});
			}
		}

		// Emit population state update
		const summary = getPopulationSummary(popState);
		logger.debug('[SOCKET EMIT DEBUG] About to emit population-state', {
			settlementId,
			popState_capacity: popState.capacity,
			finalPopulation,
			payload_capacity: popState.capacity,
		});
		io.to(`world:${worldId}`).emit('population-state', {
			settlementId,
			current: finalPopulation,
			capacity: popState.capacity,
			happiness: summary.happiness,
			happinessDescription: summary.happinessDescription,
			growthRate: popState.growthRate,
			status: summary.status,
			timestamp: Date.now(),
		});

		logger.debug('[GAME LOOP] 📡 Emitted population-state event', {
			settlementId,
			happiness: summary.happiness,
		});

		// Warn if happiness is critically low
		if (popState.happiness < 35 && popState.emigrationChance > 0) {
			io.to(`world:${worldId}`).emit('population-warning', {
				settlementId,
				population: finalPopulation,
				happiness: Math.floor(popState.happiness),
				warning: 'low_happiness',
				message: 'Settlement happiness is critically low! Settlers may leave.',
				timestamp: Date.now(),
			});
		}

		logger.debug('[GAME LOOP] Population processed', {
			settlementId,
			oldPop: popData.currentPopulation,
			newPop: finalPopulation,
			happiness: popState.happiness,
			growthRate: popState.growthRate,
		});
	} catch (error) {
		logger.error('[GAME LOOP] Error processing population:', error, {
			settlementId,
		});
	}
}

/**
 * Get game loop status
 */
export function getGameLoopStatus(): {
	isRunning: boolean;
	currentTick: number;
	tickRate: number;
} {
	return {
		isRunning,
		currentTick,
		tickRate: TICK_RATE,
	};
}
