/**
 * Test Helper Routes
 *
 * WARNING: These routes should ONLY be available in test/development environments
 * They provide dangerous operations like deleting users for test cleanup
 */

import { Router, Request, Response, NextFunction } from 'express';
import { db, accounts, profiles } from '../../db/index.js';
import { eq, like, desc } from 'drizzle-orm';
import { logger } from '../../utils/logger.js';
import { sendServerError, sendNotFoundError } from '../utils/responses.js';
import { isTest, isDevelopment } from '../../utils/environment.js';

const router = Router();

// Only enable these routes in test/development/e2e environments
const isTestEnvironment = isTest || isDevelopment;

if (!isTestEnvironment) {
	logger.warn('[TEST HELPERS] Test helper routes are disabled in production');
}

/**
 * Middleware to ensure test routes only work in test/dev/e2e
 */
const requireTestEnvironment = (req: Request, res: Response, next: NextFunction) => {
	if (!isTestEnvironment) {
		return res.status(403).json({
			error: 'Test helper routes are only available in test/development/e2e environments',
			code: 'FORBIDDEN',
		});
	}
	next();
};

/**
 * DELETE /api/test/cleanup/user/:email
 * Delete a test user and all associated data
 */
router.delete('/cleanup/user/:email', requireTestEnvironment, async (req, res) => {
	try {
		const { email } = req.params;

		logger.info(`[TEST CLEANUP] Cleaning up test user: ${email}`);

		// Find the user account
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.email, email),
		});

		if (!account) {
			logger.warn(`[TEST CLEANUP] User not found: ${email}`);
			return sendNotFoundError(res, 'User not found');
		}

		// Delete in order due to foreign key constraints:
		// 1. Profile (will cascade to other data)
		await db.delete(profiles).where(eq(profiles.accountId, account.id));
		logger.info(`[TEST CLEANUP] Deleted profile for: ${email}`);

		// 2. Account
		await db.delete(accounts).where(eq(accounts.id, account.id));
		logger.info(`[TEST CLEANUP] Deleted account: ${email}`);

		res.json({
			success: true,
			message: `Test user ${email} and associated data deleted successfully`,
		});
	} catch (error) {
		logger.error('[TEST CLEANUP] Failed to delete test user', error);
		sendServerError(res, error, 'Failed to delete test user', 'CLEANUP_FAILED');
	}
});

/**
 * DELETE /api/test/cleanup/users/pattern
 * Delete all test users matching a pattern (e.g., %.test.local)
 */
router.delete('/cleanup/users/pattern', requireTestEnvironment, async (req, res) => {
	try {
		const { pattern } = req.body;

		if (!pattern || typeof pattern !== 'string') {
			return res.status(400).json({
				error: 'Pattern is required',
				code: 'MISSING_PATTERN',
			});
		}

		logger.info(`[TEST CLEANUP] Cleaning up test users with pattern: ${pattern}`);

		// Find all matching accounts
		const matchingAccounts = await db
			.select()
			.from(accounts)
			.where(like(accounts.email, pattern));

		if (matchingAccounts.length === 0) {
			return res.json({
				success: true,
				message: 'No matching users found',
				deletedCount: 0,
			});
		}

		const accountIds = matchingAccounts.map((a) => a.id);

		// Delete in order due to foreign key constraints
		for (const accountId of accountIds) {
			// 1. Profile (will cascade to other data)
			await db.delete(profiles).where(eq(profiles.accountId, accountId));

			// 2. Account
			await db.delete(accounts).where(eq(accounts.id, accountId));
		}

		logger.info(`[TEST CLEANUP] Deleted ${accountIds.length} test users`);

		res.json({
			success: true,
			message: `Deleted ${accountIds.length} test users matching pattern: ${pattern}`,
			deletedCount: accountIds.length,
			deletedEmails: matchingAccounts.map((a) => a.email),
		});
	} catch (error) {
		logger.error('[TEST CLEANUP] Failed to delete test users by pattern', error);
		sendServerError(res, error, 'Failed to delete test users', 'CLEANUP_FAILED');
	}
});

/**
 * DELETE /api/test/cleanup/all
 * Delete ALL test users (emails ending with @test.local)
 */
router.delete('/cleanup/all', requireTestEnvironment, async (req, res) => {
	try {
		logger.info('[TEST CLEANUP] Cleaning up ALL test users (@test.local)');

		// Find all test accounts
		const testAccounts = await db
			.select()
			.from(accounts)
			.where(like(accounts.email, '%@test.local'));

		if (testAccounts.length === 0) {
			return res.json({
				success: true,
				message: 'No test users found',
				deletedCount: 0,
			});
		}

		const accountIds = testAccounts.map((a) => a.id);

		// Delete in order due to foreign key constraints
		for (const accountId of accountIds) {
			await db.delete(profiles).where(eq(profiles.accountId, accountId));
			await db.delete(accounts).where(eq(accounts.id, accountId));
		}

		logger.info(`[TEST CLEANUP] Deleted ${accountIds.length} test users`);

		res.json({
			success: true,
			message: `Deleted ${accountIds.length} test users`,
			deletedCount: accountIds.length,
			deletedEmails: testAccounts.map((a) => a.email),
		});
	} catch (error) {
		logger.error('[TEST CLEANUP] Failed to delete all test users', error);
		sendServerError(res, error, 'Failed to delete test users', 'CLEANUP_FAILED');
	}
});

/**
 * GET /api/test/users
 * List all test users (emails ending with @test.local)
 */
router.get('/users', requireTestEnvironment, async (req, res) => {
	try {
		const testAccounts = await db
			.select({
				id: accounts.id,
				email: accounts.email,
				username: profiles.username,
				createdAt: accounts.createdAt,
			})
			.from(accounts)
			.leftJoin(profiles, eq(profiles.accountId, accounts.id))
			.where(like(accounts.email, '%@test.local'))
			.orderBy(desc(accounts.createdAt));

		res.json({
			success: true,
			count: testAccounts.length,
			users: testAccounts,
		});
	} catch (error) {
		logger.error('[TEST CLEANUP] Failed to list test users', error);
		sendServerError(res, error, 'Failed to list test users', 'LIST_FAILED');
	}
});

/**
 * PUT /api/test/elevate-admin/:email
 * Elevate a test user to ADMINISTRATOR role
 *
 * This endpoint allows E2E tests to bootstrap admin users without direct database access.
 * Production admins should be created by operations team via database or separate admin tools.
 */
router.put('/elevate-admin/:email', requireTestEnvironment, async (req, res) => {
	try {
		const { email } = req.params;

		logger.info(`[TEST HELPERS] Elevating user to ADMINISTRATOR: ${email}`);

		// Find the user account
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.email, email),
		});

		if (!account) {
			logger.warn(`[TEST HELPERS] User not found: ${email}`);
			return sendNotFoundError(res, 'User not found');
		}

		// Update role to ADMINISTRATOR
		await db
			.update(accounts)
			.set({
				role: 'ADMINISTRATOR',
				updatedAt: new Date(),
			})
			.where(eq(accounts.id, account.id));

		logger.info(`[TEST HELPERS] User elevated to ADMINISTRATOR: ${email}`);

		res.json({
			success: true,
			message: `User ${email} elevated to ADMINISTRATOR`,
			accountId: account.id,
			email: account.email,
			role: 'ADMINISTRATOR',
		});
	} catch (error) {
		logger.error('[TEST HELPERS] Failed to elevate user to admin', error);
		sendServerError(res, error, 'Failed to elevate user to admin', 'ELEVATION_FAILED');
	}
});

export default router;
