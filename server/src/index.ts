/**
 * Uncharted Lands - Game Server
 *
 * Real-time multiplayer game server using Socket.IO
 */

// Initialize Sentry FIRST (before any other imports)
import { initSentry } from './utils/sentry.js';
initSentry();

import { Server } from 'socket.io';
import http from 'node:http';
import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';

// Load environment variables BEFORE other imports that need them
dotenv.config();

import { expressErrorHandler } from '@sentry/node';
import type {
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData,
} from '@uncharted-lands/shared';
import { registerEventHandlers } from './events/handlers.js';
import { setupPresenceTracking } from './events/presence.js';
import {
	authenticationMiddleware,
	loggingMiddleware,
	errorHandlingMiddleware,
} from './middleware/socket-middleware.js';
import { logger } from './utils/logger.js';
import { closeDatabase, isDatabaseConnected } from './db/index.js';
import { startGameLoop, stopGameLoop, getGameLoopStatus } from './game/game-loop.js';
import { startTransportQueue, stopTransportQueue } from './game/transport-queue.js';
import apiRouter from './api/index.js';
import { apiLimiter } from './api/middleware/rateLimit.js';
import { requestLogger, errorLogger } from './api/middleware/request-logger.js';

// Configuration
const PORT = Number.parseInt(process.env.PORT || '3001', 10);
const HOST = process.env.HOST || '0.0.0.0';
const CORS_ORIGINS = process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5173'];
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create Express app
export const app = express();

// Express middleware
app.use(
	cors({
		origin: CORS_ORIGINS,
		credentials: true,
		methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	})
);
app.use(express.json()); // Default limit is sufficient for settings
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (adds request ID and logs all requests)
app.use(requestLogger);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// REST API routes
app.use('/api', apiRouter);

// Sentry error handler (must be after routes but before other error handlers)
app.use(expressErrorHandler());

// Error logging middleware (logs all errors)
app.use(errorLogger);

// Health check endpoint
app.get('/health', (req, res) => {
	const gameLoopStatus = getGameLoopStatus();
	const dbStatus = isDatabaseConnected();

	res.json({
		status: dbStatus ? 'healthy' : 'degraded',
		uptime: process.uptime(),
		connections: io?.engine?.clientsCount || 0,
		environment: NODE_ENV,
		database: {
			connected: dbStatus,
			status: dbStatus ? 'operational' : 'unavailable',
		},
		gameLoop: gameLoopStatus,
		timestamp: new Date().toISOString(),
	});
});

// 404 handler for unknown routes
app.use((req, res) => {
	res.status(404).json({
		error: 'Not found',
		path: req.path,
		method: req.method,
	});
});

// Create HTTP server from Express app
const httpServer = http.createServer(app);

// Create Socket.IO server with TypeScript types
const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
	httpServer,
	{
		cors: {
			origin: CORS_ORIGINS,
			methods: ['GET', 'POST'],
			credentials: true,
		},
		// Connection settings
		pingTimeout: 60000, // 60 seconds before considering connection dead
		pingInterval: 25000, // Send ping every 25 seconds
		upgradeTimeout: 30000, // 30 seconds to complete upgrade
		maxHttpBufferSize: 1e6, // 1MB max message size
		// Enable compression for production
		perMessageDeflate: NODE_ENV === 'production',
		// Transport options
		transports: ['websocket', 'polling'],
		allowUpgrades: true,
	}
);

// Make Socket.IO instance available to Express routes
app.set('io', io);

// Apply middleware
io.use(loggingMiddleware);
io.use(authenticationMiddleware);
io.use(errorHandlingMiddleware);

// Setup presence tracking (ARTIFACT-05 Phase 2)
setupPresenceTracking(io);

// Start transport queue processor (ARTIFACT-05 Phase 3)
startTransportQueue(io);

// Handle new connections
io.on('connection', (socket) => {
	const connectionInfo = {
		socketId: socket.id,
		address: socket.handshake.address,
		transport: socket.conn.transport.name,
		userAgent: socket.handshake.headers['user-agent'],
	};

	logger.info('[SOCKET] ✓ Client connected', connectionInfo);

	// Send welcome message
	socket.emit('connected', {
		message: 'Welcome to Uncharted Lands Server',
		socketId: socket.id,
		timestamp: Date.now(),
	});

	// Register all event handlers
	registerEventHandlers(socket);

	// Log transport upgrades
	socket.conn.on('upgrade', (transport) => {
		logger.debug('[SOCKET] Transport upgraded', {
			socketId: socket.id,
			from: socket.conn.transport.name,
			to: transport.name,
		});
	});

	// Track connection duration on disconnect
	socket.on('disconnect', (reason) => {
		const duration = Date.now() - socket.data.connectedAt;
		logger.info('[SOCKET] ✗ Client disconnected', {
			socketId: socket.id,
			reason,
			durationMs: duration,
			durationFormatted: `${(duration / 1000).toFixed(2)}s`,
			playerId: socket.data.playerId || 'unauthenticated',
		});
	});
});

