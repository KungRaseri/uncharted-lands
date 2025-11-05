/**
 * Manual Tick Trigger (Development Only)
 * 
 * This endpoint allows you to manually trigger game ticks during development.
 * Access via: http://localhost:5173/api/cron/trigger
 * 
 * In production, this endpoint is disabled for security.
 */

import type { RequestHandler } from '@sveltejs/kit';
import { runHourlyTick } from '$lib/server/game-ticks';
import { dev } from '$app/environment';

export const GET: RequestHandler = async () => {
	// Only allow in development mode
	if (!dev) {
		return new Response(JSON.stringify({
			success: false,
			message: 'Manual triggers are disabled in production'
		}), {
			status: 403,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	try {
		console.log('[MANUAL TRIGGER] Running hourly tick...');
		
		const result = await runHourlyTick();
		
		return new Response(JSON.stringify({
			message: 'Manual tick completed successfully',
			...result
		}), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('[MANUAL TRIGGER] Tick failed:', error);
		
		return new Response(JSON.stringify({
			success: false,
			message: 'Manual tick failed',
			error: error instanceof Error ? error.message : 'Unknown error'
		}), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
