/**
 * Settlement Area API Routes
 * Provides area statistics and building capacity information
 *
 * December 2025 - Building Area System Implementation
 */

import { Router, Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db, settlements, settlementStructures } from '../../db/index.js';
import type * as schema from '../../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { getAreaStatistics } from '../../utils/area-calculator.js';
import { STRUCTURES } from '../../data/structures.js';

const router = Router();

/**
 * GET /api/settlement-area/:settlementId
 * Get area statistics for a settlement
 *
 * Returns:
 * - areaUsed: Total area consumed by buildings
 * - areaCapacity: Total area available (500 + TH level * 100)
 * - areaAvailable: Remaining area for new buildings
 * - percentUsed: Percentage of area consumed
 * - townHallLevel: Current Town Hall level
 * - buildings: List of buildings with area costs
 */
router.get('/:settlementId', authenticate, async (req: Request, res: Response) => {
	try {
		const { settlementId } = req.params;

		// Verify settlement exists
		const settlement = await db.query.settlements.findFirst({
			where: eq(settlements.id, settlementId),
		});

		if (!settlement) {
			return res.status(404).json({
				success: false,
				error: 'Not Found',
				code: 'SETTLEMENT_NOT_FOUND',
				message: 'Settlement not found',
			});
		}

		// Verify user owns the settlement
		if (!req.user || settlement.playerProfileId !== req.user.profileId) {
			return res.status(403).json({
				success: false,
				error: 'Forbidden',
				code: 'NOT_SETTLEMENT_OWNER',
				message: 'You do not own this settlement',
			});
		}

		// Get area statistics
		const areaStats = await getAreaStatistics(db, settlementId);

		// Get list of buildings with area costs
		const settlementBuildings = await db.query.settlementStructures.findMany({
			where: eq(settlementStructures.settlementId, settlementId),
			with: {
				structure: true,
			},
		});

		const buildings = settlementBuildings
			.map((building) => {
				const structure = building.structure as typeof schema.structures.$inferSelect;
				const structureDefinition = STRUCTURES.find(
					(s) => s.name === structure.name
				);

				if (!structureDefinition || structureDefinition.category !== 'BUILDING') {
					return null;
				}

				return {
					id: building.id,
					name: structure.name,
					level: building.level,
					areaCost: structureDefinition.areaCost,
					unique: structureDefinition.unique,
				};
			})
			.filter((b) => b !== null);

		logger.debug('[API] Area statistics retrieved', {
			settlementId,
			areaUsed: areaStats.areaUsed,
			areaCapacity: areaStats.areaCapacity,
			buildingCount: buildings.length,
		});

		return res.json({
			success: true,
			data: {
				...areaStats,
				buildings,
			},
		});
	} catch (error) {
		logger.error('[API] Failed to get area statistics', {
			error,
			settlementId: req.params.settlementId,
		});
		return res.status(500).json({
			success: false,
			error: 'Internal Server Error',
			code: 'AREA_STATS_FAILED',
			message: 'Failed to retrieve area statistics',
		});
	}
});

export default router;
