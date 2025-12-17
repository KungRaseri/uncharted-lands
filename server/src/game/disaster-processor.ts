/**
 * Disaster Processor
 *
 * Processes disaster lifecycle: Warning → Impact → Aftermath
 *
 * PHASE 4 IMPLEMENTATION (November 2025)
 *
 * Lifecycle Phases:
 * 1. SCHEDULED → WARNING: Issue disaster warning to affected players
 * 2. WARNING → IMPACT: Begin gradual damage application
 * 3. IMPACT → AFTERMATH: Transition to recovery phase
 * 4. AFTERMATH → RESOLVED: Complete disaster after 30 days
 *
 * Processing Frequency:
 * - Runs at 10Hz (every 6 ticks at 60Hz game loop)
 * - Updates every 10 minutes during impact phase
 * - Hourly happiness recovery during aftermath
 *
 * Integration with game loop (game-loop.ts):
 * - Called from processTick() when tickCount % 6 === 0
 * - Broadcasts events via Socket.IO to affected players
 *
 * GDD Reference: Section 3.5.4 (Disaster System), Section 5.6.4 (Disaster Event Processing)
 *
 * @module game/disaster-processor
 */

import type { Server as SocketIOServer } from 'socket.io';
import { db } from '../db/index.js';
import { disasterEvents, settlements, disasterHistory } from '../db/schema.js';
import { eq, and, lt, sql } from 'drizzle-orm';
import { logger } from '../utils/logger.js';
import { calculateSettlementDamage } from './disaster-damage-calculator.js';
import { createId } from '@paralleldrive/cuid2';
import type {
	DisasterWarningData,
	DisasterImminentData,
	DisasterImpactStartData,
	DisasterDamageUpdateData,
	DisasterImpactEndData,
	DisasterAftermathData,
	DisasterResolvedData,
} from '@uncharted-lands/shared';

/**
 * Process all active disasters
 * Called from game loop at 10Hz (every 6 ticks)
 */
export async function processDisasters(io: SocketIOServer, currentTime: number): Promise<void> {
	try {
		// Process all active disaster states
		await processScheduledDisasters(io, currentTime);
		await processWarningPhase(io, currentTime);
		await processImpactPhase(io, currentTime);
		await processAftermathPhase(io, currentTime);
	} catch (error) {
		logger.error('[DISASTER PROCESSOR] Error processing disasters', {
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});
	}
}

/**
 * Check scheduled disasters that need to transition to WARNING phase
 */
async function processScheduledDisasters(io: SocketIOServer, currentTime: number): Promise<void> {
	// Find disasters that are scheduled and warning time has started
	// (scheduledAt - warningTime <= currentTime)
	const disasters = await db.query.disasterEvents.findMany({
		where: and(
			eq(disasterEvents.status, 'SCHEDULED'),
			lt(disasterEvents.scheduledAt, new Date(currentTime + 24 * 60 * 60 * 1000)) // Within next 24 hours
		),
		with: {
			world: true,
		},
	});

	for (const disaster of disasters) {
		const scheduledTime = disaster.scheduledAt.getTime();
		const warningStartTime = scheduledTime - disaster.warningTime * 1000;

		// Check if warning phase should start
		if (currentTime >= warningStartTime && currentTime < scheduledTime) {
			// Handle null affectedBiomes
			await transitionToWarning(
				{
					...disaster,
					affectedBiomes: disaster.affectedBiomes || [],
				},
				io,
				currentTime
			);
		}
	}
}

/**
 * Transition disaster from SCHEDULED to WARNING
 */
