import type { PageServerLoad } from './$types';
import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';

export const load: PageServerLoad = async ({ cookies }) => {
	const sessionToken = cookies.get('session');

	try {
		// Fetch all worlds
		const worldsResponse = await fetch(`${SERVER_API_URL}/worlds`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!worldsResponse.ok) {
			logger.error('[ADMIN UTILITIES] Failed to fetch worlds:', {
				status: worldsResponse.status
			});
			return {
				worlds: [],
				regions: []
			};
		}

		const worldsData = await worldsResponse.json();
		const worlds = worldsData.data || [];

		// Fetch all regions
		const regionsResponse = await fetch(`${SERVER_API_URL}/regions`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		let regions: Array<{ id: string; name: string; worldId: string }> = [];
		if (regionsResponse.ok) {
			const regionsData = await regionsResponse.json();
			regions = regionsData.data || [];
		}

		logger.debug('[ADMIN UTILITIES] Loaded data:', {
			worldsCount: worlds.length,
			regionsCount: regions.length
		});

		return {
			worlds,
			regions
		};
	} catch (error) {
		logger.error('[ADMIN UTILITIES] Error loading page data:', error);
		return {
			worlds: [],
			regions: []
		};
	}
};
