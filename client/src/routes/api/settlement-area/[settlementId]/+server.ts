/**
 * Settlement Area API Proxy
 * Proxies client-side requests to backend API
 *
 * December 2025 - Building Area System Implementation
 */

import { json, type RequestHandler } from '@sveltejs/kit';
import { SERVER_API_URL } from '$env/static/private';

export const GET: RequestHandler = async ({ params, cookies, fetch }) => {
	const { settlementId } = params;
	const sessionCookie = cookies.get('session');

	if (!sessionCookie) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const response = await fetch(`${SERVER_API_URL}/settlement-area/${settlementId}`, {
			headers: {
				Cookie: `session=${sessionCookie}`
			}
		});

		const data = await response.json();

		return json(data, {
			status: response.status
		});
	} catch (error) {
		console.error('[API Proxy] Failed to fetch area stats:', error);
		return json({ error: 'Failed to fetch area statistics' }, { status: 500 });
	}
};
