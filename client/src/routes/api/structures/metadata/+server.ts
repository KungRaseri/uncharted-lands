/**
 * SvelteKit API Route: Structure Metadata
 *
 * Proxies requests to the backend API server.
 * This allows the client to fetch structure metadata without CORS issues.
 */

import { SERVER_API_URL } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { logger } from '$lib/utils/logger';

export const GET: RequestHandler = async ({ cookies }) => {
	try {
		const sessionToken = cookies.get('session');
		// ✅ Use native fetch for EXTERNAL Express API
		const response = await globalThis.fetch(`${SERVER_API_URL}/structures/metadata`, {
			headers: {
				Cookie: `session=${sessionToken}`
			}
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({
				error: 'Failed to fetch structure metadata'
			}));

			return json(
				{
					error: errorData.error || 'Failed to fetch structure metadata'
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		return json(data);
	} catch (err) {
		logger.error('[API] Error fetching structure metadata:', err);
		return json(
			{
				error: `Failed to fetch structure metadata: ${err instanceof Error ? err.message : 'Unknown error'}`
			},
			{ status: 500 }
		);
	}
};
