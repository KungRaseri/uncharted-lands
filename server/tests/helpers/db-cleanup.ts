/**
 * Database Cleanup Utilities for Tests
 *
 * Provides utilities to clean up test data and ensure tests don't leave
 * orphaned records in the database.
 */

import { db } from '../../src/db/index.js';
import {
	accounts,
	profiles,
	servers,
	worlds,
	regions,
	tiles,
	plots,
	settlements,
	settlementStorage,
	settlementStructures,
	structureModifiers,
	profileServerData,
} from '../../src/db/schema.js';
import { eq, inArray } from 'drizzle-orm';

/**
 * Track test data created during tests for automatic cleanup
 */
export class TestDataTracker {
	private accountIds: string[] = [];
	private profileIds: string[] = [];
	private serverIds: string[] = [];
	private worldIds: string[] = [];
	private regionIds: string[] = [];
	private tileIds: string[] = [];
	private plotIds: string[] = [];
	private settlementIds: string[] = [];
	private storageIds: string[] = [];
	private structureIds: string[] = [];

	/**
	 * Track a created account ID for cleanup
	 */
	trackAccount(id: string): void {
		this.accountIds.push(id);
	}

	/**
	 * Track a created profile ID for cleanup
	 */
	trackProfile(id: string): void {
		this.profileIds.push(id);
	}

	/**
	 * Track a created server ID for cleanup
	 */
	trackServer(id: string): void {
		this.serverIds.push(id);
	}

	/**
	 * Track a created world ID for cleanup
	 */
	trackWorld(id: string): void {
		this.worldIds.push(id);
	}

	/**
	 * Track a created region ID for cleanup
	 */
	trackRegion(id: string): void {
		this.regionIds.push(id);
	}

	/**
	 * Track a created tile ID for cleanup
	 */
	trackTile(id: string): void {
		this.tileIds.push(id);
	}

	/**
	 * Track a created plot ID for cleanup
	 */
	trackPlot(id: string): void {
		this.plotIds.push(id);
	}

	/**
	 * Track a created settlement ID for cleanup
	 */
	trackSettlement(id: string): void {
		this.settlementIds.push(id);
	}

	/**
	 * Track a created storage ID for cleanup
	 */
	trackStorage(id: string): void {
		this.storageIds.push(id);
	}

	/**
	 * Track a created structure ID for cleanup
	 */
	trackStructure(id: string): void {
		this.structureIds.push(id);
	}

	/**
	 * Clean up all tracked test data in the correct order (respecting FK constraints)
	 */
	async cleanup(): Promise<void> {
		try {
			// Delete in reverse order of dependencies

			// 1. Structure-related tables
			if (this.structureIds.length > 0) {
				await db
					.delete(structureModifiers)
					.where(inArray(structureModifiers.settlementStructureId, this.structureIds));
				// Structure requirements are cascaded when structure is deleted
				await db
					.delete(settlementStructures)
					.where(inArray(settlementStructures.id, this.structureIds));
			}

			// 2. Settlements
			if (this.settlementIds.length > 0) {
				await db.delete(settlements).where(inArray(settlements.id, this.settlementIds));
			}

			// 3. Settlement storage
			if (this.storageIds.length > 0) {
				await db.delete(settlementStorage).where(inArray(settlementStorage.id, this.storageIds));
			}

			// 4. Plots
			if (this.plotIds.length > 0) {
				await db.delete(plots).where(inArray(plots.id, this.plotIds));
			}

			// 5. Tiles
			if (this.tileIds.length > 0) {
				await db.delete(tiles).where(inArray(tiles.id, this.tileIds));
			}

			// 6. Regions
			if (this.regionIds.length > 0) {
				await db.delete(regions).where(inArray(regions.id, this.regionIds));
			}

			// 7. Worlds
			if (this.worldIds.length > 0) {
				await db.delete(worlds).where(inArray(worlds.id, this.worldIds));
			}

			// 8. Servers
			if (this.serverIds.length > 0) {
				await db.delete(servers).where(inArray(servers.id, this.serverIds));
			}

			// 9. Profile server data
			if (this.profileIds.length > 0) {
				await db
					.delete(profileServerData)
					.where(inArray(profileServerData.profileId, this.profileIds));
			}

			// 10. Profiles
			if (this.profileIds.length > 0) {
				await db.delete(profiles).where(inArray(profiles.id, this.profileIds));
			}

			// 11. Accounts (last, as profiles depend on them)
			if (this.accountIds.length > 0) {
				await db.delete(accounts).where(inArray(accounts.id, this.accountIds));
			}

			// Clear all tracking arrays
			this.reset();
		} catch (error) {
			console.error('Error during test data cleanup:', error);
			throw error;
		}
	}

