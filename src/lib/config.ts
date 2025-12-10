/**
 * Client Configuration
 *
 * Centralized configuration for environment variables and API endpoints.
 * Uses SvelteKit's PUBLIC_ prefix for variables that should be available
 * in the browser.
 */

import { env } from '$env/dynamic/public';

/**
 * REST API base URL
 *
 * Used by admin routes for CRUD operations.
 * Default: http://localhost:3001/api (development)
 *
 * Set via PUBLIC_API_URL environment variable.
 */
export const API_URL = env.PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * WebSocket server URL
 *
 * Used by game routes for real-time Socket.IO connections.
 * Default: http://localhost:3001 (development)
 *
 * Set via PUBLIC_WS_URL environment variable.
 */
export const WS_URL = env.PUBLIC_WS_URL || 'http://localhost:3001';

/**
 * Re-export environment utilities for convenience
 * @deprecated Import from $lib/utils/environment instead
 */
export { isDevelopment, isProduction } from './utils/environment';
