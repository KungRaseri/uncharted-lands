/**
 * Request Logging Middleware
 *
 * Adds request IDs and logs all HTTP requests/responses
 */

import type { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'node:crypto';
import { logger } from '../../utils/logger.js';

// Extend Express Request to include request ID and logger
declare module 'express-serve-static-core' {
	interface Request {
		id: string;
		logger: ReturnType<typeof logger.child>;
		startTime: number;
	}
}

/**
 * Generate or extract request ID
 */
function getRequestId(req: Request): string {
	// Use existing request ID from header if present (for distributed tracing)
	const existingId = req.headers['x-request-id'] as string;
	return existingId || randomUUID();
}

/**
 * Sanitize URL for logging (remove sensitive data)
 */
function sanitizeUrl(url: string): string {
	// Remove sensitive query parameters
	return url.replace(/([?&])(password|token|secret|apikey)=[^&]*/gi, '$1$2=***');
}

/**
 * Get user info from request for logging
 */
function getUserContext(req: Request): { userId?: string; userEmail?: string } {
	if (req.user) {
		return {
			userId: req.user.id,
			userEmail: req.user.email,
		};
	}
	return {};
}

/**
 * Request logging middleware
 *
 * Adds:
 * - Unique request ID
 * - Request start time
 * - Child logger with request context
 * - Logs all requests and responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
	// Generate request ID
	req.id = getRequestId(req);
	req.startTime = Date.now();

	// Add request ID to response headers for client debugging
	res.setHeader('X-Request-Id', req.id);

	// Create child logger with request context
	req.logger = logger.child({ requestId: req.id });

	// Log incoming request
	const sanitizedUrl = sanitizeUrl(req.url);
	req.logger.httpRequest(req.method, sanitizedUrl, {
		ip: req.ip,
		userAgent: req.headers['user-agent'],
	});

	// Capture response
	const originalSend = res.send;
	let responseLogged = false;

	res.send = function (body): Response {
		if (!responseLogged) {
			const duration = Date.now() - req.startTime;
			const userContext = getUserContext(req);

			req.logger.httpResponse(req.method, sanitizedUrl, res.statusCode, duration, {
				...userContext,
				contentLength: res.getHeader('content-length'),
			});

			// Log slow requests as warnings
			if (duration > 1000) {
				req.logger.warn('Slow request detected', {
					duration,
					method: req.method,
					path: sanitizedUrl,
				});
			}

			responseLogged = true;
		}

		return originalSend.call(this, body);
	};

	next();
};

/**
 * Error logging middleware (should be added after routes)
 */
export const errorLogger = (err: Error, req: Request, res: Response, next: NextFunction): void => {
	const duration = Date.now() - (req.startTime || Date.now());
	const userContext = getUserContext(req);

	// Log error with full context
	if (req.logger) {
		req.logger.error('Request error', err, {
			...userContext,
			method: req.method,
			path: req.url,
			duration,
			statusCode: res.statusCode,
		});
	} else {
		logger.error('Request error (no request logger)', err, {
			requestId: req.id,
			method: req.method,
			path: req.url,
		});
	}

	next(err);
};
