/**
 * Servers API Routes
 *
 * CRUD operations for game server management
 */

import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { db, servers } from '../../db/index.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/servers
 * List all servers
 * Accessible to all authenticated users (needed for settlement creation)
 */
router.get('/', authenticate, async (req, res) => {
	try {
		const allServers = await db.query.servers.findMany({
			with: {
				worlds: {
					columns: {
						id: true,
						name: true,
					},
				},
			},
			orderBy: (servers, { desc }) => [desc(servers.createdAt)],
		});

		res.json(allServers);
	} catch (error) {
		logger.error('[API] Error fetching servers:', error);
		res.status(500).json({
			error: 'Failed to fetch servers',
			code: 'FETCH_FAILED',
		});
	}
});

/**
 * GET /api/servers/:id
 * Get server details with worlds and players
 * Accessible to all authenticated users
 */
router.get('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params;

		const server = await db.query.servers.findFirst({
			where: eq(servers.id, id),
			with: {
				worlds: true,
				players: {
					with: {
						profile: true,
					},
				},
			},
		});

		if (!server) {
			return res.status(404).json({
				error: 'Server not found',
				code: 'NOT_FOUND',
			});
		}

		res.json(server);
	} catch (error) {
		logger.error('[API] Error fetching server:', error);
		res.status(500).json({
			error: 'Failed to fetch server',
			code: 'FETCH_FAILED',
		});
	}
});

/**
 * POST /api/servers
 * Create new server
 *
 * Body: {
 *   name: string,
 *   hostname?: string,
 *   port?: number,
 *   status?: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE'
 * }
 */
router.post('/', authenticateAdmin, async (req, res) => {
	try {
		const { name, hostname, port, status } = req.body;

		// Validation
		if (!name) {
			return res.status(400).json({
				error: 'Missing required field: name',
				code: 'INVALID_INPUT',
			});
		}

		// Create server
		const [newServer] = await db
			.insert(servers)
			.values({
				id: createId(),
				name,
				hostname: hostname || 'localhost',
				port: port || 5000,
				status: status || 'OFFLINE',
			})
			.returning();

		logger.info(`[API] Created server: ${newServer.id} - ${newServer.name}`);
		res.status(201).json(newServer);
	} catch (error) {
		logger.error('[API] Error creating server:', error);
		res.status(500).json({
			error: 'Failed to create server',
			code: 'CREATE_FAILED',
			details: error instanceof Error ? error.message : 'Unknown error',
		});
	}
});

/**
 * PUT /api/servers/:id
 * Update server settings
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { name, hostname, port, status } = req.body;

		// Check if server exists
		const existing = await db.query.servers.findFirst({
			where: eq(servers.id, id),
		});

		if (!existing) {
			return res.status(404).json({
				error: 'Server not found',
				code: 'NOT_FOUND',
			});
		}

		// Update server
		const [updated] = await db
			.update(servers)
			.set({
				name: name || existing.name,
				hostname: hostname || existing.hostname,
				port: port || existing.port,
				status: status || existing.status,
				updatedAt: new Date(),
			})
			.where(eq(servers.id, id))
			.returning();

		logger.info(`[API] Updated server: ${id}`);
		res.json(updated);
	} catch (error) {
		logger.error('[API] Error updating server:', error);
		res.status(500).json({
			error: 'Failed to update server',
			code: 'UPDATE_FAILED',
		});
	}
});

/**
 * DELETE /api/servers/:id
 * Delete server (cascade deletes worlds and related data)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		// Check if server exists
		const existing = await db.query.servers.findFirst({
			where: eq(servers.id, id),
		});

		if (!existing) {
			return res.status(404).json({
				error: 'Server not found',
				code: 'NOT_FOUND',
			});
		}

		// Delete server (cascade will handle related data)
		await db.delete(servers).where(eq(servers.id, id));

		logger.info(`[API] Deleted server: ${id} - ${existing.name}`);
		res.json({
			success: true,
			message: `Server "${existing.name}" deleted successfully`,
		});
	} catch (error) {
		logger.error('[API] Error deleting server:', error);
		res.status(500).json({
			error: 'Failed to delete server',
			code: 'DELETE_FAILED',
		});
	}
});

export default router;
