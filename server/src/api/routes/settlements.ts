import { Router } from 'express';
import { db } from '../../db/index.js';
import {
	settlements,
	settlementStorage,
	settlementPopulation,
	settlementStructures,
	structureModifiers,
	profiles,
	profileServerData,
	tiles,
	disasterHistory,
} from '../../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { MODIFIER_NAMES } from '../../game/modifier-names.js';

const router = Router();

/**
 * GET /api/settlements
 * Get all settlements (with optional player filter)
 */
router.get('/', async (req, res) => {
	try {
		const { playerProfileId } = req.query;

		// Build the query
		const result = await db.query.settlements.findMany({
			where: playerProfileId
				? eq(settlements.playerProfileId, playerProfileId as string)
				: undefined,
			with: {
				tile: {
					with: {
						biome: true,
						region: {
							with: {
								world: {
									with: {
										server: true,
									},
								},
							},
						},
					},
				},
				structures: true,
				storage: true,
			},
		});

		res.json(result);
	} catch (error) {
		logger.error('[API] Error fetching settlements', error);
		res.status(500).json({ error: 'Failed to fetch settlements' });
	}
});

/**
 * GET /api/settlements/:id
 * Get a specific settlement by ID
 */
router.get('/:id', async (req, res) => {
	try {
		const { id } = req.params;

		const settlement = await db.query.settlements.findFirst({
			where: eq(settlements.id, id),
			with: {
				tile: {
					with: {
						biome: true,
						region: true,
					},
				},
				structures: {
					with: {
						structure: true,
						modifiers: true,
					},
				},
				storage: true,
				population: true,
			},
		});

		if (!settlement) {
			return res.status(404).json({ error: 'Settlement not found' });
		}

		// Ensure structures array exists (Drizzle might omit it if empty)
		if (!settlement.structures) {
			settlement.structures = [];
		}

		// Ensure each structure has a modifiers array
		settlement.structures = settlement.structures.map(
			(structure: { modifiers?: unknown[] }) => ({
				...structure,
				modifiers: structure.modifiers || [],
			})
		);

		res.json(settlement);
	} catch (error) {
		logger.error('[API] Error fetching settlement', error);
		res.status(500).json({ error: 'Failed to fetch settlement' });
	}
});

/**
 * GET /api/settlements/:id/disaster-history
 * Get disaster history for a specific settlement
 * Returns array of past disasters with impact details
 *
 * Response: DisasterHistory[] - Array of disaster records
 */
router.get('/:id/disaster-history', authenticate, async (req, res) => {
	try {
		const { id } = req.params;

		// Step 1: Verify settlement exists and get owner info
		const settlement = await db.query.settlements.findFirst({
			where: eq(settlements.id, id),
			columns: {
				id: true,
				playerProfileId: true,
			},
		});

		if (!settlement) {
			return res.status(404).json({ error: 'Settlement not found' });
		}

		// Step 2: Verify ownership (settlement.playerProfileId must match req.user.profileId)
		if (!req.user || settlement.playerProfileId !== req.user.profileId) {
			return res.status(403).json({
				error: 'Forbidden: You do not own this settlement',
				code: 'NOT_OWNER',
			});
		}

		// Step 3: Query disaster history with disaster event details
		const history = await db.query.disasterHistory.findMany({
			where: eq(disasterHistory.settlementId, id),
			with: {
				disaster: true, // Include disaster event details (type, severity, etc.)
			},
			orderBy: desc(disasterHistory.timestamp),
			limit: 50, // Last 50 disasters
		});

		// Step 4: Transform to match client DisasterHistory interface
		const transformedHistory = history.map((record) => {
			// Type assertion for disaster record (Drizzle returns union type)
			const disaster = record.disaster as {
				type: string;
				severity: number;
				severityLevel: string;
			};

			return {
				id: record.id,
				disasterId: record.disasterId,
				settlementId: record.settlementId,

				// Disaster properties from related disasterEvent
				type: disaster.type,
				severity: disaster.severity,
				severityLevel: disaster.severityLevel,

				// Impact data
				casualties: record.casualties,
				structuresDamaged: record.structuresDamaged,
				structuresDestroyed: record.structuresDestroyed,
				resourcesLost: record.resourcesLost || {
					food: 0,
					water: 0,
					wood: 0,
					stone: 0,
					ore: 0,
				},

				// Recovery
				resilienceGained: record.resilienceGained,

				// Timestamp
				timestamp: record.timestamp,
			};
		});

		res.json(transformedHistory);
	} catch (error) {
		logger.error('[API] Error fetching disaster history', error);
		res.status(500).json({ error: 'Failed to fetch disaster history' });
	}
});

