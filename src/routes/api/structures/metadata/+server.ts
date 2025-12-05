/**
 * SvelteKit API Route: Structure Metadata
 *
 * Proxies requests to the backend API server.
 * This allows the client to fetch structure metadata without CORS issues.
 */

import { API_URL } from '$lib/config';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ fetch }) => {
	try {
		const response = await fetch(`${API_URL}/structures/metadata`);

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
		console.error('[API] Error fetching structure metadata:', err);
		return json(
			{
				error: `Failed to fetch structure metadata: ${err instanceof Error ? err.message : 'Unknown error'}`
			},
			{ status: 500 }
		);
	}
};
