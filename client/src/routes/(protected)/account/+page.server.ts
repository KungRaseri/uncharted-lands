import { error } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/public';

// Use PUBLIC_API_URL which works in both client and server contexts
const API_URL = env.PUBLIC_API_URL || 'http://localhost:3001/api';

export const load: PageServerLoad = async ({ locals, cookies }) => {
	if (!locals.account) {
		logger.warn('[ACCOUNT PAGE] Unauthorized access attempt');
		throw error(401);
	}

	try {
		// Get session token from cookies instead of locals
		const sessionToken = cookies.get('session');

		if (!sessionToken) {
			logger.warn('[ACCOUNT PAGE] No session token found in cookies');
			throw error(401);
		}

		logger.debug('[ACCOUNT PAGE] Fetching account data', {
			accountId: locals.account.id,
			email: logger.maskEmail(locals.account.email),
			hasSessionToken: !!sessionToken
		});

		const response = await fetch(`${API_URL}/account/me`, {
			method: 'GET',
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			logger.error('[ACCOUNT PAGE] Failed to fetch account', {
				status: response.status,
				statusText: response.statusText,
				error: errorData
			});

			throw error(response.status);
		}

		const account = await response.json();

		logger.info('[ACCOUNT PAGE] Successfully loaded account data', {
			accountId: account.id,
			email: logger.maskEmail(account.email)
		});

		return { account };
	} catch (err) {
		// Re-throw SvelteKit error() calls
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		logger.error('[ACCOUNT PAGE] Unexpected error loading account', err);
		throw error(500);
	}
};
