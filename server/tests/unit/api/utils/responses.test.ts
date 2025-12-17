import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Response } from 'express';
import {
	sendErrorResponse,
	sendServerError,
	sendNotFoundError,
	sendBadRequestError,
	sendUnauthorizedError,
	sendForbiddenError,
} from '../../../../src/api/utils/responses.js';
import { logger } from '../../../../src/utils/logger.js';

// Mock logger
vi.mock('../../../../src/utils/logger.js', () => ({
	logger: {
		error: vi.fn(),
		warn: vi.fn(),
		info: vi.fn(),
	},
}));

describe('Response Utilities', () => {
	let mockRes: Partial<Response>;
	let mockJson: any;
	let mockStatus: any;

	beforeEach(() => {
		// Reset mocks
		vi.clearAllMocks();

		// Create chainable mock
		mockJson = vi.fn().mockReturnThis();
		mockStatus = vi.fn().mockReturnValue({ json: mockJson });

		mockRes = {
			status: mockStatus as any,
			json: mockJson as any,
		};
	});

	describe('sendErrorResponse', () => {
		it('should send error response with all parameters', () => {
			const error = new Error('Test error');
			sendErrorResponse(mockRes as Response, 400, error, 'TEST_ERROR', 'Test error message');

			expect(logger.error).toHaveBeenCalledWith('[API] Error [TEST_ERROR]', error);
			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Test error message',
				code: 'TEST_ERROR',
			});
		});

		it('should send error response without code', () => {
			const error = new Error('Test error');
			sendErrorResponse(mockRes as Response, 500, error, undefined, 'Error occurred');

			expect(logger.error).toHaveBeenCalledWith('[API] Error [UNKNOWN]', error);
			expect(mockStatus).toHaveBeenCalledWith(500);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Error occurred',
			});
		});

		it('should send error response with default message', () => {
			const error = new Error('Test error');
			sendErrorResponse(mockRes as Response, 400, error, 'ERROR_CODE');

			expect(logger.error).toHaveBeenCalledWith('[API] Error [ERROR_CODE]', error);
			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'An error occurred',
				code: 'ERROR_CODE',
			});
		});

		it('should handle non-Error objects', () => {
			const error = 'String error';
			sendErrorResponse(mockRes as Response, 500, error, 'STRING_ERROR', 'String error message');

			expect(logger.error).toHaveBeenCalledWith('[API] Error [STRING_ERROR]', error);
			expect(mockStatus).toHaveBeenCalledWith(500);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'String error message',
				code: 'STRING_ERROR',
			});
		});
	});

	describe('sendServerError', () => {
		it('should send 500 error with default message and code', () => {
			const error = new Error('Database error');
			sendServerError(mockRes as Response, error);

			expect(logger.error).toHaveBeenCalledWith('[API] Error [INTERNAL_ERROR]', error);
			expect(mockStatus).toHaveBeenCalledWith(500);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Internal server error',
				code: 'INTERNAL_ERROR',
			});
		});

		it('should send 500 error with custom message', () => {
			const error = new Error('Custom error');
			sendServerError(mockRes as Response, error, 'Custom server error');

			expect(logger.error).toHaveBeenCalledWith('[API] Error [INTERNAL_ERROR]', error);
			expect(mockStatus).toHaveBeenCalledWith(500);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Custom server error',
				code: 'INTERNAL_ERROR',
			});
		});

		it('should send 500 error with custom code', () => {
			const error = new Error('Database error');
			sendServerError(mockRes as Response, error, 'Database failed', 'DB_ERROR');

			expect(logger.error).toHaveBeenCalledWith('[API] Error [DB_ERROR]', error);
			expect(mockStatus).toHaveBeenCalledWith(500);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Database failed',
				code: 'DB_ERROR',
			});
		});
	});

	describe('sendNotFoundError', () => {
		it('should send 404 error with default code', () => {
			sendNotFoundError(mockRes as Response, 'Resource not found');

			expect(mockStatus).toHaveBeenCalledWith(404);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Resource not found',
				code: 'NOT_FOUND',
			});
		});

		it('should send 404 error with custom code', () => {
			sendNotFoundError(mockRes as Response, 'World not found', 'WORLD_NOT_FOUND');

			expect(mockStatus).toHaveBeenCalledWith(404);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'World not found',
				code: 'WORLD_NOT_FOUND',
			});
		});
	});

	describe('sendBadRequestError', () => {
		it('should send 400 error with default code', () => {
			sendBadRequestError(mockRes as Response, 'Invalid input data');

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Invalid input data',
				code: 'INVALID_INPUT',
			});
		});

		it('should send 400 error with custom code', () => {
			sendBadRequestError(mockRes as Response, 'Missing required field', 'MISSING_FIELD');

			expect(mockStatus).toHaveBeenCalledWith(400);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Missing required field',
				code: 'MISSING_FIELD',
			});
		});
	});

	describe('sendUnauthorizedError', () => {
		it('should send 401 error with default message', () => {
			sendUnauthorizedError(mockRes as Response);

			expect(mockStatus).toHaveBeenCalledWith(401);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Unauthorized',
			});
		});

		it('should send 401 error with custom message', () => {
			sendUnauthorizedError(mockRes as Response, 'Invalid authentication token');

			expect(mockStatus).toHaveBeenCalledWith(401);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Invalid authentication token',
			});
		});

		it('should send 401 error for expired session', () => {
			sendUnauthorizedError(mockRes as Response, 'Session expired');

			expect(mockStatus).toHaveBeenCalledWith(401);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Session expired',
			});
		});
	});

	describe('sendForbiddenError', () => {
		it('should send 403 error with default message', () => {
			sendForbiddenError(mockRes as Response);

			expect(mockStatus).toHaveBeenCalledWith(403);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Forbidden',
			});
		});

		it('should send 403 error with custom message', () => {
			sendForbiddenError(mockRes as Response, 'Insufficient permissions');

			expect(mockStatus).toHaveBeenCalledWith(403);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Insufficient permissions',
			});
		});

		it('should send 403 error for admin-only resource', () => {
			sendForbiddenError(mockRes as Response, 'Admin access required');

			expect(mockStatus).toHaveBeenCalledWith(403);
			expect(mockJson).toHaveBeenCalledWith({
				error: 'Admin access required',
			});
		});
	});

	describe('Response chaining', () => {
		it('should properly chain status and json calls', () => {
			sendNotFoundError(mockRes as Response, 'Not found');

			expect(mockStatus).toHaveBeenCalledBefore(mockJson);
			expect(mockStatus).toHaveBeenCalledWith(404);
			expect(mockJson).toHaveBeenCalledTimes(1);
		});

		it('should handle multiple response calls', () => {
			sendBadRequestError(mockRes as Response, 'Bad request');
			sendNotFoundError(mockRes as Response, 'Not found');

			expect(mockStatus).toHaveBeenCalledTimes(2);
			expect(mockJson).toHaveBeenCalledTimes(2);
		});
	});
});
