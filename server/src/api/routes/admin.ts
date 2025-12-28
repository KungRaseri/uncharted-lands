/**
 * Admin Dashboard API Routes
 *
 * Statistics and overview data for admin panel
 */

import { Router } from 'express';
import type { Server as SocketIOServer } from 'socket.io';
import { sql, eq, inArray } from 'drizzle-orm';
import {
	db,
	servers,
	worlds,
	accounts,
	settlements,
	disasterEvents,
	regions
} from '../../db/index.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { getSeverityLevel, getVulnerableBiomes } from '../../game/disaster-scheduler.js';
import type { DisasterType } from '../../db/schema.js';
import type { DisasterWarningData } from '@uncharted-lands/shared';

const router = Router();

/**
 * GET /api/admin/dashboard
 * Get dashboard statistics
 */
router.get('/dashboard', authenticateAdmin, async (req, res) => {
	try {
		// Count all entities
		const [serverCount] = await db.select({ count: sql<number>`count(*)` }).from(servers);
		const [worldCount] = await db.select({ count: sql<number>`count(*)` }).from(worlds);
		const [accountCount] = await db.select({ count: sql<number>`count(*)` }).from(accounts);
		const [settlementCount] = await db
			.select({ count: sql<number>`count(*)` })
			.from(settlements);

		// Get recent servers
		const recentServers = await db.query.servers.findMany({
			limit: 5,
			orderBy: (servers, { desc }) => [desc(servers.createdAt)],
			with: {
				worlds: {
					columns: {
						id: true,
						name: true,
					},
				},
			},
		});

		// Get recent worlds
		const recentWorlds = await db.query.worlds.findMany({
			limit: 5,
			orderBy: (worlds, { desc }) => [desc(worlds.createdAt)],
			with: {
				server: {
					columns: {
						id: true,
						name: true,
					},
				},
			},
		});

		// Get recent players
		const recentPlayers = await db.query.accounts.findMany({
			limit: 5,
			orderBy: (accounts, { desc }) => [desc(accounts.createdAt)],
			with: {
				profile: {
					columns: {
						id: true,
						username: true,
						picture: true,
					},
				},
			},
		});

		const stats = {
			counts: {
				servers: Number(serverCount.count),
				worlds: Number(worldCount.count),
				players: Number(accountCount.count),
				settlements: Number(settlementCount.count),
			},
			recent: {
				servers: recentServers,
				worlds: recentWorlds,
				players: recentPlayers,
			},
			timestamp: new Date().toISOString(),
		};

		res.json(stats);
	} catch (error) {
		logger.error('[API] Error fetching dashboard stats:', error);
		res.status(500).json({
			error: 'Failed to fetch dashboard statistics',
			code: 'FETCH_FAILED',
		});
	}
});

/**
 * POST /api/admin/disasters/trigger
 * Manually trigger a disaster for testing purposes
 *
 * Body (NEW region-based format):
 * - worldId: string (required) - Target world
 * - regionIds: string[] (required) - Array of region IDs to affect
 * - disasterType: DisasterType (required) - Type of disaster
 * - severity: number 1-5 (required) - Severity level
 *
 * OR legacy settlement-based:
 * - settlementId: string (required) - Target settlement
 * - disasterType: DisasterType (required) - Type of disaster
 * - severity: number 1-5 (required) - Severity level
 *
 * OR for E2E testing:
 * - worldId: string (required) - Target world
 * - type: DisasterType (required) - Type of disaster
 * - severity: number 0-100 (optional) - Internal severity value
 * - duration: number (optional) - Impact duration in seconds
 */
