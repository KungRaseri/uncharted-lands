import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import adminRouter from '../../../src/api/routes/admin.js';
import * as db from '../../../src/db/index.js';

// Mock dependencies
vi.mock('../../../src/db/index.js', () => ({
	db: {
		select: vi.fn(() => ({
			from: vi.fn(),
		})),
		query: {
			servers: {
				findMany: vi.fn(),
			},
			worlds: {
				findMany: vi.fn(),
			},
			accounts: {
				findMany: vi.fn(),
			},
		},
	},
	servers: {},
	worlds: {},
	accounts: {},
	settlements: {},
}));

vi.mock('../../../src/utils/logger.js', () => ({
	logger: {
		error: vi.fn(),
		info: vi.fn(),
		warn: vi.fn(),
	},
}));

vi.mock('../../../src/api/middleware/auth.js', () => ({
	authenticateAdmin: (req: any, res: any, next: any) => {
		if (req.headers.authorization === 'Bearer admin-token') {
			req.user = { id: 'admin-123', role: 'ADMINISTRATOR' };
			next();
		} else {
			res.status(403).json({ error: 'Forbidden', code: 'NOT_ADMIN' });
		}
	},
}));

describe('Admin API Routes', () => {
	let app: express.Application;

	beforeEach(() => {
		vi.clearAllMocks();
		app = express();
		app.use(express.json());
		app.use('/api/admin', adminRouter);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/admin/dashboard', () => {
		it('should return 403 if not admin', async () => {
			const response = await request(app)
				.get('/api/admin/dashboard')
				.set('Authorization', 'Bearer user-token')
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should return dashboard statistics when authenticated as admin', async () => {
			// Mock count queries
			const mockSelect = vi.fn(() => ({
				from: vi.fn().mockResolvedValue([{ count: 10 }]),
			}));
			vi.mocked(db.db.select).mockImplementation(mockSelect as any);

			// Mock recent data queries
			vi.mocked(db.db.query.servers.findMany).mockResolvedValue([
				{
					id: 'server-1',
					name: 'Server 1',
					worlds: [{ id: 'world-1', name: 'World 1' }],
				},
			] as any);

			vi.mocked(db.db.query.worlds.findMany).mockResolvedValue([
				{
					id: 'world-1',
					name: 'World 1',
					server: { id: 'server-1', name: 'Server 1' },
				},
			] as any);

			vi.mocked(db.db.query.accounts.findMany).mockResolvedValue([
				{
					id: 'account-1',
					email: 'user@example.com',
					profile: { id: 'profile-1', username: 'user1', picture: '' },
				},
			] as any);

			const response = await request(app)
				.get('/api/admin/dashboard')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body.counts).toBeDefined();
			expect(response.body.counts.servers).toBe(10);
			expect(response.body.counts.worlds).toBe(10);
			expect(response.body.counts.players).toBe(10);
			expect(response.body.counts.settlements).toBe(10);
			expect(response.body.recent).toBeDefined();
			expect(response.body.recent.servers).toHaveLength(1);
			expect(response.body.recent.worlds).toHaveLength(1);
			expect(response.body.recent.players).toHaveLength(1);
			expect(response.body.timestamp).toBeDefined();
		});

		it('should return zero counts when no data exists', async () => {
			const mockSelect = vi.fn(() => ({
				from: vi.fn().mockResolvedValue([{ count: 0 }]),
			}));
			vi.mocked(db.db.select).mockImplementation(mockSelect as any);

			vi.mocked(db.db.query.servers.findMany).mockResolvedValue([] as any);
			vi.mocked(db.db.query.worlds.findMany).mockResolvedValue([] as any);
			vi.mocked(db.db.query.accounts.findMany).mockResolvedValue([] as any);

			const response = await request(app)
				.get('/api/admin/dashboard')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body.counts.servers).toBe(0);
			expect(response.body.counts.worlds).toBe(0);
			expect(response.body.counts.players).toBe(0);
			expect(response.body.counts.settlements).toBe(0);
			expect(response.body.recent.servers).toEqual([]);
			expect(response.body.recent.worlds).toEqual([]);
			expect(response.body.recent.players).toEqual([]);
		});

		it('should return 500 on database error', async () => {
			const mockSelect = vi.fn(() => ({
				from: vi.fn().mockRejectedValue(new Error('Database error')),
			}));
			vi.mocked(db.db.select).mockImplementation(mockSelect as any);

			const response = await request(app)
				.get('/api/admin/dashboard')
				.set('Authorization', 'Bearer admin-token')
				.expect(500);

			expect(response.body.code).toBe('FETCH_FAILED');
		});

		it('should include timestamp in response', async () => {
			const mockSelect = vi.fn(() => ({
				from: vi.fn().mockResolvedValue([{ count: 5 }]),
			}));
			vi.mocked(db.db.select).mockImplementation(mockSelect as any);

			vi.mocked(db.db.query.servers.findMany).mockResolvedValue([] as any);
			vi.mocked(db.db.query.worlds.findMany).mockResolvedValue([] as any);
			vi.mocked(db.db.query.accounts.findMany).mockResolvedValue([] as any);

			const response = await request(app)
				.get('/api/admin/dashboard')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body.timestamp).toBeDefined();
			expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
		});
	});
});
