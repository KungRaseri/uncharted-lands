import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express from 'express';
import geographyRouter from '../../../src/api/routes/geography.js';
import * as db from '../../../src/db/index.js';

// Mock dependencies
vi.mock('../../../src/db/index.js', () => ({
	db: {
		query: {
			regions: {
				findMany: vi.fn(),
				findFirst: vi.fn(),
			},
			tiles: {
				findFirst: vi.fn(),
			},
			settlements: {
				findFirst: vi.fn(),
			},
			worlds: {
				findFirst: vi.fn(),
			},
		},
	},
	regions: {},
	tiles: {},
	settlements: {},
	worlds: {},
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
		const cookies = req.headers.cookie;
		if (cookies && cookies.includes('session=admin-session')) {
			req.user = {
				id: 'admin-123',
				email: 'admin@test.com',
				username: 'admin',
				role: 'ADMINISTRATOR',
			};
			next();
		} else {
			res.status(403).json({ error: 'Forbidden', code: 'NOT_ADMIN' });
		}
	},
	authenticate: (req: any, res: any, next: any) => {
		const cookies = req.headers.cookie;
		if (
			cookies &&
			(cookies.includes('session=valid-session') || cookies.includes('session=admin-session'))
		) {
			req.user = {
				id: 'user-123',
				email: 'test@example.com',
				username: 'testuser',
				role: 'MEMBER',
			};
			next();
		} else {
			res.status(401).json({ error: 'Unauthorized', code: 'NO_SESSION' });
		}
	},
}));

