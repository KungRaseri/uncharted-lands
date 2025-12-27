/**
 * Structure Management API Routes
 *
 * Handles settlement building operations:
 * - Building settlement structures (non-extractors)
 * - Upgrading structures
 * - Viewing structure details
 */

import { Router, Request, Response } from 'express';
import { eq, and, or, sql } from 'drizzle-orm';
import {
	db,
	settlementStructures,
	settlements,
	structures,
	tiles,
	constructionQueue,
} from '../../db/index.js';
import { STRUCTURE_COSTS } from '../../data/structure-costs.js';
import type { Structure, Settlement } from '../../db/schema.js';
import { authenticate } from '../middleware/auth.js';
import { logger } from '../../utils/logger.js';
import { createId } from '@paralleldrive/cuid2';
import {
	validateAndDeductResources,
	type ValidationResult,
} from '../../game/structure-validation.js';
import {
	calculateStructureModifiers,
	getPrerequisitesForStructure,
	validatePrerequisites,
} from '../../game/modifier-calculator.js';
import { validateBuildingPlacement } from '../../utils/building-validator.js';
import { updateSettlementAreaUsage } from '../../utils/area-calculator.js';

const router = Router();

/**
 * Server-side cache for structure metadata
 * Phase 3: Add 5-minute cache to reduce database queries
 */
interface MetadataCache {
	data: unknown[];
	timestamp: number;
}

let metadataCache: MetadataCache | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * GET /api/structures/metadata
 * Get all structure definitions (costs, requirements, modifiers)
 * Returns database IDs (CUIDs) for use in create structure endpoint
 * Must come before /:id route to avoid route collision
 *
 * Phase 3: Added server-side caching (5 min) and dynamic modifier calculation
 */
router.get('/metadata', async (req: Request, res: Response) => {
	try {
		// Check cache first
		const now = Date.now();
		if (metadataCache && now - metadataCache.timestamp < CACHE_DURATION_MS) {
			logger.debug('[API] Returning cached structure metadata');
			return res.json({
				success: true,
				data: metadataCache.data,
				cached: true,
				cacheAge: Math.floor((now - metadataCache.timestamp) / 1000), // seconds
				timestamp: now,
			});
		}

		// Cache miss - fetch from database
		logger.debug('[API] Cache miss - fetching structure metadata from database');

		// Get structure definitions from database (with CUIDs)
		const dbStructures = await db.query.structures.findMany({
			with: {
				requirements: {
					with: {
						resource: true, // Join to get resource names
					},
				},
			},
		});

		// Map to include modifiers and prerequisites
		const metadata = dbStructures
			.map((dbStructure) => {
				// Skip structures without proper type definition
				const structureType = dbStructure.extractorType || dbStructure.buildingType;
				if (!structureType) {
					logger.warn(
						`[API] Structure missing type: ${dbStructure.name} (id: ${dbStructure.id})`
					);
					return null;
				}

				// ✅ Phase 3: Calculate modifiers dynamically at level 1 (NOT from database)
				const modifiers = calculateStructureModifiers(dbStructure.name, 1);

				// ✅ Phase 3: Add prerequisites from config
				const prerequisites = getPrerequisitesForStructure(dbStructure.name);

				// ✅ Phase 3 Complete: Build costs from StructureRequirement join table
				const costs: Record<string, number> = {};
				for (const req of dbStructure.requirements) {
					costs[req.resource.name] = req.quantity;
				}

				// ✅ Phase 3 Complete: Use database fields directly (no hardcoded imports)
				return {
					id: dbStructure.id, // ✅ Database CUID, not hardcoded string
					name: structureType,
					displayName: dbStructure.displayName, // ✅ From database
					description: dbStructure.description,
					category: dbStructure.category,
					extractorType: dbStructure.extractorType,
					buildingType: dbStructure.buildingType,
					tier: dbStructure.tier, // ✅ From database
					costs, // ✅ From database (StructureRequirement join)
					constructionTimeSeconds: dbStructure.constructionTimeSeconds, // ✅ From database
					populationRequired: dbStructure.populationRequired, // ✅ From database
					// ✅ Building Area System: Include area constraints
					areaCost: dbStructure.areaCost ?? 0, // Area consumed (0 for extractors)
					unique: dbStructure.unique ?? false, // Can only build one per settlement
					minTownHallLevel: dbStructure.minTownHallLevel ?? 0, // Minimum TH level required
					modifiers, // ✅ Phase 3: Calculated modifiers (config-based)
					prerequisites, // ✅ Phase 3: Config-based prerequisites
				};
			})
			.filter((item) => item !== null); // Remove nulls (defensive)

		// Update cache
		metadataCache = {
			data: metadata,
			timestamp: now,
		};

		logger.debug(`[API] Cached ${metadata.length} structure definitions`);

		return res.json({
			success: true,
			data: metadata,
			cached: false,
			timestamp: now,
		});
	} catch (error) {
		logger.error('[API] Failed to fetch structure metadata', { error });
		return res.status(500).json({
			success: false,
			error: 'Internal Server Error',
			code: 'METADATA_FETCH_FAILED',
			message: 'Failed to fetch structure metadata',
		});
	}
});

