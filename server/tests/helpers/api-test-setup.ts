/**
 * API Integration Test Setup Helpers
 *
 * Provides common mock setup patterns used across API integration tests
 * to reduce duplication and standardize test structure.
 */

import { vi, expect } from 'vitest';
import express from 'express';

/**
 * Standard mock for db/index module
 * Returns a function that can be used in vi.mock()
 */
export function getMockDbModule() {
	return {
		db: {
			query: {
				accounts: { findFirst: vi.fn(), findMany: vi.fn() },
				servers: { findFirst: vi.fn(), findMany: vi.fn() },
				worlds: { findFirst: vi.fn(), findMany: vi.fn() },
				regions: { findFirst: vi.fn(), findMany: vi.fn() },
				tiles: { findFirst: vi.fn(), findMany: vi.fn() },
				profiles: { findFirst: vi.fn(), findMany: vi.fn() },
				settlements: { findFirst: vi.fn(), findMany: vi.fn() },
				settlementStorage: { findFirst: vi.fn(), findMany: vi.fn() },
				biomes: { findFirst: vi.fn(), findMany: vi.fn() },
			},
		},
		accounts: {},
		servers: {},
		worlds: {},
		regions: {},
		tiles: {},
		profiles: {},
		settlements: {},
		settlementStorage: {},
		biomes: {},
	};
}

/**
 * Standard mock for logger module
 */
export function getMockLoggerModule() {
	return {
		logger: {
			error: vi.fn(),
			info: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
		},
	};
}

/**
 * Standard mock for auth middleware module
 * Provides basic authenticate and authenticateAdmin functions
 */
export function getMockAuthMiddlewareModule() {
	return {
		authenticate: (req: any, res: any, next: any) => {
			if (req.headers.authorization) {
				req.user = { id: 'user-123', username: 'testuser' };
			}
			next();
		},
		authenticateAdmin: (req: any, res: any, next: any) => {
			if (req.headers.authorization === 'Bearer admin-token') {
				req.user = { id: 'admin-123', username: 'admin', role: 'ADMINISTRATOR' };
				next();
			} else if (req.headers.authorization) {
				res.status(403).json({ error: 'Forbidden', code: 'FORBIDDEN' });
			} else {
				res.status(401).json({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
			}
		},
		optionalAuth: (req: any, res: any, next: any) => {
			if (req.headers.authorization) {
				req.user = { id: 'user-123', username: 'testuser' };
			}
			next();
		},
	};
}

/**
 * Creates a standardized Express app for testing a router
 */
export function createApiTestApp(router: express.Router, path: string): express.Application {
	const app = express();
	app.use(express.json());
	app.use(path, router);
	return app;
}

/**
 * Common test patterns for API routes
 */
export const commonTestPatterns = {
	/**
	 * Test pattern: Unauthorized access
	 */
	unauthorizedAccess: {
		expectedStatus: 401,
		expectedBody: { error: expect.any(String) },
	},

	/**
	 * Test pattern: Forbidden access (insufficient permissions)
	 */
	forbiddenAccess: {
		expectedStatus: 403,
		expectedBody: { error: 'Forbidden', code: 'FORBIDDEN' },
	},

	/**
	 * Test pattern: Resource not found
	 */
	notFound: {
		expectedStatus: 404,
		expectedBody: { error: expect.any(String), code: 'NOT_FOUND' },
	},

	/**
	 * Test pattern: Validation error
	 */
	validationError: {
		expectedStatus: 400,
		expectedBody: { error: expect.any(String), code: 'INVALID_INPUT' },
	},

	/**
	 * Test pattern: Database error
	 */
	databaseError: {
		expectedStatus: 500,
		checkCode: (code: string) => expect(code).toBeDefined(),
	},
};

/**
 * Headers for authenticated requests
 */
export const authHeaders = {
	user: { Authorization: 'Bearer user-token' },
	admin: { Authorization: 'Bearer admin-token' },
};

/**
 * Helper to verify error response structure
 */
export function expectErrorResponse(
	response: any,
	status: number,
	errorMessage?: string,
	code?: string
) {
	expect(response.status).toBe(status);
	expect(response.body.error).toBeDefined();
	if (errorMessage) {
		expect(response.body.error).toContain(errorMessage);
	}
	if (code) {
		expect(response.body.code).toBe(code);
	}
}

/**
 * Helper to mock database errors
 */
export function mockDbError(mockFn: any, errorMessage: string = 'Database error') {
	mockFn.mockRejectedValue(new Error(errorMessage));
}

/**
 * Helper to mock successful database queries
 */
export function mockDbSuccess(mockFn: any, data: any) {
	mockFn.mockResolvedValue(data);
}

/**
 * Helper to mock empty database results
 */
export function mockDbNotFound(mockFn: any) {
	mockFn.mockResolvedValue(undefined);
}
