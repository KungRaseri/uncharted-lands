/**
 * Environment Utilities
 *
 * Centralized environment detection for consistent behavior across the server.
 * Use these instead of directly checking process.env.NODE_ENV.
 */

/**
 * Current NODE_ENV value
 */
export const NODE_ENV = process.env.NODE_ENV || 'development';

/**
 * Is the server running in development mode?
 * Includes: 'development', 'test', 'e2e'
 */
export const isDevelopment =
	NODE_ENV === 'development' || NODE_ENV === 'test' || NODE_ENV === 'e2e';

/**
 * Is the server running in local development mode specifically?
 */
export const isLocalDevelopment = NODE_ENV === 'development';

/**
 * Is the server running in production mode?
 */
export const isProduction = NODE_ENV === 'production';

/**
 * Is the server running in test mode?
 * Includes: 'test', 'e2e'
 */
export const isTest = NODE_ENV === 'test' || NODE_ENV === 'e2e';

/**
 * Is the server running in E2E test mode specifically?
 */
export const isE2E = NODE_ENV === 'e2e';

/**
 * Is the server running in unit test mode specifically?
 */
export const isUnitTest = NODE_ENV === 'test';

/**
 * Should we enable verbose logging?
 * (development, test, or e2e modes)
 */
export const isVerboseLogging = isDevelopment;

/**
 * Should we enable strict rate limiting?
 * (only in production)
 */
export const isStrictRateLimiting = isProduction;

/**
 * Should we expose debugging endpoints?
 * (test and e2e modes only)
 */
export const allowDebugEndpoints = isTest;

/**
 * Should we enable database query logging?
 * (development mode only)
 */
export const enableDatabaseLogging = NODE_ENV === 'development';

/**
 * Get a human-readable environment name
 */
export function getEnvironmentName(): string {
	switch (NODE_ENV) {
		case 'production':
			return 'Production';
		case 'development':
			return 'Development';
		case 'test':
			return 'Unit Test';
		case 'e2e':
			return 'E2E Test';
		default:
			return NODE_ENV;
	}
}

/**
 * Log current environment info (useful for startup)
 */
export function logEnvironmentInfo(logger?: {
	info: (msg: string, meta?: Record<string, unknown>) => void;
}) {
	const info = {
		environment: getEnvironmentName(),
		nodeEnv: NODE_ENV,
		isDevelopment,
		isProduction,
		isTest,
		isE2E,
		verboseLogging: isVerboseLogging,
		strictRateLimiting: isStrictRateLimiting,
		debugEndpoints: allowDebugEndpoints,
		databaseLogging: enableDatabaseLogging,
	};

	if (logger) {
		logger.info('[ENVIRONMENT] Configuration loaded', info);
	} else {
		console.log('[ENVIRONMENT] Configuration:', info);
	}

	return info;
}
