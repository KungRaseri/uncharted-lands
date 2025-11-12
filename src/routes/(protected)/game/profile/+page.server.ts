import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/public';

// Use PUBLIC_API_URL which works in both client and server contexts
const API_URL = env.PUBLIC_API_URL || 'http://localhost:3001/api';

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
			`${API_URL}/settlements?profileId=${locals.account.profile.id}`,
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
		console.error('[PROFILE LOAD] Error:', error);
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