/**
 * Broadcast message to all clients in a specific world
 */
export function broadcastToWorld(worldId: string, event: string, data: unknown): void {
	io.to(`world:${worldId}`).emit(event as keyof ServerToClientEvents, data as never);
}

/**
 * Broadcast message to all connected clients
 */
export function broadcastToAll(event: string, data: unknown): void {
	io.emit(event as keyof ServerToClientEvents, data as never);
}

/**
 * Get connection statistics
 */
export function getStats() {
	return {
		connections: io.engine.clientsCount,
		uptime: process.uptime(),
		environment: NODE_ENV,
	};
}

/**
 * Get known API routes
 * Note: This is a static list since Express doesn't expose registered routes
 * until after the server starts listening
 */
function getKnownApiRoutes(): Array<{ method: string; path: string }> {
	const routes = [
		// Health checks
		{ method: 'GET', path: '/health' },
		{ method: 'GET', path: '/api/health' },

		// Auth routes
		{ method: 'POST', path: '/api/auth/register' },
		{ method: 'POST', path: '/api/auth/login' },
		{ method: 'POST', path: '/api/auth/logout' },
		{ method: 'GET', path: '/api/auth/session' },

		// Account routes
		{ method: 'GET', path: '/api/account/:id' },
		{ method: 'PUT', path: '/api/account/:id' },
		{ method: 'DELETE', path: '/api/account/:id' },

		// Config routes
		{ method: 'GET', path: '/api/config' },

		// World routes
		{ method: 'GET', path: '/api/worlds' },
		{ method: 'POST', path: '/api/worlds' },
		{ method: 'GET', path: '/api/worlds/:id' },
		{ method: 'POST', path: '/api/worlds/:id/generate' },

		// Server routes
		{ method: 'GET', path: '/api/servers' },
		{ method: 'POST', path: '/api/servers' },
		{ method: 'GET', path: '/api/servers/:id' },

		// Region routes
		{ method: 'GET', path: '/api/regions' },
		{ method: 'GET', path: '/api/regions/:id' },

		// Player routes
		{ method: 'GET', path: '/api/players' },
		{ method: 'GET', path: '/api/players/:id' },
		{ method: 'PUT', path: '/api/players/:id' },
		{ method: 'DELETE', path: '/api/players/:id' },

		// Settlement routes
		{ method: 'GET', path: '/api/settlements' },
		{ method: 'POST', path: '/api/settlements' },
		{ method: 'GET', path: '/api/settlements/:id' },
		{ method: 'PUT', path: '/api/settlements/:id' },
		{ method: 'DELETE', path: '/api/settlements/:id' },

		// Structure routes
		{ method: 'GET', path: '/api/structures/:id' },
		{ method: 'POST', path: '/api/structures/create' },
		{ method: 'POST', path: '/api/structures/:id/upgrade' },
		{ method: 'DELETE', path: '/api/structures/:id' },

		// Admin routes
		{ method: 'GET', path: '/api/admin/stats' },
	];

	// Add test endpoints only in development/test environments
	const isTestEnvironment =
		process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test';
	if (isTestEnvironment) {
		routes.push(
			// Test helper routes
			{ method: 'GET', path: '/api/test/error' },
			{ method: 'DELETE', path: '/api/test/cleanup/user/:email' },
			{ method: 'DELETE', path: '/api/test/cleanup/users/pattern' },
			{ method: 'DELETE', path: '/api/test/cleanup/all' },
			{ method: 'GET', path: '/api/test/users' },
			{ method: 'PUT', path: '/api/test/elevate-admin/:email' },

			// Test admin routes (require TEST_ADMIN_TOKEN header)
			{ method: 'POST', path: '/api/test-admin/elevate-user' },
			{ method: 'POST', path: '/api/test-admin/reset-user-role' },
			{ method: 'GET', path: '/api/test-admin/health' }
		);
	}

	return routes;
}

/**
 * Get memory usage statistics
 */
function getMemoryStats() {
	const usage = process.memoryUsage();
	return {
		heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
		heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
		rss: `${(usage.rss / 1024 / 1024).toFixed(2)} MB`,
		external: `${(usage.external / 1024 / 1024).toFixed(2)} MB`,
	};
}

