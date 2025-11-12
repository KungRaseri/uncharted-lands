import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_URL } from '$lib/config';
import { logger } from '$lib/utils/logger';

export const load: PageServerLoad = async ({ params, cookies }) => {
	try {
		const sessionToken = cookies.get('session');

		const response = await fetch(`${API_URL}/regions/${params.id}`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			if (response.status === 404) {
				logger.warn('[ADMIN REGION] Region not found', { regionId: params.id });
				throw error(404);
			}
			logger.error('[ADMIN REGION] Failed to fetch region', {
				regionId: params.id,
				status: response.status
			});
			throw error(500);
		}

		const region = await response.json();

		logger.debug('[ADMIN REGION] Region loaded', {
			regionId: region.id
		});

		return { region };
	} catch (err) {
		if (err instanceof Response) throw err;
		logger.error('[ADMIN REGION] Error loading region', err);
		throw error(500);
	}
};
