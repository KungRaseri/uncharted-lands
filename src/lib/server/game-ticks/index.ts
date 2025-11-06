/**
 * Game Tick Service Layer
 * 
 * Orchestrates all game tick operations including production, consumption,
 * population management, and events.
 */

import { db } from '$lib/db';
import { calculateProduction } from './production';
import { calculateConsumption } from './consumption';
import { calculateStorageCapacity, clampToCapacity, calculateWaste } from './storage';

/**
 * Main tick orchestrator - runs hourly
 * This is called by the Vercel Cron job at /api/cron/hourlyProduction
 */
export async function runHourlyTick() {
	const startTime = Date.now();
	console.log('[HOURLY TICK] Starting tick at', new Date().toISOString());

	try {
		// Get all settlements with their related data
		const settlements = await db.settlement.findMany({
			include: {
				Plot: true,
				Storage: true,
				Structures: {
					include: {
						modifiers: true,
						buildRequirements: true
					}
				}
			}
		});

		console.log(`[HOURLY TICK] Processing ${settlements.length} settlements`);

		// Process each settlement
		let totalWaste = 0;
		for (const settlement of settlements) {
			const waste = await processSettlementTick(settlement);
			totalWaste += Object.values(waste).reduce((sum, val) => sum + val, 0);
		}

		const duration = Date.now() - startTime;
		console.log(`[HOURLY TICK] Completed in ${duration}ms`);

		// Note: In a production app, you might want to broadcast this via WebSocket/SSE
		// For now, clients will poll periodically or use SvelteKit's invalidation system

		return {
			success: true,
			settlementsProcessed: settlements.length,
			totalResourcesWasted: totalWaste,
			duration,
			timestamp: new Date().toISOString()
		};
	} catch (error) {
		console.error('[HOURLY TICK] Error:', error);
		throw error;
	}
}

/**
 * Process a single settlement's tick
 */
async function processSettlementTick(settlement: any) {
	try {
		console.log(`[TICK] Processing settlement ${settlement.name} (${settlement.id})`);

		// Calculate production with structure bonuses
		const production = calculateProduction(settlement);

		// Calculate consumption
		const consumption = calculateConsumption(settlement);

		// Calculate net resource changes
		const netChanges = {
			food: production.food - consumption.food,
			water: production.water - consumption.water,
			wood: production.wood - consumption.wood,
			stone: production.stone - consumption.stone,
			ore: production.ore - consumption.ore
		};

		// Calculate storage capacity
		const storageCapacity = calculateStorageCapacity(settlement);

		// Calculate current resources
		const currentResources = {
			food: settlement.Storage.food,
			water: settlement.Storage.water,
			wood: settlement.Storage.wood,
			stone: settlement.Storage.stone,
			ore: settlement.Storage.ore
		};

		// Calculate waste (resources exceeding capacity)
		const waste = calculateWaste(currentResources, netChanges, storageCapacity);

		// Apply changes to storage (respecting capacity limits)
		const newResources = clampToCapacity({
			food: currentResources.food + netChanges.food,
			water: currentResources.water + netChanges.water,
			wood: currentResources.wood + netChanges.wood,
			stone: currentResources.stone + netChanges.stone,
			ore: currentResources.ore + netChanges.ore
		}, storageCapacity);

		await db.settlementStorage.update({
			where: { id: settlement.settlementStorageId },
			data: newResources
		});

		// Log waste if any
		if (Object.values(waste).some(v => v > 0)) {
			console.log(`[TICK] ${settlement.name} - Resources wasted (capacity limit):`, waste);
		}

		console.log(`[TICK] ${settlement.name} - Production:`, production, 'Consumption:', consumption);
		
		return waste;
	} catch (error) {
		console.error(`[TICK] Error processing settlement ${settlement.id}:`, error);
		// Continue processing other settlements even if one fails
		return { food: 0, water: 0, wood: 0, stone: 0, ore: 0 };
	}
}

// Re-export types for convenience
export type { ResourceAmounts } from './production';
export type { ResourceCapacity } from './storage';
