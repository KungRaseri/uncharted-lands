import type { RequestHandler } from '@sveltejs/kit';
import { runHourlyTick } from '$lib/server/game-ticks';

/**
 * Hourly Production Cron Endpoint
 * 
 * Called by Vercel Cron every hour (0 * * * *)
 * Processes all game tick operations including:
 * - Resource production with structure bonuses
 * - Resource consumption (future)
 * - Population management (future)
 * - Events and threats (future)
 */
export const GET: RequestHandler = async () => {
	try {
		console.log('[CRON] Hourly production tick triggered');
		
		const result = await runHourlyTick();
		
		return new Response(JSON.stringify({
			message: 'Hourly tick completed successfully',
			...result
		}), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('[CRON] Hourly tick failed:', error);
		
		return new Response(JSON.stringify({
			success: false,
			message: 'Hourly tick failed',
			error: error instanceof Error ? error.message : 'Unknown error'
		}), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};