/**
 * GET /api/structures/construction-queue/:settlementId
 * Get construction queue for a settlement
 * Returns active (IN_PROGRESS) and queued (QUEUED) construction projects
 */
router.get('/construction-queue/:settlementId', authenticate, async (req: Request, res: Response) => {
	try {
		const { settlementId } = req.params;

		// Verify settlement exists and user owns it
		const settlement = await db.query.settlements.findFirst({
			where: eq(settlements.id, settlementId),
		});

		if (!settlement) {
			return res.status(404).json({
				success: false,
				error: 'Settlement not found',
			});
		}

		if (!req.user || settlement.playerProfileId !== req.user.profileId) {
			return res.status(403).json({
				success: false,
				error: 'You do not own this settlement',
			});
		}

		// Fetch construction queue items (exclude COMPLETE and CANCELLED)
		const queueItems = await db
			.select()
			.from(constructionQueue)
			.where(
				and(
					eq(constructionQueue.settlementId, settlementId),
					or(
						eq(constructionQueue.status, 'IN_PROGRESS'),
						eq(constructionQueue.status, 'QUEUED')
					)
				)
			);

		// Filter to only IN_PROGRESS and QUEUED (exclude COMPLETE)
		const activeItems = queueItems.filter(item => item.status === 'IN_PROGRESS');
		const queuedItems = queueItems.filter(item => item.status === 'QUEUED');

		logger.debug('[API] Fetched construction queue', {
			settlementId,
			activeCount: activeItems.length,
			queuedCount: queuedItems.length,
		});

		return res.json({
			success: true,
			active: activeItems,
			queued: queuedItems,
		});
	} catch (error) {
		logger.error('[API] Failed to fetch construction queue', {
			error,
			settlementId: req.params.settlementId,
		});
		return res.status(500).json({
			success: false,
			error: 'Failed to fetch construction queue',
		});
	}
});

/**
 * GET /api/structures/:id
 * Get structure details
 */
router.get('/:id', authenticate, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const structure = await db.query.settlementStructures.findFirst({
			where: eq(settlementStructures.id, id),
			with: {
				structure: true,
				settlement: true,
				modifiers: true,
			},
		});

		if (!structure) {
			return res.status(404).json({
				error: 'Not Found',
				code: 'STRUCTURE_NOT_FOUND',
				message: 'Structure not found',
			});
		}

		// Flatten master structure fields into response
		const structureDef = structure.structure as Structure | undefined;

		// Calculate dynamic modifiers based on current level
		const calculatedModifiers = structureDef?.name
			? calculateStructureModifiers(structureDef.name, structure.level)
			: [];

		const response = {
			...structure,
			name: structureDef?.name,
			description: structureDef?.description,
			category: structureDef?.category,
			buildingType: structureDef?.buildingType,
			extractorType: structureDef?.extractorType,
			maxLevel: structureDef?.maxLevel,
			calculatedModifiers, // ✅ Phase 3: Add calculated modifiers
		};

		return res.json(response);
	} catch (error) {
		logger.error('[API] Failed to fetch structure', { error, structureId: req.params.id });
		return res.status(500).json({
			error: 'Internal Server Error',
			code: 'FETCH_FAILED',
			message: 'Failed to fetch structure details',
		});
	}
});

/**
 * POST /api/structures/create
 * Create a new settlement structure (extractor or building)
 *
 * Required body params:
 * - settlementId: string
 * - structureId: string (Structure.id from database)
 * - tileId: string (for extractors, where to place it)
 * - slotPosition: number (for extractors, which slot 0-4)
 */
