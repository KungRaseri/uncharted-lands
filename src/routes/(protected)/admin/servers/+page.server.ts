import type { PageServerLoad, Actions, Action } from './$types';
import { fail } from '@sveltejs/kit';
import { logger } from '$lib/utils/logger';
import { API_URL } from '$lib/config';
import type { GameServerWithRelations } from '$lib/types/api';

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		const sessionToken = cookies.get('session');

		logger.debug('[ADMIN SERVERS] Loading servers list', {
			hasSessionToken: !!sessionToken
		});

		const response = await fetch(`${API_URL}/servers`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			logger.error('[ADMIN SERVERS] Failed to fetch servers', {
				status: response.status,
				statusText: response.statusText
			});
			return { servers: [] };
		}

		const servers: GameServerWithRelations[] = await response.json();

		logger.info('[ADMIN SERVERS] Successfully loaded servers', {
			count: servers.length
		});

		return { servers };
	} catch (err) {
		logger.error('[ADMIN SERVERS] Error loading servers', err);
		return { servers: [] };
	}
};

const deleteServer: Action = async ({ request, cookies }) => {
	const data = await request.formData();
	const serverId = data.get('serverId');

	if (!serverId || typeof serverId !== 'string') {
		logger.warn('[ADMIN SERVERS] Delete attempt without server ID');
		return fail(400, { success: false, message: 'Server ID is required' });
	}

	try {
		const sessionToken = cookies.get('session');

		logger.debug('[ADMIN SERVERS] Deleting server', { serverId });

		const response = await fetch(`${API_URL}/servers/${serverId}`, {
			method: 'DELETE',
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			const errorData = await response.json();
			logger.error('[ADMIN SERVERS] Failed to delete server', {
				serverId,
				status: response.status,
				error: errorData
			});
			return fail(response.status, {
				success: false,
				message: errorData.error || 'Failed to delete server',
				serverId
			});
		}

		logger.info('[ADMIN SERVERS] Server deleted successfully', { serverId });
		return { success: true, message: 'Server deleted successfully', serverId };
	} catch (err) {
		logger.error('[ADMIN SERVERS] Error deleting server', err, { serverId });
		return fail(500, { success: false, message: 'Failed to delete server', serverId });
	}
};

export const actions: Actions = { delete: deleteServer };