/**
 * GET /api/settlements/aggregate
 * Get aggregated resources and stats across all player settlements
 *
 * Auth: Requires authentication
 * Response: {
 *   totalResources: { food, water, wood, stone, ore },
 *   totalPopulation: number,
 *   totalCapacity: number,
 *   settlementCount: number,
 *   settlements: Array<{ id, name, resources, population, capacity }>
 * }
 */
router.get('/aggregate', authenticate, async (req, res) => {
	try {
		if (!req.user || !req.user.profileId) {
			return res.status(401).json({ error: 'Unauthorized: No profile found' });
		}

		const playerProfileId = req.user.profileId;

		// Query all settlements for this player with storage and population
		const playerSettlements = await db.query.settlements.findMany({
			where: eq(settlements.playerProfileId, playerProfileId),
			with: {
				storage: true,
				population: true,
			},
		});

		// Calculate aggregates
		const totalResources = {
			food: 0,
			water: 0,
			wood: 0,
			stone: 0,
			ore: 0,
		};

		let totalPopulation = 0;
		let totalCapacity = 0;

		const settlementDetails = playerSettlements.map((settlement) => {
			// Aggregate resources
			if (settlement.storage) {
				totalResources.food += settlement.storage.food;
				totalResources.water += settlement.storage.water;
				totalResources.wood += settlement.storage.wood;
				totalResources.stone += settlement.storage.stone;
				totalResources.ore += settlement.storage.ore;
			}

			// Aggregate population
			const currentPopulation = settlement.population?.currentPopulation || 0;
			totalPopulation += currentPopulation;

			// Area capacity used as housing capacity proxy
			totalCapacity += settlement.areaCapacity;

			return {
				id: settlement.id,
				name: settlement.name,
				resources: settlement.storage
					? {
							food: settlement.storage.food,
							water: settlement.storage.water,
							wood: settlement.storage.wood,
							stone: settlement.storage.stone,
							ore: settlement.storage.ore,
						}
					: totalResources,
				population: currentPopulation,
				capacity: settlement.areaCapacity,
			};
		});

		const aggregateData = {
			totalResources,
			totalPopulation,
			totalCapacity,
			settlementCount: playerSettlements.length,
			settlements: settlementDetails,
		};

		res.json(aggregateData);
	} catch (error) {
		logger.error('[API] Error fetching aggregate settlements data', error);
		res.status(500).json({ error: 'Failed to fetch aggregate data' });
	}
});

/**
 * POST /api/settlements
 * Create a new settlement with profile and storage
 *
 * Body: {
 *   username: string,
 *   serverId: string,
 *   worldId: string,
 *   accountId: string,
 *   picture?: string
 * }
 */
