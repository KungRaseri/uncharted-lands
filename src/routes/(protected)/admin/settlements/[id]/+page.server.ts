import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_URL } from '$lib/config';
import { logger } from '$lib/utils/logger';

export const load: PageServerLoad = async ({ params, cookies }) => {
	try {
		const sessionToken = cookies.get('session');

		const response = await fetch(`${API_URL}/settlements/${params.id}`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			if (response.status === 404) {
				logger.warn('[ADMIN SETTLEMENT] Settlement not found', { settlementId: params.id });
				throw error(404);
			}
			logger.error('[ADMIN SETTLEMENT] Failed to fetch settlement', {
				settlementId: params.id,
				status: response.status
			});
			throw error(500);
		}

		const settlement = await response.json();

		logger.debug('[ADMIN SETTLEMENT] Settlement loaded', {
			settlementId: settlement.id,
			name: settlement.name
		});

		return { settlement };
	} catch (err) {
		if (err instanceof Response) throw err;
		logger.error('[ADMIN SETTLEMENT] Error loading settlement', err);
		throw error(500);
	}
};
