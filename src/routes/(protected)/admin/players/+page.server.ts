import type { PageServerLoad, Actions } from './$types';
import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';
import type { PlayerWithRelations } from '$lib/types/api';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ cookies }) => {
	try {
		const sessionToken = cookies.get('session');

		const response = await fetch(`${SERVER_API_URL}/players`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			logger.error('[ADMIN PLAYERS] Failed to fetch players', {
				status: response.status
			});
			return { accounts: [] };
		}

		const accounts: PlayerWithRelations[] = await response.json();

		logger.info('[ADMIN PLAYERS] Players loaded', {
			count: accounts.length
		});

		return { accounts };
	} catch (err) {
		logger.error('[ADMIN PLAYERS] Error loading players', err);
		return { accounts: [] };
	}
};

export const actions: Actions = {
	updateRole: async ({ request, cookies }) => {
		const sessionToken = cookies.get('session');
		const formData = await request.formData();
		const accountId = formData.get('accountId') as string;
		const role = formData.get('role') as string;

		if (!accountId || !role) {
			return fail(400, { error: 'Missing required fields' });
		}

		if (!['MEMBER', 'SUPPORT', 'ADMINISTRATOR'].includes(role)) {
			return fail(400, { error: 'Invalid role' });
		}

		try {
			const response = await fetch(`${SERVER_API_URL}/players/${accountId}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionToken}`
				},
				body: JSON.stringify({ role })
			});

			if (!response.ok) {
				const error = await response.text();
				logger.error('[ADMIN PLAYERS] Failed to update role', {
					accountId,
					role,
					status: response.status,
					error
				});
				return fail(response.status, { error: 'Failed to update player role' });
			}

			logger.info('[ADMIN PLAYERS] Role updated', { accountId, role });
			return { success: true };
		} catch (err) {
			logger.error('[ADMIN PLAYERS] Error updating role', err);
			return fail(500, { error: 'Server error' });
		}
	},

	deleteAccount: async ({ request, cookies }) => {
		const sessionToken = cookies.get('session');
		const formData = await request.formData();
		const accountId = formData.get('accountId') as string;
		const confirmation = formData.get('confirmation') as string;

		if (!accountId || confirmation !== 'DELETE') {
			return fail(400, { error: 'Invalid confirmation' });
		}

		try {
			const response = await fetch(`${SERVER_API_URL}/players/${accountId}`, {
				method: 'DELETE',
				headers: {
					Cookie: `session=${sessionToken}`
				}
			});

			if (!response.ok) {
				const error = await response.text();
				logger.error('[ADMIN PLAYERS] Failed to delete account', {
					accountId,
					status: response.status,
					error
				});
				return fail(response.status, { error: 'Failed to delete account' });
			}

			logger.info('[ADMIN PLAYERS] Account deleted', { accountId });
			return { success: true };
		} catch (err) {
			logger.error('[ADMIN PLAYERS] Error deleting account', err);
			return fail(500, { error: 'Server error' });
		}
	}
};