	/**
	 * Reset all tracked IDs without cleanup (use when cleanup already handled manually)
	 */
	reset(): void {
		this.accountIds = [];
		this.profileIds = [];
		this.serverIds = [];
		this.worldIds = [];
		this.regionIds = [];
		this.tileIds = [];
		this.plotIds = [];
		this.settlementIds = [];
		this.storageIds = [];
		this.structureIds = [];
	}

	/**
	 * Get count of tracked entities for debugging
	 */
	getTrackedCounts(): Record<string, number> {
		return {
			accounts: this.accountIds.length,
			profiles: this.profileIds.length,
			servers: this.serverIds.length,
			worlds: this.worldIds.length,
			regions: this.regionIds.length,
			tiles: this.tileIds.length,
			settlements: this.settlementIds.length,
			storage: this.storageIds.length,
			structures: this.structureIds.length,
		};
	}
}

/**
 * Clean up test data by specific entity ID
 * Useful for cleanup in afterEach/afterAll hooks
 */
export async function cleanupAccount(accountId: string): Promise<void> {
	// Delete related data first
	const profile = await db.query.profiles.findFirst({
		where: eq(profiles.accountId, accountId),
	});

	if (profile) {
		await cleanupProfile(profile.id);
	}

	// Delete account
	await db.delete(accounts).where(eq(accounts.id, accountId));
}

export async function cleanupProfile(profileId: string): Promise<void> {
	// Delete settlements first
	const settlementList = await db.query.settlements.findMany({
		where: eq(settlements.playerProfileId, profileId),
	});

	for (const settlement of settlementList) {
		await cleanupSettlement(settlement.id);
	}

	// Delete profile server data
	await db.delete(profileServerData).where(eq(profileServerData.profileId, profileId));

	// Delete profile
	await db.delete(profiles).where(eq(profiles.id, profileId));
}

export async function cleanupServer(serverId: string): Promise<void> {
	// Delete worlds first (FK constraint)
	const worldList = await db.query.worlds.findMany({
		where: eq(worlds.serverId, serverId),
	});

	for (const world of worldList) {
		await cleanupWorld(world.id);
	}

	// Delete server
	await db.delete(servers).where(eq(servers.id, serverId));
}

export async function cleanupWorld(worldId: string): Promise<void> {
	// Delete regions first (FK constraint)
	const regionList = await db.query.regions.findMany({
		where: eq(regions.worldId, worldId),
	});

	for (const region of regionList) {
		await cleanupRegion(region.id);
	}

	// Delete world
	await db.delete(worlds).where(eq(worlds.id, worldId));
}

export async function cleanupRegion(regionId: string): Promise<void> {
	// Delete tiles first (FK constraint)
	const tileList = await db.query.tiles.findMany({
		where: eq(tiles.regionId, regionId),
	});

	for (const tile of tileList) {
		await cleanupTile(tile.id);
	}

	// Delete region
	await db.delete(regions).where(eq(regions.id, regionId));
}

export async function cleanupTile(tileId: string): Promise<void> {
	// Delete plots first (FK constraint)
	await db.delete(plots).where(eq(plots.tileId, tileId));

	// Delete tile
	await db.delete(tiles).where(eq(tiles.id, tileId));
}

export async function cleanupSettlement(settlementId: string): Promise<void> {
	// Delete structures first
	const structureList = await db.query.settlementStructures.findMany({
		where: eq(settlementStructures.settlementId, settlementId),
	});

	for (const structure of structureList) {
		await cleanupStructure(structure.id);
	}

	// Get settlement to find storage ID
	const settlement = await db.query.settlements.findFirst({
		where: eq(settlements.id, settlementId),
	});

	// Delete settlement
	await db.delete(settlements).where(eq(settlements.id, settlementId));

	// Delete storage if exists
	if (settlement?.settlementStorageId) {
		await db
			.delete(settlementStorage)
			.where(eq(settlementStorage.id, settlement.settlementStorageId));
	}
}

export async function cleanupStructure(structureId: string): Promise<void> {
	// Delete modifiers first (requirements are cascaded)
	await db
		.delete(structureModifiers)
		.where(eq(structureModifiers.settlementStructureId, structureId));

	// Delete structure (this will cascade delete requirements)
	await db.delete(settlementStructures).where(eq(settlementStructures.id, structureId));
}

/**
 * Clean up all test data matching a pattern (e.g., all test servers created with specific naming)
 */
export async function cleanupByPattern(
	table: 'servers' | 'worlds' | 'accounts',
	pattern: string
): Promise<void> {
	// This is a helper for cleaning up data by name pattern
	// WARNING: Use with caution in tests only
	console.warn(`Cleaning up ${table} matching pattern: ${pattern}`);

	// Implementation would depend on the table and pattern
	// For now, this is a placeholder for future enhancement
}
