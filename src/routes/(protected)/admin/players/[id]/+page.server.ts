import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { API_URL } from '$lib/config';
import { logger } from '$lib/utils/logger';

export const load: PageServerLoad = async ({ params, cookies }) => {
	try {
		const sessionToken = cookies.get('session');

		// Fetch player account data
		const response = await fetch(`${API_URL}/players/${params.id}`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			if (response.status === 404) {
				logger.warn('[ADMIN PLAYER] Player not found', { playerId: params.id });
				throw error(404);
			}
			logger.error('[ADMIN PLAYER] Failed to fetch player', {
				playerId: params.id,
				status: response.status
			});
			throw error(500);
		}

		const account = await response.json();

		// Fetch player's settlements if they have a profile
		let settlements = [];
		if (account.profile?.id) {
			try {
				const settlementsResponse = await fetch(
					`${API_URL}/settlements?profileId=${account.profile.id}`,
					{
						headers: {
							Cookie: `session=${sessionToken}`
						}
					}
				);

				if (settlementsResponse.ok) {
					settlements = await settlementsResponse.json();
					logger.debug('[ADMIN PLAYER] Settlements loaded', {
						playerId: account.id,
						settlementCount: settlements.length
					});
				}
			} catch (error_) {
				// Don't fail the page if settlements can't be loaded
				logger.warn('[ADMIN PLAYER] Failed to load settlements', {
					playerId: account.id,
					error: error_
				});
			}
		}

		logger.debug('[ADMIN PLAYER] Player loaded', {
			playerId: account.id,
			email: logger.maskEmail(account.email)
		});

		return {
			account,
			settlements
		};
	} catch (err) {
		if (err instanceof Response) throw err;
		logger.error('[ADMIN PLAYER] Error loading player', err);
		throw error(500);
	}
};