router.post('/create', authenticate, async (req: Request, res: Response) => {
	try {
		let { settlementId, structureId, tileId, slotPosition } = req.body;

		// Validate required fields
		if (!settlementId || !structureId) {
			return res.status(400).json({
				success: false,
				error: 'Bad Request',
				code: 'MISSING_FIELDS',
				message: 'settlementId and structureId are required',
			});
		}

		// Parse slotPosition if provided (comes as string from form data)
		if (slotPosition !== undefined && slotPosition !== null) {
			slotPosition = Number.parseInt(slotPosition, 10);
			if (Number.isNaN(slotPosition)) {
				return res.status(400).json({
					success: false,
					error: 'Bad Request',
					code: 'INVALID_SLOT',
					message: 'Slot position must be a valid number',
				});
			}
		}

		// 1. Get structure definition BEFORE transaction
		const structureDefinition = await db.query.structures.findFirst({
			where: eq(structures.id, structureId),
		});

		if (!structureDefinition) {
			return res.status(404).json({
				success: false,
				error: 'Not Found',
				code: 'STRUCTURE_NOT_FOUND',
				message: `Structure not found with id: ${structureId}`,
			});
		}

		// 2. Verify settlement exists
		const settlement = await db.query.settlements.findFirst({
			where: eq(settlements.id, settlementId),
			with: {
				tile: {
					with: {
						region: {
							with: {
								world: true,
							},
						},
					},
				},
			},
		});

		if (!settlement) {
			return res.status(404).json({
				success: false,
				error: 'Not Found',
				code: 'SETTLEMENT_NOT_FOUND',
				message: 'Settlement not found',
			});
		}

		// 3. Verify user owns the settlement
		if (!req.user || settlement.playerProfileId !== req.user.profileId) {
			return res.status(403).json({
				success: false,
				error: 'Forbidden',
				code: 'NOT_SETTLEMENT_OWNER',
				message: 'You do not own this settlement',
			});
		}

		// ✅ Phase 3: Validate prerequisites before building
		const prerequisiteValidation = await validatePrerequisites(
			db,
			structureDefinition.name,
			settlementId
		);

		if (!prerequisiteValidation.isValid) {
			return res.status(400).json({
				success: false,
				error: 'Bad Request',
				code: 'PREREQUISITES_NOT_MET',
				message: 'Prerequisites not met for this structure',
				missing: prerequisiteValidation.missing,
			});
		}

		// ✅ Building Area System: Validate area, Town Hall level, and unique constraints
		if (structureDefinition.category === 'BUILDING') {
			const areaValidation = await validateBuildingPlacement(
				db,
				settlementId,
				structureDefinition.name
			);

			if (!areaValidation.valid && areaValidation.error) {
				return res.status(400).json({
					success: false,
					error: 'Bad Request',
					code: areaValidation.error.type,
					message: areaValidation.error.message,
					details: areaValidation.error.details,
				});
			}
		}

		// 4. For extractors, validate tileId and slotPosition
		if (structureDefinition.category === 'EXTRACTOR') {
			if (!tileId) {
				return res.status(400).json({
					success: false,
					error: 'Bad Request',
					code: 'MISSING_TILE',
					message: 'tileId is required for extractor structures',
				});
			}

			if (slotPosition === undefined || slotPosition === null) {
				return res.status(400).json({
					success: false,
					error: 'Bad Request',
					code: 'MISSING_SLOT',
					message: 'slotPosition is required for extractor structures',
				});
			}

			// Verify tile exists
			const tile = await db.query.tiles.findFirst({
				where: eq(tiles.id, tileId),
			});

			if (!tile) {
				return res.status(404).json({
					success: false,
					error: 'Not Found',
					code: 'TILE_NOT_FOUND',
					message: 'Tile not found',
				});
			}

			// Validate slot position range
			if (slotPosition < 0 || slotPosition > tile.plotSlots - 1) {
				return res.status(400).json({
					success: false,
					error: 'Bad Request',
					code: 'INVALID_SLOT',
					message: `Slot position must be between 0 and ${tile.plotSlots - 1}`,
				});
			}

			// 5. Check if slot is already occupied by another EXTRACTOR on the SAME tile
			const existingExtractorInSlot = await db.query.settlementStructures.findFirst({
				where: and(
					eq(settlementStructures.settlementId, settlementId),
					eq(settlementStructures.tileId, tileId),
					eq(settlementStructures.slotPosition, slotPosition)
				),
				with: {
					structure: true,
				},
			});

			if (
				existingExtractorInSlot?.structure &&
				'category' in existingExtractorInSlot.structure &&
				existingExtractorInSlot.structure.category === 'EXTRACTOR'
			) {
				return res.status(400).json({
					success: false,
					error: 'Bad Request',
					code: 'SLOT_OCCUPIED',
					message: `Slot ${slotPosition} on tile ${tileId} is already occupied by another extractor`,
				});
			}

			// 5b. Check if slot is reserved by an extractor in the construction queue
			const queuedExtractorInSlot = await db.query.constructionQueue.findFirst({
				where: and(
					eq(constructionQueue.settlementId, settlementId),
					eq(constructionQueue.tileId, tileId),
					eq(constructionQueue.slotPosition, slotPosition),
					sql`${constructionQueue.status} != 'COMPLETE'` // Exclude completed constructions
				),
			});

			if (queuedExtractorInSlot) {
				return res.status(400).json({
					success: false,
					error: 'Bad Request',
					code: 'SLOT_RESERVED',
					message: `Slot ${slotPosition} on tile ${tileId} is reserved by a queued construction`,
				});
			}
		}

		// 6. Start transaction to validate resources and add to construction queue
		const result = await db.transaction(async (tx) => {
			// Validate and deduct resources using the structureDefinition object
			const validation = await validateAndDeductResources(
				tx,
				settlementId,
				structureDefinition
			);

			if (!validation.success) {
				logger.error('[API] Insufficient resources for construction', {
					settlementId,
					structureName: structureDefinition.name,
					error: validation.error,
					shortages: validation.shortages,
				});
				const error = new Error('INSUFFICIENT_RESOURCES') as Error & {
					validation: ValidationResult;
				};
				error.validation = validation;
				throw error;
			}

			// Count existing constructions to determine position
			const existingConstructions = await tx
				.select()
				.from(constructionQueue)
				.where(
					and(
						eq(constructionQueue.settlementId, settlementId),
						or(
							eq(constructionQueue.status, 'IN_PROGRESS'),
							eq(constructionQueue.status, 'QUEUED')
						)
					)
				);

			const position = existingConstructions.length;

			logger.debug('[API] Creating construction queue item', {
				settlementId,
				structureName: structureDefinition.name,
				category: structureDefinition.category,
				position,
				existingCount: existingConstructions.length,
				willBeActive: position < 1,
				tileId,
				slotPosition,
			});

			// Check if queue is full (max 11: 1 active + 10 queued)
			if (position >= 11) {
				const error = new Error('QUEUE_FULL') as Error & {
					validation: ValidationResult;
				};
				error.validation = {
					success: false,
					error: 'Construction queue is full (max 11 projects: 1 active + 10 queued)',
					deductedResources: { wood: 0, stone: 0, ore: 0 },
				};
				throw error;
			}

			// Add to construction queue
			const [queueItem] = await tx
				.insert(constructionQueue)
				.values({
					id: createId(),
					settlementId,
					structureType: structureDefinition.name,
					resourcesCost: validation.deductedResources,
					status: position < 1 ? 'IN_PROGRESS' : 'QUEUED',
					position,
					isEmergency: 0,
					// Store tileId and slotPosition for extractors
					tileId: structureDefinition.category === 'EXTRACTOR' ? tileId : null,
					slotPosition: structureDefinition.category === 'EXTRACTOR' ? slotPosition : null,
					startedAt: position < 1 ? new Date() : null,
					completesAt: position < 1
						? new Date(Date.now() + (constructionTimeSeconds * 1000))
						: null,
				})
				.returning();

			logger.debug('[API] Construction queue item created', {
				constructionId: queueItem.id,
				settlementId,
				structureName: structureDefinition.name,
				status: queueItem.status,
				position: queueItem.position,
				tileId: queueItem.tileId,
				slotPosition: queueItem.slotPosition,
			});

			return { queueItem, structureDefinition, validation };
		});

		logger.info('[API] Structure queued for construction', {
			queueItemId: result.queueItem.id,
			settlementId,
			category: result.structureDefinition.category,
			structureName: result.structureDefinition.name,
			position: result.queueItem.position,
			status: result.queueItem.status,
			resourcesDeducted: result.validation.deductedResources,
		});

		// Emit Socket.IO event for real-time updates
		const worldId = settlement.tile?.region?.world?.id;
		logger.debug('[API] Emitting Socket.IO event', {
			worldId,
			hasIO: !!req.app.get('io'),
			eventName: result.queueItem.status === 'IN_PROGRESS' ? 'construction-started' : 'construction-queued',
			constructionId: result.queueItem.id,
		});

		if (worldId && req.app.get('io')) {
			const io = req.app.get('io');

			const eventName = result.queueItem.status === 'IN_PROGRESS'
				? 'construction-started'
				: 'construction-queued';

			io.to(`world:${worldId}`).emit(eventName, {
				settlementId,
				constructionId: result.queueItem.id,
				structureType: result.structureDefinition.name,
				category: result.structureDefinition.category,
				buildingType: result.structureDefinition.buildingType,
				extractorType: result.structureDefinition.extractorType,
				position: result.queueItem.position,
				status: result.queueItem.status,
				completesAt: result.queueItem.completesAt,
				resourcesCost: result.validation.deductedResources,
				tileId: result.queueItem.tileId,
				slotPosition: result.queueItem.slotPosition,
				timestamp: Date.now(),
			});

			logger.debug('[API] Socket.IO event emitted', {
				eventName,
				worldId,
				constructionId: result.queueItem.id,
			});
		} else {
			logger.warn('[API] Socket.IO event NOT emitted', {
				worldId,
				hasIO: !!req.app.get('io'),
			});
		}

		// Return success response
		const structureCost = STRUCTURE_COSTS.find(s => s.name === result.structureDefinition.name);
		const constructionTimeSeconds = structureCost?.constructionTimeSeconds || 60;

		res.status(201).json({
			success: true,
			message: 'Structure queued for construction',
			construction: {
				id: result.queueItem.id,
				structureName: result.structureDefinition.displayName,
				structureType: result.structureDefinition.name,
				category: result.structureDefinition.category,
				position: result.queueItem.position,
				status: result.queueItem.status,
				completesAt: result.queueItem.completesAt,
				constructionTime: constructionTimeSeconds,
			},
			resourcesDeducted: result.validation.deductedResources,
		});
	} catch (error) {
		// Handle validation errors (insufficient resources or queue full)
		if (error instanceof Error && (error.message === 'INSUFFICIENT_RESOURCES' || error.message === 'QUEUE_FULL')) {
			const validationError = (error as Error & { validation: ValidationResult }).validation;
			logger.error('[API] Insufficient resources for structure', {
				settlementId: req.body.settlementId,
				structureId: req.body.structureId,
				error: validationError.error,
			});
		}

		// Handle all other errors
		logger.error('[API] Failed to create structure', {
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined,
			errorName: error instanceof Error ? error.name : 'Unknown',
			requestBody: {
				settlementId: req.body.settlementId,
				structureId: req.body.structureId,
				tileId: req.body.tileId,
				slotPosition: req.body.slotPosition,
			},
		});
		return res.status(500).json({
			success: false,
			error: 'Internal Server Error',
			code: 'CREATE_FAILED',
			message: 'An error occurred while building the structure',
		});
	}
});

