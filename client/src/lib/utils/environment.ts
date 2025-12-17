/**
 * Environment Utilities (Client)
 *
 * Centralized environment detection for consistent behavior across the client.
 * Use these instead of directly checking import.meta.env.
 */

/**
 * Current environment mode
 */
export const MODE = import.meta.env.MODE;

/**
 * Is Vite running in dev mode?
 */
export const DEV = import.meta.env.DEV;

/**
 * Is the client running in development mode?
 * Includes: dev server, test, e2e
 */
export const isDevelopment = DEV || MODE === 'test' || MODE === 'e2e' || MODE === 'development';

/**
 * Is the client running in production mode?
 */
export const isProduction = MODE === 'production' && !DEV;

/**
 * Is the client running in test mode?
 * Includes: test, e2e
 */
export const isTest = MODE === 'test' || MODE === 'e2e';

/**
 * Is the client running in E2E test mode specifically?
 */
export const isE2E = MODE === 'e2e';

/**
 * Is the client running in unit test mode specifically?
 */
export const isUnitTest = MODE === 'test';

/**
 * Should we enable verbose logging?
 * (development modes only)
 */
export const isVerboseLogging = isDevelopment;

/**
 * Should we expose debugging utilities?
 * (test modes + dev server)
 */
export const allowDebugUtilities = isDevelopment;

/**
 * Should we expose Socket.IO to window for testing?
 * (test and e2e modes only)
 */
export const exposeSocketForTesting = isTest || DEV;

/**
 * Get a human-readable environment name
 */
export function getEnvironmentName(): string {
	if (MODE === 'e2e') return 'E2E Test';
	if (MODE === 'test') return 'Unit Test';
	if (MODE === 'development' || DEV) return 'Development';
	if (MODE === 'production') return 'Production';
	return MODE;
}

/**
 * Log current environment info (useful for debugging)
 */
export function logEnvironmentInfo() {
	const info = {
		environment: getEnvironmentName(),
		mode: MODE,
		dev: DEV,
		isDevelopment,
		isProduction,
		isTest,
		isE2E,
		verboseLogging: isVerboseLogging,
		debugUtilities: allowDebugUtilities,
		exposeSocket: exposeSocketForTesting
	};

	console.log('[ENVIRONMENT] Configuration:', info);

	return info;
}
