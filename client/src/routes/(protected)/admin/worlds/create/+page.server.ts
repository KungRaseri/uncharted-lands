import { redirect, fail } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import type { PageServerLoad, Actions } from './$types';
import { env } from '$env/dynamic/public';

// Use PUBLIC_CLIENT_API_URL which works in both client and server contexts
const API_URL = env.PUBLIC_CLIENT_API_URL || 'http://localhost:3001/api';

export const load: PageServerLoad = async ({ cookies, locals, setHeaders }) => {
	if (!locals.account || locals.account.role !== 'ADMINISTRATOR') {
		throw redirect(302, '/');
	}

	// Disable caching to ensure fresh server data
	setHeaders({
		'cache-control': 'no-store, no-cache, must-revalidate, max-age=0'
	});

	try {
		const sessionToken = cookies.get('session');

		logger.debug('[WORLD CREATE] Loading servers', {
			hasSessionToken: !!sessionToken,
			apiUrl: API_URL
		});

		const response = await fetch(`${API_URL}/servers`, {
			headers: {
				Cookie: `session=${sessionToken}`
			},
			cache: 'no-store'
		});

		logger.debug('[WORLD CREATE] Server API response', {
			status: response.status,
			statusText: response.statusText,
			ok: response.ok
		});

		if (!response.ok) {
			const errorText = await response.text().catch(() => 'Unable to read error response');
			logger.error('[WORLD CREATE] Failed to fetch servers', {
				status: response.status,
				statusText: response.statusText,
				errorBody: errorText
			});
			return { servers: [], error: 'Failed to load servers' };
		}

		const servers = await response.json();

		logger.info('[WORLD CREATE] Servers loaded successfully', {
			count: servers.length,
			serverIds: servers.map((s: { id: string }) => s.id),
			serverNames: servers.map((s: { name: string }) => s.name)
		});

		return { servers };
	} catch (error) {
		logger.error('[WORLD CREATE] Exception loading servers', {
			error: error instanceof Error ? error.message : String(error),
			stack: error instanceof Error ? error.stack : undefined,
			apiUrl: API_URL
		});
		return { servers: [], error: 'An error occurred loading servers' };
	}
};

/**
 * Server action for creating worlds
 *
 * New Flow:
 * 1. Creates world record in database (status: 'pending')
 * 2. Returns immediately with world ID
 * 3. Client navigates to world details page
 * 4. World details page triggers background generation
 * 5. Client polls for status updates
 */
export const actions: Actions = {
	create: async ({ request, cookies }) => {
		const data = await request.formData();
		const worldData = JSON.parse(data.get('worldData') as string);

		try {
			const sessionToken = cookies.get('session');

			logger.info('[WORLD CREATE ACTION] Creating world record', {
				name: worldData.name,
				serverId: worldData.serverId,
				dimensions: `${worldData.width}x${worldData.height}`
			});

			// Step 1: Create world record only (quick operation)
			const response = await fetch(`${API_URL}/worlds`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionToken}`
				},
				body: JSON.stringify({
					...worldData,
					generate: false // Don't generate yet, just create the record
				})
			});

			if (!response.ok) {
				const error = await response
					.json()
					.catch(() => ({ error: 'Failed to create world' }));
				logger.error('[WORLD CREATE ACTION] Failed to create world record', {
					status: response.status,
					error
				});
				return fail(response.status, { error: error.error || 'Failed to create world' });
			}

			const world = await response.json();

			logger.info('[WORLD CREATE ACTION] World record created successfully', {
				worldId: world.id,
				name: world.name,
				status: world.status
			});

			// Return world data so client can navigate to details page
			// The details page will trigger generation and poll for status
			return { success: true, world, generationSettings: worldData };
		} catch (error) {
			logger.error('[WORLD CREATE ACTION] Exception creating world', {
				error: error instanceof Error ? error.message : String(error)
			});
			return fail(500, { error: 'An error occurred creating the world' });
		}
	}
};
