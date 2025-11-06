/**
 * Game State Store (Svelte 5)
 * 
 * Centralized reactive state for game data.
 * Uses SvelteKit's dependency tracking system to automatically refresh when data changes.
 * 
 * Usage:
 * 1. Server loads return data with dependencies: `depends('game:settlements')`
 * 2. Components use this store to track reactive state
 * 3. Tick system calls `invalidate('game:settlements')` to trigger refresh
 */

import { browser } from '$app/environment';
import { invalidate } from '$app/navigation';

/**
 * Auto-refresh game data every minute to catch tick updates
 * This provides a fallback in case the manual invalidation doesn't reach the client
 */
export function createGameRefreshInterval(dependencyKey: string = 'game:data') {
	if (!browser) return;

	// Check for updates every 60 seconds
	const intervalId = setInterval(() => {
		console.log('[GAME STORE] Auto-refresh triggered');
		invalidate(dependencyKey);
	}, 60000);

	// Cleanup function
	return () => {
		clearInterval(intervalId);
	};
}

/**
 * Manually trigger a refresh of game data
 */
export function refreshGameData(dependencyKey: string = 'game:data') {
	if (!browser) return;
	
	console.log('[GAME STORE] Manual refresh triggered');
	invalidate(dependencyKey);
}

/**
 * Track last tick time (client-side only)
 */
let lastTickTime = $state<Date | null>(null);

export const gameState = {
	get lastTickTime() {
		return lastTickTime;
	},
	
	updateLastTickTime(time: Date) {
		lastTickTime = time;
	}
};
