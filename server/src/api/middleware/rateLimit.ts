/**
 * Rate Limiting Middleware
 *
 * Protects API endpoints from abuse by limiting request rates
 */

import rateLimit from 'express-rate-limit';
import { logger } from '../../utils/logger.js';
import { isDevelopment } from '../../utils/environment.js';

// Significantly relax rate limits in development/test/e2e environments
const testMultiplier = isDevelopment ? 1000 : 1; // 1000x more lenient in dev/test/e2e

/**
 * Standard rate limiter for most API endpoints
 *
 * Production: 100 requests per 15 minutes per IP
 * Development/Test: 10,000 requests per 15 minutes per IP
 */
export const apiLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 100 * testMultiplier, // Limit each IP to 100 requests per windowMs (10k in dev/test)
	message: {
		error: 'Too Many Requests',
		code: 'RATE_LIMIT_EXCEEDED',
		message: 'Too many requests from this IP, please try again after 15 minutes',
	},
	standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers
	handler: (req, res) => {
		logger.warn(`[RATE LIMIT] IP ${req.ip} exceeded rate limit on ${req.path}`);
		res.status(429).json({
			error: 'Too Many Requests',
			code: 'RATE_LIMIT_EXCEEDED',
			message: 'Too many requests from this IP, please try again after 15 minutes',
		});
	},
});

/**
 * Strict rate limiter for sensitive operations (create, update, delete)
 *
 * Production: 20 requests per 15 minutes per IP
 * Development/Test: 2,000 requests per 15 minutes per IP
 */
export const strictLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 20 * testMultiplier, // Limit each IP to 20 requests per windowMs (2k in dev/test)
	message: {
		error: 'Too Many Requests',
		code: 'RATE_LIMIT_EXCEEDED',
		message: 'Too many modification requests from this IP, please try again after 15 minutes',
	},
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn(`[RATE LIMIT] IP ${req.ip} exceeded strict rate limit on ${req.path}`);
		res.status(429).json({
			error: 'Too Many Requests',
			code: 'RATE_LIMIT_EXCEEDED',
			message: 'Too many modification requests from this IP, please try again after 15 minutes',
		});
	},
});

/**
 * Lenient rate limiter for high-frequency read operations
 *
 * Production: 300 requests per 15 minutes per IP
 * Development/Test: 30,000 requests per 15 minutes per IP
 */
export const readLimiter = rateLimit({
	windowMs: 15 * 60 * 1000, // 15 minutes
	max: 300 * testMultiplier, // Limit each IP to 300 requests per windowMs (30k in dev/test)
	message: {
		error: 'Too Many Requests',
		code: 'RATE_LIMIT_EXCEEDED',
		message: 'Too many requests from this IP, please try again after 15 minutes',
	},
	standardHeaders: true,
	legacyHeaders: false,
	handler: (req, res) => {
		logger.warn(`[RATE LIMIT] IP ${req.ip} exceeded read rate limit on ${req.path}`);
		res.status(429).json({
			error: 'Too Many Requests',
			code: 'RATE_LIMIT_EXCEEDED',
			message: 'Too many requests from this IP, please try again after 15 minutes',
		});
	},
});