/**
 * POST /api/structures/:id/upgrade
 * Queue a structure upgrade (goes through construction queue)
 */
router.post('/:id/upgrade', authenticate, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const structure = await db.query.settlementStructures.findFirst({
			where: eq(settlementStructures.id, id),
			with: {
				structure: true,
				settlement: true,
			},
		});

		if (!structure) {
			return res.status(404).json({
				error: 'Not Found',
				code: 'STRUCTURE_NOT_FOUND',
				message: 'Structure not found',
			});
		}

		// Verify user owns the settlement
		const settlementData = structure.settlement as Settlement | undefined;
		if (!req.user || settlementData?.playerProfileId !== req.user.profileId) {
			return res.status(403).json({
				error: 'Forbidden',
				code: 'NOT_SETTLEMENT_OWNER',
				message: 'You do not own this settlement',
			});
		}

		const structureDef = structure.structure as Structure | undefined;
		const nextLevel = structure.level + 1;

		// Calculate upgrade cost (same as construction cost, could be adjusted)
		const upgradeCost = {
			wood: structureDef?.woodCost || 0,
			stone: structureDef?.stoneCost || 0,
			ore: structureDef?.oreCost || 0,
		};

		// Deduct resources
		const resources = await db.query.settlementResources.findFirst({
			where: eq(settlementResources.settlementId, settlementData.id),
		});

		if (!resources) {
			return res.status(400).json({
				error: 'Bad Request',
				code: 'NO_RESOURCES',
				message: 'Settlement has no resource data',
			});
		}

		// Check resource availability
		if (
			resources.wood < upgradeCost.wood ||
			resources.stone < upgradeCost.stone ||
			resources.ore < upgradeCost.ore
		) {
			return res.status(400).json({
				error: 'Bad Request',
				code: 'INSUFFICIENT_RESOURCES',
				message: 'Insufficient resources for upgrade',
			});
		}

		// Deduct resources
		await db
			.update(settlementResources)
			.set({
				wood: resources.wood - upgradeCost.wood,
				stone: resources.stone - upgradeCost.stone,
				ore: resources.ore - upgradeCost.ore,
			})
			.where(eq(settlementResources.settlementId, settlementData.id));

		// Calculate upgrade time (1.25x construction time)
		const baseConstructionTime = (structureDef?.constructionTimeSeconds || 600) * 1000;
		const upgradeTime = Math.floor(baseConstructionTime * 1.25);
		const currentTime = Date.now();
		const completionTime = currentTime + upgradeTime;

		// Check how many active construction slots
		const activeCount = await db.query.constructionQueue.findMany({
			where: and(
				eq(constructionQueue.settlementId, settlementData.id),
				eq(constructionQueue.status, 'IN_PROGRESS')
			),
		});

		const status = activeCount.length < 1 ? 'IN_PROGRESS' : 'QUEUED';
		const position = activeCount.length < 1 ? activeCount.length : activeCount.length;

		// Add to construction queue
		const [queueItem] = await db
			.insert(constructionQueue)
			.values({
				settlementId: settlementData.id,
				structureType: structureDef?.name || 'Unknown',
				existingStructureId: id, // Mark as upgrade
				targetLevel: nextLevel,
				tileId: structure.tileId,
				slotPosition: structure.slotPosition,
				startedAt: status === 'IN_PROGRESS' ? new Date(currentTime) : null,
				completesAt: status === 'IN_PROGRESS' ? new Date(completionTime) : null,
				resourcesCost: upgradeCost,
				status,
				position,
				isEmergency: 0,
			})
			.returning();

		logger.info('[API] Structure upgrade queued', {
			structureId: id,
			targetLevel: nextLevel,
			category: structureDef?.category,
			status,
			completesAt: queueItem.completesAt,
		});

		// Emit Socket.IO event
		const settlementWithTile = await db.query.settlements.findFirst({
			where: eq(settlements.id, settlementData.id),
			with: {
				tile: {
					with: {
						region: true,
					},
				},
			},
		});
		const worldId = settlementWithTile?.tile?.region?.worldId;

		if (worldId && req.app.get('io')) {
			const io = req.app.get('io');
			const eventName = status === 'IN_PROGRESS' ? 'construction-started' : 'construction-queued';

			io.to(`world:${worldId}`).emit(eventName, {
				settlementId: settlementData.id,
				constructionId: queueItem.id,
				structureType: structureDef?.name,
				category: structureDef?.category,
				buildingType: structureDef?.buildingType,
				extractorType: structureDef?.extractorType,
				completesAt: status === 'IN_PROGRESS' ? completionTime : undefined,
				isUpgrade: true,
				existingStructureId: id,
				targetLevel: nextLevel,
				position: queueItem.position,
				timestamp: currentTime,
			});

			logger.debug(`[API] Emitted ${eventName} for upgrade`, {
				constructionId: queueItem.id,
				worldId,
			});
		}

		return res.json({
			success: true,
			message: 'Upgrade queued',
			queueItem,
		});
	} catch (error) {
		logger.error('[API] Failed to queue upgrade', { error, structureId: req.params.id });
		return res.status(500).json({
			error: 'Internal Server Error',
			code: 'UPGRADE_FAILED',
			message: 'Failed to queue upgrade',
		});
	}
});

