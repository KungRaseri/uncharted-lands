/**
 * Socket.IO Client Store for Uncharted Lands
 *
 * Manages WebSocket connection to the game server for real-time updates
 */

import { writable, derived } from 'svelte/store';
import { io, type Socket } from 'socket.io-client';
import { browser } from '$app/environment';
import * as worldApi from '$lib/game/world-api';
import { PUBLIC_WS_URL } from '$env/static/public';
import { logger } from '$lib/utils/logger';
import { presenceStore } from './presence.svelte';
import { transferStore } from './transfers.svelte';

// Connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface SocketStore {
	socket: Socket | null;
	connectionState: ConnectionState;
	error: string | null;
	lastPing: number | null;
}

// Create the socket store
function createSocketStore() {
	const { subscribe, set, update } = writable<SocketStore>({
		socket: null,
		connectionState: 'disconnected',
		error: null,
		lastPing: null
	});

	let socket: Socket | null = null;
	let reconnectAttempts = 0;
	const MAX_RECONNECT_ATTEMPTS = 5;

	return {
		subscribe,

		/**
		 * Connect to the game server
		 * @param serverUrl - Optional server URL override
		 * @param token - Session token for authentication
		 */
		connect: (serverUrl?: string, token?: string) => {
			if (!browser) return;
			if (socket?.connected) {
				logger.debug('[SOCKET] Already connected');
				return;
			}

			const url = serverUrl || PUBLIC_WS_URL;
			logger.info(`[SOCKET] Connecting to ${url}...`);

			update((state) => ({ ...state, connectionState: 'connecting' }));

			socket = io(url, {
				reconnection: true,
				reconnectionDelay: 1000,
				reconnectionDelayMax: 5000,
				reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
				transports: ['websocket', 'polling'],
				auth: {
					token: token || ''
				}
			});

			// Connection successful
			socket.on('connect', () => {
				logger.info('[SOCKET] Connected:', { socketId: socket?.id });
				reconnectAttempts = 0;
				update((state) => ({
					...state,
					socket,
					connectionState: 'connected',
					error: null
				}));

				// Initialize presence tracking (ARTIFACT-05 Phase 2)
				presenceStore.initialize(socket!);

				// Initialize transfer tracking (ARTIFACT-05 Phase 3)
				transferStore.initialize(socket!);
			});

			// Server welcome message
			socket.on('connected', (data) => {
				logger.debug('[SOCKET] Welcome:', data);
			});

			// Connection error
			socket.on('connect_error', (error) => {
				reconnectAttempts++;
				logger.error('[SOCKET] Connection error:', error);

				if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
					update((state) => ({
						...state,
						connectionState: 'error',
						error: `Failed to connect after ${MAX_RECONNECT_ATTEMPTS} attempts`
					}));
				}
			});

			// Disconnected
			socket.on('disconnect', (reason) => {
				logger.info('[SOCKET] Disconnected:', { reason });
				update((state) => ({
					...state,
					connectionState: 'disconnected',
					socket: null
				}));

				// Auto-reconnect unless it was a manual disconnect
				if (reason === 'io server disconnect') {
					socket?.connect();
				}
			});

			// Ping/pong for latency monitoring
			// Socket.IO emits 'pong' event on client when it receives a ping from server
			socket.io.on('ping', () => {
				update((state) => ({ ...state, lastPing: Date.now() }));
			});

			update((state) => ({ ...state, socket }));
		},

		/**
		 * Disconnect from the server
		 */
		disconnect: () => {
			if (socket) {
				logger.debug('[SOCKET] Disconnecting...');
				// Cleanup presence tracking (ARTIFACT-05 Phase 2)
				presenceStore.cleanup();
				// Cleanup transfer tracking (ARTIFACT-05 Phase 3)
				transferStore.cleanup();
				socket.disconnect();
				socket = null;
				set({
					socket: null,
					connectionState: 'disconnected',
					error: null,
					lastPing: null
				});
			}
		},

		/**
		 * Emit an event to the server
		 */
		emit: (event: string, data?: unknown) => {
			if (socket?.connected) {
				socket.emit(event, data);
			} else {
				logger.warn('[SOCKET] Cannot emit, not connected:', { event });
			}
		},

		/**
		 * Listen for an event from the server
		 */
		on: (event: string, callback: (data: unknown) => void) => {
			if (socket) {
				socket.on(event, callback);
			}
		},

		/**
		 * Remove event listener
		 */
		off: (event: string, callback?: (data: unknown) => void) => {
			if (socket) {
				socket.off(event, callback);
			}
		},

		/**
		 * Get the current socket instance
		 */
		getSocket: () => socket
	};
}

export const socketStore = createSocketStore();

// Derived stores for easier access
export const isConnected = derived(
	socketStore,
	($socket) => $socket.connectionState === 'connected'
);

export const connectionState = derived(socketStore, ($socket) => $socket.connectionState);

export const connectionError = derived(socketStore, ($socket) => $socket.error);

/**
 * Game-specific socket actions
 */
export const gameSocket = {
	/**
	 * Authenticate player with the server
	 */
	authenticate: (playerId: string, token?: string) => {
		socketStore.emit('authenticate', { playerId, token });
	},

	/**
	 * Join a game world
	 */
	joinWorld: (worldId: string, playerId: string) => {
		socketStore.emit('join-world', { worldId, playerId });
	},

	/**
	 * Leave a game world
	 */
	leaveWorld: (worldId: string, playerId: string) => {
		socketStore.emit('leave-world', { worldId, playerId });
	},

	/**
	 * Request current game state
	 */
	requestGameState: (worldId: string) => {
		socketStore.emit('request-game-state', { worldId });
	},

	/**
	 * Build a structure in a settlement
	 */
	buildStructure: (settlementId: string, structureType: string) => {
		socketStore.emit('build-structure', { settlementId, structureType });
	},

	/**
	 * Collect resources from a settlement
	 */
	collectResources: (settlementId: string) => {
		socketStore.emit('collect-resources', { settlementId });
	},

	/**
	 * Create a new world (uses world-api for proper type handling)
	 */
	createWorld: worldApi.createWorld,

	/**
	 * Request world data (uses world-api for proper type handling)
	 */
	requestWorldData: worldApi.requestWorldData,

	/**
	 * Request region data (uses world-api for proper type handling)
	 */
	requestRegionData: worldApi.requestRegionData
};
