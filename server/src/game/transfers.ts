/**
 * Transfer Calculation Utilities
 * Handles distance, transport time, and loss calculations for resource transfers
 * between settlements.
 *
 * ARTIFACT-05 Phase 3: Resource Transfer System
 */

import type { Settlement, Tile } from '../db/schema.js';
import { db } from '../db/index.js';
import { settlements, tiles } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Calculate Euclidean distance between two tiles
 * @param tile1 - Source tile with coordinates
 * @param tile2 - Destination tile with coordinates
 * @returns Distance in tile units (rounded to nearest integer)
 */
export function calculateDistance(
	tile1: { xCoord: number; yCoord: number },
	tile2: { xCoord: number; yCoord: number }
): number {
	const dx = tile2.xCoord - tile1.xCoord;
	const dy = tile2.yCoord - tile1.yCoord;
	return Math.round(Math.sqrt(dx * dx + dy * dy));
}

/**
 * Calculate transport time based on distance
 * Rule: 10 minutes per 100 tiles (0.1 min per tile)
 * @param distance - Distance in tiles
 * @returns Transport time in milliseconds
 */
export function calculateTransportTime(distance: number): number {
	const minutesPerTile = 0.1;
	const minutes = distance * minutesPerTile;
	return Math.round(minutes * 60 * 1000); // Convert to milliseconds
}

/**
 * Calculate resource loss percentage during transport
 * Base formula: (distance / 100) * 5 = 5% per 100 tiles
 * Disaster penalty: +10% if active disaster in source region
 * Maximum loss: 50%
 *
 * @param distance - Distance in tiles
 * @param hasDisasterPenalty - Whether source region has active disaster
 * @returns Loss percentage (0-50)
 */
export function calculateLossPercentage(distance: number, hasDisasterPenalty: boolean = false): number {
	// Base distance penalty: 5% per 100 tiles
	const baseLoss = (distance / 100) * 5;

	// Disaster penalty: +10%
	const disasterPenalty = hasDisasterPenalty ? 10 : 0;

	// Total loss capped at 50%
	const totalLoss = Math.min(baseLoss + disasterPenalty, 50);

	return Math.round(totalLoss);
}

/**
 * Calculate resources received after loss
 * @param amountSent - Original amount sent
 * @param lossPercentage - Loss percentage (0-50)
 * @returns Amount received (rounded down)
 */
export function calculateAmountReceived(amountSent: number, lossPercentage: number): number {
	const lossMultiplier = 1 - lossPercentage / 100;
	return Math.floor(amountSent * lossMultiplier);
}

/**
 * Get tile coordinates for a settlement
 * @param settlementId - Settlement ID
 * @returns Tile with coordinates, or null if not found
 */
export async function getSettlementTile(settlementId: string): Promise<{ xCoord: number; yCoord: number } | null> {
	const settlement = await db.query.settlements.findFirst({
		where: eq(settlements.id, settlementId),
		with: {
			tile: {
				columns: {
					xCoord: true,
					yCoord: true,
				},
			},
		},
	});

	return settlement?.tile ?? null;
}

/**
 * Check if a settlement's region has an active disaster
 * @param settlementId - Settlement ID
 * @returns True if active disaster exists in the region
 */
export async function hasActiveDisaster(settlementId: string): Promise<boolean> {
	const settlement = await db.query.settlements.findFirst({
		where: eq(settlements.id, settlementId),
		with: {
			tile: {
				columns: {
					regionId: true,
				},
				with: {
					region: {
						with: {
							disasters: {
								where: (disasters: any, { and, lte, isNull }: any) =>
									and(lte(disasters.startedAt, new Date()), isNull(disasters.endedAt)),
								limit: 1,
							},
						},
					},
				},
			},
		},
	});

	return (settlement?.tile?.region?.disasters?.length ?? 0) > 0;
}

/**
 * Calculate all transfer parameters (distance, time, loss, received amount)
 * @param fromSettlementId - Source settlement ID
 * @param toSettlementId - Destination settlement ID
 * @param amountSent - Amount of resources to send
 * @returns Transfer calculation results, or null if settlements not found
 */
export async function calculateTransferParameters(
	fromSettlementId: string,
	toSettlementId: string,
	amountSent: number
): Promise<{
	distance: number;
	transportTime: number;
	lossPercentage: number;
	amountReceived: number;
	completedAt: Date;
} | null> {
	// Get tile coordinates for both settlements
	const [fromTile, toTile] = await Promise.all([
		getSettlementTile(fromSettlementId),
		getSettlementTile(toSettlementId),
	]);

	if (!fromTile || !toTile) {
		return null;
	}

	// Calculate distance
	const distance = calculateDistance(fromTile, toTile);

	// Calculate transport time
	const transportTime = calculateTransportTime(distance);

	// Check for disaster penalty
	const hasDisaster = await hasActiveDisaster(fromSettlementId);

	// Calculate loss percentage
	const lossPercentage = calculateLossPercentage(distance, hasDisaster);

	// Calculate received amount
	const amountReceived = calculateAmountReceived(amountSent, lossPercentage);

	// Calculate completion time
	const completedAt = new Date(Date.now() + transportTime);

	return {
		distance,
		transportTime,
		lossPercentage,
		amountReceived,
		completedAt,
	};
}
