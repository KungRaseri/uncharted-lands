import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import serversRouter from '../../../src/api/routes/servers.js';
import * as db from '../../../src/db/index.js';
import { generateTestId } from '../../helpers/test-utils';

// Mock dependencies
vi.mock('../../../src/db/index.js', () => ({
	db: {
		query: {
			servers: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
		},
		insert: vi.fn(() => ({
			values: vi.fn(() => ({
				returning: vi.fn(),
			})),
		})),
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
	servers: { id: 'id' },
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
			req.user = { id: 'user-123', role: 'MEMBER' };
			next();
		} else {
			res.status(401).json({ error: 'Unauthorized' });
		}
	},
	authenticateAdmin: (req: any, res: any, next: any) => {
		if (req.headers.authorization === 'Bearer admin-token') {
			req.user = { id: 'admin-123', role: 'ADMINISTRATOR' };
			next();
		} else {
			res.status(403).json({ error: 'Forbidden', code: 'NOT_ADMIN' });
		}
	},
}));

vi.mock('@paralleldrive/cuid2', () => ({
	createId: vi.fn(() => generateTestId('server')),
}));

describe('Servers API Routes', () => {
	let app: express.Application;

	beforeEach(() => {
		vi.clearAllMocks();
		app = express();
		app.use(express.json());
		app.use('/api/servers', serversRouter);
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/servers', () => {
		it('should return 401 if not authenticated', async () => {
			const response = await request(app).get('/api/servers').expect(401);

			expect(response.body.error).toBe('Unauthorized');
		});

		it('should return all servers with worlds when authenticated as admin', async () => {
			const mockServers = [
				{
					id: 'server-1',
					name: 'Main Server',
					hostname: 'localhost',
					port: 5000,
					status: 'ONLINE',
					worlds: [
						{ id: 'world-1', name: 'World 1' },
						{ id: 'world-2', name: 'World 2' },
					],
				},
				{
					id: 'server-2',
					name: 'Test Server',
					hostname: 'test.local',
					port: 5001,
					status: 'OFFLINE',
					worlds: [],
				},
			];

			vi.mocked(db.db.query.servers.findMany).mockResolvedValue(mockServers as any);

			const response = await request(app)
				.get('/api/servers')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body).toEqual(mockServers);
			expect(response.body).toHaveLength(2);
			expect(response.body[0].worlds).toHaveLength(2);
		});

		it('should return empty array when no servers exist', async () => {
			vi.mocked(db.db.query.servers.findMany).mockResolvedValue([] as any);

			const response = await request(app)
				.get('/api/servers')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body).toEqual([]);
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.servers.findMany).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.get('/api/servers')
				.set('Authorization', 'Bearer admin-token')
				.expect(500);

			expect(response.body.code).toBe('FETCH_FAILED');
		});
	});

	describe('GET /api/servers/:id', () => {
		it('should return 401 if not authenticated', async () => {
			const response = await request(app).get('/api/servers/server-123').expect(401);

			expect(response.body.error).toBe('Unauthorized');
		});

		it('should return server details with worlds', async () => {
			const mockServer = {
				id: 'server-123',
				name: 'Test Server',
				hostname: 'localhost',
				port: 5000,
				status: 'ONLINE',
				worlds: [
					{
						id: 'world-1',
						name: 'Fantasy World',
						serverId: 'server-123',
					},
				],
			};

			vi.mocked(db.db.query.servers.findFirst).mockResolvedValue(mockServer as any);

			const response = await request(app)
				.get('/api/servers/server-123')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body).toEqual(mockServer);
			expect(response.body.worlds).toHaveLength(1);
		});

		it('should return 404 if server not found', async () => {
			vi.mocked(db.db.query.servers.findFirst).mockResolvedValue(null as any);

			const response = await request(app)
				.get('/api/servers/nonexistent')
				.set('Authorization', 'Bearer admin-token')
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.servers.findFirst).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.get('/api/servers/server-123')
				.set('Authorization', 'Bearer admin-token')
				.expect(500);

			expect(response.body.code).toBe('FETCH_FAILED');
		});
	});

	describe('POST /api/servers', () => {
		it('should return 403 if not admin', async () => {
			const response = await request(app)
				.post('/api/servers')
				.set('Authorization', 'Bearer user-token')
				.send({ name: 'New Server' })
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should return 400 if name is missing', async () => {
			const response = await request(app)
				.post('/api/servers')
				.set('Authorization', 'Bearer admin-token')
				.send({})
				.expect(400);

			expect(response.body.code).toBe('INVALID_INPUT');
		});

		it('should successfully create server with all fields', async () => {
			const newServer = {
				id: 'server-new',
				name: 'Production Server',
				hostname: 'prod.example.com',
				port: 8080,
				status: 'ONLINE',
			};

			vi.mocked(db.db.insert).mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([newServer]),
				}),
			} as any);

			const response = await request(app)
				.post('/api/servers')
				.set('Authorization', 'Bearer admin-token')
				.send({
					name: 'Production Server',
					hostname: 'prod.example.com',
					port: 8080,
					status: 'ONLINE',
				})
				.expect(201);

			expect(response.body).toEqual(newServer);
		});

		it('should create server with defaults when optional fields are missing', async () => {
			const newServer = {
				id: 'server-new',
				name: 'Simple Server',
				hostname: 'localhost',
				port: 5000,
				status: 'OFFLINE',
			};

			vi.mocked(db.db.insert).mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockResolvedValue([newServer]),
				}),
			} as any);

			const response = await request(app)
				.post('/api/servers')
				.set('Authorization', 'Bearer admin-token')
				.send({ name: 'Simple Server' })
				.expect(201);

			expect(response.body.hostname).toBe('localhost');
			expect(response.body.port).toBe(5000);
			expect(response.body.status).toBe('OFFLINE');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.insert).mockReturnValue({
				values: vi.fn().mockReturnValue({
					returning: vi.fn().mockRejectedValue(new Error('Database error')),
				}),
			} as any);

			const response = await request(app)
				.post('/api/servers')
				.set('Authorization', 'Bearer admin-token')
				.send({ name: 'Test Server' })
				.expect(500);

			expect(response.body.code).toBe('CREATE_FAILED');
		});
	});

	describe('PUT /api/servers/:id', () => {
		it('should return 403 if not admin', async () => {
			const response = await request(app)
				.put('/api/servers/server-123')
				.set('Authorization', 'Bearer user-token')
				.send({ name: 'Updated Server' })
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should return 404 if server not found', async () => {
			vi.mocked(db.db.query.servers.findFirst).mockResolvedValue(null as any);

			const response = await request(app)
				.put('/api/servers/nonexistent')
				.set('Authorization', 'Bearer admin-token')
				.send({ name: 'Updated Server' })
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should successfully update all server fields', async () => {
			const existingServer = {
				id: 'server-123',
				name: 'Old Name',
				hostname: 'old.host',
				port: 5000,
				status: 'OFFLINE',
			};

			const updatedServer = {
				id: 'server-123',
				name: 'New Name',
				hostname: 'new.host',
				port: 8080,
				status: 'ONLINE',
				updatedAt: new Date(),
			};

			vi.mocked(db.db.query.servers.findFirst).mockResolvedValue(existingServer as any);
			vi.mocked(db.db.update).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([updatedServer]),
					}),
				}),
			} as any);

			const response = await request(app)
				.put('/api/servers/server-123')
				.set('Authorization', 'Bearer admin-token')
				.send({
					name: 'New Name',
					hostname: 'new.host',
					port: 8080,
					status: 'ONLINE',
				})
				.expect(200);

			expect(response.body.name).toBe('New Name');
			expect(response.body.status).toBe('ONLINE');
		});

		it('should preserve existing values when fields are not provided', async () => {
			const existingServer = {
				id: 'server-123',
				name: 'Server Name',
				hostname: 'localhost',
				port: 5000,
				status: 'ONLINE',
			};

			vi.mocked(db.db.query.servers.findFirst).mockResolvedValue(existingServer as any);
			vi.mocked(db.db.update).mockReturnValue({
				set: vi.fn().mockReturnValue({
					where: vi.fn().mockReturnValue({
						returning: vi.fn().mockResolvedValue([existingServer]),
					}),
				}),
			} as any);

			const response = await request(app)
				.put('/api/servers/server-123')
				.set('Authorization', 'Bearer admin-token')
				.send({})
				.expect(200);

			expect(response.body.name).toBe('Server Name');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.servers.findFirst).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.put('/api/servers/server-123')
				.set('Authorization', 'Bearer admin-token')
				.send({ name: 'Updated' })
				.expect(500);

			expect(response.body.code).toBe('UPDATE_FAILED');
		});
	});

	describe('DELETE /api/servers/:id', () => {
		it('should return 403 if not admin', async () => {
			const response = await request(app)
				.delete('/api/servers/server-123')
				.set('Authorization', 'Bearer user-token')
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should return 404 if server not found', async () => {
			vi.mocked(db.db.query.servers.findFirst).mockResolvedValue(null as any);

			const response = await request(app)
				.delete('/api/servers/nonexistent')
				.set('Authorization', 'Bearer admin-token')
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should successfully delete server', async () => {
			const existingServer = {
				id: 'server-123',
				name: 'Server to Delete',
				hostname: 'localhost',
				port: 5000,
				status: 'OFFLINE',
			};

			vi.mocked(db.db.query.servers.findFirst).mockResolvedValue(existingServer as any);

			const response = await request(app)
				.delete('/api/servers/server-123')
				.set('Authorization', 'Bearer admin-token')
				.expect(200);

			expect(response.body.success).toBe(true);
			expect(response.body.message).toContain('Server to Delete');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.servers.findFirst).mockRejectedValue(new Error('Database error'));

			const response = await request(app)
				.delete('/api/servers/server-123')
				.set('Authorization', 'Bearer admin-token')
				.expect(500);

			expect(response.body.code).toBe('DELETE_FAILED');
		});
	});
});