// Start server
httpServer.listen(PORT, HOST, () => {
	const dbStatus = isDatabaseConnected();
	const memStats = getMemoryStats();
	const routes = getKnownApiRoutes();

	// Group routes by base path
	const routesByPath = routes.reduce(
		(
			acc: Record<string, Array<{ method: string; path: string }>>,
			route: { method: string; path: string }
		) => {
			const basePath = route.path.split('/')[1] || 'root';
			if (!acc[basePath]) acc[basePath] = [];
			acc[basePath].push(route);
			return acc;
		},
		{} as Record<string, Array<{ method: string; path: string }>>
	);

	logger.info('═'.repeat(80));
	logger.info('  🎮 Uncharted Lands - Game Server');
	logger.info('═'.repeat(80));
	logger.info(`  Server Time:  ${new Date().toISOString()}`);
	logger.info(`  Node Version: ${process.version}`);
	logger.info(`  Process ID:   ${process.pid}`);
	logger.info(`  Platform:     ${process.platform} (${process.arch})`);
	logger.info('─'.repeat(80));
	logger.info('  📡 Server Endpoints:');
	logger.info(`     WebSocket:    ws://${HOST}:${PORT}`);
	logger.info(`     REST API:     http://${HOST}:${PORT}/api`);
	logger.info(`     Health Check: http://${HOST}:${PORT}/health`);
	logger.info('─'.repeat(80));
	logger.info('  💾 Memory Usage:');
	logger.info(`     Heap Used:    ${memStats.heapUsed}`);
	logger.info(`     Heap Total:   ${memStats.heapTotal}`);
	logger.info(`     RSS:          ${memStats.rss}`);
	logger.info(`     External:     ${memStats.external}`);
	logger.info('─'.repeat(80));
	logger.info(`  🔌 Database:     ${dbStatus ? '✓ Connected' : '✗ Disconnected'}`);
	logger.info(`  🌐 CORS Origins: ${CORS_ORIGINS.length} configured`);
	for (const origin of CORS_ORIGINS) {
		logger.info(`     • ${origin}`);
	}
	logger.info('─'.repeat(80));
	logger.info(`  📍 Registered API Routes: ${routes.length} total`);
	logger.info('');

	// Display routes grouped by base path
	const sortedPaths = Object.keys(routesByPath).sort();
	for (const basePath of sortedPaths) {
		const pathRoutes = routesByPath[basePath];
		logger.info(`     /${basePath === 'root' ? '' : basePath}:`);

		// Sort routes by path then method
		pathRoutes
			.sort(
				(a: { method: string; path: string }, b: { method: string; path: string }) => {
					if (a.path === b.path) {
						const methodOrder = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
						return methodOrder.indexOf(a.method) - methodOrder.indexOf(b.method);
					}
					return a.path.localeCompare(b.path);
				}
			)
			.forEach((route: { method: string; path: string }) => {
				const methodPadded = route.method.padEnd(7);
				logger.info(`       ${methodPadded} ${route.path}`);
			});
		logger.info('');
	}
	logger.info('─'.repeat(80));
	logger.info(`  🧪 Environment Variables:`);
	logger.info(`     NODE_ENV: ${NODE_ENV}`);
	logger.info(`     LOG_LEVEL: ${process.env.LOG_LEVEL || 'info'}`);
	logger.info('');
	logger.info(`  ⏰ Game Loop Configuration (Phase 1 - Real-World Time Aligned):`);
	logger.info(`     TICK_RATE: ${process.env.TICK_RATE || '60'} Hz`);
	logger.info(`     RESOURCE_INTERVAL_SEC: ${process.env.RESOURCE_INTERVAL_SEC || '3600'}s (Every hour at :00)`);
	logger.info(`     SOCKET_EMIT_INTERVAL_SEC: ${process.env.SOCKET_EMIT_INTERVAL_SEC || '1'}s`);
	logger.info(`     POPULATION_INTERVAL_SEC: ${process.env.POPULATION_INTERVAL_SEC || '3600'}s (Every hour at :30)`);
	logger.info(`     DISASTER_INTERVAL_SEC: ${process.env.DISASTER_INTERVAL_SEC || '900'}s (Every 15 minutes)`);
	logger.info(`     REPAIR_SCHEDULE: Every hour at :45`);

	logger.info('═'.repeat(80));


	if (dbStatus) {
		logger.info('[STARTUP] ✓ All systems operational');
	} else {
		logger.warn('[STARTUP] ⚠️  Server started WITHOUT database connection');
		logger.warn('[STARTUP] Database operations will fail until connection is restored');
	}

	// Start the game loop
	startGameLoop(io);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
	logger.info(`[SHUTDOWN] ${signal} signal received`);

	// Stop game loop first
	logger.info('[SHUTDOWN] Stopping game loop...');
	stopGameLoop();

	logger.info('[SHUTDOWN] Stopping transport queue...');
	stopTransportQueue();

	logger.info('[SHUTDOWN] Closing Socket.IO server...');

	io.close(async () => {
		logger.info('[SHUTDOWN] Socket.IO server closed');

		// Close database connections
		try {
			await closeDatabase();
			logger.info('[SHUTDOWN] Database connections closed');
		} catch (error) {
			logger.error('[SHUTDOWN] Error closing database:', error);
		}

		httpServer.close(() => {
			logger.info('[SHUTDOWN] HTTP server closed');
			process.exit(0);
		});

		// Force exit after 10 seconds
		setTimeout(() => {
			logger.error('[SHUTDOWN] Forced shutdown after timeout');
			process.exit(1);
		}, 10000);
	});
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
	logger.error('[FATAL] Uncaught exception:', error);
	shutdown('UNCAUGHT_EXCEPTION');
});

process.on('unhandledRejection', (reason) => {
	logger.error('[FATAL] Unhandled rejection:', reason);
	shutdown('UNHANDLED_REJECTION');
});