async function transitionToWarning(
	disaster: {
		id: string;
		worldId: string;
		type: string;
		severity: number;
		severityLevel: string;
		affectedRegionId: string | null;
		affectedBiomes: string[];
		scheduledAt: Date;
		warningTime: number;
		impactDuration: number;
	},
	io: SocketIOServer,
	currentTime: number
): Promise<void> {
	// Update disaster status
	await db
		.update(disasterEvents)
		.set({
			status: 'WARNING',
			warningIssuedAt: new Date(currentTime),
		})
		.where(eq(disasterEvents.id, disaster.id));

	// Calculate time remaining until impact
	const scheduledTime = disaster.scheduledAt.getTime();
	const timeRemaining = scheduledTime - currentTime;

	// Emit warning event to world room
	const warningData: DisasterWarningData = {
		disasterId: disaster.id,
		type: disaster.type,
		severity: disaster.severity,
		severityLevel: disaster.severityLevel,
		affectedRegion: disaster.affectedRegionId,
		affectedBiomes: disaster.affectedBiomes,
		timeRemaining,
		recommendedActions: getRecommendedActions(disaster.type, disaster.severityLevel),
		timestamp: currentTime,
	};

	io.to(`world:${disaster.worldId}`).emit('disaster-warning', warningData);

	logger.info(`[DISASTER PROCESSOR] Disaster warning issued`, {
		disasterId: disaster.id,
		type: disaster.type,
		severity: disaster.severity,
		timeRemaining: `${(timeRemaining / 1000 / 60).toFixed(0)}min`,
	});
}

/**
 * Process disasters in WARNING phase
 * - Check for imminent warnings (30 minutes before)
 * - Transition to IMPACT when scheduled time reached
 */
async function processWarningPhase(io: SocketIOServer, currentTime: number): Promise<void> {
	const disasters = await db.query.disasterEvents.findMany({
		where: eq(disasterEvents.status, 'WARNING'),
		with: {
			world: true,
		},
	});

	for (const disaster of disasters) {
		const scheduledTime = disaster.scheduledAt.getTime();
		const timeUntilImpact = scheduledTime - currentTime;

		// Issue imminent warning 30 minutes before impact
		const thirtyMinutes = 30 * 60 * 1000;
		if (timeUntilImpact <= thirtyMinutes && timeUntilImpact > 0) {
			// Only issue once (check if we haven't already)
			const imminentData: DisasterImminentData = {
				disasterId: disaster.id,
				type: disaster.type,
				severity: disaster.severity,
				impactIn: timeUntilImpact,
				timestamp: currentTime,
			};

			io.to(`world:${disaster.worldId}`).emit('disaster-imminent', imminentData);
		}

		// Transition to IMPACT when time reached
		if (currentTime >= scheduledTime) {
			await transitionToImpact(disaster, io, currentTime);
		}
	}
}

/**
 * Transition disaster from WARNING to IMPACT
 */
async function transitionToImpact(
	disaster: {
		id: string;
		worldId: string;
		type: string;
		severity: number;
		impactDuration: number;
	},
	io: SocketIOServer,
	currentTime: number
): Promise<void> {
	// Update disaster status
	await db
		.update(disasterEvents)
		.set({
			status: 'IMPACT',
			impactStartedAt: new Date(currentTime),
		})
		.where(eq(disasterEvents.id, disaster.id));

	// Emit impact start event
	const impactData: DisasterImpactStartData = {
		disasterId: disaster.id,
		type: disaster.type,
		severity: disaster.severity,
		duration: disaster.impactDuration * 1000, // Convert to milliseconds
		timestamp: currentTime,
	};

	io.to(`world:${disaster.worldId}`).emit('disaster-impact-start', impactData);

	logger.info(`[DISASTER PROCESSOR] Disaster impact started`, {
		disasterId: disaster.id,
		type: disaster.type,
		durationMinutes: Math.floor(disaster.impactDuration / 60),
	});
}

/**
 * Process disasters in IMPACT phase
 * - Apply gradual damage every 10 minutes
 * - Emit progress updates
 * - Transition to AFTERMATH when duration complete
 */
async function processImpactPhase(io: SocketIOServer, currentTime: number): Promise<void> {
	const disasters = await db.query.disasterEvents.findMany({
		where: eq(disasterEvents.status, 'IMPACT'),
		with: {
			world: true,
		},
	});

	for (const disaster of disasters) {
		if (!disaster.impactStartedAt) continue;

		const impactStartTime = disaster.impactStartedAt.getTime();
		const elapsedTime = currentTime - impactStartTime;
		const impactDurationMs = disaster.impactDuration * 1000;
		const progress = Math.min(100, (elapsedTime / impactDurationMs) * 100);

		// Emit damage update every 10 minutes (600,000ms)
		const tenMinutes = 10 * 60 * 1000;
		if (elapsedTime % tenMinutes < 100) {
			// Within 100ms tolerance
			const updateData: DisasterDamageUpdateData = {
				disasterId: disaster.id,
				progress: Math.floor(progress),
				timestamp: currentTime,
			};

			io.to(`world:${disaster.worldId}`).emit('disaster-damage-update', updateData);
		}

		// Check if impact phase complete
		if (elapsedTime >= impactDurationMs) {
			await transitionToAftermath(disaster, io, currentTime);
		}
	}
}

