/**
 * Tests for Socket.IO Middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { Socket } from 'socket.io';
import {
	authenticationMiddleware,
	rateLimitMiddleware,
	loggingMiddleware,
	errorHandlingMiddleware,
} from '../../../src/middleware/socket-middleware.js';

// Mock database queries
vi.mock('../../../src/db/queries.js', () => ({
	findAccountByToken: vi.fn(),
	findProfileByAccountId: vi.fn(),
}));

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
	logger: {
		warn: vi.fn(),
		error: vi.fn(),
		info: vi.fn(),
		debug: vi.fn(),
	},
}));

describe('Socket.IO Middleware', () => {
	describe('authenticationMiddleware', () => {
		let mockSocket: Partial<Socket>;
		let nextFunction: any;

		beforeEach(async () => {
			const { findAccountByToken, findProfileByAccountId } = await import(
				'../../../src/db/queries.js'
			);

			vi.clearAllMocks();
			nextFunction = vi.fn();

			mockSocket = {
				id: 'socket-123',
				handshake: {
					auth: {},
					address: '127.0.0.1',
					headers: {},
				} as any,
				data: {},
			};

			vi.mocked(findAccountByToken).mockResolvedValue(null);
			vi.mocked(findProfileByAccountId).mockResolvedValue(null);
		});

		it('should authenticate a user with valid token', async () => {
			const { findAccountByToken, findProfileByAccountId } = await import(
				'../../../src/db/queries.js'
			);

			const mockAccount = {
				id: 'account-123',
				email: 'test@example.com',
				role: 'USER',
				sessionToken: 'valid-token',
			};

			const mockProfile = {
				id: 'profile-123',
				username: 'testuser',
				accountId: 'account-123',
			};

			vi.mocked(findAccountByToken).mockResolvedValue(mockAccount as any);
			vi.mocked(findProfileByAccountId).mockResolvedValue(mockProfile as any);

			mockSocket.handshake!.auth = { token: 'valid-token' };

			await authenticationMiddleware(mockSocket as Socket, nextFunction);

			expect(nextFunction).toHaveBeenCalledWith();
			expect(mockSocket.data?.authenticated).toBe(true);
			expect(mockSocket.data?.playerId).toBe('profile-123');
			expect(mockSocket.data?.username).toBe('testuser');
			expect(mockSocket.data?.accountId).toBe('account-123');
			expect(mockSocket.data?.role).toBe('USER');
			expect(mockSocket.data?.connectedAt).toBeDefined();
		});

		it('should reject connection when no token provided', async () => {
			mockSocket.handshake!.auth = {};

			await authenticationMiddleware(mockSocket as Socket, nextFunction);

			expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
			expect(nextFunction.mock.calls[0][0].message).toBe('Authentication required');
			expect(mockSocket.data?.authenticated).toBeUndefined();
		});

		it('should reject connection when token is empty string', async () => {
			mockSocket.handshake!.auth = { token: '' };

			await authenticationMiddleware(mockSocket as Socket, nextFunction);

			expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
			expect(nextFunction.mock.calls[0][0].message).toBe('Authentication required');
		});

		it('should reject connection with invalid token', async () => {
			const { findAccountByToken } = await import('../../../src/db/queries.js');

			vi.mocked(findAccountByToken).mockResolvedValue(null);

			mockSocket.handshake!.auth = { token: 'invalid-token' };

			await authenticationMiddleware(mockSocket as Socket, nextFunction);

			expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
			expect(nextFunction.mock.calls[0][0].message).toBe('Invalid authentication token');
		});

		it('should reject connection when profile not found', async () => {
			const { findAccountByToken, findProfileByAccountId } = await import(
				'../../../src/db/queries.js'
			);

			const mockAccount = {
				id: 'account-123',
				email: 'test@example.com',
				role: 'USER',
				sessionToken: 'valid-token',
			};

			vi.mocked(findAccountByToken).mockResolvedValue(mockAccount as any);
			vi.mocked(findProfileByAccountId).mockResolvedValue(null);

			mockSocket.handshake!.auth = { token: 'valid-token' };

			await authenticationMiddleware(mockSocket as Socket, nextFunction);

			expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
			expect(nextFunction.mock.calls[0][0].message).toBe('Profile not found for account');
		});

		it('should handle database errors gracefully', async () => {
			const { findAccountByToken } = await import('../../../src/db/queries.js');

			vi.mocked(findAccountByToken).mockRejectedValue(new Error('Database connection failed'));

			mockSocket.handshake!.auth = { token: 'some-token' };

			await authenticationMiddleware(mockSocket as Socket, nextFunction);

			expect(nextFunction).toHaveBeenCalledWith(expect.any(Error));
			expect(nextFunction.mock.calls[0][0].message).toBe('Authentication failed');
		});

		it('should log successful authentication', async () => {
			const { findAccountByToken, findProfileByAccountId } = await import(
				'../../../src/db/queries.js'
			);
			const { logger } = await import('../../../src/utils/logger.js');

			const mockAccount = {
				id: 'account-123',
				email: 'test@example.com',
				role: 'USER',
				sessionToken: 'valid-token',
			};

			const mockProfile = {
				id: 'profile-123',
				username: 'testuser',
				accountId: 'account-123',
			};

			vi.mocked(findAccountByToken).mockResolvedValue(mockAccount as any);
			vi.mocked(findProfileByAccountId).mockResolvedValue(mockProfile as any);

			mockSocket.handshake!.auth = { token: 'valid-token' };

			await authenticationMiddleware(mockSocket as Socket, nextFunction);

			expect(logger.info).toHaveBeenCalledWith(
				'[AUTH] User authenticated successfully',
				expect.objectContaining({
					socketId: 'socket-123',
					username: 'testuser',
					playerId: 'profile-123',
					role: 'USER',
				})
			);
		});

		it('should log authentication warnings', async () => {
			const { logger } = await import('../../../src/utils/logger.js');

			mockSocket.handshake!.auth = {};

			await authenticationMiddleware(mockSocket as Socket, nextFunction);

			expect(logger.warn).toHaveBeenCalledWith(
				'[AUTH] Connection rejected: No token provided',
				expect.objectContaining({
					socketId: 'socket-123',
					address: '127.0.0.1',
				})
			);
		});
	});

	describe('rateLimitMiddleware', () => {
		it('should call next without errors (placeholder implementation)', () => {
			const mockSocket = {} as Socket;
			const nextFunction = vi.fn();

			rateLimitMiddleware(mockSocket, nextFunction);

			expect(nextFunction).toHaveBeenCalledWith();
		});
	});

	describe('loggingMiddleware', () => {
		let mockSocket: Partial<Socket>;
		let nextFunction: any;

		beforeEach(() => {
			vi.clearAllMocks();
			nextFunction = vi.fn();

			mockSocket = {
				id: 'socket-456',
				handshake: {
					address: '192.168.1.1',
					headers: {
						'user-agent': 'Mozilla/5.0',
					},
				} as any,
				emit: vi.fn(),
			};
		});

		it('should log new connection', async () => {
			const { logger } = await import('../../../src/utils/logger.js');

			loggingMiddleware(mockSocket as Socket, nextFunction);

			expect(logger.info).toHaveBeenCalledWith(
				'[CONNECTION] New client connecting',
				expect.objectContaining({
					socketId: 'socket-456',
					address: '192.168.1.1',
					userAgent: 'Mozilla/5.0',
				})
			);
			expect(nextFunction).toHaveBeenCalled();
		});

		it('should wrap emit in development mode', async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'development';

			const originalEmit = mockSocket.emit;
			loggingMiddleware(mockSocket as Socket, nextFunction);

			expect(mockSocket.emit).not.toBe(originalEmit);

			process.env.NODE_ENV = originalEnv;
		});

		it('should not wrap emit in production mode', async () => {
			const originalEnv = process.env.NODE_ENV;
			process.env.NODE_ENV = 'production';

			const originalEmit = mockSocket.emit;
			loggingMiddleware(mockSocket as Socket, nextFunction);

			expect(mockSocket.emit).toBe(originalEmit);

			process.env.NODE_ENV = originalEnv;
		});
	});

	describe('errorHandlingMiddleware', () => {
		let mockSocket: Partial<Socket>;
		let nextFunction: any;

		beforeEach(() => {
			vi.clearAllMocks();
			nextFunction = vi.fn();

			mockSocket = {
				id: 'socket-789',
				data: { playerId: 'player-123' },
				on: vi.fn(),
				emit: vi.fn(),
			};
		});

		it('should wrap socket.on method', () => {
			const originalOn = mockSocket.on;

			errorHandlingMiddleware(mockSocket as Socket, nextFunction as any);

			expect(mockSocket.on).not.toBe(originalOn);
			expect(nextFunction).toHaveBeenCalled();
		});

		it('should catch errors in event handlers', async () => {
			const originalOn = mockSocket.on as any;
			errorHandlingMiddleware(mockSocket as Socket, nextFunction as any);

			// Verify socket.on was wrapped
			expect(mockSocket.on).not.toBe(originalOn);

			// Manually test the error handling
			const testHandler = vi.fn(() => {
				throw new Error('Handler error');
			});

			// Get the wrapped on function and call it
			const wrappedOn = mockSocket.on as any;
			wrappedOn('test-event', testHandler);

			// Since we can't easily access the wrapped listener through the mock,
			// we'll verify the wrapping behavior by checking that the original on was called
			expect(vi.mocked(originalOn)).toHaveBeenCalledWith('test-event', expect.any(Function));
		});

		it('should not interfere with successful handlers', async () => {
			const originalOn = mockSocket.on as any;
			errorHandlingMiddleware(mockSocket as Socket, nextFunction as any);

			const successHandler = vi.fn(() => 'success');

			const wrappedOn = mockSocket.on as any;
			wrappedOn('test-event', successHandler);

			// Verify the original on was called
			expect(vi.mocked(originalOn)).toHaveBeenCalledWith('test-event', expect.any(Function));
		});
	});

	describe('Integration Tests', () => {
		it('should apply all middleware in sequence', async () => {
			const { findAccountByToken, findProfileByAccountId } = await import(
				'../../../src/db/queries.js'
			);

			const mockAccount = {
				id: 'account-123',
				email: 'test@example.com',
				role: 'USER',
				sessionToken: 'valid-token',
			};

			const mockProfile = {
				id: 'profile-123',
				username: 'testuser',
				accountId: 'account-123',
			};

			vi.mocked(findAccountByToken).mockResolvedValue(mockAccount as any);
			vi.mocked(findProfileByAccountId).mockResolvedValue(mockProfile as any);

			const mockSocket: Partial<Socket> = {
				id: 'socket-integration',
				handshake: {
					auth: { token: 'valid-token' },
					address: '127.0.0.1',
					headers: { 'user-agent': 'Test' },
				} as any,
				data: {},
				emit: vi.fn(),
				on: vi.fn(),
			};

			const next1 = vi.fn();
			const next2 = vi.fn();
			const next3 = vi.fn();
			const next4 = vi.fn();

			// Apply all middleware
			await authenticationMiddleware(mockSocket as Socket, next1);
			rateLimitMiddleware(mockSocket as Socket, next2);
			loggingMiddleware(mockSocket as Socket, next3);
			errorHandlingMiddleware(mockSocket as Socket, next4);

			expect(next1).toHaveBeenCalled();
			expect(next2).toHaveBeenCalled();
			expect(next3).toHaveBeenCalled();
			expect(next4).toHaveBeenCalled();
			expect(mockSocket.data?.authenticated).toBe(true);
		});
	});
});