router.post('/disasters/trigger', authenticateAdmin, async (req, res) => {
	try {
		const { worldId, regionIds, disasterType, severity, settlementId, type, duration } =
			req.body;

		// Support three formats:
		// 1. New region-based: worldId + regionIds + disasterType + severity
		// 2. Legacy settlement-based: settlementId + disasterType + severity
		// 3. E2E testing: worldId + type
		const isRegionFormat =
			worldId &&
			regionIds &&
			Array.isArray(regionIds) &&
			disasterType &&
			typeof severity === 'number';
		const isSettlementFormat = settlementId && disasterType && typeof severity === 'number';
		const isE2EFormat = worldId && type && !regionIds;

		if (!isRegionFormat && !isSettlementFormat && !isE2EFormat) {
			return res.status(400).json({
				error: 'Missing required fields',
				code: 'MISSING_FIELDS',
				required:
					'Either (worldId, regionIds[], disasterType, severity) or (settlementId, disasterType, severity) or (worldId, type)',
			});
		}

		let targetWorldId: string;
		let affectedRegionIds: string[];
		let vulnerableBiomes: string[];
		let disasterSeverity: number;
		let disasterTypeValue: DisasterType;
		let warningTime: number;
		let impactDuration: number;

		if (isRegionFormat) {
			// NEW region-based format
			if (severity < 1 || severity > 5) {
				return res.status(400).json({
					error: 'Severity must be between 1 and 5',
					code: 'INVALID_SEVERITY',
				});
			}

			// Verify world exists
			const world = await db.query.worlds.findFirst({
				where: eq(worlds.id, worldId),
			});

			if (!world) {
				return res.status(404).json({
					error: 'World not found',
					code: 'WORLD_NOT_FOUND',
				});
			}

			// Verify all regions exist and belong to this world
			const targetRegions = await db.query.regions.findMany({
				where: inArray(regions.id, regionIds),
			});

			if (targetRegions.length !== regionIds.length) {
				return res.status(404).json({
					error: 'One or more regions not found',
					code: 'REGIONS_NOT_FOUND',
				});
			}

			// Verify all regions belong to the world
			const invalidRegions = targetRegions.filter((r) => r.worldId !== worldId);
			if (invalidRegions.length > 0) {
				return res.status(400).json({
					error: 'Some regions do not belong to the specified world',
					code: 'INVALID_REGIONS',
				});
			}

			targetWorldId = worldId;
			affectedRegionIds = regionIds;
			disasterTypeValue = disasterType as DisasterType;
			vulnerableBiomes = getVulnerableBiomes(disasterTypeValue);

			// Convert user-friendly scale (1-5) to internal (0-100)
			const severityMap: Record<number, [number, number]> = {
				1: [20, 25], // MILD
				2: [30, 40], // MILD-MODERATE
				3: [45, 55], // MODERATE
				4: [60, 75], // MAJOR
				5: [80, 100], // CATASTROPHIC
			};
			const [min, max] = severityMap[severity] || [45, 55];
			disasterSeverity = Math.floor(Math.random() * (max - min + 1)) + min;
			warningTime = 300; // 5 minutes for admin-triggered
			impactDuration = 600; // 10 minutes default
		} else if (isSettlementFormat) {
			// Legacy settlement-based format (convert to region-based)
			if (severity < 1 || severity > 5) {
				return res.status(400).json({
					error: 'Severity must be between 1 and 5',
					code: 'INVALID_SEVERITY',
				});
			}

			// Get settlement and its tile/region
			const settlement = await db.query.settlements.findFirst({
				where: eq(settlements.id, settlementId),
				with: {
					tile: true,
				},
			});

			if (!settlement || !settlement.tile) {
				return res.status(404).json({
					error: 'Settlement not found',
					code: 'SETTLEMENT_NOT_FOUND',
				});
			}

			targetWorldId = settlement.tile.worldId;
			affectedRegionIds = [settlement.tile.regionId]; // Convert to region-based
			disasterTypeValue = disasterType as DisasterType;
			vulnerableBiomes = getVulnerableBiomes(disasterTypeValue);

			// Convert user-friendly scale (1-5) to internal (0-100)
			const severityMap: Record<number, [number, number]> = {
				1: [20, 25], // MILD
				2: [30, 40], // MILD-MODERATE
				3: [45, 55], // MODERATE
				4: [60, 75], // MAJOR
				5: [80, 100], // CATASTROPHIC
			};
			const [min, max] = severityMap[severity] || [45, 55];
			disasterSeverity = Math.floor(Math.random() * (max - min + 1)) + min;
			warningTime = 300; // 5 minutes for admin-triggered
			impactDuration = 600; // 10 minutes default
		} else {
			// E2E testing format
			const world = await db.query.worlds.findFirst({
				where: eq(worlds.id, worldId),
			});

			if (!world) {
				return res.status(404).json({
					error: 'World not found',
					code: 'WORLD_NOT_FOUND',
				});
			}

			// Get a random region for E2E tests
			const worldRegions = await db.query.regions.findMany({
				where: eq(regions.worldId, worldId),
				limit: 1,
			});

			if (worldRegions.length === 0) {
				return res.status(404).json({
					error: 'No regions found in world',
					code: 'NO_REGIONS',
				});
			}

			targetWorldId = worldId;
			affectedRegionIds = [worldRegions[0].id];
			disasterSeverity = severity || 50;
			disasterTypeValue = type as DisasterType;
			vulnerableBiomes = getVulnerableBiomes(disasterTypeValue);
			// Use E2E_DISASTER_WARNING_SECONDS env var for testing
			warningTime = process.env.E2E_DISASTER_WARNING_SECONDS
				? Number.parseInt(process.env.E2E_DISASTER_WARNING_SECONDS, 10)
				: 10; // 10 seconds for E2E
			impactDuration = duration || 600;
		}

		const currentTime = Date.now();
		const scheduledAt = new Date(currentTime + warningTime * 1000);

		// Create disaster event
		const [disasterEvent] = await db
			.insert(disasterEvents)
			.values({
				worldId: targetWorldId,
				type: disasterTypeValue,
				severity: disasterSeverity,
				severityLevel: getSeverityLevel(disasterSeverity),
				affectedRegionIds: affectedRegionIds,
				affectedBiomes: vulnerableBiomes,
				status: 'WARNING', // Start with WARNING for immediate visibility
				scheduledAt: scheduledAt,
				warningIssuedAt: new Date(currentTime),
				warningTime: warningTime,
				impactDuration: impactDuration,
			})
			.returning();

		logger.info('[API] Manual disaster triggered', {
			disasterId: disasterEvent.id,
			worldId: targetWorldId,
			type: disasterTypeValue,
			severity: disasterSeverity,
			severityLevel: getSeverityLevel(disasterSeverity),
			affectedRegionIds,
			vulnerableBiomes,
			scheduledAt: scheduledAt.toISOString(),
			format: isRegionFormat
				? 'region-based'
				: isSettlementFormat
					? 'settlement-legacy'
					: 'e2e-legacy',
		});

		// Emit disaster-warning event immediately (since we created with status='WARNING')
		const io = req.app.get('io') as SocketIOServer;
		if (io) {
			const timeRemaining = scheduledAt.getTime() - currentTime;
			const warningData: DisasterWarningData = {
				disasterId: disasterEvent.id,
				type: disasterTypeValue,
				severity: disasterSeverity,
				severityLevel: getSeverityLevel(disasterSeverity),
				affectedRegions: affectedRegionIds,
				affectedBiomes: vulnerableBiomes,
				timeRemaining,
				recommendedActions: getRecommendedActions(
					disasterTypeValue,
					getSeverityLevel(disasterSeverity)
				),
				timestamp: currentTime,
			};

			io.to(`world:${targetWorldId}`).emit('disaster-warning', warningData);

			logger.info('[API] Disaster warning emitted', {
				disasterId: disasterEvent.id,
				worldId: targetWorldId,
				timeRemaining: `${(timeRemaining / 1000).toFixed(0)}s`,
			});
		}

		res.json({
			success: true,
			disasterId: disasterEvent.id,
			scheduledAt: scheduledAt.toISOString(),
			warningTime: warningTime,
			message: `Disaster triggered successfully! Warning issued, impact begins in ${warningTime} seconds.`,
		});
	} catch (error) {
		logger.error('[API] Error triggering disaster:', error);
		res.status(500).json({
			error: 'Failed to trigger disaster',
			code: 'TRIGGER_FAILED',
		});
	}
});

/**
 * Get recommended actions for disaster type and severity
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

export default router;
