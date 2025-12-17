import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import playersRouter from '../../../src/api/routes/players.js';
import * as db from '../../../src/db/index.js';

// Mock dependencies
vi.mock('../../../src/db/index.js', () => ({
	db: {
		query: {
			accounts: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
		},
		update: vi.fn(() => ({
			set: vi.fn(() => ({
				where: vi.fn(() => ({
					returning: vi.fn(),
				})),
			})),
		})),
		delete: vi.fn(() => ({
			where: vi.fn().mockResolvedValue(undefined),
		})),
	},
	accounts: { id: 'id' },
	profiles: {},
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

describe('Players API Routes', () => {
	let app: express.Application;

	beforeEach(() => {
		vi.clearAllMocks();
		app = express();
		app.use(express.json());
		app.use('/api/players', playersRouter);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/players', () => {
		it('should return 403 if not admin', async () => {
			const response = await request(app)
				.get('/api/players')
				.set('Authorization', 'Bearer user-token')
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should return all players when authenticated as admin', async () => {
			const mockPlayers = [
				{
					id: 'player-1',
					email: 'player1@example.com',
					profile: {
						id: 'profile-1',
						username: 'player1',
					},
				},
				{
					id: 'player-2',
					email: 'player2@example.com',
					profile: {
						id: 'profile-2',
						username: 'player2',
					},
				},
			];

			vi.mocked(db.db.query.accounts.findMany).mockResolvedValue(mockPlayers as any);

			const response = await request(app)
				.get('/api/players')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body).toEqual(mockPlayers);
			expect(response.body).toHaveLength(2);
		});

		it('should return empty array when no players exist', async () => {
			vi.mocked(db.db.query.accounts.findMany).mockResolvedValue([] as any);

			const response = await request(app)
				.get('/api/players')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body).toEqual([]);
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.accounts.findMany).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.get('/api/players')
				.set('Authorization', 'Bearer admin-token')
				.expect(500);

			expect(response.body.code).toBe('FETCH_FAILED');
		});
	});

	describe('GET /api/players/:id', () => {
		it('should return 403 if not admin', async () => {
			const response = await request(app)
				.get('/api/players/player-123')
				.set('Authorization', 'Bearer user-token')
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should return player details with settlements', async () => {
			const mockPlayer = {
				id: 'player-123',
				email: 'player@example.com',
				profile: {
					id: 'profile-123',
					username: 'testplayer',
					settlements: [
						{
							id: 'settlement-1',
							name: 'Test Settlement',
							plot: {
								tile: {
									region: {
										world: {
											id: 'world-1',
											name: 'Test World',
										},
									},
								},
							},
						},
					],
				},
			};

			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(mockPlayer as any);

			const response = await request(app)
				.get('/api/players/player-123')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body).toEqual(mockPlayer);
			expect(response.body.profile.settlements).toHaveLength(1);
		});

		it('should return 404 if player not found', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(null as any);

			const response = await request(app)
				.get('/api/players/nonexistent')
				.set('Authorization', 'Bearer admin-token')
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.get('/api/players/player-123')
				.set('Authorization', 'Bearer admin-token')
				.expect(500);

			expect(response.body.code).toBe('FETCH_FAILED');
		});
	});

	describe('PUT /api/players/:id', () => {
		it('should return 403 if not admin', async () => {
			const response = await request(app)
				.put('/api/players/player-123')
				.set('Authorization', 'Bearer user-token')
				.send({ role: 'SUPPORT' })
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should return 404 if player not found', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(null as any);

			const response = await request(app)
				.put('/api/players/nonexistent')
				.set('Authorization', 'Bearer admin-token')
				.send({ role: 'SUPPORT' })
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should return 400 for invalid role', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue({
				id: 'player-123',
				role: 'MEMBER',
			} as any);

			const response = await request(app)
				.put('/api/players/player-123')
				.set('Authorization', 'Bearer admin-token')
				.send({ role: 'INVALID_ROLE' })
				.expect(400);

			expect(response.body.code).toBe('INVALID_INPUT');
		});

		it('should successfully update player role to SUPPORT', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue({
				id: 'player-123',
				role: 'MEMBER',
			} as any);

			const mockUpdated = {
				id: 'player-123',
				role: 'SUPPORT',
				updatedAt: new Date(),
			};

			vi.mocked(db.db.update).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockUpdated]),
					}),
				}),
			} as any);

			const response = await request(app)
				.put('/api/players/player-123')
				.set('Authorization', 'Bearer admin-token')
				.send({ role: 'SUPPORT' })
				.expect(200);

			expect(response.body.role).toBe('SUPPORT');
		});

		it('should successfully update player role to ADMINISTRATOR', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue({
				id: 'player-123',
				role: 'MEMBER',
			} as any);

			const mockUpdated = {
				id: 'player-123',
				role: 'ADMINISTRATOR',
				updatedAt: new Date(),
			};

			vi.mocked(db.db.update).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([mockUpdated]),
					}),
				}),
			} as any);

			const response = await request(app)
				.put('/api/players/player-123')
				.set('Authorization', 'Bearer admin-token')
				.send({ role: 'ADMINISTRATOR' })
				.expect(200);

			expect(response.body.role).toBe('ADMINISTRATOR');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.put('/api/players/player-123')
				.set('Authorization', 'Bearer admin-token')
				.send({ role: 'SUPPORT' })
				.expect(500);

			expect(response.body.code).toBe('UPDATE_FAILED');
		});
	});

	describe('DELETE /api/players/:id', () => {
		it('should return 403 if not admin', async () => {
			const response = await request(app)
				.delete('/api/players/player-123')
				.set('Authorization', 'Bearer user-token')
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should return 404 if player not found', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue(null as any);

			const response = await request(app)
				.delete('/api/players/nonexistent')
				.set('Authorization', 'Bearer admin-token')
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should successfully delete player', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue({
				id: 'player-123',
				email: 'player@example.com',
				profile: {
					id: 'profile-123',
					username: 'testplayer',
				},
			} as any);

			const response = await request(app)
				.delete('/api/players/player-123')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain('testplayer');
		});

		it('should successfully delete player without profile username', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockResolvedValue({
				id: 'player-123',
				email: 'player@example.com',
				profile: null,
			} as any);

			const response = await request(app)
				.delete('/api/players/player-123')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain('player@example.com');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.accounts.findFirst).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.delete('/api/players/player-123')
				.set('Authorization', 'Bearer admin-token')
				.expect(500);

			expect(response.body.code).toBe('DELETE_FAILED');
		});
	});
});
