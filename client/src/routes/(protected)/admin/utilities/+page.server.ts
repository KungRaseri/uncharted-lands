import type { PageServerLoad } from './$types';
import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionToken = cookies.get('session');

	try {
		// Fetch all settlements for disaster targeting
		const settlementsResponse = await fetch(`${SERVER_API_URL}/settlements`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!settlementsResponse.ok) {
			logger.error('[ADMIN UTILITIES] Failed to fetch settlements:', {
				status: settlementsResponse.status
			});
			return {
				settlements: []
			};
		}

		const settlementsData = await settlementsResponse.json();

		// Fetch world names for better settlement display
		const worldsResponse = await fetch(`${SERVER_API_URL}/worlds`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		let worlds: Array<{ id: string; name: string }> = [];
		if (worldsResponse.ok) {
			const worldsData = await worldsResponse.json();
			worlds = worldsData.data || [];
		}

		// Map settlements with world names
		const settlementsWithWorlds = (settlementsData.data || []).map(
			(settlement: { id: string; name: string; worldId: string }) => ({
				id: settlement.id,
				name: settlement.name,
				worldId: settlement.worldId,
				worldName: worlds.find((w) => w.id === settlement.worldId)?.name || 'Unknown World'
			})
		);

		logger.debug('[ADMIN UTILITIES] Loaded data:', {
			settlementsCount: settlementsWithWorlds.length
		});

		return {
			settlements: settlementsWithWorlds
		};
	} catch (error) {
		logger.error('[ADMIN UTILITIES] Error loading page data:', error);
		return {
			settlements: []
		};
	}
};
