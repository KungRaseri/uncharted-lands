/**
 * Admin Dashboard API Routes
 *
 * Statistics and overview data for admin panel
 */

import { Router } from 'express';
import { sql, eq } from 'drizzle-orm';
import { db, servers, worlds, accounts, settlements, disasterEvents } from '../../db/index.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { getSeverityLevel } from '../../game/disaster-scheduler.js';
import type { DisasterType } from '../../db/schema.js';

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
 * Body:
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
		const { settlementId, disasterType, severity, worldId, type, duration } = req.body;

		// Support both new admin UI format (settlementId) and legacy E2E format (worldId)
		const isNewFormat = settlementId && disasterType && typeof severity === 'number';
		const isLegacyFormat = worldId && type;

		if (!isNewFormat && !isLegacyFormat) {
			return res.status(400).json({
				error: 'Missing required fields',
				code: 'MISSING_FIELDS',
				required: 'Either (settlementId, disasterType, severity) or (worldId, type)',
			});
		}

		let targetWorldId: string;
		let targetBiome = 'GRASSLAND';
		let disasterSeverity: number;
		let disasterTypeValue: DisasterType;
		let warningTime: number;
		let impactDuration: number;

		if (isNewFormat) {
			// New admin UI format: settlement-based targeting
			if (severity < 1 || severity > 5) {
				return res.status(400).json({
					error: 'Severity must be between 1 and 5',
					code: 'INVALID_SEVERITY',
				});
			}

			// Get settlement and its world
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
			targetBiome = settlement.tile.biome;

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
			disasterTypeValue = disasterType as DisasterType;
			warningTime = 300; // 5 minutes for admin-triggered
			impactDuration = 600; // 10 minutes default
		} else {
			// Legacy E2E testing format: world-based
			const world = await db.query.worlds.findFirst({
				where: eq(worlds.id, worldId),
			});

			if (!world) {
				return res.status(404).json({
					error: 'World not found',
					code: 'WORLD_NOT_FOUND',
				});
			}

			targetWorldId = worldId;
			disasterSeverity = severity || 50;
			disasterTypeValue = type as DisasterType;
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
				affectedRegionId: null,
				affectedBiomes: [targetBiome],
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
			biome: targetBiome,
			scheduledAt: scheduledAt.toISOString(),
			format: isNewFormat ? 'admin-ui' : 'e2e-legacy',
		});

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

export default router;
