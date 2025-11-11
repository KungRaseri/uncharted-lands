/**
 * World API - Client interface for server-generated worlds
 * 
 * Provides functions to interact with the server's world generation
 * and data loading systems via Socket.IO.
 */

import { socketStore } from '$lib/stores/game/socket';

export interface WorldCreationOptions {
	worldName: string;
	seed?: number;
	width?: number;
	height?: number;
}

export interface WorldCreationResult {
	success: boolean;
	worldId?: string;
	stats?: {
		regionCount: number;
		tileCount: number;
		plotCount: number;
		duration: number;
	};
	error?: string;
}

export interface WorldDataRequest {
	worldId: string;
	includeRegions?: boolean;
}

export interface WorldDataResponse {
	success: boolean;
	world?: any;  // Will match server's World type
	regions?: any[];  // Will match server's Region type
	error?: string;
	timestamp: number;
}

export interface RegionDataRequest {
	regionId: string;
	includeTiles?: boolean;
}

export interface RegionDataResponse {
	success: boolean;
	region?: any;  // Will match server's Region type with optional tiles
	error?: string;
}

/**
 * Create a new world on the server
 * 
 * @param options - World creation parameters
 * @returns Promise resolving to world creation result
 * 
 * @example
 * ```typescript
 * const result = await createWorld({
 *   worldName: 'My New World',
 *   seed: 42,  // Optional: for reproducible worlds
 *   width: 100,
 *   height: 100
 * });
 * 
 * if (result.success) {
 *   console.log('World created:', result.worldId);
 *   console.log('Stats:', result.stats);
 * }
 * ```
 */
export function createWorld(options: WorldCreationOptions): Promise<WorldCreationResult> {
	return new Promise((resolve, reject) => {
		const socket = socketStore.getSocket();
		
		if (!socket || !socket.connected) {
			reject(new Error('Socket not connected'));
			return;
		}

		// Set a timeout in case the server doesn't respond
		const timeout = setTimeout(() => {
			reject(new Error('World creation request timed out'));
		}, 60000); // 60 seconds for world generation

		socket.emit('create-world', options, (response: WorldCreationResult) => {
			clearTimeout(timeout);
			
			if (response.success) {
				resolve(response);
			} else {
				reject(new Error(response.error || 'Failed to create world'));
			}
		});
	});
}

/**
 * Request world data from the server
 * 
 * @param request - World data request parameters
 * @returns Promise resolving to world data
 * 
 * @example
 * ```typescript
 * const worldData = await requestWorldData({
 *   worldId: 'world-123',
 *   includeRegions: true  // Optionally include regions list
 * });
 * ```
 */
export function requestWorldData(request: WorldDataRequest): Promise<WorldDataResponse> {
	return new Promise((resolve, reject) => {
		const socket = socketStore.getSocket();
		
		if (!socket?.connected) {
			reject(new Error('Socket not connected'));
			return;
		}

		const timeout = setTimeout(() => {
			reject(new Error('World data request timed out'));
		}, 10000);

		socket.emit('request-world-data', request, (response: WorldDataResponse) => {
			clearTimeout(timeout);
			
			if (response.success) {
				resolve(response);
			} else {
				reject(new Error(response.error || 'Failed to fetch world data'));
			}
		});
	});
}

/**
 * Request region data from the server
 * 
 * @param request - Region data request parameters
 * @returns Promise resolving to region data
 * 
 * @example
 * ```typescript
 * const regionData = await requestRegionData({
 *   regionId: 'region-123',
 *   includeTiles: true  // Optionally include tiles and plots
 * });
 * ```
 */
export function requestRegionData(request: RegionDataRequest): Promise<RegionDataResponse> {
	return new Promise((resolve, reject) => {
		const socket = socketStore.getSocket();
		
		if (!socket?.connected) {
			reject(new Error('Socket not connected'));
			return;
		}

		const timeout = setTimeout(() => {
			reject(new Error('Region data request timed out'));
		}, 10000);

		socket.emit('request-region', request, (response: RegionDataResponse) => {
			clearTimeout(timeout);
			
			if (response.success) {
				resolve(response);
			} else {
				reject(new Error(response.error || 'Failed to fetch region data'));
			}
		});
	});
}

/**
 * Helper to add these functions to the gameSocket object
 */
export const worldSocketActions = {
	createWorld,
	requestWorldData,
	requestRegionData
};
