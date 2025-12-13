import { fail, redirect } from '@sveltejs/kit';
import type { Action, Actions, PageServerLoad } from './$types';
import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';

export const load: PageServerLoad = async () => {
	return {};
};

const createServer: Action = async ({ request, cookies }) => {
	const data = await request.formData();
	const name = data.get('name');
	const hostname = data.get('hostname');
	const port = data.get('port');

	if (
		typeof name !== 'string' ||
		!name ||
		typeof hostname !== 'string' ||
		!hostname ||
		typeof port !== 'string' ||
		!port
	) {
		return fail(400, { invalid: true, message: 'Invalid form data. Check form and try again' });
	}

	const sessionToken = cookies.get('session');

	logger.debug('[ADMIN CREATE SERVER] Creating server', {
		name,
		hostname,
		port,
		hasSessionToken: !!sessionToken
	});

	try {
		const response = await fetch(`${SERVER_API_URL}/servers`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Cookie: `session=${sessionToken}`
			},
			body: JSON.stringify({
				name,
				hostname,
				port: Number.parseInt(port)
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			logger.error('[ADMIN CREATE SERVER] Failed to create server', {
				status: response.status,
				error: errorData.error
			});
			return fail(response.status, {
				invalid: true,
				message: errorData.error || 'Failed to create server'
			});
		}

		const server = await response.json();
		logger.info('[ADMIN CREATE SERVER] Successfully created server', {
			serverId: server.id,
			name: server.name
		});
	} catch (e) {
		logger.error('[ADMIN CREATE SERVER] Error creating server', e);
		return fail(500, { invalid: true, message: `Unknown error occurred: ${e}` });
	}

	throw redirect(302, '/admin/servers');
};

export const actions: Actions = { createServer };
