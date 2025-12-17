/**
 * Account API Routes
 *
 * User account operations (non-admin)
 */

import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db, accounts } from '../../db/index.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';

const router = Router();

/**
 * GET /api/account/me
 * Get current user's account with profile
 */
router.get('/me', authenticate, async (req, res) => {
	try {
		if (!req.user) {
			return res.status(401).json({
				error: 'Unauthorized',
				code: 'NO_USER',
			});
		}

		const account = await db.query.accounts.findFirst({
			where: eq(accounts.id, req.user.id),
			with: {
				profile: true,
			},
		});

		if (!account) {
			return res.status(404).json({
				error: 'Account not found',
				code: 'NOT_FOUND',
			});
		}

		// Remove password hash for security
		const accountWithoutPassword = {
			...account,
			passwordHash: '',
		};

		res.json(accountWithoutPassword);
	} catch (error) {
		logger.error('[API] Error fetching account:', error);
		res.status(500).json({
			error: 'Failed to fetch account',
			code: 'FETCH_FAILED',
		});
	}
});

export default router;