router.post('/', authenticate, async (req, res) => {
	try {
		const { username, serverId, worldId, accountId, picture } = req.body;

		// Validate required fields
		if (!username || !serverId || !worldId || !accountId) {
			return res.status(400).json({
				error: 'Missing required fields',
				required: ['username', 'serverId', 'worldId', 'accountId'],
			});
		}

		// Step 1: Find a suitable starting TILE (settlements claim tiles, not plots)
		logger.info(`[SETTLEMENT CREATE] Finding suitable tile for world ${worldId}`);

		// SCHEMA NOTE: Tiles don't have worldId directly, must query through regions
		// First, get all regions in this world
		const worldRegions = await db.query.regions.findMany({
			where: (regions, { eq }) => eq(regions.worldId, worldId),
			columns: { id: true },
		});

		const regionIds = worldRegions.map((r) => r.id);
		logger.info(`[SETTLEMENT CREATE] Found ${regionIds.length} regions in world ${worldId}`);

		if (regionIds.length === 0) {
			return res.status(404).json({
				error: 'World has no regions',
				code: 'NO_REGIONS',
			});
		}

		// Query unclaimed tiles in this world's regions
		const suitableTiles = await db.query.tiles.findMany({
			where: (tiles, { inArray, and, isNull }) =>
				and(
					inArray(tiles.regionId, regionIds), // In this world
					isNull(tiles.settlementId) // Not already claimed
				),
			with: {
				region: true, // Include region for debugging
			},
			limit: 1000, // Get a large sample of tiles
		});

		// DEBUG: Log sample tiles
		logger.info(
			`[SETTLEMENT CREATE] Found ${suitableTiles.length} unclaimed tiles in world, analyzing first 3...`
		);
		for (let i = 0; i < Math.min(3, suitableTiles.length); i++) {
			const tile = suitableTiles[i];
			logger.info(
				`[SETTLEMENT CREATE] Tile ${i}: regionWorldId=${tile.region?.worldId}, elevation=${tile.elevation}, precipitation=${tile.precipitation}, temperature=${tile.temperature}`
			);
		}

		// Filter for tiles with suitable terrain for settlement
		// Per GDD: elevation is -100 to 100, precipitation 0-100, temperature -50 to 50
		let viableTiles = suitableTiles.filter(
			(tile) =>
				(tile.elevation ?? -101) > 0 && // Land (elevation > 0, ocean is <= 0)
				(tile.elevation ?? 101) < 80 && // Not too mountainous (< 80 out of 100)
				(tile.precipitation ?? 0) >= 20 && // Some rainfall for crops
				(tile.temperature ?? -100) > -20 && // Not frozen tundra
				(tile.foodQuality ?? 0) >= 40 && // Good food production potential
				(tile.waterQuality ?? 0) >= 40 // Good water access
		);

		logger.info(
			`[SETTLEMENT CREATE] Found ${viableTiles.length} ideal tiles (worldId=${worldId})`
		);

		// Fallback if no ideal tiles
		if (viableTiles.length === 0) {
			logger.warn(
				'[SETTLEMENT CREATE] No ideal tiles, using relaxed criteria (food/water >= 20)'
			);
			viableTiles = suitableTiles.filter(
				(tile) =>
					(tile.elevation ?? -101) > 0 && // Must still be land (elevation > 0)
					(tile.foodQuality ?? 0) >= 20 && // Minimum food potential
					(tile.waterQuality ?? 0) >= 20 // Minimum water access
			);
			logger.info(`[SETTLEMENT CREATE] Found ${viableTiles.length} relaxed tiles`);
		}

		// Final fallback - just land
		if (viableTiles.length === 0) {
			logger.warn('[SETTLEMENT CREATE] No suitable tiles with resources, using any land');
			viableTiles = suitableTiles.filter(
				(tile) => (tile.elevation ?? -101) > 0 // Must be land
			);
			logger.info(`[SETTLEMENT CREATE] Found ${viableTiles.length} fallback tiles`);
		}

		if (viableTiles.length === 0) {
			return res.status(404).json({
				error: 'No viable tiles for settlement found',
				code: 'NO_SUITABLE_TILES',
			});
		}

		// Pick a random tile
		const chosenTile = viableTiles[Math.floor(Math.random() * viableTiles.length)];

		logger.info(`[SETTLEMENT CREATE] Chosen tile ${chosenTile.id}`, {
			elevation: chosenTile.elevation,
			precipitation: chosenTile.precipitation,
			temperature: chosenTile.temperature,
			foodQuality: chosenTile.foodQuality,
			waterQuality: chosenTile.waterQuality,
			woodQuality: chosenTile.woodQuality,
			stoneQuality: chosenTile.stoneQuality,
			oreQuality: chosenTile.oreQuality,
		});

		// Step 2: Get or create profile
		// PRODUCTION BUG #8 FIX: Check if profile exists before creating
		let existingProfile = await db.query.profiles.findFirst({
			where: (profiles, { eq }) => eq(profiles.accountId, accountId),
		});

		let profileId: string;
		if (existingProfile) {
			profileId = existingProfile.id;
			logger.info(
				`[SETTLEMENT CREATE] Using existing profile ${profileId} for account ${accountId}`
			);
		} else {
			profileId = createId();
			await db.insert(profiles).values({
				id: profileId,
				username,
				picture:
					picture ||
					`https://via.placeholder.com/128x128?text=${username.charAt(0).toUpperCase()}`,
				accountId,
			});
			logger.info(`[SETTLEMENT CREATE] Created new profile ${profileId} for ${username}`);
		}

		// Step 3: Create profile-server data (only if doesn't exist)
		const existingProfileServerData = await db.query.profileServerData.findFirst({
			where: and(
				eq(profileServerData.profileId, profileId),
				eq(profileServerData.serverId, serverId)
			),
		});

		if (!existingProfileServerData) {
			await db.insert(profileServerData).values({
				profileId,
				serverId,
			});
			logger.info(
				`[SETTLEMENT CREATE] Created ProfileServerData for profile ${profileId} on server ${serverId}`
			);
		} else {
			logger.info(
				`[SETTLEMENT CREATE] ProfileServerData already exists for profile ${profileId} on server ${serverId}`
			);
		}

		// Step 4: Create settlement ON THE TILE (not on a plot!)
		const settlementId = createId();
		await db.insert(settlements).values({
			id: settlementId,
			name: 'Home Settlement',
			tileId: chosenTile.id, // Settlement claims the TILE
			playerProfileId: profileId,
		});

		logger.info(
			`[SETTLEMENT CREATE] Created settlement ${settlementId} for profile ${profileId} on tile ${chosenTile.id}`
		);

		// Step 5: Create storage with starting resources (per GDD specification)
		const storageId = createId();
		await db.insert(settlementStorage).values({
			id: storageId,
			settlementId, // Link to settlement
			food: 50, // ~2.5 hours for 10 population at GDD rates
			water: 100, // ~2.5 hours for 10 population
			wood: 50, // Can build 2 FARMs (20 wood each) or 5 TENTs (10 wood each)
			stone: 30, // Can build 3 FARMs (10 stone each) or other structures
			ore: 10, // Per GDD spec - starting ore for basic tools/equipment
		});

		logger.info(
			`[SETTLEMENT CREATE] Created storage ${storageId} for settlement ${settlementId}`
		);

		// Step 6: Update Tile.settlementId to point back to settlement (bidirectional FK)
		await db.update(tiles).set({ settlementId }).where(eq(tiles.id, chosenTile.id));

		logger.info(
			`[SETTLEMENT CREATE] Updated tile ${chosenTile.id} settlementId to ${settlementId}`
		);

		// Step 7: Create starting TENT structure on tile slot 0
		// First, look up the master "Tent" structure definition
		const tentMaster = await db.query.structures.findFirst({
			where: (structures, { eq }) => eq(structures.name, 'Tent'),
		});

		if (!tentMaster) {
			return res.status(500).json({
				error: 'Master TENT structure not found in database',
				code: 'MISSING_MASTER_STRUCTURE',
			});
		}

		const tentId = createId();
		await db.insert(settlementStructures).values({
			id: tentId,
			structureId: tentMaster.id, // FK to master structure definition
			settlementId: settlementId,
			tileId: chosenTile.id, // Structure built ON TILE
			slotPosition: 0, // First slot (0-4 available)
			level: 1,
		});

		logger.info(
			`[SETTLEMENT CREATE] Created starting TENT structure ${tentId} on tile ${chosenTile.id} slot 0`
		);

		// Step 9: Create structure modifier for TENT (+2 population capacity per GDD spec)
		const tentModifierId = createId();
		await db.insert(structureModifiers).values({
			id: tentModifierId,
			settlementStructureId: tentId,
			name: MODIFIER_NAMES.POPULATION_CAPACITY,
			description: 'Provides shelter for 2 people',
			value: 2,
		});

		logger.info(
			`[SETTLEMENT CREATE] Created TENT modifier ${tentModifierId} (+2 population capacity)`
		);

		// Step 10: Create starting population (GDD BLOCKER 1 - starting population > 0)
		const populationId = createId();
		await db.insert(settlementPopulation).values({
			id: populationId,
			settlementId: settlementId,
			currentPopulation: 10, // GDD spec: settlements start with population
			happiness: 50, // Neutral starting happiness
		});

		logger.info(
			`[SETTLEMENT CREATE] Created population record ${populationId} (current: 10, happiness: 50)`
		);

		// Fetch and return the complete settlement
		const newSettlement = await db.query.settlements.findFirst({
			where: eq(settlements.id, settlementId),
			with: {
				tile: {
					with: {
						biome: true,
						region: {
							with: {
								world: true,
							},
						},
					},
				},
				storage: true,
				population: true, // Include population in response
				playerProfile: true,
			},
		});

		res.status(201).json(newSettlement);
	} catch (error) {
		logger.error('[SETTLEMENT CREATE] Error:', error);

		// Handle unique constraint violations
		if (error instanceof Error && error.message.includes('unique')) {
			return res.status(409).json({
				error: 'Username already taken or account already has a profile',
				code: 'DUPLICATE_ENTRY',
			});
		}

		res.status(500).json({ error: 'Failed to create settlement' });
	}
});

