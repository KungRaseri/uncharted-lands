/**
 * Socket.IO Middleware
 *
 * Middleware functions for authentication, validation, and error handling
 */

import type { Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { findAccountByToken, findProfileByAccountId } from '../db/queries.js';

// Type for Socket.IO middleware error
type ExtendedError = Error & { data?: unknown };

/**
 * Authentication middleware
 * Validates connection before allowing socket to connect
 */
export async function authenticationMiddleware(
	socket: Socket,
	next: (err?: ExtendedError) => void
): Promise<void> {
	try {
		// Extract auth data from handshake
		const { auth } = socket.handshake;
		const token = auth?.token as string;

		// Check if token is provided
		if (!token || token.length === 0) {
			logger.warn('[AUTH] Connection rejected: No token provided', {
				socketId: socket.id,
				address: socket.handshake.address,
			});
			return next(new Error('Authentication required'));
		}

		// Look up account by token
		const account = await findAccountByToken(token);

		if (!account) {
			logger.warn('[AUTH] Connection rejected: Invalid token', {
				socketId: socket.id,
				address: socket.handshake.address,
			});
			return next(new Error('Invalid authentication token'));
		}

		// Get profile for this account
		const profile = await findProfileByAccountId(account.id);

		if (!profile) {
			logger.error('[AUTH] Connection rejected: Profile not found for account', {
				socketId: socket.id,
				accountId: account.id,
			});
			return next(new Error('Profile not found for account'));
		}

		// Attach user data to socket
		socket.data.authenticated = true;
		socket.data.playerId = profile.id;
		socket.data.username = profile.username;
		socket.data.accountId = account.id;
		socket.data.role = account.role;
		socket.data.connectedAt = Date.now();

		logger.info('[AUTH] User authenticated successfully', {
			socketId: socket.id,
			username: profile.username,
			playerId: profile.id,
			role: account.role,
		});

		next();
	} catch (error) {
		logger.error('[AUTH] Authentication error:', error);
		next(new Error('Authentication failed'));
	}
}

/**
 * Rate limiting middleware
 * Prevents spam by limiting event frequency
 */
export function rateLimitMiddleware(socket: Socket, next: (err?: ExtendedError) => void): void {
	// TODO: Implement rate limiting
	// Track events per socket per time window
	// Reject if exceeds threshold
	next();
}

/**
 * Logging middleware
 * Logs all incoming events for debugging
 */
export function loggingMiddleware(socket: Socket, next: (err?: ExtendedError) => void): void {
	// Log connection
	logger.info('[CONNECTION] New client connecting', {
		socketId: socket.id,
		address: socket.handshake.address,
		userAgent: socket.handshake.headers['user-agent'],
	});

	// Wrap emit to log outgoing events in development
	if (process.env.NODE_ENV === 'development') {
		const originalEmit = socket.emit.bind(socket);
		socket.emit = ((event: string, ...args: unknown[]) => {
			logger.debug(`[EMIT] ${event}`, { socketId: socket.id });
			return originalEmit(event, ...args);
		}) as typeof socket.emit;
	}

	next();
}

/**
 * Error handling middleware
 * Catches and logs errors before they crash the server
 */
export function errorHandlingMiddleware(socket: Socket, next: (err?: ExtendedError) => void): void {
	// Wrap socket event handlers with try-catch
	const originalOn = socket.on.bind(socket);
	socket.on = ((event: string, listener: (...args: unknown[]) => void) => {
		const wrappedListener = (...args: unknown[]) => {
			try {
				listener(...args);
			} catch (error) {
				logger.error(`[ERROR] Error in ${event} handler:`, error, {
					socketId: socket.id,
					playerId: socket.data.playerId,
				});

				// Emit error to client
				socket.emit('error', {
					code: 'HANDLER_ERROR',
					message: 'An error occurred processing your request',
					timestamp: Date.now(),
				});
			}
		};
		return originalOn(event, wrappedListener);
	}) as typeof socket.on;

	next();
}