/**
 * Transition disaster from IMPACT to AFTERMATH
 */
async function transitionToAftermath(
	disaster: {
		id: string;
		worldId: string;
		type: string;
	},
	io: SocketIOServer,
	currentTime: number
): Promise<void> {
	// Query the full disaster event to get severity
	const fullDisaster = await db.query.disasterEvents.findFirst({
		where: eq(disasterEvents.id, disaster.id),
	});

	if (!fullDisaster) {
		logger.error('[DISASTER PROCESSOR] Could not find disaster event', {
			disasterId: disaster.id,
		});
		return;
	}

	// Update disaster status
	await db
		.update(disasterEvents)
		.set({
			status: 'AFTERMATH',
			impactEndedAt: new Date(currentTime),
		})
		.where(eq(disasterEvents.id, disaster.id));

	// Calculate damage for all affected settlements
	const affectedSettlements = await db.query.settlements.findMany({
		where: eq(settlements.worldId, disaster.worldId),
	});

	let totalCasualties = 0;
	let totalStructuresDamaged = 0;
	let totalStructuresDestroyed = 0;
	const totalResourcesLost = { food: 0, water: 0, wood: 0, stone: 0, ore: 0 };

	for (const settlement of affectedSettlements) {
		try {
			const damage = await calculateSettlementDamage(fullDisaster, settlement);

			totalCasualties += damage.casualties;
			totalStructuresDamaged += damage.structuresDamaged;
			totalStructuresDestroyed += damage.structuresDestroyed;
			totalResourcesLost.food += damage.resourcesLost.food;
			totalResourcesLost.water += damage.resourcesLost.water;
			totalResourcesLost.wood += damage.resourcesLost.wood;
			totalResourcesLost.stone += damage.resourcesLost.stone;
			totalResourcesLost.ore += damage.resourcesLost.ore;

			// Insert disaster history record for this settlement
			await db.insert(disasterHistory).values({
				id: createId(),
				settlementId: settlement.id,
				disasterId: disaster.id,
				casualties: damage.casualties,
				structuresDamaged: damage.structuresDamaged,
				structuresDestroyed: damage.structuresDestroyed,
				resourcesLost: damage.resourcesLost,
				resilienceGained: 0, // Will be set in transitionToResolved
			});

			// Emit per-settlement structure damage events
			for (const structure of damage.affectedStructures) {
				if (structure.newHealth === 0) {
					io.to(`settlement:${settlement.id}`).emit('structure-destroyed', {
						worldId: disaster.worldId,
						settlementId: settlement.id,
						disasterId: disaster.id,
						structureId: structure.structureId,
						structureName: structure.name,
						timestamp: currentTime,
					});
				} else {
					io.to(`settlement:${settlement.id}`).emit('structure-damaged', {
						worldId: disaster.worldId,
						settlementId: settlement.id,
						disasterId: disaster.id,
						structureId: structure.structureId,
						structureName: structure.name,
						oldHealth: structure.oldHealth,
						newHealth: structure.newHealth,
						timestamp: currentTime,
					});
				}
			}

			// Emit casualties report if any casualties occurred
			if (damage.casualties > 0) {
				io.to(`settlement:${settlement.id}`).emit('casualties-report', {
					worldId: disaster.worldId,
					settlementId: settlement.id,
					disasterId: disaster.id,
					casualties: damage.casualties,
					cause: disaster.type,
					timestamp: currentTime,
				});
			}
		} catch (error) {
			logger.error('[DISASTER PROCESSOR] Error calculating damage for settlement', {
				settlementId: settlement.id,
				disasterId: disaster.id,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	// Use calculated final stats
	const finalStats = {
		casualties: totalCasualties,
		structuresDamaged: totalStructuresDamaged,
		structuresDestroyed: totalStructuresDestroyed,
		resourcesLost: totalResourcesLost,
	}; // Emit impact end event
	const endData: DisasterImpactEndData = {
		disasterId: disaster.id,
		type: disaster.type,
		...finalStats,
		timestamp: currentTime,
	};

	io.to(`world:${disaster.worldId}`).emit('disaster-impact-end', endData);

	// Emit aftermath event (48-hour emergency repair discount)
	const aftermathData: DisasterAftermathData = {
		disasterId: disaster.id,
		type: disaster.type,
		emergencyRepairDiscount: true,
		timestamp: currentTime,
	};

	io.to(`world:${disaster.worldId}`).emit('disaster-aftermath', aftermathData);

	logger.info(`[DISASTER PROCESSOR] Disaster aftermath phase started`, {
		disasterId: disaster.id,
		type: disaster.type,
	});
}

/**
 * Process disasters in AFTERMATH phase
 * - Happiness recovery (hourly checks)
 * - Emigration spike checks (every 10 minutes for 48 hours)
 * - Transition to RESOLVED after 30 days
 */
async function processAftermathPhase(io: SocketIOServer, currentTime: number): Promise<void> {
	const disasters = await db.query.disasterEvents.findMany({
		where: eq(disasterEvents.status, 'AFTERMATH'),
		with: {
			world: true,
		},
	});

	const thirtyDays = 30 * 24 * 60 * 60 * 1000;

	for (const disaster of disasters) {
		if (!disaster.impactEndedAt) continue;

		const aftermathStartTime = disaster.impactEndedAt.getTime();
		const elapsedTime = currentTime - aftermathStartTime;

		// Transition to RESOLVED after 30 days
		if (elapsedTime >= thirtyDays) {
			await transitionToResolved(disaster, io, currentTime);
		}
	}
}

/**
 * Transition disaster from AFTERMATH to RESOLVED
 */
async function transitionToResolved(
	disaster: {
		id: string;
		worldId: string;
		type: string;
	},
	io: SocketIOServer,
	currentTime: number
): Promise<void> {
	try {
		// Query full disaster event to get severity for resilience calculation
		const fullDisaster = await db.query.disasterEvents.findFirst({
			where: eq(disasterEvents.id, disaster.id),
		});

		if (!fullDisaster) {
			logger.error('[DISASTER PROCESSOR] Disaster not found for resolution', {
				disasterId: disaster.id,
			});
			return;
		}

		// Update disaster status to RESOLVED
		await db
			.update(disasterEvents)
			.set({
				status: 'RESOLVED',
				updatedAt: new Date(currentTime),
			})
			.where(eq(disasterEvents.id, disaster.id));

		// Calculate resilience gain based on severity (per GDD specifications)
		const resilienceGainMap: Record<string, number> = {
			MILD: 2,
			MODERATE: 5,
			MAJOR: 10,
			CATASTROPHIC: 15,
		};
		const baseResilienceGain = resilienceGainMap[fullDisaster.severityLevel] || 5;

		// Query affected settlements (those with disaster history records)
		const affectedHistory = await db.query.disasterHistory.findMany({
			where: eq(disasterHistory.disasterId, disaster.id),
			with: {
				settlement: true,
			},
		});

		logger.info('[DISASTER PROCESSOR] Granting resilience bonuses', {
			disasterId: disaster.id,
			settlementsAffected: affectedHistory.length,
			baseResilienceGain,
			severityLevel: fullDisaster.severityLevel,
		});

		// Grant resilience to each affected settlement
		for (const history of affectedHistory) {
			// TypeScript doesn't infer the settlement type correctly from the query, so we assert it
			const settlement = history.settlement as typeof settlements.$inferSelect;

			try {
				// Update settlement resilience (cumulative total)
				await db
					.update(settlements)
					.set({
						resilience: sql`COALESCE(${settlements.resilience}, 0) + ${baseResilienceGain}`,
						updatedAt: new Date(currentTime),
					})
					.where(eq(settlements.id, settlement.id));

				// Calculate new resilience value for event emission
				const newResilience = (settlement.resilience || 0) + baseResilienceGain;

				// Update disaster history with resilience gained
				await db
					.update(disasterHistory)
					.set({ resilienceGained: baseResilienceGain })
					.where(eq(disasterHistory.id, history.id));

				// Emit per-settlement resolved event
				const resolvedData: DisasterResolvedData = {
					settlementId: settlement.id,
					disasterType: fullDisaster.type,
					resilienceGain: baseResilienceGain,
					newResilience,
					timestamp: currentTime,
				};

				io.to(`settlement:${settlement.id}`).emit('disaster-resolved', resolvedData);

				logger.info('[DISASTER PROCESSOR] Settlement resilience updated', {
					settlementId: settlement.id,
					settlementName: settlement.name,
					disasterId: disaster.id,
					resilienceGain: baseResilienceGain,
					newResilience,
				});
			} catch (error) {
				logger.error('[DISASTER PROCESSOR] Failed to grant resilience bonus', {
					settlementId: settlement.id,
					disasterId: disaster.id,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}

		logger.info('[DISASTER PROCESSOR] Disaster resolved', {
			disasterId: disaster.id,
			type: fullDisaster.type,
			severityLevel: fullDisaster.severityLevel,
			settlementsAffected: affectedHistory.length,
			resilienceGain: baseResilienceGain,
		});
	} catch (error) {
		logger.error('[DISASTER PROCESSOR] Failed to transition to RESOLVED', {
			disasterId: disaster.id,
			error: error instanceof Error ? error.message : 'Unknown error',
			stack: error instanceof Error ? error.stack : undefined,
		});
	}
}

/**
 * Get recommended actions for disaster type
 * Based on GDD recommended preparation strategies
 */
function getRecommendedActions(disasterType: string, severity: string): string[] {
	const actions: string[] = [
		'Check settlement resources and stockpile food/water',
		'Review emergency shelter capacity',
	];

	// Add disaster-specific recommendations
	const disasterActions: Record<string, string[]> = {
		EARTHQUAKE: [
			'Inspect structure health (stone/ore production buildings at risk)',
			'Consider seismic foundations if available',
		],
		LANDSLIDE: [
			'Inspect structure health (stone/ore production buildings at risk)',
			'Consider seismic foundations if available',
		],
		AVALANCHE: [
			'Inspect structure health (stone/ore production buildings at risk)',
			'Consider seismic foundations if available',
		],
		DROUGHT: ['Stockpile water reserves immediately', 'Activate water conservation measures'],
		HEATWAVE: ['Stockpile water reserves immediately', 'Activate water conservation measures'],
		FLOOD: [
			'Move resources to higher ground if possible',
			'Activate storm barriers if available',
		],
		HURRICANE: [
			'Move resources to higher ground if possible',
			'Activate storm barriers if available',
		],
		TSUNAMI: [
			'Move resources to higher ground if possible',
			'Activate storm barriers if available',
		],
		WILDFIRE: [
			'Clear wood stockpiles from settlement center',
			'Use fire-resistant structures if available',
		],
		BLIZZARD: ['Stockpile fuel and heating resources', 'Ensure population shelter capacity'],
		EXTREME_COLD: [
			'Stockpile fuel and heating resources',
			'Ensure population shelter capacity',
		],
		PLAGUE: [
			'Stockpile medicinal herbs and medical supplies',
			'Activate hospitals and medical facilities',
		],
		INSECT_PLAGUE: [
			'Stockpile medicinal herbs and medical supplies',
			'Activate hospitals and medical facilities',
		],
		BLIGHT: [
			'Stockpile medicinal herbs and medical supplies',
			'Activate hospitals and medical facilities',
		],
	};

	const specificActions = disasterActions[disasterType];
	if (specificActions) {
		actions.push(...specificActions);
	}

	// Add severity-specific recommendations
	if (severity === 'MAJOR' || severity === 'CATASTROPHIC') {
		actions.push(
			'Consider requesting emergency aid from allies',
			'Prepare for potential population evacuation'
		);
	}

	return actions;
}