/**
 * DELETE /api/structures/construction-queue/:constructionId
 * Cancel a queued construction and refund resources
 */
router.delete('/construction-queue/:constructionId', authenticate, async (req: Request, res: Response) => {
	try {
		const { constructionId } = req.params;

		// Get construction queue item
		const queueItem = await db.query.constructionQueue.findFirst({
			where: eq(constructionQueue.id, constructionId),
		});

		if (!queueItem) {
			return res.status(404).json({
				success: false,
				error: 'Not Found',
				code: 'CONSTRUCTION_NOT_FOUND',
				message: 'Construction not found',
			});
		}

		// Get settlement with world info
		const settlementData = await db.query.settlements.findFirst({
			where: eq(settlements.id, queueItem.settlementId),
			with: {
				tile: {
					with: {
						region: {
							with: {
								world: true,
							},
						},
					},
				},
			},
		});

		if (!settlementData) {
			return res.status(404).json({
				success: false,
				error: 'Not Found',
				code: 'SETTLEMENT_NOT_FOUND',
				message: 'Settlement not found',
			});
		}

		// Verify user owns the settlement
		if (!req.user || settlementData.playerProfileId !== req.user.profileId) {
			return res.status(403).json({
				success: false,
				error: 'Forbidden',
				code: 'NOT_SETTLEMENT_OWNER',
				message: 'You do not own this settlement',
			});
		}

		// Can only cancel QUEUED items, not IN_PROGRESS
		if (queueItem.status === 'IN_PROGRESS') {
			return res.status(400).json({
				success: false,
				error: 'Bad Request',
				code: 'CANNOT_CANCEL_ACTIVE',
				message: 'Cannot cancel a construction that is already in progress',
			});
		}

		if (queueItem.status !== 'QUEUED') {
			return res.status(400).json({
				success: false,
				error: 'Bad Request',
				code: 'INVALID_STATUS',
				message: 'Can only cancel queued constructions',
			});
		}

		// Refund resources
		const resourcesCost = queueItem.resourcesCost as Record<string, number> | null;
		if (resourcesCost && Object.keys(resourcesCost).length > 0) {
			await db
				.update(settlements)
				.set({
					wood: sql`${settlements.wood} + ${resourcesCost.wood || 0}`,
					stone: sql`${settlements.stone} + ${resourcesCost.stone || 0}`,
					ore: sql`${settlements.ore} + ${resourcesCost.ore || 0}`,
					food: sql`${settlements.food} + ${resourcesCost.food || 0}`,
				})
				.where(eq(settlements.id, settlementData.id));
		}

		// Delete construction queue item
		await db.delete(constructionQueue).where(eq(constructionQueue.id, constructionId));

		logger.info('[API] Construction cancelled and resources refunded', {
			constructionId,
			settlementId: settlementData.id,
			resourcesRefunded: resourcesCost,
		});

		// Emit Socket.IO event
		const worldId = settlementData.tile?.region?.world?.id;
		if (worldId && req.app.get('io')) {
			const io = req.app.get('io');
			io.to(`world:${worldId}`).emit('construction-cancelled', {
				settlementId: settlementData.id,
				constructionId,
				resourcesRefunded: resourcesCost,
				timestamp: Date.now(),
			});
		}

		return res.json({
			success: true,
			message: 'Construction cancelled and resources refunded',
			resourcesRefunded: resourcesCost,
		});
	} catch (error) {
		logger.error('[API] Failed to cancel construction', {
			error,
			constructionId: req.params.constructionId
		});
		return res.status(500).json({
			success: false,
			error: 'Internal Server Error',
			code: 'CANCEL_FAILED',
			message: 'Failed to cancel construction',
		});
	}
});

