/**
 * Authentication Middleware Tests
 *
 * Tests for authenticate(), authenticateAdmin(), and optionalAuth() middleware
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { authenticateAdmin, authenticate, optionalAuth } from '../../../src/api/middleware/auth.js';
import {
	createMockRequest,
	createMockResponse,
	createMockNext,
	expectUnauthorizedError,
	expectForbiddenError,
	expectServerError,
} from '../../helpers/test-utils';
import * as dbModule from '../../../src/db/index.js';

// Mock database
vi.mock('../../../src/db/index.js', () => ({
	db: {
		query: {
			accounts: {
				findFirst: vi.fn(),
			},
		},
	},
}));

// Mock logger
vi.mock('../../../src/utils/logger.js', () => ({
	logger: {
		info: vi.fn(),
		warn: vi.fn(),
		error: vi.fn(),
	},
}));

describe('Authentication Middleware', () => {
	let mockDb: any;

	beforeEach(() => {
		mockDb = (dbModule as any).db;
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	describe('authenticateAdmin', () => {
		it('should reject requests without cookies', async () => {
			const req = createMockRequest({
				headers: {},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticateAdmin(req as any, res as any, next);

			expectUnauthorizedError(res);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'NO_SESSION',
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should reject requests without session token', async () => {
			const req = createMockRequest({
				headers: {
					cookie: 'other=value',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticateAdmin(req as any, res as any, next);

			expectUnauthorizedError(res);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'NO_SESSION',
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should reject invalid session tokens', async () => {
			mockDb.query.accounts.findFirst.mockResolvedValue(null);

			const req = createMockRequest({
				headers: {
					cookie: 'session=invalid-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticateAdmin(req as any, res as any, next);

			expectUnauthorizedError(res);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'INVALID_SESSION',
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should reject non-admin users', async () => {
			const mockUser = {
				id: 'user-1',
				email: 'user@example.com',
				role: 'MEMBER',
				profile: {
					username: 'testuser',
				},
			};
			mockDb.query.accounts.findFirst.mockResolvedValue(mockUser);

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticateAdmin(req as any, res as any, next);

			expectForbiddenError(res);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'NOT_ADMIN',
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should allow admin users', async () => {
			const mockAdmin = {
				id: 'admin-1',
				email: 'admin@example.com',
				role: 'ADMINISTRATOR',
				profile: {
					username: 'adminuser',
				},
			};
			mockDb.query.accounts.findFirst.mockResolvedValue(mockAdmin);

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-admin-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticateAdmin(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user).toEqual({
				id: mockAdmin.id,
				email: mockAdmin.email,
				username: mockAdmin.profile.username,
				role: mockAdmin.role,
			});
			expect(res.status).not.toHaveBeenCalled();
		});

		it('should include profileId in user object', async () => {
			const mockAdmin = {
				id: 'admin-1',
				email: 'admin@example.com',
				role: 'ADMINISTRATOR',
				profile: {
					id: 'profile-123',
					username: 'adminuser',
				},
			};
			mockDb.query.accounts.findFirst.mockResolvedValue(mockAdmin);

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-admin-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticateAdmin(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user).toEqual({
				id: mockAdmin.id,
				profileId: mockAdmin.profile.id,
				email: mockAdmin.email,
				username: mockAdmin.profile.username,
				role: mockAdmin.role,
			});
			expect((req as any).user.profileId).toBe('profile-123');
		});

		it('should use email as username fallback', async () => {
			const mockAdmin = {
				id: 'admin-1',
				email: 'admin@example.com',
				role: 'ADMINISTRATOR',
				profile: null,
			};
			mockDb.query.accounts.findFirst.mockResolvedValue(mockAdmin);

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-admin-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticateAdmin(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user.username).toBe(mockAdmin.email);
		});

		it('should handle database errors', async () => {
			mockDb.query.accounts.findFirst.mockRejectedValue(new Error('Database error'));

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticateAdmin(req as any, res as any, next);

			expectServerError(res);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({
					code: 'AUTH_ERROR',
				})
			);
			expect(next).not.toHaveBeenCalled();
		});

		it('should parse session from multiple cookies', async () => {
			const mockAdmin = {
				id: 'admin-1',
				email: 'admin@example.com',
				role: 'ADMINISTRATOR',
				profile: {
					username: 'adminuser',
				},
			};
			mockDb.query.accounts.findFirst.mockResolvedValue(mockAdmin);

			const req = createMockRequest({
				headers: {
					cookie: 'other=value; session=my-token; another=data',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticateAdmin(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect(mockDb.query.accounts.findFirst).toHaveBeenCalledWith(
				expect.objectContaining({
					where: expect.any(Object),
				})
			);
		});
	});

	describe('authenticate', () => {
		it('should reject requests without cookies', async () => {
			const req = createMockRequest({
				headers: {},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticate(req as any, res as any, next);

			expectUnauthorizedError(res);
			expect(next).not.toHaveBeenCalled();
		});

		it('should reject invalid session tokens', async () => {
			mockDb.query.accounts.findFirst.mockResolvedValue(null);

			const req = createMockRequest({
				headers: {
					cookie: 'session=invalid-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticate(req as any, res as any, next);

			expectUnauthorizedError(res);
			expect(next).not.toHaveBeenCalled();
		});

		it('should allow any authenticated user (not just admin)', async () => {
			const mockUser = {
				id: 'user-1',
				email: 'user@example.com',
				role: 'MEMBER',
				profile: {
					username: 'testuser',
				},
			};
			mockDb.query.accounts.findFirst.mockResolvedValue(mockUser);

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticate(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user).toEqual({
				id: mockUser.id,
				email: mockUser.email,
				username: mockUser.profile.username,
				role: mockUser.role,
			});
			expect(res.status).not.toHaveBeenCalled();
		});

		it('should allow admin users', async () => {
			const mockAdmin = {
				id: 'admin-1',
				email: 'admin@example.com',
				role: 'ADMINISTRATOR',
				profile: {
					username: 'adminuser',
				},
			};
			mockDb.query.accounts.findFirst.mockResolvedValue(mockAdmin);

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-admin-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticate(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user.role).toBe('ADMINISTRATOR');
		});

		it('should handle database errors', async () => {
			mockDb.query.accounts.findFirst.mockRejectedValue(new Error('Database error'));

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await authenticate(req as any, res as any, next);

			expectServerError(res);
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('optionalAuth', () => {
		it('should continue without cookies', async () => {
			const req = createMockRequest({
				headers: {},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await optionalAuth(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user).toBeUndefined();
			expect(res.status).not.toHaveBeenCalled();
		});

		it('should continue without session token', async () => {
			const req = createMockRequest({
				headers: {
					cookie: 'other=value',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await optionalAuth(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user).toBeUndefined();
		});

		it('should continue with invalid session token', async () => {
			mockDb.query.accounts.findFirst.mockResolvedValue(null);

			const req = createMockRequest({
				headers: {
					cookie: 'session=invalid-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await optionalAuth(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user).toBeUndefined();
		});

		it('should attach user if valid session', async () => {
			const mockUser = {
				id: 'user-1',
				email: 'user@example.com',
				role: 'MEMBER',
				profile: {
					username: 'testuser',
				},
			};
			mockDb.query.accounts.findFirst.mockResolvedValue(mockUser);

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await optionalAuth(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user).toEqual({
				id: mockUser.id,
				email: mockUser.email,
				username: mockUser.profile.username,
				role: mockUser.role,
			});
			expect(res.status).not.toHaveBeenCalled();
		});

		it('should continue even on database errors', async () => {
			mockDb.query.accounts.findFirst.mockRejectedValue(new Error('Database error'));

			const req = createMockRequest({
				headers: {
					cookie: 'session=valid-token',
				},
			});
			const res = createMockResponse();
			const next = createMockNext();

			await optionalAuth(req as any, res as any, next);

			expect(next).toHaveBeenCalled();
			expect((req as any).user).toBeUndefined();
			expect(res.status).not.toHaveBeenCalled();
		});
	});
});
