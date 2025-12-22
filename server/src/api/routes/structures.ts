/**
 * Structure Management API Routes
 *
 * Handles settlement building operations:
 * - Building settlement structures (non-extractors)
 * - Upgrading structures
 * - Viewing structure details
 */

import { Router, Request, Response } from 'express';
import { eq, and } from 'drizzle-orm';
import {
	db,
	settlementStructures,
	settlements,
	structures,
	tiles,
	structureModifiers,
} from '../../db/index.js';
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
		}

		// 6. Start transaction to validate resources and create structure
		const result = await db.transaction(async (tx) => {
			// ✅ Phase 4: Pass full Structure object (not string)
			// Validate and deduct resources using the structureDefinition object
			const validation = await validateAndDeductResources(
				tx,
				settlementId,
				structureDefinition
			);

			if (!validation.success) {
				const error = new Error('INSUFFICIENT_RESOURCES') as Error & {
					validation: ValidationResult;
				};
				error.validation = validation;
				throw error;
			}

			// Create the settlement structure instance
			const [structure] = await tx
				.insert(settlementStructures)
				.values({
					id: createId(),
					structureId: structureDefinition.id,
					settlementId,
					tileId: structureDefinition.category === 'EXTRACTOR' ? tileId : null,
					slotPosition:
						structureDefinition.category === 'EXTRACTOR' ? slotPosition : null,
					level: 1,
				})
				.returning();

			// Create structure modifiers
			// Convert type (e.g., 'POPULATION_CAPACITY') to snake_case name (e.g., 'population_capacity')
			// This matches the MODIFIER_NAMES constants used by game logic calculators
			const modifiers = calculateStructureModifiers(structureDefinition.name, 1);
			if (modifiers.length > 0) {
				await tx.insert(structureModifiers).values(
					modifiers.map((mod) => ({
						id: createId(),
						settlementStructureId: structure.id,
						name: mod.type.toLowerCase(), // Use snake_case type, not human-readable name
						description: mod.description,
						value: mod.value,
					}))
				);
			}

			return { structure, structureDefinition, validation };
		});

		logger.info('[API] Structure created', {
			structureId: result.structure.id,
			settlementId,
			category: result.structureDefinition.category,
			structureName: result.structureDefinition.name,
			resourcesDeducted: result.validation.deductedResources,
		});

		// Emit Socket.IO event for real-time updates
		const worldId = settlement.tile?.region?.world?.id;
		logger.debug('[SERVER] Attempting to emit structure:built event', {
			worldId,
			settlementId,
			hasIo: !!req.app.get('io'),
			structureName: result.structureDefinition.name,
		});
		if (worldId && req.app.get('io')) {
			const io = req.app.get('io');
			logger.debug('[SERVER] Emitting structure:built to room:', {
				world: `world:${worldId}`,
			});

			// ✅ FIX: Flatten the structure with master definition fields before emitting
			const flattenedStructure = {
				...result.structure,
				name: result.structureDefinition.name,
				description: result.structureDefinition.description,
				category: result.structureDefinition.category,
				buildingType: result.structureDefinition.buildingType,
				extractorType: result.structureDefinition.extractorType,
				maxLevel: result.structureDefinition.maxLevel,
			};

			io.to(`world:${worldId}`).emit('structure:built', {
				settlementId,
				structure: flattenedStructure,
				category: result.structureDefinition.category,
				structureName: result.structureDefinition.name,
				resourcesDeducted: result.validation.deductedResources,
			});
			logger.debug('[SERVER] structure:built event emitted successfully');
		} else {
			logger.debug('[SERVER] FAILED to emit - missing worldId or io instance');
		}

		// ✅ Phase 4: Trigger settlement modifier recalculation after structure creation
		try {
			const { aggregateSettlementModifiers } =
				await import('../../game/settlement-modifier-aggregator.js');
			await aggregateSettlementModifiers(settlementId);
			logger.debug('[API] Settlement modifiers recalculated after structure creation', {
				settlementId,
				structureId: result.structure.id,
			});
		} catch (aggError) {
			// Log error but don't fail the structure creation operation
			logger.error(
				'[API] Failed to recalculate settlement modifiers after structure creation',
				{
					settlementId,
					structureId: result.structure.id,
					error: aggError instanceof Error ? aggError.message : 'Unknown error',
				}
			);
		}

		// ✅ Building Area System: Emit area update event for real-time UI updates
		if (worldId && req.app.get('io')) {
			try {
				const { getAreaStatistics } = await import('../../utils/area-calculator.js');
				const areaStats = await getAreaStatistics(db, settlementId);

				const io = req.app.get('io');
				io.to(`world:${worldId}`).emit('area:updated', {
					settlementId,
					...areaStats,
				});
				logger.debug('[SERVER] area:updated event emitted', {
					settlementId,
					areaUsed: areaStats.areaUsed,
					areaCapacity: areaStats.areaCapacity,
				});
			} catch (areaError) {
				logger.error('[SERVER] Failed to emit area:updated event', {
					error: areaError instanceof Error ? areaError.message : 'Unknown error',
				});
			}
		}

		// ✅ Building Area System: Update settlement area usage after building
		if (structureDefinition.category === 'BUILDING') {
			try {
				await updateSettlementAreaUsage(db, settlementId);
				logger.debug('[API] Settlement area usage updated after structure creation', {
					settlementId,
					structureId: result.structure.id,
				});
			} catch (areaError) {
				// Log error but don't fail the operation
				logger.error('[API] Failed to update settlement area usage', {
					settlementId,
					error: areaError instanceof Error ? areaError.message : 'Unknown error',
				});
			}
		}

		// ✅ IMMEDIATE CAPACITY UPDATE: Emit population-state event with updated capacity
		// This ensures the UI receives the new population capacity immediately after building
		// The population interval tick will still handle growth/immigration/emigration
		if (worldId && req.app.get('io')) {
			try {
				const io = req.app.get('io');

				// Get current population data
				const { getSettlementPopulation } = await import('../../db/queries.js');
				const popData = await getSettlementPopulation(settlementId);

				// Get all structures with modifiers to calculate new capacity
				const structuresWithModifiers = await db.query.settlementStructures.findMany({
					where: eq(settlementStructures.settlementId, settlementId),
					with: {
						structure: true,
						modifiers: true,
					},
				});

				// Map to Structure type expected by calculatePopulationState
				// Handle Drizzle relation result (can be array or single object)
				const mappedStructures = structuresWithModifiers.map((s) => {
					const struct = Array.isArray(s.structure) ? s.structure[0] : s.structure;

					// Handle modifiers relation (Drizzle returns loosely typed objects)
					const rawMods = Array.isArray(s.modifiers)
						? s.modifiers
						: s.modifiers
							? [s.modifiers]
							: [];

					return {
						id: s.id,
						name: struct?.name || 'Unknown',
						category: struct?.category || 'BUILDING',
						level: s.level,
						modifiers: (rawMods as Array<{ name: string; value: number }>).map((m) => ({
							name: m.name,
							value: m.value,
						})),
					};
				});

				// DEBUG: Log mapped structures to see modifiers
				logger.debug('[API] Structures mapped for capacity calculation:', {
					settlementId,
					structureCount: mappedStructures.length,
					structures: mappedStructures.map((s) => ({
						id: s.id,
						name: s.name,
						level: s.level,
						modifierCount: s.modifiers?.length || 0,
						modifiers: s.modifiers || [],
					})),
				});

				// Calculate updated population state with new capacity
				const { calculatePopulationState } =
					await import('../../game/population-calculator.js');
				const popState = calculatePopulationState(
					popData.currentPopulation,
					mappedStructures,
					{ food: 0, water: 0, wood: 0, stone: 0, ore: 0 }, // Resources not needed for capacity calc
					popData.lastGrowthTick.getTime()
				);

				// DEBUG: Log capacity calculation result
				logger.debug('[API] Capacity calculation completed:', {
					settlementId,
					currentPopulation: popData.currentPopulation,
					calculatedCapacity: popState.capacity,
					expectedAfterHouse: 17,
					capacityDifference: 17 - popState.capacity,
				});

				// Emit updated population state with new capacity
				io.to(`world:${worldId}`).emit('population-state', {
					settlementId,
					current: popData.currentPopulation,
					capacity: popState.capacity,
					happiness: Math.floor(popState.happiness),
					growthRate: popState.growthRate,
					timestamp: Date.now(),
				});

				logger.debug(
					'[API] Emitted population-state with updated capacity after structure creation',
					{
						settlementId,
						newCapacity: popState.capacity,
						currentPopulation: popData.currentPopulation,
					}
				);
			} catch (popError) {
				// Log error but don't fail the structure creation operation
				logger.error('[API] Failed to emit population-state after structure creation', {
					settlementId,
					error: popError instanceof Error ? popError.message : 'Unknown error',
				});
			}
		}

		return res.status(201).json({
			success: true,
			structure: result.structure,
		});
	} catch (error) {
		// Handle validation errors (insufficient resources)
		if (error instanceof Error && error.message === 'INSUFFICIENT_RESOURCES') {
			const validationError = (error as Error & { validation: ValidationResult }).validation;
			logger.warn('[API] Insufficient resources for structure', {
				settlementId: req.body.settlementId,
				structureName: req.body.structureName,
				shortages: validationError.shortages,
			});
			return res.status(400).json({
				success: false,
				error: validationError.error || 'Insufficient resources to build structure',
				shortages: validationError.shortages,
			});
		}

		// Handle all other errors
		logger.error('[API] Failed to create structure', {
			errorMessage: error instanceof Error ? error.message : String(error),
			errorStack: error instanceof Error ? error.stack : undefined,
			body: req.body,
		});
		return res.status(500).json({
			error: 'Internal Server Error',
			code: 'CREATE_FAILED',
			message: 'Failed to create structure',
		});
	}
});

