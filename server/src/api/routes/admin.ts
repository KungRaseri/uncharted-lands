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
 */
router.post('/disasters/trigger', authenticateAdmin, async (req, res) => {
	try {
		const { worldId, type, severity, duration } = req.body;

		// Validate required fields
		if (!worldId || !type) {
			return res.status(400).json({
				error: 'Missing required fields',
				code: 'MISSING_FIELDS',
				required: ['worldId', 'type'],
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

	// Default values
	const disasterSeverity = severity || 50; // Default moderate severity
	// Use E2E_DISASTER_WARNING_SECONDS env var for testing (default: 10 seconds for E2E, 300 for production)
	const warningTime = process.env.E2E_DISASTER_WARNING_SECONDS
		? Number.parseInt(process.env.E2E_DISASTER_WARNING_SECONDS, 10)
		: 10; // 10 seconds for fast E2E tests
	const impactDuration = duration || 600; // 10 minutes default
	const currentTime = Date.now();
	const scheduledAt = new Date(currentTime + warningTime * 1000);		// Create disaster event
		const [disasterEvent] = await db
			.insert(disasterEvents)
			.values({
				worldId: worldId,
				type: type as DisasterType,
				severity: disasterSeverity,
				severityLevel: getSeverityLevel(disasterSeverity),
				affectedRegionId: null,
				affectedBiomes: ['GRASSLAND'], // Default to grassland for testing
				status: 'SCHEDULED',
				scheduledAt: scheduledAt,
				warningIssuedAt: null,
				warningTime: warningTime,
				impactDuration: impactDuration,
			})
			.returning();

		logger.info('[API] Manual disaster triggered', {
			disasterId: disasterEvent.id,
			worldId,
			type,
			severity: disasterSeverity,
			scheduledAt: scheduledAt.toISOString(),
		});

		res.json({
			success: true,
			disasterId: disasterEvent.id,
			scheduledAt: scheduledAt.toISOString(),
			warningTime: warningTime,
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
