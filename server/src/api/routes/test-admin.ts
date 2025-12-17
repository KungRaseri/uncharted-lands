/**
 * Test-only endpoints for E2E testing infrastructure
 *
 * These endpoints are ONLY available when TEST_ADMIN_TOKEN is set in environment.
 * They bypass normal authentication to enable test setup (e.g., creating admin users).
 *
 * SECURITY: Never deploy with TEST_ADMIN_TOKEN set in production!
 */

import express from 'express';
import { db } from '../../db';
import { accounts } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '../../utils/logger.js';

const router = express.Router();

// Test admin token from environment (should only be set in test environments)
const TEST_ADMIN_TOKEN = process.env.TEST_ADMIN_TOKEN;

/**
 * Middleware to verify test admin token
 * This prevents accidental use of test endpoints in production
 */
function authenticateTestToken(
	req: express.Request,
	res: express.Response,
	next: express.NextFunction
) {
	// If no TEST_ADMIN_TOKEN is set, these endpoints are disabled
	if (!TEST_ADMIN_TOKEN) {
		return res.status(404).json({
			error: 'NOT_FOUND',
			message: 'Test endpoints are disabled (TEST_ADMIN_TOKEN not set)',
		});
	}

	const providedToken = req.headers['x-test-admin-token'];

	if (!providedToken || providedToken !== TEST_ADMIN_TOKEN) {
		return res.status(401).json({
			error: 'UNAUTHORIZED',
			message: 'Invalid test admin token',
		});
	}

	next();
}

/**
 * POST /api/test-admin/elevate-user
 * Elevate a user to ADMINISTRATOR role
 *
 * Body: { email: string } or { accountId: string }
 */
router.post('/elevate-user', authenticateTestToken, async (req, res) => {
	try {
		const { email, accountId } = req.body;

		if (!email && !accountId) {
			return res.status(400).json({
				error: 'INVALID_REQUEST',
				message: 'Either email or accountId must be provided',
			});
		}

		// Update user role to ADMINISTRATOR
		const whereClause = email ? eq(accounts.email, email) : eq(accounts.id, accountId);

		const result = await db
			.update(accounts)
			.set({
				role: 'ADMINISTRATOR',
				updatedAt: new Date(),
			})
			.where(whereClause)
			.returning();

		if (result.length === 0) {
			return res.status(404).json({
				error: 'USER_NOT_FOUND',
				message: 'No user found with provided email or accountId',
			});
		}

		const updatedAccount = result[0];

		res.json({
			success: true,
			message: 'User elevated to ADMINISTRATOR',
			accountId: updatedAccount.id,
			email: updatedAccount.email,
			role: updatedAccount.role,
		});
	} catch (error) {
		logger.error('[TEST-ADMIN] Error elevating user:', error);
		res.status(500).json({
			error: 'INTERNAL_ERROR',
			message: 'Failed to elevate user',
		});
	}
});

/**
 * POST /api/test-admin/reset-user-role
 * Reset a user's role back to MEMBER (for test cleanup)
 *
 * Body: { email: string } or { accountId: string }
 */
router.post('/reset-user-role', authenticateTestToken, async (req, res) => {
	try {
		const { email, accountId } = req.body;

		if (!email && !accountId) {
			return res.status(400).json({
				error: 'INVALID_REQUEST',
				message: 'Either email or accountId must be provided',
			});
		}

		const whereClause = email ? eq(accounts.email, email) : eq(accounts.id, accountId);

		const result = await db
			.update(accounts)
			.set({
				role: 'MEMBER',
				updatedAt: new Date(),
			})
			.where(whereClause)
			.returning();

		if (result.length === 0) {
			return res.status(404).json({
				error: 'USER_NOT_FOUND',
				message: 'No user found with provided email or accountId',
			});
		}

		res.json({
			success: true,
			message: 'User role reset to MEMBER',
			accountId: result[0].id,
		});
	} catch (error) {
		logger.error('[TEST-ADMIN] Error resetting user role:', error);
		res.status(500).json({
			error: 'INTERNAL_ERROR',
			message: 'Failed to reset user role',
		});
	}
});

/**
 * GET /api/test-admin/health
 * Health check for test endpoints (verifies token works)
 */
router.get('/health', authenticateTestToken, (req, res) => {
	res.json({
		success: true,
		message: 'Test admin endpoints are available',
		timestamp: new Date().toISOString(),
	});
});

export default router;