/**
 * POST /api/structures/:id/upgrade
 * Upgrade a structure to the next level
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

		// Upgrade the structure
		const nextLevel = structure.level + 1;
		const [upgraded] = await db
			.update(settlementStructures)
			.set({
				level: nextLevel,
			})
			.where(eq(settlementStructures.id, id))
			.returning();

		// Note: Extractor upgrades no longer update Plot production rates
		// (Plot table removed - production now calculated from Tile quality fields)

		const structureDef = structure.structure as Structure | undefined;
		logger.info('[API] Structure upgraded', {
			structureId: id,
			level: nextLevel,
			category: structureDef?.category,
		});

		// ✅ Phase 4: Trigger settlement modifier recalculation after structure upgrade
		try {
			const { aggregateSettlementModifiers } =
				await import('../../game/settlement-modifier-aggregator.js');
			await aggregateSettlementModifiers(settlementData.id);
			logger.debug('[API] Settlement modifiers recalculated after structure upgrade', {
				settlementId: settlementData.id,
				structureId: id,
				newLevel: nextLevel,
			});
		} catch (aggError) {
			// Log error but don't fail the upgrade operation
			logger.error(
				'[API] Failed to recalculate settlement modifiers after structure upgrade',
				{
					settlementId: settlementData.id,
					structureId: id,
					error: aggError instanceof Error ? aggError.message : 'Unknown error',
				}
			);
		}

		// Emit Socket.IO event for real-time updates
		// Get world ID from settlement's tile (need to fetch with relations)
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
		logger.debug('[SERVER] Attempting to emit structure:upgraded event', {
			worldId,
			settlementId: settlementData.id,
			hasIo: !!req.app.get('io'),
			structureName: structureDef?.name,
		});
		if (worldId && req.app.get('io')) {
			const io = req.app.get('io');
			logger.debug('[SERVER] Emitting structure:upgraded to room:', {
				world: `world:${worldId}`,
			});
			io.to(`world:${worldId}`).emit('structure:upgraded', {
				settlementId: settlementData.id,
				structureId: id,
				level: nextLevel,
				category: structureDef?.category,
				structureName: structureDef?.name,
			});
			logger.debug('[SERVER] structure:upgraded event emitted successfully');

			// ✅ IMMEDIATE CAPACITY UPDATE: Emit population-state event after upgrade
			// This ensures the UI receives the new population capacity if housing was upgraded
			try {
				// Get current population data
				const { getSettlementPopulation } = await import('../../db/queries.js');
				const popData = await getSettlementPopulation(settlementData.id);

				// Get all structures with modifiers to calculate new capacity
				const structuresWithModifiers = await db.query.settlementStructures.findMany({
					where: eq(settlementStructures.settlementId, settlementData.id),
					with: {
						structure: true,
						modifiers: true,
					},
				});

				// Map to Structure type expected by calculatePopulationState
				const mappedStructures = structuresWithModifiers.map((s) => {
					const struct = Array.isArray(s.structure) ? s.structure[0] : s.structure;
					const rawMods = Array.isArray(s.modifiers)
						? s.modifiers
						: s.modifiers
							? [s.modifiers]
							: [];

					return {
						id: s.id,
						name: struct?.name || 'Unknown',
						category: struct?.category || 'BUILDING',
						level: s.level,
						modifiers: (rawMods as Array<{ name: string; value: number }>).map((m) => ({
							name: m.name,
							value: m.value,
						})),
					};
				});

				// Calculate updated population state with new capacity
				const { calculatePopulationState } =
					await import('../../game/population-calculator.js');
				const popState = calculatePopulationState(
					popData.currentPopulation,
					mappedStructures,
					{ food: 0, water: 0, wood: 0, stone: 0, ore: 0 },
					popData.lastGrowthTick.getTime()
				);

				// Emit updated population state with new capacity
				io.to(`world:${worldId}`).emit('population-state', {
					settlementId: settlementData.id,
					current: popData.currentPopulation,
					capacity: popState.capacity,
					happiness: Math.floor(popState.happiness),
					growthRate: popState.growthRate,
					timestamp: Date.now(),
				});

				logger.debug('[API] Population-state emitted after structure upgrade', {
					settlementId: settlementData.id,
					structureId: id,
					capacity: popState.capacity,
				});
			} catch (popError) {
				// Log error but don't fail the upgrade operation
				logger.error('[API] Failed to emit population-state after structure upgrade', {
					settlementId: settlementData.id,
					structureId: id,
					error: popError instanceof Error ? popError.message : 'Unknown error',
				});
			}
		} else {
			logger.debug('[SERVER] FAILED to emit - missing worldId or io instance');
		}

		return res.json(upgraded);
	} catch (error) {
		logger.error('[API] Failed to upgrade structure', { error, structureId: req.params.id });
		return res.status(500).json({
			error: 'Internal Server Error',
			code: 'UPGRADE_FAILED',
			message: 'Failed to upgrade structure',
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
