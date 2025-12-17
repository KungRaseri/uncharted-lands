import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import accountRouter from '../../../src/api/routes/account.js';
import * as db from '../../../src/db/index.js';

// Mock dependencies
vi.mock('../../../src/db/index.js', () => ({
	db: {
		query: {
			accounts: {
				findFirst: vi.fn(),
			},
		},
	},
	accounts: {},
}));

vi.mock('../../../src/utils/logger.js', () => ({
	logger: {
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
	},
}));

vi.mock('../../../src/api/middleware/auth.js', () => ({
	authenticate: (req: any, res: any, next: any) => {
		if (req.headers.authorization) {
			req.user = { id: 'user-123', username: 'testuser' };
		}
		next();
	},
}));

describe('Account API Routes', () => {
	let app: express.Application;

	beforeEach(() => {
		vi.clearAllMocks();
		app = express();
		app.use(express.json());
		app.use('/api/account', accountRouter);
	});

	describe('GET /api/account/me', () => {
		it('should return 401 when not authenticated', async () => {
			const response = await request(app).get('/api/account/me').expect(401);

			expect(response.body).toEqual({
				error: 'Unauthorized',
				code: 'NO_USER',
			});
		});

		it('should return account data when authenticated', async () => {
			const mockAccount = {
				id: 'user-123',
				username: 'testuser',
				email: 'test@example.com',
				passwordHash: 'hashed-password',
				profile: {
					id: 'profile-123',
					accountId: 'user-123',
					displayName: 'Test User',
				},
			};

			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(mockAccount as any);

			const response = await request(app)
				.get('/api/account/me')
				.set('Authorization', 'Bearer token')
				.expect(200);

			expect(response.body.passwordHash).toBe('');
			expect(response.body.username).toBe('testuser');
		});

		it('should return 404 when account not found', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(undefined as any);

			const response = await request(app)
				.get('/api/account/me')
				.set('Authorization', 'Bearer token')
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockRejectedValue(
				new Error('Database connection failed')
			);

			const response = await request(app)
				.get('/api/account/me')
				.set('Authorization', 'Bearer token')
				.expect(500);

			expect(response.body).toEqual({
				error: 'Failed to fetch account',
				code: 'FETCH_FAILED',
			});
		});

		it('should remove password hash from response', async () => {
			const mockAccount = {
				id: 'user-123',
				username: 'testuser',
				email: 'test@example.com',
				passwordHash: 'should-be-removed-from-response',
				profile: {
					id: 'profile-123',
					accountId: 'user-123',
					displayName: 'Test User',
				},
			};

			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(mockAccount as any);

			const response = await request(app)
				.get('/api/account/me')
				.set('Authorization', 'Bearer token')
				.expect(200);

			expect(response.body.passwordHash).toBe('');
			expect(response.body.passwordHash).not.toBe('should-be-removed-from-response');
		});

		it('should include profile data when present', async () => {
			const mockAccount = {
				id: 'user-123',
				username: 'testuser',
				email: 'test@example.com',
				passwordHash: 'hashed',
				profile: {
					id: 'profile-123',
					accountId: 'user-123',
					displayName: 'Test User',
					bio: 'A test bio',
				},
			};

			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(mockAccount as any);

			const response = await request(app)
				.get('/api/account/me')
				.set('Authorization', 'Bearer token')
				.expect(200);

			expect(response.body.profile).toBeDefined();
			expect(response.body.profile.displayName).toBe('Test User');
			expect(response.body.profile.bio).toBe('A test bio');
		});

		it('should handle account without profile', async () => {
			const mockAccount = {
				id: 'user-123',
				username: 'testuser',
				email: 'test@example.com',
				passwordHash: 'hashed',
				profile: null,
			};

			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(mockAccount as any);

			const response = await request(app)
				.get('/api/account/me')
				.set('Authorization', 'Bearer token')
				.expect(200);

			expect(response.body.profile).toBeNull();
			expect(response.body.username).toBe('testuser');
		});
	});
});
