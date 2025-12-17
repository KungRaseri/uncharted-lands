/**
 * Players (Accounts/Profiles) API Routes
 *
 * Admin operations for user management
 */

import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, accounts } from '../../db/index.js';
import { authenticateAdmin } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { sendServerError, sendNotFoundError, sendBadRequestError } from '../utils/responses.js';

const router = Router();

/**
 * GET /api/players
 * List all players (accounts with profiles)
 */
router.get('/', authenticateAdmin, async (req, res) => {
	try {
		const allAccounts = await db.query.accounts.findMany({
			with: {
				profile: true,
			},
			orderBy: (accounts, { desc }) => [desc(accounts.createdAt)],
		});

		res.json(allAccounts);
	} catch (error) {
		sendServerError(res, error, 'Failed to fetch players', 'FETCH_FAILED');
	}
});

/**
 * GET /api/players/:id
 * Get player details with settlements
 */
router.get('/:id', authenticateAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		const account = await db.query.accounts.findFirst({
			where: eq(accounts.id, id),
			with: {
				profile: {
					with: {
						settlements: {
							with: {
								tile: {
									with: {
										region: {
											with: {
												world: true,
											},
										},
									},
								},
							},
						},
					},
				},
			},
		});

		if (!account) {
			return sendNotFoundError(res, 'Player not found');
		}

		res.json(account);
	} catch (error) {
		sendServerError(res, error, 'Failed to fetch player', 'FETCH_FAILED');
	}
});

/**
 * PUT /api/players/:id
 * Update player role (admin only)
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { role } = req.body;

		// Check if account exists
		const existing = await db.query.accounts.findFirst({
			where: eq(accounts.id, id),
		});

		if (!existing) {
			return sendNotFoundError(res, 'Player not found');
		}

		// Validate role
		if (role && !['MEMBER', 'SUPPORT', 'ADMINISTRATOR'].includes(role)) {
			return sendBadRequestError(
				res,
				'Invalid role. Must be MEMBER, SUPPORT, or ADMINISTRATOR'
			);
		}

		// Update account
		const [updated] = await db
			.update(accounts)
			.set({
				role: role || existing.role,
				updatedAt: new Date(),
			})
			.where(eq(accounts.id, id))
			.returning();

		logger.info(`[API] Updated player role: ${id} -> ${role}`);
		res.json(updated);
	} catch (error) {
		sendServerError(res, error, 'Failed to update player', 'UPDATE_FAILED');
	}
});

/**
 * DELETE /api/players/:id
 * Delete player account (admin only, cascade deletes profile and settlements)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		// Check if account exists
		const existing = await db.query.accounts.findFirst({
			where: eq(accounts.id, id),
			with: {
				profile: true,
			},
		});

		if (!existing) {
			return sendNotFoundError(res, 'Player not found');
		}

		// Delete account (cascade will handle profile and settlements)
		await db.delete(accounts).where(eq(accounts.id, id));

		logger.info(`[API] Deleted player: ${id} - ${existing.email}`);
		res.json({
			success: true,
			message: `Player "${(existing.profile && !Array.isArray(existing.profile) ? existing.profile.username : null) || existing.email}" deleted successfully`,
		});
	} catch (error) {
		sendServerError(res, error, 'Failed to delete player', 'DELETE_FAILED');
	}
});

export default router;
