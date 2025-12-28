/**
 * Resource Transfer Store (ARTIFACT-05 Phase 3)
 *
 * Manages resource transfers between settlements
 * - Tracks active and completed transfers
 * - Listens to Socket.IO 'transfer-completed' events
 * - Provides reactive state for UI components
 * - Handles transfer initiation API calls
 */

import type { Socket } from 'socket.io-client';
import { PUBLIC_CLIENT_API_URL } from '$env/static/public';

export type ResourceType = 'FOOD' | 'WOOD' | 'STONE' | 'ORE' | 'CLAY' | 'HERBS' | 'PELTS' | 'GEMS' | 'EXOTIC_WOOD';

export type TransferStatus = 'in_transit' | 'completed';

export type Transfer = {
	id: string;
	fromSettlementId: string;
	fromSettlementName: string;
	toSettlementId: string;
	toSettlementName: string;
	resourceType: ResourceType;
	amountSent: number;
	amountReceived: number;
	lossPercentage: number;
	distance: number;
	transportTime: number;
	status: TransferStatus;
	startedAt: Date;
	completedAt: Date | null;
	direction: 'incoming' | 'outgoing';
};

class TransferStore {
	private transfers = $state<Map<string, Transfer>>(new Map());
	private socket: Socket | null = null;

	/**
	 * Get all transfers (sorted by startedAt, most recent first)
	 */
	get allTransfers(): Transfer[] {
		return Array.from(this.transfers.values()).sort(
			(a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
		);
	}

	/**
	 * Get active (in-transit) transfers
	 */
	get activeTransfers(): Transfer[] {
		return this.allTransfers.filter((t) => t.status === 'in_transit');
	}

	/**
	 * Get completed transfers
	 */
	get completedTransfers(): Transfer[] {
		return this.allTransfers.filter((t) => t.status === 'completed');
	}

	/**
	 * Get transfers for a specific settlement
	 */
	getSettlementTransfers(settlementId: string): Transfer[] {
		return this.allTransfers.filter(
			(t) => t.fromSettlementId === settlementId || t.toSettlementId === settlementId
		);
	}

	/**
	 * Get active transfers for a specific settlement
	 */
	getActiveSettlementTransfers(settlementId: string): Transfer[] {
		return this.activeTransfers.filter(
			(t) => t.fromSettlementId === settlementId || t.toSettlementId === settlementId
		);
	}

	/**
	 * Get a specific transfer by ID
	 */
	getTransfer(transferId: string): Transfer | undefined {
		return this.transfers.get(transferId);
	}

	/**
	 * Get time remaining for a transfer (in milliseconds)
	 */
	getTimeRemaining(transferId: string): number {
		const transfer = this.transfers.get(transferId);
		if (!transfer || !transfer.completedAt) return 0;

		const now = Date.now();
		const completedTime = new Date(transfer.completedAt).getTime();
		const remaining = completedTime - now;

		return remaining > 0 ? remaining : 0;
	}

	/**
	 * Format time remaining as human-readable string
	 */
	formatTimeRemaining(transferId: string): string {
		const ms = this.getTimeRemaining(transferId);
		if (ms === 0) return 'Completed';

		const seconds = Math.floor(ms / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);

		if (hours > 0) {
			const remainingMinutes = minutes % 60;
			return `${hours}h ${remainingMinutes}m`;
		} else if (minutes > 0) {
			const remainingSeconds = seconds % 60;
			return `${minutes}m ${remainingSeconds}s`;
		} else {
			return `${seconds}s`;
		}
	}

	/**
	 * Update or add a transfer
	 */
	private updateTransfer(transfer: Transfer) {
		// Convert string dates to Date objects
		const processedTransfer = {
			...transfer,
			startedAt: new Date(transfer.startedAt),
			completedAt: transfer.completedAt ? new Date(transfer.completedAt) : null,
		};

		this.transfers.set(transfer.id, processedTransfer);
	}

	/**
	 * Remove a transfer
	 */
	private removeTransfer(transferId: string) {
		this.transfers.delete(transferId);
	}

	/**
	 * Load transfers for a settlement from API
	 */
	async loadTransfers(settlementId: string, sessionToken: string): Promise<void> {
		try {
			const response = await fetch(`${PUBLIC_CLIENT_API_URL}/settlements/${settlementId}/transfers`, {
				headers: {
					Cookie: `session=${sessionToken}`,
				},
			});

			if (!response.ok) {
				console.error('[TransferStore] Failed to load transfers:', response.statusText);
				return;
			}

			const data = await response.json();
			const transfers = data.transfers as Transfer[];

			// Update store with fetched transfers
			for (const transfer of transfers) {
				this.updateTransfer(transfer);
			}

			console.log(`[TransferStore] Loaded ${transfers.length} transfers for settlement ${settlementId}`);
		} catch (error) {
			console.error('[TransferStore] Error loading transfers:', error);
		}
	}

	/**
	 * Initiate a new transfer
	 */
	async initiateTransfer(
		fromSettlementId: string,
		toSettlementId: string,
		resourceType: ResourceType,
		amount: number,
		sessionToken: string
	): Promise<{ success: boolean; error?: string; transfer?: any }> {
		try {
			const response = await fetch(`${PUBLIC_CLIENT_API_URL}/settlements/${fromSettlementId}/transfer`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Cookie: `session=${sessionToken}`,
				},
				body: JSON.stringify({
					toSettlementId,
					resourceType,
					amount,
				}),
			});

			const data = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: data.error || 'Failed to initiate transfer',
				};
			}

			// Reload transfers to get the new one
			await this.loadTransfers(fromSettlementId, sessionToken);

			console.log('[TransferStore] Transfer initiated:', data.transfer);

			return {
				success: true,
				transfer: data.transfer,
			};
		} catch (error) {
			console.error('[TransferStore] Error initiating transfer:', error);
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Unknown error',
			};
		}
	}

	/**
	 * Initialize the store with Socket.IO connection
	 */
	initialize(socket: Socket) {
		this.socket = socket;

		// Listen for transfer completion events
		socket.on('transfer-completed', (data) => {
			console.log('[TransferStore] Transfer completed:', data);

			// Update transfer status
			const transfer = this.transfers.get(data.transferId);
			if (transfer) {
				transfer.status = 'completed';
				this.updateTransfer(transfer);
			}
		});

		console.log('[TransferStore] Initialized');
	}

	/**
	 * Cleanup resources
	 */
	cleanup() {
		if (this.socket) {
			this.socket.off('transfer-completed');
			this.socket = null;
		}

		this.transfers.clear();
		console.log('[TransferStore] Cleaned up');
	}
}

// Export singleton instance
export const transferStore = new TransferStore();