/**
 * GET /api/structures/by-settlement/:settlementId
 * Get all structures in a settlement
 */
router.get('/by-settlement/:settlementId', authenticate, async (req: Request, res: Response) => {
	try {
		const { settlementId } = req.params;

		const structureList = await db.query.settlementStructures.findMany({
			where: eq(settlementStructures.settlementId, settlementId),
			with: {
				structure: true,
				modifiers: true,
				tile: true,
			},
		});

		// Flatten master structure fields for each structure
		const flattenedList = structureList.map((s) => {
			const structureDef = s.structure as Structure | undefined;

			// DEBUG: Log structure data to diagnose category issue
			logger.info('[API] Structure flattening:', {
				settlementStructureId: s.id,
				structureId: s.structureId,
				hasMasterDef: !!structureDef,
				category: structureDef?.category,
				name: structureDef?.name,
				buildingType: structureDef?.buildingType,
				extractorType: structureDef?.extractorType,
			});

			return {
				...s,
				name: structureDef?.name,
				description: structureDef?.description,
				category: structureDef?.category,
				buildingType: structureDef?.buildingType,
				extractorType: structureDef?.extractorType,
				maxLevel: structureDef?.maxLevel,
			};
		});

		return res.json(flattenedList);
	} catch (error) {
		logger.error('[API] Failed to fetch structures by settlement', {
			error,
			settlementId: req.params.settlementId,
		});
		return res.status(500).json({
			error: 'Internal Server Error',
			code: 'FETCH_FAILED',
			message: 'Failed to fetch structures',
		});
	}
});

