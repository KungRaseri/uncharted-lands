import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { SERVER_API_URL } from '$env/static/private';
import { logger } from '$lib/utils/logger';

/**
 * API endpoint to fetch specific regions by coordinates for lazy loading
 *
 * Query Parameters:
 * - xMin, xMax, yMin, yMax: Coordinate bounds for region grid
 * - centerX, centerY: Center coordinates (alternative to bounds)
 * - radius: Number of regions in each direction (default: 1 for 3x3 grid)
 *
 * Example: /api/regions/[worldId]?centerX=5&centerY=5&radius=1
 * This fetches a 3x3 grid centered at (5,5): regions from (4,4) to (6,6)
 */
export const GET: RequestHandler = async ({ params, url, locals, fetch }) => {
	const startTime = performance.now();

	// Check authentication
	if (!locals.account) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const { worldId } = params;

	// Build query string from URL search params
	const queryParams = new URLSearchParams();
	queryParams.set('worldId', worldId);

	// Pass through all query parameters
	for (const [key, value] of url.searchParams) {
		queryParams.set(key, value);
	}

	logger.info('[REGIONS API] Proxying to server:', {
		worldId,
		params: Object.fromEntries(queryParams),
		accountId: locals.account.id
	});

	try {
		// Proxy request to server REST API
		const response = await fetch(`${SERVER_API_URL}/regions?${queryParams.toString()}`, {
			headers: {
				Cookie: `session=${locals.account.userAuthToken}`
			}
		});

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
			logger.error('[REGIONS API] Server error:', { errorData });
			return json(
				{
					error: errorData.error || `Server returned ${response.status}`
				},
				{ status: response.status }
			);
		}

		const data = await response.json();
		const loadTimeMs = Math.round(performance.now() - startTime);

		logger.info('[REGIONS API] ⏱️  Total time: ' + loadTimeMs + 'ms', { loadTimeMs });
		logger.info('[REGIONS API] Fetched ' + data.count + ' regions', { count: data.count });

		return json({
			...data,
			queryTimeMs: loadTimeMs
		});
	} catch (err) {
		logger.error('[REGIONS API] Error proxying request:', err);
		return json(
			{
				error: `Failed to fetch regions: ${err instanceof Error ? err.message : 'Unknown error'}`
			},
			{ status: 500 }
		);
	}
};
