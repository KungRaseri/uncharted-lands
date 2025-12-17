import type { Response } from 'express';
import { logger } from '../../utils/logger.js';

/**
 * Sends a standardized error response with optional error logging
 */
export function sendErrorResponse(
	res: Response,
	status: number,
	error: unknown,
	code?: string,
	message?: string
): void {
	logger.error(`[API] Error [${code || 'UNKNOWN'}]`, error);

	res.status(status).json({
		error: message || 'An error occurred',
		...(code && { code }),
	});
}

/**
 * Sends a 500 Internal Server Error response
 */
export function sendServerError(
	res: Response,
	error: unknown,
	message: string = 'Internal server error',
	code: string = 'INTERNAL_ERROR'
): void {
	sendErrorResponse(res, 500, error, code, message);
}

/**
 * Sends a 404 Not Found response
 */
export function sendNotFoundError(
	res: Response,
	message: string,
	code: string = 'NOT_FOUND'
): void {
	res.status(404).json({ error: message, code });
}

/**
 * Sends a 400 Bad Request response
 */
export function sendBadRequestError(
	res: Response,
	message: string,
	code: string = 'INVALID_INPUT'
): void {
	res.status(400).json({ error: message, code });
}

/**
 * Sends a 401 Unauthorized response
 */
export function sendUnauthorizedError(res: Response, message: string = 'Unauthorized'): void {
	res.status(401).json({ error: message });
}

/**
 * Sends a 403 Forbidden response
 */
export function sendForbiddenError(res: Response, message: string = 'Forbidden'): void {
	res.status(403).json({ error: message });
}