/**
 * DELETE /api/structures/:id
 * Demolish a structure
 */
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
	try {
		const { id } = req.params;

		const structure = await db.query.settlementStructures.findFirst({
			where: eq(settlementStructures.id, id),
			with: {
				structure: true,
				settlement: {
					with: {
						tile: {
							with: {
								region: {
									with: {
										world: true,
									},
								},
							},
						},
					},
				},
			},
		});

		if (!structure) {
			return res.status(404).json({
				error: 'Not Found',
				code: 'STRUCTURE_NOT_FOUND',
				message: 'Structure not found',
			});
		}

		// Verify user owns the settlement
		const settlementData = structure.settlement as Settlement | undefined;
		if (!req.user || settlementData?.playerProfileId !== req.user.profileId) {
			return res.status(403).json({
				error: 'Forbidden',
				code: 'NOT_SETTLEMENT_OWNER',
				message: 'You do not own this settlement',
			});
		}

		// Delete structure (cascade will handle requirements)
		await db.delete(settlementStructures).where(eq(settlementStructures.id, id));

		const structureDef = structure.structure as Structure | undefined;
		logger.info('[API] Structure demolished', {
			structureId: id,
			settlementId: structure.settlementId,
			type: structureDef?.category,
		});

		// Emit Socket.IO event for real-time updates
		const worldId = settlementData?.tile?.region?.world?.id;
		logger.debug('[SERVER] Attempting to emit structure:demolished event', {
			worldId,
			settlementId: structure.settlementId,
			structureName: structureDef?.name,
		});
		if (worldId && req.app.get('io')) {
			const io = req.app.get('io');
			logger.debug('[SERVER] Emitting structure:demolished to room:', {
				world: `world:${worldId}`,
			});

			io.to(`world:${worldId}`).emit('structure:demolished', {
				settlementId: structure.settlementId,
				structureId: id,
				structureName: structureDef?.name,
				category: structureDef?.category,
			});
			logger.debug('[SERVER] structure:demolished event emitted successfully');
		} else {
			logger.debug('[SERVER] FAILED to emit - missing worldId or io instance');
		}

		// ✅ Phase 4: Trigger settlement modifier recalculation after structure deletion
		try {
			const { aggregateSettlementModifiers } =
				await import('../../game/settlement-modifier-aggregator.js');
			await aggregateSettlementModifiers(structure.settlementId);
			logger.debug('[API] Settlement modifiers recalculated after structure deletion', {
				settlementId: structure.settlementId,
				structureId: id,
			});
		} catch (aggError) {
			// Log error but don't fail the deletion operation
			logger.error(
				'[API] Failed to recalculate settlement modifiers after structure deletion',
				{
					settlementId: structure.settlementId,
					structureId: id,
					error: aggError instanceof Error ? aggError.message : 'Unknown error',
				}
			);
		}

		// ✅ Building Area System: Update settlement area usage after demolition
		if (structureDef?.category === 'BUILDING') {
			try {
				await updateSettlementAreaUsage(db, structure.settlementId);
				logger.debug('[API] Settlement area usage updated after structure demolition', {
					settlementId: structure.settlementId,
					structureId: id,
				});

				// Emit area update event for real-time UI updates
				if (worldId && req.app.get('io')) {
					const { getAreaStatistics } = await import('../../utils/area-calculator.js');
					const areaStats = await getAreaStatistics(db, structure.settlementId);

					const io = req.app.get('io');
					io.to(`world:${worldId}`).emit('area:updated', {
						settlementId: structure.settlementId,
						...areaStats,
					});
					logger.debug('[SERVER] area:updated event emitted after demolition', {
						settlementId: structure.settlementId,
						areaUsed: areaStats.areaUsed,
						areaCapacity: areaStats.areaCapacity,
					});
				}
			} catch (areaError) {
				// Log error but don't fail the operation
				logger.error('[API] Failed to update settlement area usage', {
					settlementId: structure.settlementId,
					error: areaError instanceof Error ? areaError.message : 'Unknown error',
				});
			}
		}

		return res.json({
			success: true,
			message: `${structureDef?.name || 'Structure'} demolished`,
		});
	} catch (error) {
		logger.error('[API] Failed to demolish structure', { error, structureId: req.params.id });
		return res.status(500).json({
			error: 'Internal Server Error',
			code: 'DEMOLISH_FAILED',
			message: 'Failed to demolish structure',
		});
	}
});

export default router;
