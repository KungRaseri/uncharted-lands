import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, depends, cookies }) => {
	// Mark this data as dependent on game state changes
	// When tick occurs, calling invalidate('game:settlements') will refresh this
	depends('game:settlements');
	depends('game:data');

	if (!locals.account?.profile) {
		throw redirect(302, '/game/getting-started');
	}

	const sessionToken = cookies.get('session');

	// ✅ Fetch settlements from EXTERNAL Express API (use native fetch)
	const response = await globalThis.fetch(
		`${SERVER_API_URL}/settlements?playerProfileId=${locals.account.profile.id}`,
		{
			headers: {
				Cookie: `session=${sessionToken}`
			}
		}
	);

	if (!response.ok) {
		logger.error('[GAME HOME] Failed to fetch settlements', {
			profileId: locals.account.profile.id,
			status: response.status
		});
		return {
			settlements: [],
			aggregateData: null,
			lastUpdate: new Date().toISOString()
		};
	}

	const settlements = await response.json();

	// ✅ Fetch aggregate resources across all settlements
	const aggregateResponse = await globalThis.fetch(`${SERVER_API_URL}/settlements/aggregate`, {
		headers: {
			Cookie: `session=${sessionToken}`
		}
	});

	let aggregateData = null;
	if (aggregateResponse.ok) {
		aggregateData = await aggregateResponse.json();
		logger.debug('[GAME HOME] Aggregate data loaded', {
			totalSettlements: aggregateData.settlementCount,
			totalPopulation: aggregateData.totalPopulation
		});
	} else {
		logger.error('[GAME HOME] Failed to fetch aggregate data', {
			status: aggregateResponse.status
		});
	}

	logger.debug('[GAME HOME] Settlements loaded', {
		count: settlements.length
	});

	return {
		settlements,
		aggregateData,
		lastUpdate: new Date().toISOString()
	};
};
