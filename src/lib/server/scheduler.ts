/**
 * Development Cron Scheduler
 * 
 * This scheduler runs only in development mode to simulate
 * Vercel Cron jobs locally. In production, Vercel Cron handles scheduling.
 */

import cron from 'node-cron';
import { runHourlyTick } from '$lib/server/game-ticks';

/**
 * Initialize development cron jobs
 * Only runs when NODE_ENV === 'development'
 */
export function initializeDevScheduler() {
	if (process.env.NODE_ENV !== 'development') {
		console.log('[DEV SCHEDULER] Skipping - not in development mode');
		return;
	}

	console.log('[DEV SCHEDULER] Initializing development cron jobs...');

	// Hourly production tick - runs every hour at minute 0
	// In dev, you can change this to */5 * * * * for every 5 minutes for faster testing
	const hourlySchedule = process.env.DEV_TICK_FAST === 'true' 
		? '*/5 * * * *'  // Every 5 minutes (fast testing)
		: '0 * * * *';   // Every hour (normal)

	cron.schedule(hourlySchedule, async () => {
		console.log('[DEV SCHEDULER] Triggering hourly production tick');
		
		try {
			// Call the tick logic directly (no HTTP request needed in dev)
			const result = await runHourlyTick();
			
			if (result.success) {
				console.log('[DEV SCHEDULER] Tick completed:', {
					settlementsProcessed: result.settlementsProcessed,
					totalResourcesWasted: result.totalResourcesWasted,
					duration: result.duration
				});
			} else {
				console.error('[DEV SCHEDULER] Tick failed');
			}
		} catch (error) {
			console.error('[DEV SCHEDULER] Error during tick:', error);
		}
	});

	console.log(`[DEV SCHEDULER] Scheduled hourly tick (${hourlySchedule})`);
	console.log('[DEV SCHEDULER] Set DEV_TICK_FAST=true in .env for 5-minute testing intervals');
}

/**
 * Manually trigger a tick (useful for testing)
 */
export async function triggerManualTick() {
	console.log('[DEV SCHEDULER] Manual tick triggered');
	
	try {
		const result = await runHourlyTick();
		console.log('[DEV SCHEDULER] Manual tick result:', result);
		return result;
	} catch (error) {
		console.error('[DEV SCHEDULER] Manual tick error:', error);
		throw error;
	}
}
