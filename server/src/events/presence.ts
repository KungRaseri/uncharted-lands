/**
 * Player Presence Tracking System (ARTIFACT-05 Phase 2)
 * 
 * Tracks player online/offline status via Socket.IO connections
 * - Marks players online immediately on connection
 * - Sets offline after 5 minutes of disconnection
 * - Broadcasts presence changes to world rooms
 * - Handles heartbeat pings to update lastSeen timestamps
 */

import { Server, Socket } from 'socket.io';
import { db } from '../db/index.js';
import { accounts } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { logger } from '../utils/logger.js';

const OFFLINE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const presenceTimers = new Map<string, NodeJS.Timeout>();

/**
 * Mark account as online and broadcast to world
 */
async function setPlayerOnline(accountId: string, worldId: string | null, io: Server) {
	try {
		await db.update(accounts)
			.set({ isOnline: true, lastSeen: new Date() })
			.where(eq(accounts.id, accountId));

		logger.debug('[PRESENCE] Player marked online', { accountId });

		// Broadcast to world if player is in one
		if (worldId) {
			io.to(`world:${worldId}`).emit('player-status-change', {
				accountId,
				isOnline: true,
				lastSeen: new Date().toISOString()
			});
		}
	} catch (error) {
		logger.error('[PRESENCE] Failed to mark player online', { accountId, error });
	}
}

/**
 * Mark account as offline and broadcast to world
 */
async function setPlayerOffline(accountId: string, worldId: string | null, io: Server) {
	try {
		await db.update(accounts)
			.set({ isOnline: false, lastSeen: new Date() })
			.where(eq(accounts.id, accountId));

		logger.debug('[PRESENCE] Player marked offline', { accountId });

		// Broadcast to world if player was in one
		if (worldId) {
			io.to(`world:${worldId}`).emit('player-status-change', {
				accountId,
				isOnline: false,
				lastSeen: new Date().toISOString()
			});
		}

		// Clean up timer
		presenceTimers.delete(accountId);
	} catch (error) {
		logger.error('[PRESENCE] Failed to mark player offline', { accountId, error });
	}
}

/**
 * Update player's last seen timestamp (heartbeat)
 */
async function updateLastSeen(accountId: string) {
	try {
		await db.update(accounts)
			.set({ lastSeen: new Date() })
			.where(eq(accounts.id, accountId));

		logger.debug('[PRESENCE] Updated last seen', { accountId });
	} catch (error) {
		logger.error('[PRESENCE] Failed to update last seen', { accountId, error });
	}
}

/**
 * Setup presence tracking on Socket.IO server
 */
export function setupPresenceTracking(io: Server) {
	logger.info('[PRESENCE] Setting up presence tracking system');

	io.on('connection', (socket: Socket) => {
		const accountId = socket.data.accountId;
		const worldId = socket.data.worldId;

		if (!accountId) {
			logger.warn('[PRESENCE] Socket connected without accountId', { socketId: socket.id });
			return;
		}

		logger.debug('[PRESENCE] Player connected', { accountId, worldId });

		// Mark online immediately
		setPlayerOnline(accountId, worldId, io);

		// Clear any existing offline timer
		const existingTimer = presenceTimers.get(accountId);
		if (existingTimer) {
			clearTimeout(existingTimer);
			presenceTimers.delete(accountId);
			logger.debug('[PRESENCE] Cleared existing offline timer', { accountId });
		}

		// Handle heartbeat to update last seen
		socket.on('heartbeat', () => {
			updateLastSeen(accountId);
		});

		// Handle disconnect
		socket.on('disconnect', (reason) => {
			logger.debug('[PRESENCE] Player disconnected', { accountId, reason });

			// Set offline timer (5 minutes)
			const offlineTimer = setTimeout(() => {
				setPlayerOffline(accountId, worldId, io);
			}, OFFLINE_TIMEOUT);

			presenceTimers.set(accountId, offlineTimer);
			logger.debug('[PRESENCE] Started offline timer', { accountId, timeoutMs: OFFLINE_TIMEOUT });
		});
	});

	logger.info('[PRESENCE] Presence tracking system initialized');
}

/**
 * Get all online players in a world
 */
export async function getOnlinePlayersInWorld(worldId: string): Promise<string[]> {
	try {
		// This would need a join with profiles/settlements to get players in a world
		// For now, return all online accounts (simplified)
		const onlineAccounts = await db.query.accounts.findMany({
			where: eq(accounts.isOnline, true),
			columns: {
				id: true
			}
		});

		return onlineAccounts.map(a => a.id);
	} catch (error) {
		logger.error('[PRESENCE] Failed to get online players', { worldId, error });
		return [];
	}
}

/**
 * Get player presence status
 */
export async function getPlayerPresence(accountId: string) {
	try {
		const account = await db.query.accounts.findFirst({
			where: eq(accounts.id, accountId),
			columns: {
				id: true,
				isOnline: true,
				lastSeen: true
			}
		});

		if (!account) {
			return null;
		}

		return {
			accountId: account.id,
			isOnline: account.isOnline,
			lastSeen: account.lastSeen
		};
	} catch (error) {
		logger.error('[PRESENCE] Failed to get player presence', { accountId, error });
		return null;
	}
}
