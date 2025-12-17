import { error, fail, redirect } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import type { PageServerLoad, Actions, Action } from './$types';
import { SERVER_API_URL } from '$env/static/private';
import type { WorldWithRelations, GameServer } from '$lib/types/api';

export const load: PageServerLoad = async ({ params, cookies }) => {
	try {
		const sessionToken = cookies.get('session');

		logger.debug('[ADMIN WORLD] Loading world details', {
			worldId: params.id,
			hasSessionToken: !!sessionToken
		});

		// Retry logic for newly created worlds (race condition mitigation)
		let response;
		let retries = 3;

		for (let i = 0; i < retries; i++) {
			response = await fetch(`${SERVER_API_URL}/worlds/${params.id}`, {
				headers: {
					Cookie: `session=${sessionToken}`
				}
			});

			if (response.ok) {
				break;
			}

			// If not found and we have retries left, wait a bit and try again
			if (response.status === 404 && i < retries - 1) {
				logger.debug('[ADMIN WORLD] World not found, retrying...', {
					worldId: params.id,
					attempt: i + 1
				});
				await new Promise((resolve) => setTimeout(resolve, 150));
			}
		}

		if (!response?.ok) {
			logger.warn('[ADMIN WORLD] World not found after retries', {
				worldId: params.id,
				status: response?.status
			});
			throw error(404);
		}

		const world: WorldWithRelations = await response.json();

		// Load all servers for reassignment dropdown
		const serversResponse = await fetch(`${SERVER_API_URL}/servers`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		const servers: GameServer[] = serversResponse.ok ? await serversResponse.json() : [];

		// Use stats from API response (_count property added by server)
		const worldWithCounts = world as WorldWithRelations & {
			_count?: {
				landTiles?: number;
				oceanTiles?: number;
				settlements?: number;
				regions?: number;
			};
		};
		const worldInfo = {
			landTiles: worldWithCounts._count?.landTiles || 0,
			oceanTiles: worldWithCounts._count?.oceanTiles || 0,
			settlements: worldWithCounts._count?.settlements || 0,
			regions: worldWithCounts._count?.regions || 0
		};

		logger.info('[ADMIN WORLD] Successfully loaded world', {
			worldId: params.id,
			worldName: world.name,
			serverCount: servers.length
		});

		return {
			world,
			servers,
			worldInfo
		};
	} catch (err) {
		// Re-throw SvelteKit errors
		if (err && typeof err === 'object' && 'status' in err) {
			throw err;
		}

		logger.error('[ADMIN WORLD] Failed to load world', err, {
			worldId: params.id
		});
		throw error(500);
	}
};

const update: Action = async ({ request, params, cookies }) => {
	const data = await request.formData();
	const name = data.get('name');
	const serverId = data.get('serverId');

	if (!name || typeof name !== 'string') {
		logger.warn('[ADMIN WORLD] Invalid world name', { worldId: params.id });
		return fail(400, { invalid: true, message: 'World name is required' });
	}

	if (!serverId || typeof serverId !== 'string') {
		logger.warn('[ADMIN WORLD] Invalid server ID', { worldId: params.id });
		return fail(400, { invalid: true, message: 'Server is required' });
	}

	try {
		const sessionToken = cookies.get('session');

		logger.debug('[ADMIN WORLD] Updating world', {
			worldId: params.id,
			name,
			serverId
		});

		const response = await fetch(`${SERVER_API_URL}/worlds/${params.id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${sessionToken}`
			},
			body: JSON.stringify({ name, serverId })
		});

		if (!response.ok) {
			logger.error('[ADMIN WORLD] Failed to update world', {
				worldId: params.id,
				status: response.status
			});
			return fail(500, { success: false, message: 'Failed to update world' });
		}

		logger.info('[ADMIN WORLD] World updated successfully', {
			worldId: params.id,
			name
		});

		return { success: true, message: 'World updated successfully' };
	} catch (err) {
		logger.error('[ADMIN WORLD] Error updating world', err, {
			worldId: params.id
		});
		return fail(500, { success: false, message: 'Failed to update world' });
	}
};

const deleteWorld: Action = async ({ params, cookies }) => {
	try {
		const sessionToken = cookies.get('session');

		logger.debug('[ADMIN WORLD] Deleting world', { worldId: params.id });

		const response = await fetch(`${SERVER_API_URL}/worlds/${params.id}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			logger.error('[ADMIN WORLD] Failed to delete world', {
				worldId: params.id,
				status: response.status
			});
			return fail(500, { success: false, message: 'Failed to delete world' });
		}

		logger.info('[ADMIN WORLD] World deleted successfully', { worldId: params.id });
		throw redirect(303, '/admin/worlds');
	} catch (err) {
		// Re-throw redirects
		if (err && typeof err === 'object' && 'location' in err) {
			throw err;
		}

		logger.error('[ADMIN WORLD] Error deleting world', err, {
			worldId: params.id
		});
		return fail(500, { success: false, message: 'Failed to delete world' });
	}
};

/**
 * Start generation action
 * Triggers background generation of regions, tiles, and plots
 */
const generate: Action = async ({ request, params, cookies }) => {
	const data = await request.formData();
	const settings = data.get('settings');

	if (!settings || typeof settings !== 'string') {
		logger.warn('[ADMIN WORLD] Missing generation settings', { worldId: params.id });
		return fail(400, { success: false, message: 'Generation settings are required' });
	}

	try {
		const sessionToken = cookies.get('session');
		const generationSettings = JSON.parse(settings);

		logger.info('[ADMIN WORLD] Starting world generation', {
			worldId: params.id,
			dimensions: `${generationSettings.width}x${generationSettings.height}`
		});

		const response = await fetch(`${SERVER_API_URL}/worlds/${params.id}/generate`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${sessionToken}`
			},
			body: JSON.stringify(generationSettings)
		});

		if (!response.ok) {
			const error = await response
				.json()
				.catch(() => ({ error: 'Failed to start generation' }));
			logger.error('[ADMIN WORLD] Failed to start generation', {
				worldId: params.id,
				status: response.status,
				error
			});
			return fail(response.status, {
				success: false,
				message: error.error || 'Failed to start generation'
			});
		}

		logger.info('[ADMIN WORLD] Generation started successfully', { worldId: params.id });

		return { success: true, message: 'Generation started' };
	} catch (err) {
		logger.error('[ADMIN WORLD] Error starting generation', err, {
			worldId: params.id
		});
		return fail(500, { success: false, message: 'Failed to start generation' });
	}
};

export const actions: Actions = { update, delete: deleteWorld, generate };
