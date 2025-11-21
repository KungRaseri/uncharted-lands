import type { PageServerLoad } from './$types';
import { API_URL } from '$lib/config';
import { logger } from '$lib/utils/logger';

// Helper function to safely get array from response
async function fetchData(url: string, sessionToken: string | undefined) {
	try {
		const response = await fetch(url, {
			headers: { Cookie: `session=${sessionToken}` }
		});
		return response.ok ? await response.json() : [];
	} catch {
		return [];
	}
}

// Helper to count items by condition
function countWhere<T>(items: T[], predicate: (item: T) => boolean): number {
	return Array.isArray(items) ? items.filter(predicate).length : 0;
}

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		const sessionToken = cookies.get('session');

		// Fetch all required data in parallel
		const [players, settlements, worlds, servers] = await Promise.all([
			fetchData(`${API_URL}/players`, sessionToken),
			fetchData(`${API_URL}/settlements`, sessionToken),
			fetchData(`${API_URL}/worlds`, sessionToken),
			fetchData(`${API_URL}/servers`, sessionToken)
		]);

		// Calculate date ranges
		const now = new Date();
		const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
		const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

		// Calculate statistics
		const totalPlayers = Array.isArray(players) ? players.length : 0;
		const totalSettlements = Array.isArray(settlements) ? settlements.length : 0;
		const totalWorlds = Array.isArray(worlds) ? worlds.length : 0;
		const totalServers = Array.isArray(servers) ? servers.length : 0;

		// Role distribution
		const memberCount = countWhere(players, (p: any) => p.role === 'MEMBER');
		const supportCount = countWhere(players, (p: any) => p.role === 'SUPPORT');
		const adminCount = countWhere(players, (p: any) => p.role === 'ADMINISTRATOR');

		// Recent activity
		const recentPlayers = countWhere(players, (p: any) => new Date(p.createdAt) >= sevenDaysAgo);
		const recentSettlements = countWhere(
			settlements,
			(s: any) => new Date(s.createdAt) >= sevenDaysAgo
		);
		const activePlayers = countWhere(players, (p: any) => new Date(p.updatedAt) >= oneDayAgo);

		// Derived metrics
		const playersWithProfiles = countWhere(players, (p: any) => p.profile);
		const avgSettlementsPerPlayer =
			totalPlayers > 0 ? (totalSettlements / totalPlayers).toFixed(1) : '0.0';

		logger.debug('[ADMIN DASHBOARD] Dashboard loaded', {
			totalPlayers,
			totalSettlements,
			totalWorlds,
			totalServers
		});

		return {
			stats: {
				totalPlayers,
				totalSettlements,
				totalWorlds,
				totalServers,
				memberCount,
				supportCount,
				adminCount,
				recentPlayers,
				recentSettlements,
				activePlayers,
				playersWithProfiles,
				avgSettlementsPerPlayer
			}
		};
	} catch (err) {
		logger.error('[ADMIN DASHBOARD] Failed to load dashboard', err);
		// Return default stats on error
		return {
			stats: {
				totalPlayers: 0,
				totalSettlements: 0,
				totalWorlds: 0,
				totalServers: 0,
				memberCount: 0,
				supportCount: 0,
				adminCount: 0,
				recentPlayers: 0,
				recentSettlements: 0,
				activePlayers: 0,
				playersWithProfiles: 0,
				avgSettlementsPerPlayer: '0.0'
			}
		};
	}
};
