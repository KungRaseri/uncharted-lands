import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';

export const load = (async ({ locals, cookies }) => {
	if (!locals.account) {
		throw redirect(302, '/login');
	}

	if (!locals.account.profile) {
		throw redirect(302, '/game/getting-started');
	}

	try {
		const sessionToken = cookies.get('session');

		// Fetch settlement count
		const settlementsResponse = await fetch(
			`${SERVER_API_URL}/settlements?profileId=${locals.account.profile.id}`,
			{
				headers: {
					Cookie: `session=${sessionToken}`
				}
			}
		);

		let settlementCount = 0;
		if (settlementsResponse.ok) {
			const settlementsData = await settlementsResponse.json();
			settlementCount = settlementsData.settlements?.length || 0;
		}

		return {
			profile: locals.account.profile,
			account: {
				email: locals.account.email,
				role: locals.account.role,
				createdAt: locals.account.createdAt
			},
			settlementCount
		};
	} catch (error) {
		logger.error('[PROFILE LOAD] Error:', error);
		return {
			profile: locals.account.profile,
			account: {
				email: locals.account.email,
				role: locals.account.role,
				createdAt: locals.account.createdAt
			},
			settlementCount: 0
		};
	}
}) satisfies PageServerLoad;