describe('Geography API Routes', () => {
	let app: express.Application;

	beforeEach(() => {
		vi.clearAllMocks();
		app = express();
		app.use(express.json());
		app.use('/api/regions', geographyRouter); // Mount at /api/regions to match route structure
	});

	afterEach(() => {
		vi.clearAllMocks();
	});

	describe('GET /api/regions/', () => {
		it('should return 401 if not authenticated', async () => {
			const response = await request(app).get('/api/regions/?worldId=world-123').expect(401);

			expect(response.body.code).toBe('NO_SESSION');
		});

		it('should return 400 if worldId is missing', async () => {
			const response = await request(app)
				.get('/api/regions/')
				.set('Cookie', 'session=valid-session')
				.expect(400);

			expect(response.body.code).toBe('INVALID_INPUT');
		});

		it('should return regions for a world', async () => {
			const mockRegions = [{ id: 'region-1', xCoord: 0, yCoord: 0, tiles: [] }];

			vi.mocked(db.db.query.regions.findMany).mockResolvedValue(mockRegions as any);

			const response = await request(app)
				.get('/api/regions/?worldId=world-123')
				.set('Cookie', 'session=valid-session')
				.expect(200);

			expect(response.body.regions).toEqual(mockRegions);
			expect(response.body.count).toBe(1);
		});

		it('should filter regions by explicit bounds', async () => {
			const mockRegions = [{ id: 'region-1' }];
			vi.mocked(db.db.query.regions.findMany).mockResolvedValue(mockRegions as any);

			const response = await request(app)
				.get('/api/regions/?worldId=world-123&xMin=0&xMax=2&yMin=0&yMax=2')
				.set('Cookie', 'session=valid-session')
				.expect(200);

			expect(response.body.bounds).toBeDefined();
			expect(response.body.bounds.xMin).toBe(0);
			expect(response.body.bounds.xMax).toBe(2);
		});

		it('should filter regions by center and radius', async () => {
			const mockRegions = [{ id: 'region-1' }];
			vi.mocked(db.db.query.regions.findMany).mockResolvedValue(mockRegions as any);

			const response = await request(app)
				.get('/api/regions/?worldId=world-123&centerX=5&centerY=5&radius=2')
				.set('Cookie', 'session=valid-session')
				.expect(200);

			expect(response.body.bounds).toBeDefined();
			expect(response.body.bounds.xMin).toBe(3);
			expect(response.body.bounds.xMax).toBe(7);
		});

		it('should use default radius of 1 when not specified', async () => {
			const mockRegions: any[] = [];
			vi.mocked(db.db.query.regions.findMany).mockResolvedValue(mockRegions as any);

			const response = await request(app)
				.get('/api/regions/?worldId=world-123&centerX=5&centerY=5')
				.set('Cookie', 'session=valid-session')
				.expect(200);

			expect(response.body.bounds.xMin).toBe(4);
			expect(response.body.bounds.xMax).toBe(6);
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.regions.findMany).mockRejectedValue(new Error('DB error'));

			const response = await request(app)
				.get('/api/regions/?worldId=world-123')
				.set('Cookie', 'session=valid-session')
				.expect(500);

			expect(response.body.code).toBe('FETCH_FAILED');
		});
	});

	describe('GET /api/regions/:id', () => {
		it('should return 403 if not admin', async () => {
			const response = await request(app)
				.get('/api/regions/region-123')
				.set('Cookie', 'session=valid-session')
				.expect(403);

			expect(response.body.code).toBe('NOT_ADMIN');
		});

		it('should return a specific region', async () => {
			const mockRegion = {
				id: 'region-123',
				xCoord: 0,
				yCoord: 0,
				world: {},
				tiles: [],
			};

			vi.mocked(db.db.query.regions.findFirst).mockResolvedValue(mockRegion as any);

			const response = await request(app)
				.get('/api/regions/region-123')
				.set('Cookie', 'session=admin-session')
				.expect(200);

			expect(response.body).toEqual(mockRegion);
		});

		it('should return 404 if region not found', async () => {
			vi.mocked(db.db.query.regions.findFirst).mockResolvedValue(undefined);

			const response = await request(app)
				.get('/api/regions/nonexistent')
				.set('Cookie', 'session=admin-session')
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.regions.findFirst).mockRejectedValue(new Error('DB error'));

			const response = await request(app)
				.get('/api/regions/region-123')
				.set('Cookie', 'session=admin-session')
				.expect(500);

			expect(response.body.code).toBe('FETCH_FAILED');
		});
	});

	describe('GET /api/regions/tiles/:id', () => {
		it('should return a specific tile', async () => {
			const mockTile = {
				id: 'tile-123',
				elevation: 10,
				region: { world: {} },
				biome: {},
			};

			vi.mocked(db.db.query.tiles.findFirst).mockResolvedValue(mockTile as any);

			const response = await request(app)
				.get('/api/regions/tiles/tile-123')
				.set('Cookie', 'session=admin-session')
				.expect(200);

			expect(response.body).toEqual(mockTile);
		});

		it('should return 404 if tile not found', async () => {
			vi.mocked(db.db.query.tiles.findFirst).mockResolvedValue(undefined);

			const response = await request(app)
				.get('/api/regions/tiles/nonexistent')
				.set('Cookie', 'session=admin-session')
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.tiles.findFirst).mockRejectedValue(new Error('DB error'));

			const response = await request(app)
				.get('/api/regions/tiles/tile-123')
				.set('Cookie', 'session=admin-session')
				.expect(500);

			expect(response.body.code).toBe('FETCH_FAILED');
		});
	});

	describe('GET /api/regions/map', () => {
		it('should return 401 if not authenticated', async () => {
			const response = await request(app).get('/api/regions/map?profileId=profile-123').expect(401);

			expect(response.body.code).toBe('NO_SESSION');
		});

		it('should return 400 if profileId is missing', async () => {
			const response = await request(app)
				.get('/api/regions/map')
				.set('Cookie', 'session=valid-session')
				.expect(400);

			expect(response.body.code).toBe('INVALID_INPUT');
		});

		it('should return map for player with settlement', async () => {
			const mockSettlement = {
				id: 'settlement-1',
				name: 'Home',
				tileId: 'tile-1',
				tile: {
					id: 'tile-1',
					region: {
						id: 'region-1',
						worldId: 'world-1',
						xCoord: 5,
						yCoord: 5,
						world: { server: {} },
					},
				},
			};

			const mockWorld = {
				id: 'world-1',
				name: 'Main World',
				server: {},
			};

			const mockRegions = [{ id: 'region-1', tiles: [] }];

			vi.mocked(db.db.query.settlements.findFirst).mockResolvedValue(mockSettlement as any);
			vi.mocked(db.db.query.worlds.findFirst).mockResolvedValue(mockWorld as any);
			vi.mocked(db.db.query.regions.findMany).mockResolvedValue(mockRegions as any);

			const response = await request(app)
				.get('/api/regions/map?profileId=profile-123')
				.set('Cookie', 'session=valid-session')
				.expect(200);

			expect(response.body.playerSettlement).toBeDefined();
			expect(response.body.playerSettlement.id).toBe('settlement-1');
			expect(response.body.world).toBeDefined();
			expect(response.body.initialRegionBounds).toBeDefined();
		});

		it('should return map for player without settlement (fallback)', async () => {
			const mockWorld = {
				id: 'world-1',
				name: 'Main World',
				server: {},
			};

			const mockRegions: any[] = [];

			vi.mocked(db.db.query.settlements.findFirst).mockResolvedValue(undefined);
			vi.mocked(db.db.query.worlds.findFirst).mockResolvedValue(mockWorld as any);
			vi.mocked(db.db.query.regions.findMany).mockResolvedValue(mockRegions as any);

			const response = await request(app)
				.get('/api/regions/map?profileId=profile-123')
				.set('Cookie', 'session=valid-session')
				.expect(200);

			expect(response.body.playerSettlement).toBeNull();
			expect(response.body.world).toBeDefined();
			expect(response.body.initialRegionBounds.xMin).toBe(4);
			expect(response.body.initialRegionBounds.xMax).toBe(6);
		});

		it('should use custom center coordinates when provided', async () => {
			const mockWorld = { id: 'world-1', server: {} };
			const mockRegions: any[] = [];

			vi.mocked(db.db.query.settlements.findFirst).mockResolvedValue(undefined);
			vi.mocked(db.db.query.worlds.findFirst).mockResolvedValue(mockWorld as any);
			vi.mocked(db.db.query.regions.findMany).mockResolvedValue(mockRegions as any);

			const response = await request(app)
				.get('/api/regions/map?profileId=profile-123&centerX=10&centerY=10')
				.set('Cookie', 'session=valid-session')
				.expect(200);

			expect(response.body.initialRegionBounds.xMin).toBe(9);
			expect(response.body.initialRegionBounds.xMax).toBe(11);
		});

		it('should use custom radius when provided', async () => {
			const mockWorld = { id: 'world-1', server: {} };
			const mockRegions: any[] = [];

			vi.mocked(db.db.query.settlements.findFirst).mockResolvedValue(undefined);
			vi.mocked(db.db.query.worlds.findFirst).mockResolvedValue(mockWorld as any);
			vi.mocked(db.db.query.regions.findMany).mockResolvedValue(mockRegions as any);

			const response = await request(app)
				.get('/api/regions/map?profileId=profile-123&radius=3')
				.set('Cookie', 'session=valid-session')
				.expect(200);

			expect(response.body.initialRegionBounds.xMin).toBe(2);
			expect(response.body.initialRegionBounds.xMax).toBe(8);
		});

		it('should return 404 if no world found (fallback case)', async () => {
			vi.mocked(db.db.query.settlements.findFirst).mockResolvedValue(undefined);
			vi.mocked(db.db.query.worlds.findFirst).mockResolvedValue(undefined);

			const response = await request(app)
				.get('/api/regions/map?profileId=profile-123')
				.set('Cookie', 'session=valid-session')
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should return 404 if world not found after settlement found', async () => {
			const mockSettlement = {
				tile: {
					region: {
						worldId: 'world-1',
						xCoord: 5,
						yCoord: 5,
					},
				},
			};

			vi.mocked(db.db.query.settlements.findFirst).mockResolvedValue(mockSettlement as any);
			vi.mocked(db.db.query.worlds.findFirst).mockResolvedValue(undefined);

			const response = await request(app)
				.get('/api/regions/map?profileId=profile-123')
				.set('Cookie', 'session=valid-session')
				.expect(404);

			expect(response.body.code).toBe('NOT_FOUND');
		});

		it('should return 500 on database error', async () => {
			vi.mocked(db.db.query.settlements.findFirst).mockRejectedValue(new Error('DB error'));

			const response = await request(app)
				.get('/api/regions/map?profileId=profile-123')
				.set('Cookie', 'session=valid-session')
				.expect(500);

			expect(response.body.code).toBe('FETCH_FAILED');
		});
	});
});