/**
 * GET /api/settlements/:id/modifiers
 *
 * Get aggregated modifiers for a settlement (Phase 4).
 *
 * Returns pre-calculated modifier totals from the settlement_modifiers table.
 * Much faster than calculating on-the-fly.
 *
 * Response:
 * {
 *   modifiers: [
 *     {
 *       id: string,
 *       modifierType: string,
 *       totalValue: string,
 *       sourceCount: number,
 *       contributingStructures: Array<{
 *         structureId: string,
 *         structureName: string,
 *         level: number,
 *         value: number
 *       }>,
 *       lastCalculatedAt: Date
 *     }
 *   ]
 * }
 */
router.get('/:id/modifiers', async (req, res) => {
	try {
		const { id } = req.params;

		// Import aggregator function
		const { getSettlementModifiers } =
			await import('../../game/settlement-modifier-aggregator.js');

		// Get aggregated modifiers
		const modifiers = await getSettlementModifiers(id);

		res.json({ modifiers });
	} catch (error) {
		logger.error('Failed to get settlement modifiers', {
			settlementId: req.params.id,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		res.status(500).json({ error: 'Failed to get settlement modifiers' });
	}
});

/**
 * POST /api/settlements/:id/modifiers/recalculate
 *
 * Force recalculation of settlement modifiers (Phase 4).
 *
 * Triggers aggregation of all modifiers from structures and stores results.
 * Use after structure create/upgrade/delete (automatically triggered),
 * or manually for admin/debugging purposes.
 *
 * Response:
 * {
 *   success: true,
 *   modifierCount: number,
 *   modifiers: SettlementModifier[]
 * }
 */
router.post('/:id/modifiers/recalculate', async (req, res) => {
	try {
		const { id } = req.params;

		// Verify settlement exists
		const settlement = await db.query.settlements.findFirst({
			where: eq(settlements.id, id),
		});

		if (!settlement) {
			return res.status(404).json({ error: 'Settlement not found' });
		}

		// Import aggregator function
		const { aggregateSettlementModifiers } =
			await import('../../game/settlement-modifier-aggregator.js');

		// Recalculate modifiers
		const modifiers = await aggregateSettlementModifiers(id);

		logger.info('Settlement modifiers recalculated', {
			settlementId: id,
			modifierCount: modifiers.length,
		});

		res.json({
			success: true,
			modifierCount: modifiers.length,
			modifiers,
		});
	} catch (error) {
		logger.error('Failed to recalculate settlement modifiers', {
			settlementId: req.params.id,
			error: error instanceof Error ? error.message : 'Unknown error',
		});
		res.status(500).json({ error: 'Failed to recalculate settlement modifiers' });
	}
});

export default router;
