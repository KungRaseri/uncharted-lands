/**
 * Add generous testing resources to all settlements
 * Run with: npx tsx scripts/add-test-resources.ts
 */

import 'dotenv/config';
import { db, settlements, settlementStorage } from '../src/db/index.js';
import { logger } from '../src/utils/logger.js';
import { eq } from 'drizzle-orm';

async function addTestResources() {
	logger.info('[TEST RESOURCES] Starting resource addition...');

	try {
		// Get all settlements
		const allSettlements = await db.query.settlements.findMany({
			with: {
				storage: true,
			},
		});

		logger.info(`[TEST RESOURCES] Found ${allSettlements.length} settlements`);

		for (const settlement of allSettlements) {
			if (!settlement.storage) {
				logger.warn(`[TEST RESOURCES] Settlement ${settlement.id} has no storage, skipping`);
				continue;
			}

			// Add generous testing resources
			await db
				.update(settlementStorage)
				.set({
					food: 1000,
					water: 1000,
					wood: 500,
					stone: 500,
					ore: 200,
				})
				.where(eq(settlementStorage.settlementId, settlement.id));

			logger.info(
				`[TEST RESOURCES] Updated settlement ${settlement.id} (${settlement.name}) with test resources`
			);
		}

		logger.info('[TEST RESOURCES] ✅ Resource addition complete!');
	} catch (error) {
		logger.error('[TEST RESOURCES] ❌ Failed:', error);
		process.exit(1);
	} finally {
		await db.$client.end();
	}
}

addTestResources();
