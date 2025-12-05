import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import { env } from '$env/dynamic/public';

// Use PUBLIC_API_URL which works in both client and server contexts
const API_URL = env.PUBLIC_API_URL || 'http://localhost:3001/api';

export const load = (async ({ locals, cookies, url }) => {
	// Check authentication
	if (!locals.account) {
		throw redirect(302, '/login');
	}

	// Check if user has a profile
	if (!locals.account.profile) {
		throw redirect(302, '/game/getting-started');
	}

	try {
		const sessionToken = cookies.get('session');

		// Get optional center coordinates from query params (for lazy loading)
		const centerX = url.searchParams.get('centerX');
		const centerY = url.searchParams.get('centerY');
		const radius = url.searchParams.get('radius');

		// Build query params
		const queryParams = new URLSearchParams({
			profileId: locals.account.profile.id
		});

		if (centerX && centerY) {
			queryParams.set('centerX', centerX);
			queryParams.set('centerY', centerY);
			if (radius) queryParams.set('radius', radius);
		}

		// Fetch map data from server API
		const response = await fetch(`${API_URL}/regions/map?${queryParams.toString()}`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			const error = await response.json().catch(() => ({ error: 'Unknown error' }));
			logger.error('[MAP LOAD] Failed to load map', {
				status: response.status,
				error: error.error
			});

			if (response.status === 404 && error.code === 'NO_WORLD') {
				// Redirect admins to world creation, others to a waiting page
				if (locals.account.role === 'ADMINISTRATOR') {
					throw redirect(302, '/admin/worlds?message=Please create a world to enable the game map');
				} else {
					throw redirect(302, '/game?error=no-world');
				}
			}

			throw new Error(`Failed to load map: ${error.error || 'Unknown error'}`);
		}

		const data = await response.json();

		logger.info('[MAP LOAD] Map loaded', {
			worldId: data.world?.id,
			worldName: data.world?.name,
			regionCount: data.world?.regions?.length,
			hasPlayerSettlement: !!data.playerSettlement
		});

		return data;
	} catch (error) {
		logger.error('[MAP LOAD] Error', error);

		// If it's a redirect, let it through
		if (error instanceof Response) {
			throw error;
		}

		// Re-throw as error for display
		throw error;
	}
}) satisfies PageServerLoad;
