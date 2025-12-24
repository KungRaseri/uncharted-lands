/**
 * Player Presence Store (ARTIFACT-05 Phase 2)
 * 
 * Tracks online/offline status of players in the same world
 * - Updates presence on Socket.IO 'player-status-change' events
 * - Sends heartbeat every 60 seconds to keep status fresh
 * - Provides reactive state for UI components
 */

import type { Socket } from 'socket.io-client';

export type PlayerStatus = {
	accountId: string;
	isOnline: boolean;
	lastSeen: Date;
};

class PresenceStore {
	private playerPresence = $state<Map<string, PlayerStatus>>(new Map());
	private heartbeatInterval: NodeJS.Timeout | null = null;
	private socket: Socket | null = null;

	/**
	 * Get all tracked players
	 */
	get players(): PlayerStatus[] {
		return Array.from(this.playerPresence.values());
	}

	/**
	 * Get online players count
	 */
	get onlineCount(): number {
		return this.players.filter(p => p.isOnline).length;
	}

	/**
	 * Get specific player status
	 */
	getPlayer(accountId: string): PlayerStatus | undefined {
		return this.playerPresence.get(accountId);
	}

	/**
	 * Check if player is online
	 */
	isPlayerOnline(accountId: string): boolean {
		return this.playerPresence.get(accountId)?.isOnline ?? false;
	}

	/**
	 * Update or add player status
	 */
	updatePlayer(status: PlayerStatus) {
		this.playerPresence.set(status.accountId, {
			...status,
			lastSeen: new Date(status.lastSeen) // Ensure Date object
		});
	}

	/**
	 * Remove player from tracking
	 */
	removePlayer(accountId: string) {
		this.playerPresence.delete(accountId);
	}

	/**
	 * Clear all tracked players
	 */
	clear() {
		this.playerPresence.clear();
	}

	/**
	 * Initialize presence tracking with Socket.IO
	 */
	initialize(socket: Socket) {
		this.socket = socket;

		// Listen for presence changes
		socket.on('player-status-change', (data: {
			accountId: string;
			isOnline: boolean;
			lastSeen: string;
		}) => {
			console.log('[PRESENCE] Player status changed', data);
			this.updatePlayer({
				accountId: data.accountId,
				isOnline: data.isOnline,
				lastSeen: new Date(data.lastSeen)
			});
		});

		// Send heartbeat every 60 seconds
		this.startHeartbeat();

		console.log('[PRESENCE] Presence tracking initialized');
	}

	/**
	 * Start sending heartbeat pings
	 */
	private startHeartbeat() {
		// Clear existing interval if any
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
		}

		// Send initial heartbeat
		this.sendHeartbeat();

		// Send heartbeat every 60 seconds
		this.heartbeatInterval = setInterval(() => {
			this.sendHeartbeat();
		}, 60000);

		console.log('[PRESENCE] Heartbeat started (60s interval)');
	}

	/**
	 * Send heartbeat to server
	 */
	private sendHeartbeat() {
		if (this.socket?.connected) {
			this.socket.emit('heartbeat');
			console.log('[PRESENCE] Heartbeat sent');
		}
	}

	/**
	 * Stop heartbeat and cleanup
	 */
	cleanup() {
		if (this.heartbeatInterval) {
			clearInterval(this.heartbeatInterval);
			this.heartbeatInterval = null;
		}

		if (this.socket) {
			this.socket.off('player-status-change');
			this.socket = null;
		}

		this.clear();
		console.log('[PRESENCE] Presence tracking cleaned up');
	}
}

// Export singleton instance
export const presenceStore = new PresenceStore();

/**
 * Format last seen timestamp for display
 */
export function formatLastSeen(lastSeen: Date): string {
	const now = Date.now();
	const diff = now - lastSeen.getTime();
	const minutes = Math.floor(diff / 60000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (minutes < 1) return 'Just now';
	if (minutes < 60) return `${minutes}m ago`;
	if (hours < 24) return `${hours}h ago`;
	return `${days}d ago`;
}
