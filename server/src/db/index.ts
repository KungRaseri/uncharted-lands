import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

// Load environment variables
dotenv.config();

// Ensure DATABASE_URL is set
if (!process.env.DATABASE_URL) {
	logger.error('[DATABASE] DATABASE_URL environment variable is not set');
	throw new Error('DATABASE_URL environment variable is not set');
}

// Parse database URL for logging (without password)
const dbUrl = new URL(process.env.DATABASE_URL);
const dbInfo = {
	host: dbUrl.hostname,
	port: dbUrl.port || '5432',
	database: dbUrl.pathname.slice(1),
	user: dbUrl.username,
};

logger.info('[DATABASE] Initializing database connection...', dbInfo);

// Create postgres connection with enhanced error handling
const queryClient = postgres(process.env.DATABASE_URL, {
	max: 10, // Connection pool size
	idle_timeout: 20,
	connect_timeout: 10,
	prepare: false, // Disable prepared statements for better compatibility with connection poolers
	onnotice: () => { }, // Suppress notices
	onparameter: () => { }, // Suppress parameter changes
	// debug:
	// 	process.env.NODE_ENV === 'development'
	// 		? (connection, query, params) => {
	// 				logger.debug('[DATABASE] Query executed', {
	// 					query: query.slice(0, 100),
	// 					params: params?.slice(0, 5),
	// 				});
	// 			}
	// 		: undefined,
});

// Test database connection on startup
let dbConnected = false;

try {
	const result = await queryClient`SELECT NOW() as time, version() as version`;
	dbConnected = true;
	logger.info('[DATABASE] ✓ Connection established successfully', {
		serverTime: result[0].time,
		version: result[0].version.split(' ')[0] + ' ' + result[0].version.split(' ')[1],
	});
} catch (error) {
	dbConnected = false;
	logger.error('[DATABASE] ✗ Failed to connect to database', error, dbInfo);
	logger.warn('[DATABASE] Server will start but database operations will fail');
}

// Create drizzle instance
export const db = drizzle(queryClient, { schema });

// Export schema for use in queries
export * from './schema.js';

// Check if database is connected
export function isDatabaseConnected(): boolean {
	return dbConnected;
}

// Graceful shutdown
export async function closeDatabase() {
	logger.info('[DATABASE] Closing database connections...');
	try {
		await queryClient.end({ timeout: 5 });
		dbConnected = false;
		logger.info('[DATABASE] ✓ Database connections closed successfully');
	} catch (error) {
		logger.error('[DATABASE] ✗ Error closing database connections', error);
		throw error;
	}
}
