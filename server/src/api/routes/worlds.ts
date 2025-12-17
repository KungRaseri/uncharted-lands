/**
 * Worlds API Routes
 *
 * CRUD operations for world management
 */

import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';
import { db, worlds, regions, tiles } from '../../db/index.js';
import { authenticate, authenticateAdmin } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { sendServerError, sendNotFoundError, sendBadRequestError } from '../utils/responses.js';
import { createWorld } from '../../game/world-creator.js';
import { startSpan } from '../../utils/sentry.js';
import {
	isValidWorldTemplateType,
	type WorldTemplateType,
	getWorldTemplateConfig,
} from '../../types/world-templates.js';

const router = Router();

/**
 * GET /api/worlds
 * List all worlds with server information
 * Accessible to all authenticated users (needed for settlement creation)
 */
router.get('/', authenticate, async (req, res) => {
	try {
		const allWorlds = await db.query.worlds.findMany({
			with: {
				server: {
					columns: {
						id: true,
						name: true,
						status: true,
					},
				},
				regions: {
					columns: {
						id: true,
					},
				},
			},
			orderBy: (worlds, { desc }) => [desc(worlds.createdAt)],
		});

		res.json(allWorlds);
	} catch (error) {
		sendServerError(res, error, 'Failed to fetch worlds', 'FETCH_FAILED');
	}
});

/**
 * GET /api/worlds/:id
 * Get world details with regions, tiles, and statistics
 * Accessible to all authenticated users
 */
router.get('/:id', authenticate, async (req, res) => {
	try {
		const { id } = req.params;

		// Use Sentry span for database query performance tracking
		const world = await startSpan(
			{
				op: 'db.query',
				name: 'Find World with Details',
				attributes: { worldId: id },
			},
			async (span) => {
				const result = await db.query.worlds.findFirst({
					where: eq(worlds.id, id),
					with: {
						server: true,
						regions: {
							orderBy: (regions, { asc }) => [
								asc(regions.xCoord),
								asc(regions.yCoord),
							],
							with: {
								tiles: {
									// Order tiles by their coordinates (x=row, y=column) to match creation order
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									orderBy: (tilesTable: typeof tiles, { asc }: any) => [
										asc(tilesTable.xCoord),
										asc(tilesTable.yCoord),
									],
									with: {
										biome: true,
										settlement: {
											columns: {
												id: true,
												name: true,
											},
										},
									},
								},
							},
						},
					},
				});

				if (result) {
					span?.setAttribute('regions', result.regions?.length || 0);
				}

				return result;
			}
		);

		if (!world) {
			return sendNotFoundError(res, 'World not found');
		}

		// Calculate statistics
		const stats = calculateWorldStatistics(world.regions || []);

		// Add stats to response
		const worldWithStats = {
			...world,
			_count: stats,
		};

		res.json(worldWithStats);
	} catch (error) {
		sendServerError(res, error, 'Failed to fetch world', 'FETCH_FAILED');
	}
});

/**
 * Helper function to calculate world statistics
 * Extracted to reduce cognitive complexity
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function calculateWorldStatistics(regions: any[]) {
	let landTilesCount = 0;
	let oceanTilesCount = 0;
	const settlementIds = new Set<string>();

	for (const region of regions) {
		const tiles = region.tiles || [];

		// If region has tile records, count them
		if (tiles.length > 0) {
			for (const tile of tiles) {
				const tileStats = processTile(tile);
				landTilesCount += tileStats.landTiles;
				oceanTilesCount += tileStats.oceanTiles;
				for (const id of tileStats.settlementIds) {
					settlementIds.add(id);
				}
			}
		}
		// If region has no tiles but has elevation map, estimate from map data
		else if (region.elevationMap && Array.isArray(region.elevationMap)) {
			// elevationMap is a 10x10 array (2D: [row][col])
			const elevationMap = region.elevationMap;
			for (const row of elevationMap) {
				if (Array.isArray(row)) {
					for (const elevation of row) {
						// Ocean is typically elevation < 0, land is >= 0
						if (elevation < 0) {
							oceanTilesCount++;
						} else {
							landTilesCount++;
						}
					}
				}
			}
		}
	}

	return {
		regions: regions.length,
		settlements: settlementIds.size,
		landTiles: landTilesCount,
		oceanTiles: oceanTilesCount,
	};
}

/**
 * Helper function to process a single tile
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function processTile(tile: any) {
	const landTiles = tile.type === 'LAND' ? 1 : 0;
	const oceanTiles = tile.type === 'OCEAN' ? 1 : 0;
	const settlementIds = new Set<string>();

	// Settlement is now directly on the tile (plot table removed)
	if (tile.settlement?.id) {
		settlementIds.add(tile.settlement.id);
	}

	return { landTiles, oceanTiles, settlementIds };
}

/**
 * POST /api/worlds
 * Create new world with optional bulk regions/tiles/plots
 *
 * Body: {
 *   name: string,
 *   serverId: string,
 *   elevationSettings: object,
 *   precipitationSettings: object,
 *   temperatureSettings: object,
 *   regions?: Region[],  // Optional bulk create
 *   tiles?: Tile[],      // Optional bulk create
 *   plots?: Plot[]       // Optional bulk create
 * }
 */
