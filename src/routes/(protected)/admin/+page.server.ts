import type { PageServerLoad } from './$types';
import { API_URL } from '$lib/config';
import { logger } from '$lib/utils/logger';
import type { DashboardStats } from '$lib/types/api';

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		const sessionToken = cookies.get('session');

		const response = await fetch(`${API_URL}/admin/dashboard`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			logger.error('[ADMIN DASHBOARD] Dashboard API error', {
				status: response.status
			});
			// Return default stats on error
			return {
				stats: {
					totalServers: 0,
					totalWorlds: 0,
					totalPlayers: 0,
					totalRegions: 0,
					totalTiles: 0,
					totalPlots: 0
				}
			};
		}

		const data: DashboardStats = await response.json();

		logger.debug('[ADMIN DASHBOARD] Dashboard loaded', {
			servers: data.counts.servers,
			worlds: data.counts.worlds,
			players: data.counts.players
		});

		return {
			stats: {
				totalServers: data.counts.servers,
				totalWorlds: data.counts.worlds,
				totalPlayers: data.counts.players,
				totalRegions: 0, // API doesn't return these yet
				totalTiles: 0,
				totalPlots: 0
			}
		};
	} catch (err) {
		logger.error('[ADMIN DASHBOARD] Failed to load dashboard', err);
		// Return default stats on error
		return {
			stats: {
				totalServers: 0,
				totalWorlds: 0,
				totalPlayers: 0,
				totalRegions: 0,
				totalTiles: 0,
				totalPlots: 0
			}
		};
	}
};
