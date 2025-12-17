/**
 * Socket.IO Test Server Helper
 *
 * Provides a real Socket.IO server for integration testing Socket.IO event handlers.
 * Starts server programmatically on a test port, allows tests to connect as clients.
 *
 * NOTE: Uses simplified authentication for testing - bypasses token validation.
 */

import { Server, type Socket } from 'socket.io';
import http from 'node:http';
import express from 'express';
import type {
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData,
} from '../../src/types/socket-events.js';
import { registerEventHandlers } from '../../src/events/handlers.js';
import {
	loggingMiddleware,
	errorHandlingMiddleware,
} from '../../src/middleware/socket-middleware.js';

/**
 * Test-only authentication middleware
 * Accepts any connection and sets test user data
 */
function testAuthenticationMiddleware(socket: Socket, next: (err?: Error) => void): void {
	// For tests, we bypass real authentication and use test data
	// The test will provide playerId via the 'authenticate' event
	socket.data.authenticated = false; // Will be set to true after 'authenticate' event
	socket.data.playerId = '';
	socket.data.username = 'TestUser';
	socket.data.accountId = '';
	socket.data.role = 'PLAYER';
	socket.data.connectedAt = Date.now();

	next(); // Allow connection
}

let httpServer: http.Server | null = null;
let io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> | null =
	null;

/**
 * Start test Socket.IO server
 */
export async function startTestServer(port: number = 3001): Promise<{
	httpServer: http.Server;
	io: Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
}> {
	// Create Express app
	const app = express();

	// Create HTTP server
	httpServer = http.createServer(app);

	// Create Socket.IO server
	io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
		httpServer,
		{
			cors: {
				origin: '*', // Allow all origins in tests
				methods: ['GET', 'POST'],
				credentials: true,
			},
			pingTimeout: 60000,
			pingInterval: 25000,
			transports: ['websocket', 'polling'],
			allowUpgrades: true,
		}
	);

	// Apply middleware (using test auth instead of production auth)
	io.use(loggingMiddleware);
	io.use(testAuthenticationMiddleware);
	io.use(errorHandlingMiddleware);

	// Handle connections and register event handlers
	io.on('connection', (socket) => {
		socket.emit('connected', {
			message: 'Test Server Connected',
			socketId: socket.id,
			timestamp: Date.now(),
		});

		// Listen for test authentication (doesn't require callback like production)
		socket.on('authenticate', (data: { playerId: string }) => {
			socket.data.authenticated = true;
			socket.data.playerId = data.playerId;
		});

		registerEventHandlers(socket);
	});

	// Start server
	await new Promise<void>((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error('Server startup timeout'));
		}, 5000);

		httpServer!.listen(port, () => {
			clearTimeout(timeout);
			resolve();
		});

		httpServer!.on('error', (error) => {
			clearTimeout(timeout);
			reject(error);
		});
	});

	return { httpServer: httpServer!, io: io! };
}

/**
 * Stop test Socket.IO server
 * Gracefully handles cases where server is already stopped
 */
export async function stopTestServer(): Promise<void> {
	if (io) {
		await new Promise<void>((resolve) => {
			io!.close(() => {
				io = null;
				resolve();
			});
		});
	}

	if (httpServer) {
		await new Promise<void>((resolve, reject) => {
			const timeout = setTimeout(() => {
				reject(new Error('Server shutdown timeout'));
			}, 5000);

			httpServer!.close((error) => {
				clearTimeout(timeout);
				httpServer = null;
				// Ignore "Server is not running" errors (already stopped)
				if (error && !error.message?.includes('not running')) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}
}