router.post('/', authenticateAdmin, async (req, res) => {
	const reqLogger = req.logger || logger;
	const startTime = Date.now();

	try {
		const {
			name,
			serverId,
			elevationSettings,
			precipitationSettings,
			temperatureSettings,
			regions: worldRegions,
			tiles: worldTiles,
			// Server-side generation parameters
			generate,
			width,
			height,
			elevationSeed,
			// World template
			worldTemplateType,
		} = req.body;

		reqLogger.info('[WORLD CREATE] Request received', {
			userId: req.user?.id,
			name,
			serverId,
			generate,
			dimensions: generate ? `${width}x${height}` : 'n/a',
		});

		// Validation
		if (!name || !serverId) {
			reqLogger.warn('[WORLD CREATE] Missing required fields', {
				name: !!name,
				serverId: !!serverId,
			});
			return sendBadRequestError(res, 'Missing required fields: name and serverId');
		}

		// Validate world template type if provided
		if (worldTemplateType && !isValidWorldTemplateType(worldTemplateType)) {
			reqLogger.warn('[WORLD CREATE] Invalid world template type', {
				worldTemplateType,
			});
			return sendBadRequestError(
				res,
				'Invalid world template type. Must be one of: SURVIVAL, STANDARD, RELAXED, FANTASY, APOCALYPSE'
			);
		}

		// Server-side generation mode (FULL world with tiles and plots)
		if (generate && width && height) {
			reqLogger.info(`[WORLD CREATE] Starting server-side generation`, {
				name,
				serverId,
				dimensions: `${width}x${height}`,
				estimatedTime: `${Math.round((width * height) / 100)}s`,
			});

			// First, create the world record with 'generating' status
			const templateConfig = worldTemplateType
				? getWorldTemplateConfig(worldTemplateType as WorldTemplateType)
				: getWorldTemplateConfig('STANDARD');

			const [newWorld] = await db
				.insert(worlds)
				.values({
					id: createId(),
					name,
					serverId,
					elevationSettings: elevationSettings || {},
					precipitationSettings: precipitationSettings || {},
					temperatureSettings: temperatureSettings || {},
					worldTemplateType: worldTemplateType || 'STANDARD',
					worldTemplateConfig: templateConfig,
					status: 'generating',
				})
				.returning();

			reqLogger.info(`[WORLD CREATE] World record created`, {
				worldId: newWorld.id,
				name: newWorld.name,
				status: 'generating',
			});

			try {
				reqLogger.startTimer(`world-generation-${newWorld.id}`);

				// Use Sentry span for performance monitoring
				const result = await startSpan(
					{
						op: 'world.generation',
						name: `Generate World: ${name}`,
						attributes: {
							worldId: newWorld.id,
							worldName: name,
							width,
							height,
							totalSize: width * height,
						},
					},
					async (span) => {
						const result = await createWorld({
							serverId,
							worldName: name,
							worldId: newWorld.id, // Pass the existing world ID
							width,
							height,
							seed: elevationSeed || Date.now(),
							elevationOptions: {
								amplitude: elevationSettings?.amplitude || 1,
								persistence: elevationSettings?.persistence || 0.5,
								frequency: elevationSettings?.frequency || 0.05,
								octaves: elevationSettings?.octaves || 8,
								scale: (x: number) => x * (elevationSettings?.scale || 1),
							},
							precipitationOptions: {
								amplitude: precipitationSettings?.amplitude || 1,
								persistence: precipitationSettings?.persistence || 0.5,
								frequency: precipitationSettings?.frequency || 0.05,
								octaves: precipitationSettings?.octaves || 8,
								scale: (x: number) => x * (precipitationSettings?.scale || 1),
							},
							temperatureOptions: {
								amplitude: temperatureSettings?.amplitude || 1,
								persistence: temperatureSettings?.persistence || 0.5,
								frequency: temperatureSettings?.frequency || 0.05,
								octaves: temperatureSettings?.octaves || 8,
								scale: (x: number) => x * (temperatureSettings?.scale || 1),
							},
						});

						// Add metrics to span
						span?.setAttribute('regions', result.regionCount);
						span?.setAttribute('tiles', result.tileCount);

						return result;
					}
				);

				const generationDuration = reqLogger.endTimer(`world-generation-${newWorld.id}`, {
					worldId: newWorld.id,
					regions: result.regionCount,
					tiles: result.tileCount,
				});

				// Update world status to 'ready'
				await db
					.update(worlds)
					.set({ status: 'ready', updatedAt: new Date() })
					.where(eq(worlds.id, newWorld.id));

				reqLogger.info(`[WORLD CREATE] Generation complete`, {
					worldId: result.worldId,
					status: 'ready',
					regions: result.regionCount,
					tiles: result.tileCount,
					duration: generationDuration,
					totalDuration: Date.now() - startTime,
				});

				// Fetch the updated world to return
				const createdWorld = await db.query.worlds.findFirst({
					where: eq(worlds.id, result.worldId),
				});

				return res.status(201).json(createdWorld);
			} catch (error) {
				reqLogger.error('[WORLD CREATE] Generation failed', error, {
					worldId: newWorld.id,
					name: newWorld.name,
					dimensions: `${width}x${height}`,
				});

				// Update world status to 'failed' on error
				await db
					.update(worlds)
					.set({ status: 'failed', updatedAt: new Date() })
					.where(eq(worlds.id, newWorld.id));

				return sendServerError(
					res,
					error,
					'Failed to generate world data',
					'GENERATION_FAILED'
				);
			}
		}

		// Legacy mode: Manual world creation (regions only, no tiles/plots)
		const templateConfig = worldTemplateType
			? getWorldTemplateConfig(worldTemplateType as WorldTemplateType)
			: getWorldTemplateConfig('STANDARD');

		const [newWorld] = await db
			.insert(worlds)
			.values({
				id: createId(),
				name,
				serverId,
				elevationSettings: elevationSettings || {},
				precipitationSettings: precipitationSettings || {},
				temperatureSettings: temperatureSettings || {},
				worldTemplateType: worldTemplateType || 'STANDARD',
				worldTemplateConfig: templateConfig,
				status: 'pending', // Set to pending when not generating immediately
			})
			.returning();

		logger.info(`[API] Created world: ${newWorld.id} - ${newWorld.name}`);

		// Bulk insert regions if provided
		if (worldRegions && Array.isArray(worldRegions) && worldRegions.length > 0) {
			const regionsToInsert = worldRegions.map((r) => ({
				...r,
				id: r.id || createId(),
				worldId: newWorld.id,
			}));
			await db.insert(regions).values(regionsToInsert);
			logger.info(`[API] Created ${regionsToInsert.length} regions for world ${newWorld.id}`);
		}

		// Bulk insert tiles if provided
		if (worldTiles && Array.isArray(worldTiles) && worldTiles.length > 0) {
			await db.insert(tiles).values(worldTiles);
			logger.info(`[API] Created ${worldTiles.length} tiles for world ${newWorld.id}`);
		}

		res.status(201).json(newWorld);
	} catch (error) {
		sendServerError(res, error, 'Failed to create world', 'CREATE_FAILED');
	}
});

