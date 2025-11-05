/**
 * Development Cron Scheduler
 * 
 * This scheduler runs only in development mode to simulate
 * Vercel Cron jobs locally. In production, Vercel Cron handles scheduling.
 */

import cron from 'node-cron';

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
			// Call the cron endpoint internally
			const response = await fetch('http://localhost:5173/api/cron/hourlyProduction');
			const result = await response.json();
			
			if (result.success) {
				console.log('[DEV SCHEDULER] Tick completed:', result);
			} else {
				console.error('[DEV SCHEDULER] Tick failed:', result);
			}
		} catch (error) {
			console.error('[DEV SCHEDULER] Error calling tick endpoint:', error);
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
		const response = await fetch('http://localhost:5173/api/cron/hourlyProduction');
		const result = await response.json();
		console.log('[DEV SCHEDULER] Manual tick result:', result);
		return result;
	} catch (error) {
		console.error('[DEV SCHEDULER] Manual tick error:', error);
		throw error;
	}
}
