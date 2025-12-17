/**
 * Test Utilities and Helpers
 *
 * Provides common testing utilities, mocks, and helper functions
 * for API and integration tests.
 */

import { vi, expect } from 'vitest';
import type { Request, Response, NextFunction } from 'express';

/**
 * Mock Express Request
 */
export function createMockRequest(overrides: Partial<Request> = {}): Partial<Request> {
	return {
		body: {},
		params: {},
		query: {},
		headers: {},
		cookies: {},
		...overrides,
	};
}

/**
 * Mock Express Response
 */
export function createMockResponse(): Partial<Response> & {
	status: ReturnType<typeof vi.fn>;
	json: ReturnType<typeof vi.fn>;
	send: ReturnType<typeof vi.fn>;
	sendStatus: ReturnType<typeof vi.fn>;
} {
	const res: any = {
		status: vi.fn().mockReturnThis(),
		json: vi.fn().mockReturnThis(),
		send: vi.fn().mockReturnThis(),
		sendStatus: vi.fn().mockReturnThis(),
		setHeader: vi.fn().mockReturnThis(),
		cookie: vi.fn().mockReturnThis(),
		clearCookie: vi.fn().mockReturnThis(),
	};
	return res;
}

/**
 * Mock Next Function
 */
export function createMockNext(): NextFunction {
	return vi.fn() as any;
}

/**
 * Mock Database Query Result
 */
export function createMockQueryResult<T>(data: T[]): {
	rows: T[];
	rowCount: number;
} {
	return {
		rows: data,
		rowCount: data.length,
	};
}

/**
 * Mock User for Authentication
 */
export interface MockUser {
	id: string;
	username: string;
	email: string;
	role: 'user' | 'admin';
	profile?: {
		id: string;
		username: string;
		serverId: string;
		accountId: string;
	};
}

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
	return {
		id: 'test-user-id',
		username: 'testuser',
		email: 'test@example.com',
		role: 'user',
		...overrides,
	};
}

export function createMockAdmin(overrides: Partial<MockUser> = {}): MockUser {
	return createMockUser({
		role: 'admin',
		username: 'adminuser',
		email: 'admin@example.com',
		...overrides,
	});
}

/**
 * Mock Database Entities
 */