/**
 * PUT /api/worlds/:id
 * Update world settings
 */
router.put('/:id', authenticateAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { name, elevationSettings, precipitationSettings, temperatureSettings } = req.body;

		// Check if world exists
		const existing = await db.query.worlds.findFirst({
			where: eq(worlds.id, id),
		});

		if (!existing) {
			return sendNotFoundError(res, 'World not found');
		}

		// Update world
		const [updated] = await db
			.update(worlds)
			.set({
				name: name || existing.name,
				elevationSettings: elevationSettings || existing.elevationSettings,
				precipitationSettings: precipitationSettings || existing.precipitationSettings,
				temperatureSettings: temperatureSettings || existing.temperatureSettings,
				updatedAt: new Date(),
			})
			.where(eq(worlds.id, id))
			.returning();

		logger.info(`[API] Updated world: ${id}`);
		res.json(updated);
	} catch (error) {
		sendServerError(res, error, 'Failed to update world', 'UPDATE_FAILED');
	}
});

/**
 * DELETE /api/worlds/:id
 * Delete world (cascade deletes regions, tiles, plots)
 */
router.delete('/:id', authenticateAdmin, async (req, res) => {
	try {
		const { id } = req.params;

		// Check if world exists
		const existing = await db.query.worlds.findFirst({
			where: eq(worlds.id, id),
		});

		if (!existing) {
			return sendNotFoundError(res, 'World not found');
		}

		// Delete world (cascade will handle related data)
		await db.delete(worlds).where(eq(worlds.id, id));

		logger.info(`[API] Deleted world: ${id} - ${existing.name}`);
		res.json({
			success: true,
			message: `World "${existing.name}" deleted successfully`,
		});
	} catch (error) {
		sendServerError(res, error, 'Failed to delete world', 'DELETE_FAILED');
	}
});

