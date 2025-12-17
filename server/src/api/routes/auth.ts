import { Router } from 'express';
import { db } from '../../db/index.js';
import { accounts } from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { logger } from '../../utils/logger.js';
import { strictLimiter } from '../middleware/rateLimit.js';
import bcrypt from 'bcrypt';

const router = Router();
const BCRYPT_ROUNDS = 10; // Standard bcrypt salt rounds

/**
 * POST /api/auth/register
 * Register a new user account
 * Note: Username is optional and can be set later when joining a world
 *
 * Rate limited to prevent user enumeration attacks
 */
router.post('/register', strictLimiter, async (req, res) => {
	const requestId = createId().slice(0, 8);

	try {
		const { email, password, username } = req.body;

		logger.debug('[AUTH] Registration attempt', {
			requestId,
			email: email ? `${email.substring(0, 3)}***` : 'missing',
			hasPassword: !!password,
			hasUsername: !!username,
		});

		// Validate required fields
		if (!email || !password) {
			logger.warn('[AUTH] Registration failed - missing required fields', {
				requestId,
				hasEmail: !!email,
				hasPassword: !!password,
			});
			return res.status(400).json({
				error: 'Email and password are required',
				code: 'MISSING_FIELDS',
			});
		}

		// Validate password length (minimum 16 characters)
		if (password.length < 16) {
			logger.warn('[AUTH] Registration failed - password too short', {
				requestId,
				passwordLength: password.length,
			});
			return res.status(400).json({
				error: 'Password must be at least 16 characters long',
				code: 'PASSWORD_TOO_SHORT',
			});
		}

		// Check if account already exists
		let existingAccount;
		try {
			existingAccount = await db.query.accounts.findFirst({
				where: eq(accounts.email, email),
			});
		} catch (dbError) {
			logger.error('[AUTH] Database query failed while checking existing account', {
				requestId,
				error: dbError,
				email: `${email.substring(0, 3)}***`,
			});
			return res.status(500).json({
				error: 'Database error. Please try again later.',
				code: 'DATABASE_ERROR',
			});
		}

		if (existingAccount) {
			logger.info('[AUTH] Registration failed - email already registered', {
				requestId,
				email: `${email.substring(0, 3)}***`,
				existingAccountId: existingAccount.id,
			});
			return res.status(400).json({
				error: 'An account with this email already exists',
				code: 'EMAIL_EXISTS',
			});
		}

		// Hash the password using bcrypt
		logger.debug('[AUTH] Hashing password', { requestId });
		const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

		// Create account
		const accountId = createId();
		const userAuthToken = createId();

		logger.debug('[AUTH] Creating new account', { requestId, accountId });

		// Create account (but NOT profile - that happens during onboarding)
		try {
			await db.insert(accounts).values({
				id: accountId,
				email,
				passwordHash, // Store the bcrypt hash
				userAuthToken,
				role: 'MEMBER',
				createdAt: new Date(),
				updatedAt: new Date(),
			});
		} catch (dbError) {
			logger.error('[AUTH] Database error during account creation', {
				requestId,
				error: dbError,
				accountId,
			});
			return res.status(500).json({
				error: 'Failed to create account. Please try again later.',
				code: 'DATABASE_ERROR',
			});
		}

		logger.info('[AUTH] ✓ Account created successfully', {
			requestId,
			accountId,
			email: `${email.substring(0, 3)}***`,
		});

		// Fetch the created account with profile
		const newAccount = await db.query.accounts.findFirst({
			where: eq(accounts.id, accountId),
			with: {
				profile: true,
			},
		});

		res.status(201).json({
			success: true,
			account: newAccount,
		});
	} catch (error) {
		logger.error('[AUTH] Registration error', error, { requestId });
		res.status(500).json({
			error: 'Failed to register account',
			code: 'SERVER_ERROR',
		});
	}
});

/**
 * POST /api/auth/login
 * Login with email and password
 *
 * Rate limited to prevent brute force attacks
 */
router.post('/login', strictLimiter, async (req, res) => {
	const requestId = createId().slice(0, 8);

	try {
		const { email, password } = req.body;

		logger.debug('[AUTH] Login attempt', {
			requestId,
			email: email ? `${email.substring(0, 3)}***` : 'missing',
			hasPassword: !!password,
		});

		if (!email || !password) {
			logger.warn('[AUTH] Login failed - missing credentials', { requestId });
			return res.status(400).json({
				error: 'Email and password are required',
				code: 'MISSING_FIELDS',
			});
		}

		// Find account
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.email, email),
			with: {
				profile: true,
			},
		});

		if (!account) {
			logger.info('[AUTH] Login failed - account not found', {
				requestId,
				email: `${email.substring(0, 3)}***`,
			});
			return res.status(401).json({
				error: 'Invalid email or password',
				code: 'INVALID_CREDENTIALS',
			});
		}

		// Compare password using bcrypt
		logger.debug('[AUTH] Comparing password', { requestId });
		const passwordMatches = await bcrypt.compare(password, account.passwordHash);

		if (!passwordMatches) {
			logger.info('[AUTH] Login failed - incorrect password', {
				requestId,
				accountId: account.id,
			});
			return res.status(401).json({
				error: 'Invalid email or password',
				code: 'INVALID_CREDENTIALS',
			});
		}

		// Generate new auth token
		const newAuthToken = createId();

		await db
			.update(accounts)
			.set({
				userAuthToken: newAuthToken,
				updatedAt: new Date(),
			})
			.where(eq(accounts.id, account.id));

		logger.info('[AUTH] ✓ Login successful', {
			requestId,
			accountId: account.id,
			email: `${email.substring(0, 3)}***`,
		});

		res.json({
			success: true,
			account: {
				...account,
				userAuthToken: newAuthToken,
			},
		});
	} catch (error) {
		logger.error('[AUTH] Login error', error, { requestId });
		res.status(500).json({
			error: 'Failed to login',
			code: 'SERVER_ERROR',
		});
	}
});

/**
 * POST /api/auth/validate
 * Validate a session token
 */
router.post('/validate', async (req, res) => {
	const requestId = createId().slice(0, 8);

	try {
		const { token } = req.body;

		logger.debug('[AUTH] Token validation attempt', {
			requestId,
			hasToken: !!token,
		});

		if (!token) {
			logger.warn('[AUTH] Validation failed - no token provided', { requestId });
			return res.status(400).json({
				error: 'Token is required',
				code: 'MISSING_TOKEN',
			});
		}

		const account = await db.query.accounts.findFirst({
			where: eq(accounts.userAuthToken, token),
			with: {
				profile: true,
			},
		});

		if (!account) {
			logger.info('[AUTH] Validation failed - invalid token', {
				requestId,
				token: `${token.substring(0, 8)}***`,
			});
			return res.status(401).json({
				error: 'Invalid token',
				code: 'INVALID_TOKEN',
			});
		}

		logger.debug('[AUTH] ✓ Token validated', {
			requestId,
			accountId: account.id,
		});

		res.json({
			success: true,
			account,
		});
	} catch (error) {
		logger.error('[AUTH] Validation error', error, { requestId });
		res.status(500).json({
			error: 'Failed to validate token',
			code: 'SERVER_ERROR',
		});
	}
});

export default router;