export function createMockServer(id: string = 'server-1') {
	return {
		id,
		name: `Test Server ${id}`,
		description: 'Test server description',
		maxPlayers: 100,
		isActive: true,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export function createMockWorld(serverId: string = 'server-1', id: string = 'world-1') {
	return {
		id,
		name: `Test World ${id}`,
		serverId,
		width: 10,
		height: 10,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export function createMockRegion(worldId: string = 'world-1', x: number = 0, y: number = 0) {
	return {
		id: `region-${x}-${y}`,
		worldId,
		x,
		y,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export function createMockTile(regionId: string = 'region-0-0', x: number = 0, y: number = 0) {
	return {
		id: `tile-${x}-${y}`,
		regionId,
		x,
		y,
		elevation: 15,
		temperature: 20,
		precipitation: 200,
		biomeId: 'biome-grassland',
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export function createMockPlot(tileId: string = 'tile-0-0', x: number = 0, y: number = 0) {
	return {
		id: `plot-${x}-${y}`,
		tileId,
		x,
		y,
		area: 100,
		solar: 5,
		wind: 5,
		wood: 5,
		stone: 3,
		ore: 2,
		food: 4,
		water: 3,
	};
}

export function createMockProfile(accountId: string = 'account-1', serverId: string = 'server-1') {
	return {
		id: `profile-${accountId}`,
		username: 'Test Player',
		serverId,
		accountId,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export function createMockSettlement(
	plotId: string = 'plot-0-0',
	playerProfileId: string = 'profile-1'
) {
	return {
		id: `settlement-${plotId}`,
		name: 'Test Settlement',
		plotId,
		playerProfileId,
		createdAt: new Date(),
		updatedAt: new Date(),
	};
}

export function createMockSettlementStorage(settlementId: string = 'settlement-1') {
	return {
		id: `storage-${settlementId}`,
		settlementId,
		food: 100,
		water: 80,
		wood: 50,
		stone: 30,
		ore: 10,
		updatedAt: new Date(),
	};
}

export function createMockBiome(name: string = 'Grassland') {
	return {
		id: `biome-${name.toLowerCase()}`,
		name,
		color: '#90EE90',
		description: `${name} biome`,
		createdAt: new Date(),
	};
}

/**
 * Mock Authentication Middleware
 */
export function mockAuthenticateMiddleware(user: MockUser) {
	return vi.fn((req: any, res: any, next: any) => {
		req.user = user;
		next();
	});
}

export function mockAuthenticateAdminMiddleware(admin: MockUser) {
	return vi.fn((req: any, res: any, next: any) => {
		if (admin.role !== 'admin') {
			return res.status(403).json({ error: 'Admin access required' });
		}
		req.user = admin;
		next();
	});
}

/**
 * Database Mock Helpers
 */
export function createMockDb() {
	return {
		query: {
			accounts: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			servers: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			worlds: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			regions: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			tiles: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			profiles: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			settlements: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			settlementStorage: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
			biomes: {
				findFirst: vi.fn(),
				findMany: vi.fn(),
			},
		},
		insert: vi.fn().mockReturnThis(),
		values: vi.fn().mockReturnThis(),
		returning: vi.fn(),
		update: vi.fn().mockReturnThis(),
		set: vi.fn().mockReturnThis(),
		where: vi.fn().mockReturnThis(),
		delete: vi.fn().mockReturnThis(),
	};
}

/**
 * Wait for async operations
 */
export async function wait(ms: number = 0): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random test data
 */

/**
 * Get a random integer between 0 and max (exclusive)
 * Using Math.random() for test data generation is acceptable for non-cryptographic purposes
 */
function getRandomInt(max: number): number {
	return Math.floor(Math.random() * max); // NOSONAR
}

/**
 * Generate a random test ID suffix
 * Using Math.random() for test data generation is acceptable for non-cryptographic purposes
 */
export function generateTestId(prefix: string = 'test-id'): string {
	return `${prefix}-${Math.random().toString(36).substring(7)}`; // NOSONAR
}

/**
 * Generate a random test password (minimum 16 characters)
 */
export function generateTestPassword(): string {
	const randomPart = Math.random().toString(36).substring(2);
	return `test-password-${randomPart}`.padEnd(16, '0'); // NOSONAR - Ensure minimum 16 chars
}

export function generateRandomString(length: number = 10): string {
	const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
	let result = '';
	for (let i = 0; i < length; i++) {
		result += chars.charAt(getRandomInt(chars.length));
	}
	return result;
}

export function generateRandomEmail(): string {
	return `test${generateRandomString(8)}@example.com`;
}

/**
 * Assert Response Helpers
 */
export function expectSuccessResponse(res: any, statusCode: number = 200) {
	expect(res.status).toHaveBeenCalledWith(statusCode);
	expect(res.json).toHaveBeenCalled();
}

export function expectErrorResponse(res: any, statusCode: number, errorMessage?: string) {
	expect(res.status).toHaveBeenCalledWith(statusCode);
	if (errorMessage) {
		expect(res.json).toHaveBeenCalledWith(
			expect.objectContaining({ error: expect.stringContaining(errorMessage) })
		);
	}
}

export function expectValidationError(res: any) {
	expectErrorResponse(res, 400);
}

export function expectUnauthorizedError(res: any) {
	expectErrorResponse(res, 401);
}

export function expectForbiddenError(res: any) {
	expectErrorResponse(res, 403);
}

export function expectNotFoundError(res: any) {
	expectErrorResponse(res, 404);
}

export function expectConflictError(res: any) {
	expectErrorResponse(res, 409);
}

export function expectServerError(res: any) {
	expectErrorResponse(res, 500);
}