/**
 * POST /api/worlds/:id/generate
 * Start async world generation for an existing world record
 * Updates world status and triggers background generation
 */
router.post('/:id/generate', authenticateAdmin, async (req, res) => {
	try {
		const { id } = req.params;
		const { width, height, seed, elevationOptions, precipitationOptions, temperatureOptions } =
			req.body;

		// Validate required fields
		if (
			!width ||
			!height ||
			!seed ||
			!elevationOptions ||
			!precipitationOptions ||
			!temperatureOptions
		) {
			return sendBadRequestError(res, 'Missing required generation settings');
		}

		// Check if world exists
		const existing = await db.query.worlds.findFirst({
			where: eq(worlds.id, id),
		});

		if (!existing) {
			return sendNotFoundError(res, 'World not found');
		}

		// Update world status to 'generating'
		await db
			.update(worlds)
			.set({
				status: 'generating',
				updatedAt: new Date(),
			})
			.where(eq(worlds.id, id));

		logger.info(`[API] Starting generation for world: ${id} - ${existing.name}`);

		// Start async generation (don't await - fire and forget)
		// This runs in the background and updates status when complete
		generateWorldInBackground(id, existing.name, existing.serverId, {
			width,
			height,
			seed,
			elevationOptions,
			precipitationOptions,
			temperatureOptions,
		}).catch((error) => {
			logger.error(`[API] Background generation failed for world ${id}:`, error);
			// Update status to failed
			db.update(worlds)
				.set({
					status: 'failed',
					updatedAt: new Date(),
				})
				.where(eq(worlds.id, id))
				.catch((updateError) => {
					logger.error(`[API] Failed to update world status to failed:`, updateError);
				});
		});

		// Return immediately - client will poll for status
		res.json({
			success: true,
			message: 'World generation started',
			status: 'generating',
		});
	} catch (error) {
		sendServerError(res, error, 'Failed to start world generation', 'GENERATE_FAILED');
	}
});

/**
 * Background world generation process
 * Runs asynchronously and updates world status when complete
 */
async function generateWorldInBackground(
	worldId: string,
	worldName: string,
	serverId: string | null,
	settings: {
		width: number;
		height: number;
		seed: number;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		elevationOptions: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		precipitationOptions: any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		temperatureOptions: any;
	}
) {
	try {
		logger.info(`[BACKGROUND] Starting generation for world ${worldId}`);

		// Transform options to ensure scale is a function
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const transformOptions = (opts: any) => ({
			amplitude: opts.amplitude || 1,
			persistence: opts.persistence || 0.5,
			frequency: opts.frequency || 0.05,
			octaves: opts.octaves || 8,
			scale:
				typeof opts.scale === 'function'
					? opts.scale
					: (x: number) => x * (opts.scale || 1),
		});

		// Call createWorld with the existing worldId
		await createWorld({
			serverId,
			worldName,
			worldId, // Pass existing ID so it doesn't create a new world record
			width: settings.width,
			height: settings.height,
			seed: settings.seed,
			elevationOptions: transformOptions(settings.elevationOptions),
			precipitationOptions: transformOptions(settings.precipitationOptions),
			temperatureOptions: transformOptions(settings.temperatureOptions),
		});

		// Update world status to 'ready'
		await db
			.update(worlds)
			.set({
				status: 'ready',
				updatedAt: new Date(),
			})
			.where(eq(worlds.id, worldId));

		logger.info(`[BACKGROUND] Successfully generated world ${worldId}`);
	} catch (error) {
		logger.error(`[BACKGROUND] Generation failed for world ${worldId}:`, error);

		// Update world status to 'failed'
		await db
			.update(worlds)
			.set({
				status: 'failed',
				updatedAt: new Date(),
			})
			.where(eq(worlds.id, worldId));

		throw error; // Re-throw so the caller's catch block can log it
	}
}

export default router;
