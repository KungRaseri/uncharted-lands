import { describe, it, expect, vi } from 'vitest';
import {
	createMockRequest,
	createMockResponse,
	createMockNext,
	createMockQueryResult,
	createMockUser,
	createMockAdmin,
	createMockServer,
	createMockWorld,
	createMockRegion,
	createMockTile,
	createMockPlot,
	createMockProfile,
	createMockSettlement,
	createMockSettlementStorage,
	createMockBiome,
	mockAuthenticateMiddleware,
	mockAuthenticateAdminMiddleware,
	createMockDb,
	wait,
	generateTestId,
	generateTestPassword,
	generateRandomString,
	generateRandomEmail,
	expectSuccessResponse,
	expectErrorResponse,
	expectValidationError,
	expectUnauthorizedError,
	expectForbiddenError,
	expectNotFoundError,
	expectConflictError,
	expectServerError,
} from './test-utils';

describe('Test Utils', () => {
	describe('Mock Express Objects', () => {
		it('should create mock request', () => {
			const req = createMockRequest({ body: { test: 'data' } });
			expect(req.body).toEqual({ test: 'data' });
			expect(req.params).toEqual({});
			expect(req.query).toEqual({});
		});

		it('should create mock response', () => {
			const res = createMockResponse();
			expect(res.status).toBeDefined();
			expect(res.json).toBeDefined();
			expect(res.send).toBeDefined();
			expect(res.sendStatus).toBeDefined();
		});

		it('should create mock next function', () => {
			const next = createMockNext();
			expect(typeof next).toBe('function');
		});

		it('should create mock query result', () => {
			const data = [{ id: '1' }, { id: '2' }];
			const result = createMockQueryResult(data);
			expect(result.rows).toEqual(data);
			expect(result.rowCount).toBe(2);
		});
	});

	describe('Mock Users', () => {
		it('should create mock user', () => {
			const user = createMockUser();
			expect(user.id).toBe('test-user-id');
			expect(user.role).toBe('user');
			expect(user.email).toBe('test@example.com');
		});

		it('should create mock user with overrides', () => {
			const user = createMockUser({ username: 'custom' });
			expect(user.username).toBe('custom');
		});

		it('should create mock admin', () => {
			const admin = createMockAdmin();
			expect(admin.role).toBe('admin');
			expect(admin.email).toBe('admin@example.com');
		});

		it('should create mock admin with overrides', () => {
			const admin = createMockAdmin({ username: 'superadmin' });
			expect(admin.username).toBe('superadmin');
			expect(admin.role).toBe('admin');
		});
	});

	describe('Mock Database Entities', () => {
		it('should create mock server', () => {
			const server = createMockServer('srv-1');
			expect(server.id).toBe('srv-1');
			expect(server.name).toContain('Test Server');
			expect(server.maxPlayers).toBe(100);
		});

		it('should create mock world', () => {
			const world = createMockWorld('srv-1', 'world-1');
			expect(world.id).toBe('world-1');
			expect(world.serverId).toBe('srv-1');
			expect(world.width).toBe(10);
		});

		it('should create mock region', () => {
			const region = createMockRegion('world-1', 5, 10);
			expect(region.worldId).toBe('world-1');
			expect(region.x).toBe(5);
			expect(region.y).toBe(10);
		});

		it('should create mock tile', () => {
			const tile = createMockTile('region-1', 3, 4);
			expect(tile.regionId).toBe('region-1');
			expect(tile.x).toBe(3);
			expect(tile.y).toBe(4);
			expect(tile.elevation).toBe(15);
		});

		it('should create mock plot', () => {
			const plot = createMockPlot('tile-1', 2, 3);
			expect(plot.tileId).toBe('tile-1');
			expect(plot.x).toBe(2);
			expect(plot.y).toBe(3);
			expect(plot.area).toBe(100);
		});

		it('should create mock profile', () => {
			const profile = createMockProfile('acc-1', 'srv-1');
			expect(profile.accountId).toBe('acc-1');
			expect(profile.serverId).toBe('srv-1');
			expect(profile.username).toBe('Test Player');
		});

		it('should create mock settlement', () => {
			const settlement = createMockSettlement('plot-1', 'profile-1');
			expect(settlement.plotId).toBe('plot-1');
			expect(settlement.playerProfileId).toBe('profile-1');
			expect(settlement.name).toBe('Test Settlement');
		});

		it('should create mock settlement storage', () => {
			const storage = createMockSettlementStorage('settlement-1');
			expect(storage.settlementId).toBe('settlement-1');
			expect(storage.food).toBe(100);
			expect(storage.water).toBe(80);
		});

		it('should create mock biome', () => {
			const biome = createMockBiome('Desert');
			expect(biome.name).toBe('Desert');
			expect(biome.id).toContain('desert');
		});
	});

	describe('Mock Middleware', () => {
		it('should create authenticate middleware', () => {
			const user = createMockUser();
			const middleware = mockAuthenticateMiddleware(user);
			const req: any = {};
			const res: any = {};
			const next = vi.fn();

			middleware(req, res, next);

			expect(req.user).toEqual(user);
			expect(next).toHaveBeenCalled();
		});

		it('should create authenticate admin middleware that allows admin', () => {
			const admin = createMockAdmin();
			const middleware = mockAuthenticateAdminMiddleware(admin);
			const req: any = {};
			const res: any = {
				status: vi.fn().mockReturnThis(),
				json: vi.fn(),
			};
			const next = vi.fn();

			middleware(req, res, next);

			expect(req.user).toEqual(admin);
			expect(next).toHaveBeenCalled();
		});

		it('should create authenticate admin middleware that rejects non-admin', () => {
			const user = createMockUser(); // regular user, not admin
			const middleware = mockAuthenticateAdminMiddleware(user);
			const req: any = {};
			const res: any = {
				status: vi.fn().mockReturnThis(),
				json: vi.fn(),
			};
			const next = vi.fn();

			middleware(req, res, next);

			expect(res.status).toHaveBeenCalledWith(403);
			expect(res.json).toHaveBeenCalled();
			expect(next).not.toHaveBeenCalled();
		});
	});

	describe('Mock Database', () => {
		it('should create mock database', () => {
			const db = createMockDb();
			expect(db.query).toBeDefined();
			expect(db.insert).toBeDefined();
			expect(db.update).toBeDefined();
			expect(db.delete).toBeDefined();
		});
	});

	describe('Utility Functions', () => {
		it('should wait for specified time', async () => {
			const start = Date.now();
			await wait(10);
			const elapsed = Date.now() - start;
			expect(elapsed).toBeGreaterThanOrEqual(8); // Allow some timing variance
		});

		it('should generate test ID with prefix', () => {
			const id = generateTestId('custom');
			expect(id).toContain('custom-');
		});

		it('should generate test password', () => {
			const password = generateTestPassword();
			expect(password).toContain('test-password-');
			expect(password.length).toBeGreaterThanOrEqual(16);
		});

		it('should generate random string of specified length', () => {
			const str = generateRandomString(15);
			expect(str.length).toBe(15);
		});

		it('should generate random email', () => {
			const email = generateRandomEmail();
			expect(email).toContain('@example.com');
			expect(email).toContain('test');
		});
	});

	describe('Assert Response Helpers', () => {
		it('should assert success response', () => {
			const res: any = {
				status: vi.fn(),
				json: vi.fn(),
			};
			res.status(200);
			res.json({ success: true });

			expectSuccessResponse(res);
			expect(res.status).toHaveBeenCalledWith(200);
		});

		it('should assert error response', () => {
			const res: any = {
				status: vi.fn(),
				json: vi.fn(),
			};
			res.status(400);
			res.json({ error: 'Bad Request' });

			expectErrorResponse(res, 400);
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('should assert error response with message', () => {
			const res: any = {
				status: vi.fn(),
				json: vi.fn(),
			};
			res.status(400);
			res.json({ error: 'Invalid input provided' });

			expectErrorResponse(res, 400, 'Invalid input');
			expect(res.status).toHaveBeenCalledWith(400);
			expect(res.json).toHaveBeenCalledWith(
				expect.objectContaining({ error: expect.stringContaining('Invalid input') })
			);
		});

		it('should assert validation error', () => {
			const res: any = {
				status: vi.fn(),
				json: vi.fn(),
			};
			res.status(400);

			expectValidationError(res);
			expect(res.status).toHaveBeenCalledWith(400);
		});

		it('should assert unauthorized error', () => {
			const res: any = {
				status: vi.fn(),
				json: vi.fn(),
			};
			res.status(401);

			expectUnauthorizedError(res);
			expect(res.status).toHaveBeenCalledWith(401);
		});

		it('should assert forbidden error', () => {
			const res: any = {
				status: vi.fn(),
				json: vi.fn(),
			};
			res.status(403);

			expectForbiddenError(res);
			expect(res.status).toHaveBeenCalledWith(403);
		});

		it('should assert not found error', () => {
			const res: any = {
				status: vi.fn(),
				json: vi.fn(),
			};
			res.status(404);

			expectNotFoundError(res);
			expect(res.status).toHaveBeenCalledWith(404);
		});

		it('should assert conflict error', () => {
			const res: any = {
				status: vi.fn(),
				json: vi.fn(),
			};
			res.status(409);

			expectConflictError(res);
			expect(res.status).toHaveBeenCalledWith(409);
		});

		it('should assert server error', () => {
			const res: any = {
				status: vi.fn(),
				json: vi.fn(),
			};
			res.status(500);

			expectServerError(res);
			expect(res.status).toHaveBeenCalledWith(500);
		});
	});
});
