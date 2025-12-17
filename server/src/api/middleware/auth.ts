/**
 * Authentication Middleware for REST API
 *
 * Validates admin access for API endpoints
 */

import type { Request, Response, NextFunction } from 'express';
import { db } from '../../db/index.js';
import { accounts } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../../utils/logger.js';
import { setUserContext } from '../../utils/sentry.js';

// Type alias for account roles
type AccountRole = 'MEMBER' | 'SUPPORT' | 'ADMINISTRATOR';

// Extend Express Request to include authenticated user
declare module 'express-serve-static-core' {
	interface Request {
		user?: {
			id: string;
			profileId: string;
			email: string;
			username: string;
			role: AccountRole;
		};
	}
}

/**
 * Extract session token from cookies
 * @param cookies - Cookie header string
 * @returns Session token or null
 */
function extractSessionToken(cookies: string | undefined): string | null {
	if (!cookies) {
		return null;
	}

	const sessionRegex = /session=([^;]+)/;
	const sessionMatch = sessionRegex.exec(cookies);
	return sessionMatch ? sessionMatch[1] : null;
}

/**
 * Validate session token and fetch user from database
 * @param sessionToken - Session token to validate
 * @returns User account or null
 */
async function validateSessionToken(sessionToken: string) {
	logger.info('[API AUTH] Validating session token', {
		sessionToken: sessionToken.substring(0, 8) + '...',
		fullTokenLength: sessionToken.length,
	});

	const account = await db.query.accounts.findFirst({
		where: eq(accounts.userAuthToken, sessionToken),
		with: {
			profile: true,
		},
	});

	logger.info('[API AUTH] Account lookup result', {
		found: !!account,
		accountId: account?.id,
		email: account?.email,
		role: account?.role,
		hasProfile: !!account?.profile,
		userAuthTokenMatches: account?.userAuthToken === sessionToken,
	});

	return account;
}

/**
 * Send unauthorized error response
 */
function sendUnauthorizedResponse(res: Response, code: string, message: string): void {
	res.status(401).json({
		error: 'Unauthorized',
		code,
		message,
	});
}

/**
 * Authentication middleware for admin routes
 *
 * Validates session cookie from SvelteKit and checks for ADMINISTRATOR role.
 * Session cookie contains userAuthToken which is used to look up the user.
 */
export const authenticateAdmin = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const cookies = req.headers.cookie;
		const sessionToken = extractSessionToken(cookies);

		const reqLogger = req.logger || logger;

		if (!sessionToken) {
			reqLogger.warn('[API AUTH] No session token found');
			sendUnauthorizedResponse(res, 'NO_SESSION', 'Authentication required');
			return;
		}

		const user = await validateSessionToken(sessionToken);

		if (!user) {
			reqLogger.warn('[API AUTH] Invalid session token', {
				sessionToken: sessionToken.substring(0, 8) + '...',
			});
			sendUnauthorizedResponse(res, 'INVALID_SESSION', 'Invalid or expired session');
			return;
		}

		// Check if user has ADMINISTRATOR role
		if (user.role !== 'ADMINISTRATOR') {
			reqLogger.warn(`[API AUTH] User attempted admin access without permissions`, {
				email: user.email,
				role: user.role,
			});
			res.status(403).json({
				error: 'Forbidden',
				code: 'NOT_ADMIN',
				message: 'Administrator access required',
			});
			return;
		}

		// Attach user to request
		req.user = {
			id: user.id,
			profileId: user.profile && !Array.isArray(user.profile) ? user.profile.id : '',
			email: user.email,
			username:
				(user.profile && !Array.isArray(user.profile) ? user.profile.username : null) ||
				user.email,
			role: user.role,
		};

		// Set Sentry user context for error tracking
		setUserContext({
			id: user.id,
			email: user.email,
			username: req.user.username,
		});

		reqLogger.info(`[API AUTH] ✓ Admin authenticated`, { email: user.email, userId: user.id });
		next();
	} catch (error) {
		const reqLogger = req.logger || logger;
		reqLogger.error('[API AUTH] Authentication error', error);
		res.status(500).json({
			error: 'Internal Server Error',
			code: 'AUTH_ERROR',
			message: 'Authentication failed',
		});
	}
};

/**
 * Authentication middleware for any authenticated user (not just admin)
 *
 * Validates session cookie and ensures user is logged in.
 */
export const authenticate = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const reqLogger = req.logger || logger;

		// ✅ DEBUG: Log all authentication attempts
		reqLogger.info('[API AUTH] Authentication attempt', {
			method: req.method,
			path: req.path,
			hasCookieHeader: !!req.headers.cookie,
			cookieHeaderPreview: req.headers.cookie?.substring(0, 50) + '...',
		});

		const cookies = req.headers.cookie;
		const sessionToken = extractSessionToken(cookies);

		if (!sessionToken) {
			reqLogger.warn('[API AUTH] No session token found', {
				cookieHeader: req.headers.cookie,
			});
			sendUnauthorizedResponse(res, 'NO_SESSION', 'Authentication required');
			return;
		}

		const user = await validateSessionToken(sessionToken);

		if (!user) {
			reqLogger.warn('[API AUTH] Invalid session token', {
				sessionToken: sessionToken.substring(0, 8) + '...',
			});
			sendUnauthorizedResponse(res, 'INVALID_SESSION', 'Invalid or expired session');
			return;
		}

		// Attach user to request (no role check)
		req.user = {
			id: user.id,
			profileId: user.profile && !Array.isArray(user.profile) ? user.profile.id : '',
			email: user.email,
			username:
				(user.profile && !Array.isArray(user.profile) ? user.profile.username : null) ||
				user.email,
			role: user.role,
		};

		// Set Sentry user context for error tracking
		setUserContext({
			id: user.id,
			email: user.email,
			username: req.user.username,
		});

		reqLogger.info(`[API AUTH] ✓ User authenticated`, { email: user.email, userId: user.id });
		next();
	} catch (error) {
		const reqLogger = req.logger || logger;
		reqLogger.error('[API AUTH] Authentication error', error);
		res.status(500).json({
			error: 'Internal Server Error',
			code: 'AUTH_ERROR',
			message: 'Authentication failed',
		});
	}
};

/**
 * Optional authentication (allows unauthenticated access but attaches user if present)
 */
export const optionalAuth = async (
	req: Request,
	res: Response,
	next: NextFunction
): Promise<void> => {
	try {
		const cookies = req.headers.cookie;
		const sessionToken = extractSessionToken(cookies);

		if (!sessionToken) {
			next();
			return;
		}

		const user = await validateSessionToken(sessionToken);

		if (user) {
			req.user = {
				id: user.id,
				profileId: user.profile && !Array.isArray(user.profile) ? user.profile.id : '',
				email: user.email,
				username:
					(user.profile && !Array.isArray(user.profile) ? user.profile.username : null) ||
					user.email,
				role: user.role,
			};

			// Set Sentry user context for error tracking
			setUserContext({
				id: user.id,
				email: user.email,
				username: req.user.username,
			});

			logger.info(`[API AUTH] Optional auth: ${user.email} (${user.role})`);
		}

		next();
	} catch (error) {
		logger.error('[API AUTH] Optional auth error:', error);
		next(); // Continue even if auth fails
	}
};
