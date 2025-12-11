import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals, depends, cookies }) => {
	// Mark this data as dependent on game state changes
	depends('game:settlements');
	depends('game:data');

	const profileId = locals.account?.profile?.id;
	if (!profileId) {
		return { settlements: [], lastUpdate: new Date().toISOString() };
	}

	const sessionToken = cookies.get('session');

	const response = await fetch(`${SERVER_API_URL}/settlements?playerProfileId=${profileId}`, {
		headers: {
			Cookie: `session=${sessionToken}`
		}
	});

	if (!response.ok) {
		logger.error('[SETTLEMENTS] Failed to fetch settlements', {
			profileId,
			status: response.status
		});
		return {
			settlements: [],
			lastUpdate: new Date().toISOString()
		};
	}

	const settlements = await response.json();

	logger.debug('[SETTLEMENTS] Settlements loaded', {
		count: settlements.length
	});

	return {
		settlements,
		lastUpdate: new Date().toISOString()
	};
}) satisfies PageServerLoad;
