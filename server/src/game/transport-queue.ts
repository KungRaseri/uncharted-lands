/**
 * Transport Queue Processor
 * Periodically checks for completed resource transfers and delivers them
 * to destination settlements.
 *
 * ARTIFACT-05 Phase 3: Resource Transfer System
 */

import { db } from '../db/index.js';
import { settlementTransfers, settlementStorage } from '../db/schema.js';
import { eq, and, lte } from 'drizzle-orm';
import type { Server as SocketServer } from 'socket.io';
import { logger } from '../utils/logger.js';

let intervalId: NodeJS.Timeout | null = null;
let io: SocketServer | null = null;

/**
 * Process completed transfers: add resources to destination and emit events
 */
async function processCompletedTransfers() {
	try {
		// Find all in_transit transfers that have completed
		const completedTransfers = await db.query.settlementTransfers.findMany({
			where: and(
				eq(settlementTransfers.status, 'in_transit'),
				lte(settlementTransfers.completedAt, new Date())
			),
			with: {
				fromSettlement: {
					columns: {
						name: true,
					},
					with: {
						playerProfile: {
							columns: {
								accountId: true,
							},
						},
					},
				},
				toSettlement: {
					columns: {
						name: true,
					},
					with: {
						playerProfile: {
							columns: {
								accountId: true,
							},
						},
						storage: true,
					},
				},
			},
		});

		if (completedTransfers.length === 0) {
			return; // No transfers to process
		}

		logger.info('Processing completed transfers', {
			count: completedTransfers.length,
		});

		// Process each completed transfer
		for (const transfer of completedTransfers) {
			try {
			// Type guard: ensure settlements are objects (Drizzle relations can be arrays)
			if (Array.isArray(transfer.fromSettlement) || Array.isArray(transfer.toSettlement)) {
				logger.error('Invalid settlement relation type', { transferId: transfer.id });
				continue;
			}

						transferId: transfer.id,
						settlementId: transfer.toSettlementId,
					});
					continue;
				}

				// Add resources to destination settlement
				const resourceField = transfer.resourceType.toLowerCase() as keyof typeof storage;
				const currentAmount = (storage[resourceField] as number) || 0;
				const newAmount = currentAmount + transfer.amountReceived;

				await db
					.update(settlementStorage)
					.set({
						[resourceField]: newAmount,
					})
					.where(eq(settlementStorage.settlementId, transfer.toSettlementId));

				// Update transfer status to completed
				await db
					.update(settlementTransfers)
					.set({
						status: 'completed',
					})
					.where(eq(settlementTransfers.id, transfer.id));

				logger.info('Transfer completed', {
					transferId: transfer.id,
					fromSettlement: transfer.fromSettlement.name,
					toSettlement: transfer.toSettlement.name,
					resourceType: transfer.resourceType,
					amountReceived: transfer.amountReceived,
				});

				// Emit Socket.IO event to both sender and receiver
				if (io) {
					// Notify sender
				const fromProfile = !Array.isArray(transfer.fromSettlement.playerProfile) 
					? transfer.fromSettlement.playerProfile 
					: transfer.fromSettlement.playerProfile[0];
				const toProfile = !Array.isArray(transfer.toSettlement.playerProfile) 
					? transfer.toSettlement.playerProfile 
					: transfer.toSettlement.playerProfile[0];

				io.to(`account:${fromProfile.accountId}`).emit('transfer-completed', {
						transferId: transfer.id,
						fromSettlementId: transfer.fromSettlementId,
						toSettlementId: transfer.toSettlementId,
						fromSettlementName: transfer.fromSettlement.name,
						toSettlementName: transfer.toSettlement.name,
						resourceType: transfer.resourceType,
						amountSent: transfer.amountSent,
						amountReceived: transfer.amountReceived,
						lossPercentage: transfer.lossPercentage,
						direction: 'outgoing',
					});

					// Notify receiver
				io.to(`account:${toProfile.accountId}`).emit('transfer-completed', {
						transferId: transfer.id,
						fromSettlementId: transfer.fromSettlementId,
						toSettlementId: transfer.toSettlementId,
						fromSettlementName: transfer.fromSettlement.name,
						toSettlementName: transfer.toSettlement.name,
						resourceType: transfer.resourceType,
						amountSent: transfer.amountSent,
						amountReceived: transfer.amountReceived,
						lossPercentage: transfer.lossPercentage,
						direction: 'incoming',
					});
				}
			} catch (error) {
				logger.error('Failed to process transfer', {
					transferId: transfer.id,
					error: error instanceof Error ? error.message : 'Unknown error',
				});
			}
		}
	} catch (error) {
		logger.error('Failed to process completed transfers', {
			error: error instanceof Error ? error.message : 'Unknown error',
		});
	}
}

/**
 * Start the transport queue processor
 * Checks for completed transfers every 10 seconds
 *
 * @param socketIo - Socket.IO server instance for emitting events
 */
export function startTransportQueue(socketIo: SocketServer) {
	if (intervalId) {
		logger.warn('Transport queue already running');
		return;
	}

	io = socketIo;

	// Process immediately on start
	processCompletedTransfers();

	// Check every 10 seconds
	intervalId = setInterval(processCompletedTransfers, 10000);

	logger.info('Transport queue started', {
		interval: '10 seconds',
	});
}

/**
 * Stop the transport queue processor
 * Called during graceful shutdown
 */
export function stopTransportQueue() {
	if (intervalId) {
		clearInterval(intervalId);
		intervalId = null;
		logger.info('Transport queue stopped');
	}
}
