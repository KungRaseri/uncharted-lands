/**
 * Socket.IO Event Handlers
 *
 * Organized handlers for all client events
 */

import type { Socket } from 'socket.io';
import type { Server as SocketIOServer } from 'socket.io';
import type {
	AuthenticateData,
	JoinWorldData,
	LeaveWorldData,
	GameStateRequest,
	BuildStructureData,
	UpgradeStructureData,
	CollectResourcesData,
	CreateWorldData,
	CreateWorldResponse,
	RequestWorldDataData,
	WorldDataResponse,
	RequestRegionData,
	RegionDataResponse,
} from '@uncharted-lands/shared';
import { logger } from '../utils/logger.js';
import {
	getSettlementWithDetails,
	updateSettlementStorage,
	getPlayerSettlements,
	createStructure,
	getSettlementStructures,
} from '../db/queries.js';
import { getStructureCostByName, isValidStructure } from '../data/structure-costs.js';
import { getStructureModifiers } from '../data/structure-modifiers.js';
import {
	calculateTimedProduction,
	addResources,
	subtractResources,
	hasEnoughResources,
	type Resources,
	calculateProduction,
} from '../game/resource-calculator.js';
import { createWorld } from '../game/world-creator.js';
import { aggregateSettlementModifiers } from '../game/settlement-modifier-aggregator.js';
import { calculatePopulationState, getPopulationSummary } from '../game/population-calculator.js';
import { calculateConsumption, calculatePopulation } from '../game/consumption-calculator.js';
import { getWorldTemplateConfig } from '../types/world-templates.js';
import { db } from '../db/index.js';
import { settlementStructures, settlements, tiles as tilesSchema } from '../db/schema.js';
import { eq } from 'drizzle-orm';

/**
 * Register all event handlers for a socket connection
 */
export function registerEventHandlers(socket: Socket): void {
	// Authentication
	socket.on('authenticate', (data, callback) => handleAuthenticate(socket, data, callback));

	// World Management
	socket.on('join-world', (data) => handleJoinWorld(socket, data));
	socket.on('leave-world', (data) => handleLeaveWorld(socket, data));
	socket.on('create-world', (data, callback) => handleCreateWorld(socket, data, callback));
	socket.on('request-world-data', (data, callback) =>
		handleRequestWorldData(socket, data, callback)
	);
	socket.on('request-region', (data, callback) => handleRequestRegion(socket, data, callback));

	// Game State
	socket.on('request-game-state', (data) => handleGameStateRequest(socket, data));

	// Settlement Actions
	socket.on('build-structure', (data, callback) => handleBuildStructure(socket, data, callback));
	socket.on('upgrade-structure', (data, callback) =>
		handleUpgradeStructure(socket, data, callback)
	);
	socket.on('collect-resources', (data, callback) =>
		handleCollectResources(socket, data, callback)
	);

	// Disconnect
	socket.on('disconnect', (reason) => handleDisconnect(socket, reason));

	// Errors
	socket.on('error', (error) => handleError(socket, error));
}

/**
 * Handle player authentication
 */
async function handleAuthenticate(
	socket: Socket,
	data: AuthenticateData,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	callback?: (response: any) => void
): Promise<void> {
	try {
		logger.info(`[AUTH] Player authenticating: ${data.playerId}`, { socketId: socket.id });

		// TODO: Validate token if provided
		// For now, accept all authentications
		const isValid = true;

		if (isValid) {
			// Store player data in socket
			socket.data.playerId = data.playerId;
			socket.data.authenticated = true;

			const response = {
				success: true,
				playerId: data.playerId,
			};

			// Send response via callback (acknowledgment pattern)
			if (callback) {
				callback(response);
			} else {
				socket.emit('authenticated', response);
			}

			logger.info(`[AUTH] Player authenticated: ${data.playerId}`, { socketId: socket.id });
		} else {
			const response = {
				success: false,
				error: 'Invalid authentication token',
			};

			if (callback) {
				callback(response);
			} else {
				socket.emit('error', {
					code: 'AUTH_FAILED',
					message: 'Authentication failed',
					timestamp: Date.now(),
				});
			}
		}
	} catch (error) {
		logger.error('[AUTH] Authentication error:', error);
		socket.emit('error', {
			code: 'AUTH_ERROR',
			message: 'Authentication error occurred',
			timestamp: Date.now(),
		});
	}
}

/**
 * Handle player joining a world
 */
async function handleJoinWorld(socket: Socket, data: JoinWorldData): Promise<void> {
	try {
		logger.info(`[WORLD] Player ${data.playerId} joining world ${data.worldId}`, {
			socketId: socket.id,
		});

		// Store world ID in socket data
		socket.data.worldId = data.worldId;

		// Join Socket.IO room for world-specific broadcasts
		await socket.join(`world:${data.worldId}`);

		// DEBUG: Log room membership (development only)
		if (process.env.NODE_ENV === 'development') {
			const roomName = `world:${data.worldId}`;
			const room = socket.nsp.adapter.rooms.get(roomName);
			logger.info('[WORLD] Socket joined room', {
				socketId: socket.id,
				playerId: data.playerId,
				worldId: data.worldId,
				roomName,
				clientsInRoom: room?.size || 0,
				socketRooms: Array.from(socket.rooms),
			});
		}

		// Notify player they joined
		socket.emit('world-joined', {
			worldId: data.worldId,
			timestamp: Date.now(),
		});

		// Send initial resource production/consumption rates for player's settlements
		await sendInitialResourceData(socket, data.playerId, data.worldId);

		// Notify others in the world
		socket.to(`world:${data.worldId}`).emit('player-joined', {
			playerId: data.playerId,
			timestamp: Date.now(),
		});

		logger.info(`[WORLD] Player ${data.playerId} joined world ${data.worldId}`, {
			socketId: socket.id,
		});
	} catch (error) {
		logger.error('[WORLD] Error joining world:', error);
		socket.emit('error', {
			code: 'JOIN_WORLD_ERROR',
			message: 'Failed to join world',
			timestamp: Date.now(),
		});
	}
}

/**
 * Send initial resource production/consumption data for a player's settlements
 * Called when player joins world to populate initial rates
 */
async function sendInitialResourceData(
	socket: Socket,
	playerId: string,
	worldId: string
): Promise<void> {
	try {
		// Get player's settlements in this world
		const playerSettlements = await db.query.settlements.findMany({
			where: eq(settlements.playerProfileId, playerId),
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
				structures: {
					with: {
						structure: true,
						modifiers: true, // Include modifiers for population capacity calculation
					},
				},
			},
		});

		// Filter to settlements in this world
		const settlementsInWorld = playerSettlements.filter(
			(s) => s.tile?.region?.worldId === worldId
		);

		if (settlementsInWorld.length === 0) {
			logger.debug('[INITIAL DATA] No settlements found for player in world', {
				playerId,
				worldId,
			});
			return;
		}

		// Send resource data for each settlement
		for (const settlement of settlementsInWorld) {
			if (!settlement.tile || !settlement.storage) continue;

			// Get extractors (production structures)
			const extractors = settlement.structures?.filter(
				(s: { extractorType: string | null }) => s.extractorType != null
			) || [];

			// Calculate TICK_RATE interval production (10 seconds = 600 ticks at 60Hz)
			const TICK_RATE = 60;
			const RESOURCE_INTERVAL_SEC = Number.parseInt(
				process.env.RESOURCE_INTERVAL_SEC || '10',
				10
			);
			const ticksForInterval = RESOURCE_INTERVAL_SEC * TICK_RATE;

			// Get world template multipliers
			const worldTemplate = getWorldTemplateConfig(
				settlement.tile.region?.world?.worldTemplateType || 'STANDARD'
			);
			const productionMultiplier = worldTemplate.productionMultiplier;
			const consumptionMultiplier = worldTemplate.consumptionMultiplier;

			// Calculate production for the interval
			const production = calculateProduction(
				settlement.tile,
				extractors,
				ticksForInterval,
				settlement.tile.biome?.name,
				productionMultiplier
			);

			// Calculate consumption for the interval
			const population = calculatePopulation(settlement.structures || []);
			const consumption = calculateConsumption(
				population,
				settlement.structures?.length || 0,
				ticksForInterval,
				consumptionMultiplier
			);

			// Calculate net production
			const netProduction = {
				food: production.food - consumption.food,
				water: production.water - consumption.water,
				wood: production.wood - consumption.wood,
				stone: production.stone - consumption.stone,
				ore: production.ore - consumption.ore,
			};

			// Send resource-update event with initial rates
			socket.emit('resource-update', {
				type: 'auto-production' as const,
				settlementId: settlement.id,
				resources: {
					food: settlement.storage.food,
					water: settlement.storage.water,
					wood: settlement.storage.wood,
					stone: settlement.storage.stone,
					ore: settlement.storage.ore,
				},
				production,
				consumption,
				netProduction,
				population,
				timestamp: Date.now(),
			});

			// Send population-state event with initial capacity
			const popState = calculatePopulationState(
				settlement.structures || [],
				settlement.population?.currentPopulation || 0
			);

			socket.emit('population-state', {
				settlementId: settlement.id,
				current: popState.current,
				capacity: popState.capacity,
				happiness: popState.happiness,
				happinessDescription: popState.happinessDescription,
				growthRate: popState.growthRate,
				status: popState.status,
				timestamp: Date.now(),
			});

			logger.debug('[INITIAL DATA] Sent initial resource and population data', {
				settlementId: settlement.id,
				production,
				consumption,
				populationCapacity: popState.capacity,
			});
		}
	} catch (error) {
		logger.error('[INITIAL DATA] Error sending initial resource data:', error);
	}
}

/**
 * Handle player leaving a world
 */
async function handleLeaveWorld(socket: Socket, data: LeaveWorldData): Promise<void> {
	try {
		logger.info(`[WORLD] Player ${data.playerId} leaving world ${data.worldId}`, {
			socketId: socket.id,
		});

		// Leave Socket.IO room
		await socket.leave(`world:${data.worldId}`);

		// Notify others in the world
		socket.to(`world:${data.worldId}`).emit('player-left', {
			playerId: data.playerId,
			timestamp: Date.now(),
		});

		// Clear world ID from socket data
		socket.data.worldId = undefined;

		logger.info(`[WORLD] Player ${data.playerId} left world ${data.worldId}`, {
			socketId: socket.id,
		});
	} catch (error) {
		logger.error('[WORLD] Error leaving world:', error);
	}
}

/**
 * Handle game state request
 */
async function handleGameStateRequest(socket: Socket, data: GameStateRequest): Promise<void> {
	try {
		logger.info(`[STATE] State requested for world ${data.worldId}`, {
			socketId: socket.id,
			playerId: socket.data.playerId,
		});

		// Verify player is authenticated
		if (!socket.data.playerId) {
			socket.emit('error', {
				code: 'AUTH_REQUIRED',
				message: 'Authentication required',
				timestamp: Date.now(),
			});
			return;
		}

		// Fetch player's settlements
		const settlements = await getPlayerSettlements(socket.data.playerId);

		// Send game state to client
		socket.emit('game-state', {
			worldId: data.worldId,
			state: {
				settlements: settlements,
				playerId: socket.data.playerId,
			},
			timestamp: Date.now(),
		});

		logger.info('[STATE] Game state sent successfully', {
			playerId: socket.data.playerId,
			settlementCount: settlements.length,
		});
	} catch (error) {
		logger.error('[STATE] Error fetching game state:', error);
		socket.emit('error', {
			code: 'STATE_ERROR',
			message: 'Failed to fetch game state',
			timestamp: Date.now(),
		});
	}
}

/**
 * Handle structure building
 */
async function handleBuildStructure(
	socket: Socket,
	data: BuildStructureData,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	callback?: (response: any) => void
): Promise<void> {
	try {
		logger.info(
			`[ACTION] Building structure: ${data.structureType} in settlement ${data.settlementId}`,
			{
				socketId: socket.id,
				playerId: socket.data.playerId,
			}
		);

		// Verify player is authenticated
		if (!socket.data.playerId) {
			const errorResponse = {
				success: false,
				error: 'Authentication required',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Get settlement with storage
		const settlementData = await getSettlementWithDetails(data.settlementId);

		if (!settlementData?.settlement) {
			const errorResponse = {
				success: false,
				error: 'Settlement not found',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Verify ownership
		if (settlementData.settlement.playerProfileId !== socket.data.playerId) {
			const errorResponse = {
				success: false,
				error: 'You do not own this settlement',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		const storage = settlementData.storage;
		if (!storage) {
			const errorResponse = {
				success: false,
				error: 'Settlement storage not found',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Validate structure type exists in our centralized config
		const normalizedStructureType = data.structureType.toUpperCase();
		if (!isValidStructure(normalizedStructureType)) {
			const errorResponse = {
				success: false,
				error: `Unknown structure type: ${data.structureType}`,
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Get structure configuration from centralized source (GDD-accurate costs)
		const structureConfig = getStructureCostByName(normalizedStructureType);
		if (!structureConfig) {
			const errorResponse = {
				success: false,
				error: `Structure configuration not found: ${data.structureType}`,
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Check if player has enough resources
		const currentResources = {
			food: storage.food,
			water: storage.water,
			wood: storage.wood,
			stone: storage.stone,
			ore: storage.ore,
		};

		// Convert optional costs to required Resources type with defaults
		const requiredResources: Resources = {
			food: structureConfig.costs.food ?? 0,
			water: structureConfig.costs.water ?? 0,
			wood: structureConfig.costs.wood ?? 0,
			stone: structureConfig.costs.stone ?? 0,
			ore: structureConfig.costs.ore ?? 0,
		};

		const hasResources = hasEnoughResources(currentResources, requiredResources);
		if (!hasResources) {
			const errorResponse = {
				success: false,
				error: 'Insufficient resources to build structure',
				required: requiredResources,
				current: currentResources,
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Deduct resources
		const newResources = subtractResources(currentResources, requiredResources);
		await updateSettlementStorage(storage.id, newResources);

		// Get structure modifiers from config
		const modifiers = getStructureModifiers(structureConfig.name);

		// Check if this is an extractor (needs tileId and slotPosition)
		let tileId: string | null = null;
		let slotPosition: number | null = null;

		if (structureConfig.category === 'EXTRACTOR') {
			// Auto-assign to settlement's founding tile (temporary solution)
			// TODO: UI should let player select tile and slot via grid interface
			tileId = settlementData.settlement.tileId;

			// Find next available slot on this tile (0-4)
			const existingExtractors = (await getSettlementStructures(data.settlementId)).filter(
				(s) => s.structureDef?.category == 'EXTRACTOR' && s.structure.tileId === tileId
			);

			// Find first available slot (0-4)
			const usedSlots = new Set(
				existingExtractors.map((e) => e.structure.slotPosition).filter((s) => s !== null)
			);
			for (let slot = 0; slot < settlementData.settlement.plotSlots; slot++) {
				if (!usedSlots.has(slot)) {
					slotPosition = slot;
					break;
				}
			}

			// If no slots available, return error
			if (slotPosition === null) {
				const errorResponse = {
					success: false,
					error: 'No available slots on settlement tile. All 5 slots occupied.',
					timestamp: Date.now(),
				};
				return callback ? callback(errorResponse) : undefined;
			}

			logger.info(`[EXTRACTOR] Auto-assigned to tile ${tileId}, slot ${slotPosition}`, {
				structureType: structureConfig.name,
				settlementId: data.settlementId,
			});
		}

		// Create the structure with all required data
		const structureResult = await createStructure(
			data.settlementId,
			structureConfig.name,
			structureConfig.description,
			{
				food: requiredResources.food,
				water: requiredResources.water,
				wood: requiredResources.wood,
				stone: requiredResources.stone,
				ore: requiredResources.ore,
			},
			modifiers,
			tileId,
			slotPosition
		);

		const response = {
			success: true,
			settlementId: data.settlementId,
			structure: structureResult.structure,
			remainingResources: newResources,
			timestamp: Date.now(),
		};

		// Acknowledge action
		if (callback) {
			callback(response);
		} else {
			socket.emit('structure-built', response);
		}

		// Broadcast to world
		if (socket.data.worldId) {
			socket.to(`world:${socket.data.worldId}`).emit('state-update', {
				type: 'structure-built',
				settlementId: data.settlementId,
				structureId: structureResult.structure.id,
				structureName: structureConfig.name,
				playerId: socket.data.playerId,
				timestamp: Date.now(),
			});
		}

		logger.info('[ACTION] Structure built successfully', {
			settlementId: data.settlementId,
			structureId: structureResult.structure.id,
			structureType: data.structureType,
			playerId: socket.data.playerId,
		});

		// ===== RECALCULATE POPULATION STATE AFTER BUILDING STRUCTURE =====
		// The new structure may have modifiers that affect population capacity (e.g., HOUSE +5)
		// We need to recalculate and emit the updated population state immediately
		try {
			logger.debug('[POPULATION RECALC] Starting recalculation after structure built', {
				settlementId: data.settlementId,
				structureType: data.structureType,
			});

			// Fetch ALL structures for this settlement (including the one we just built)
			const structureData = await getSettlementStructures(data.settlementId);
			logger.debug('[POPULATION RECALC] Fetched structure data', {
				settlementId: data.settlementId,
				rowCount: structureData.length,
				rows: structureData.map((r) => ({
					structureName: r.structureDef?.name,
					level: r.structure.level,
					modifier: r.modifiers ? `${r.modifiers.name}=${r.modifiers.value}` : null,
				})),
			});

			// Transform structure data (deduplicate modifiers like game-loop.ts does)
			const structures = structureData.reduce(
				(acc, row) => {
					if (!row.structureDef) return acc;

					// Find or create structure entry
					let structure = acc.find((s) => s.name === row.structureDef?.name);
					if (!structure) {
						structure = {
							name: row.structureDef.name,
							level: row.structure.level,
							modifiers: [],
						};
						acc.push(structure);
					}

					// Add modifier if it exists and hasn't been added yet
					if (row.modifiers) {
						const modifierExists = structure.modifiers.some(
							(m) =>
								m.name === row.modifiers!.name && m.value === row.modifiers!.value
						);
						if (!modifierExists) {
							structure.modifiers.push({
								name: row.modifiers.name,
								value: row.modifiers.value,
							});
						}
					}

					return acc;
				},
				[] as Array<{
					name: string;
					level: number;
					modifiers: Array<{ name: string; value: number }>;
				}>
			);

			logger.debug('[POPULATION RECALC] Transformed structures', {
				settlementId: data.settlementId,
				structureCount: structures.length,
				structures: structures.map((s) => ({
					name: s.name,
					level: s.level,
					modifierCount: s.modifiers.length,
					modifiers: s.modifiers.map((m) => `${m.name}=${m.value}`),
				})),
			});

			// Get current population data
			const popData = await db.query.settlementPopulation.findFirst({
				where: (fields, { eq }) => eq(fields.settlementId, data.settlementId),
			});

			if (popData) {
				logger.debug('[POPULATION RECALC] Found population data', {
					settlementId: data.settlementId,
					currentPopulation: popData.currentPopulation,
					lastGrowthTick: popData.lastGrowthTick.getTime(),
				});

				// Calculate new population state with ALL structures (deduplicated)
				const popState = calculatePopulationState(
					popData.currentPopulation,
					structures,
					newResources, // Use the NEW resource amounts after deduction
					popData.lastGrowthTick.getTime()
				);

				logger.debug('[POPULATION RECALC] Calculated new population state', {
					settlementId: data.settlementId,
					capacity: popState.capacity,
					happiness: popState.happiness,
					growthRate: popState.growthRate,
					inputs: {
						currentPopulation: popData.currentPopulation,
						structureCount: structures.length,
						hasResources: !!newResources,
					},
				});

				// Get population summary for happiness description and status
				const summary = getPopulationSummary(popState);

				// Emit the updated population state to the player
				socket.emit('population-state', {
					settlementId: data.settlementId,
					current: popData.currentPopulation,
					capacity: popState.capacity,
					happiness: summary.happiness,
					happinessDescription: summary.happinessDescription,
					growthRate: popState.growthRate,
					status: summary.status,
					timestamp: Date.now(),
				});

				// Also broadcast to other players in the world
				if (socket.data.worldId) {
					socket.to(`world:${socket.data.worldId}`).emit('population-state', {
						settlementId: data.settlementId,
						current: popData.currentPopulation,
						capacity: popState.capacity,
						happiness: summary.happiness,
						happinessDescription: summary.happinessDescription,
						growthRate: popState.growthRate,
						status: summary.status,
						timestamp: Date.now(),
					});
				}

				logger.info('[POPULATION] Population state emitted after structure build', {
					settlementId: data.settlementId,
					newCapacity: popState.capacity,
				});
			}
		} catch (popError) {
			logger.error(
				'[POPULATION] Error recalculating population after structure build:',
				popError
			);
			// Don't fail the whole operation if population update fails
		}
		// ===== END POPULATION RECALCULATION =====
	} catch (error) {
		logger.error('[ACTION] Error building structure:', error);
		const errorResponse = {
			success: false,
			error: 'Failed to build structure',
			timestamp: Date.now(),
		};

		if (callback) {
			callback(errorResponse);
		} else {
			socket.emit('error', {
				code: 'BUILD_ERROR',
				message: 'Failed to build structure',
				timestamp: Date.now(),
			});
		}
	}
}

/**
 * Handle structure upgrade
 */
async function handleUpgradeStructure(
	socket: Socket,
	data: UpgradeStructureData,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	callback?: (response: any) => void
): Promise<void> {
	try {
		logger.info(
			`[ACTION] Upgrading structure: ${data.structureType} (${data.structureId}) in settlement ${data.settlementId}`,
			{
				socketId: socket.id,
				playerId: socket.data.playerId,
			}
		);

		// Verify player is authenticated
		if (!socket.data.playerId) {
			const errorResponse = {
				success: false,
				error: 'Authentication required',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Get settlement with storage
		const settlementData = await getSettlementWithDetails(data.settlementId);

		if (!settlementData?.settlement) {
			const errorResponse = {
				success: false,
				error: 'Settlement not found',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Verify ownership
		if (settlementData.settlement.playerProfileId !== socket.data.playerId) {
			const errorResponse = {
				success: false,
				error: 'You do not own this settlement',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		const storage = settlementData.storage;
		if (!storage) {
			const errorResponse = {
				success: false,
				error: 'Settlement storage not found',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Find the structure to upgrade
		const structures = await getSettlementStructures(data.settlementId);
		const structureToUpgrade = structures.find((s) => s.structure.id === data.structureId);

		if (!structureToUpgrade) {
			const errorResponse = {
				success: false,
				error: 'Structure not found in this settlement',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		const currentLevel = structureToUpgrade.structure.level;
		const maxLevel = 5; // Default max level (could be from config)

		// Check if already at max level
		if (currentLevel >= maxLevel) {
			const errorResponse = {
				success: false,
				error: `Structure already at maximum level (${maxLevel})`,
				currentLevel,
				maxLevel,
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Get structure configuration from centralized source
		const normalizedStructureType = data.structureType.toUpperCase();
		if (!isValidStructure(normalizedStructureType)) {
			const errorResponse = {
				success: false,
				error: `Unknown structure type: ${data.structureType}`,
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		const structureConfig = getStructureCostByName(normalizedStructureType);
		if (!structureConfig) {
			const errorResponse = {
				success: false,
				error: `Structure configuration not found: ${data.structureType}`,
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Calculate upgrade cost (base cost * 1.5 per level)
		const upgradeCostMultiplier = Math.pow(1.5, currentLevel);
		const baseCosts: Resources = {
			food: structureConfig.costs.food ?? 0,
			water: structureConfig.costs.water ?? 0,
			wood: structureConfig.costs.wood ?? 0,
			stone: structureConfig.costs.stone ?? 0,
			ore: structureConfig.costs.ore ?? 0,
		};

		const upgradeCosts: Resources = {
			food: Math.floor(baseCosts.food * upgradeCostMultiplier),
			water: Math.floor(baseCosts.water * upgradeCostMultiplier),
			wood: Math.floor(baseCosts.wood * upgradeCostMultiplier),
			stone: Math.floor(baseCosts.stone * upgradeCostMultiplier),
			ore: Math.floor(baseCosts.ore * upgradeCostMultiplier),
		};

		// Check if player has enough resources
		const currentResources = {
			food: storage.food,
			water: storage.water,
			wood: storage.wood,
			stone: storage.stone,
			ore: storage.ore,
		};

		const hasResources = hasEnoughResources(currentResources, upgradeCosts);
		if (!hasResources) {
			const errorResponse = {
				success: false,
				error: 'Insufficient resources to upgrade structure',
				required: upgradeCosts,
				current: currentResources,
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Deduct resources
		const newResources = subtractResources(currentResources, upgradeCosts);
		await updateSettlementStorage(storage.id, newResources);

		// Increment structure level
		const newLevel = currentLevel + 1;
		await db
			.update(settlementStructures)
			.set({ level: newLevel })
			.where(eq(settlementStructures.id, data.structureId));

		// Recalculate settlement modifiers (upgraded structures may change bonuses)
		await aggregateSettlementModifiers(data.settlementId);

		const response = {
			success: true,
			settlementId: data.settlementId,
			structureId: data.structureId,
			structureType: data.structureType,
			oldLevel: currentLevel,
			newLevel,
			upgradeCost: upgradeCosts,
			remainingResources: newResources,
			timestamp: Date.now(),
		};

		// Acknowledge action
		if (callback) {
			callback(response);
		} else {
			socket.emit('structure-upgraded', response);
		}

		// Broadcast to world
		if (socket.data.worldId) {
			socket.to(`world:${socket.data.worldId}`).emit('state-update', {
				type: 'structure-upgraded',
				settlementId: data.settlementId,
				structureId: data.structureId,
				structureType: data.structureType,
				newLevel,
				playerId: socket.data.playerId,
				timestamp: Date.now(),
			});
		}

		logger.info('[ACTION] Structure upgraded successfully', {
			settlementId: data.settlementId,
			structureId: data.structureId,
			structureType: data.structureType,
			oldLevel: currentLevel,
			newLevel,
			playerId: socket.data.playerId,
		});
	} catch (error) {
		logger.error('[ACTION] Error upgrading structure:', error);
		const errorResponse = {
			success: false,
			error: 'Failed to upgrade structure',
			timestamp: Date.now(),
		};

		if (callback) {
			callback(errorResponse);
		} else {
			socket.emit('error', {
				code: 'UPGRADE_ERROR',
				message: 'Failed to upgrade structure',
				timestamp: Date.now(),
			});
		}
	}
}

/**
 * Handle resource collection
 */
async function handleCollectResources(
	socket: Socket,
	data: CollectResourcesData,
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	callback?: (response: any) => void
): Promise<void> {
	try {
		logger.info(`[ACTION] Collecting resources for settlement ${data.settlementId}`, {
			socketId: socket.id,
			playerId: socket.data.playerId,
		});

		// Verify player is authenticated
		if (!socket.data.playerId) {
			const errorResponse = {
				success: false,
				error: 'Authentication required',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Fetch settlement with details from database
		const settlementData = await getSettlementWithDetails(data.settlementId);

		if (!settlementData?.settlement) {
			const errorResponse = {
				success: false,
				error: 'Settlement not found',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Verify player owns this settlement
		if (settlementData.settlement.playerProfileId !== socket.data.playerId) {
			const errorResponse = {
				success: false,
				error: 'You do not own this settlement',
				timestamp: Date.now(),
			};
			logger.warn(
				'[ACTION] Player attempted to collect resources from settlement they do not own',
				{
					playerId: socket.data.playerId,
					settlementId: data.settlementId,
					ownerId: settlementData.settlement.playerProfileId,
				}
			);
			return callback ? callback(errorResponse) : undefined;
		}

		// Get current storage
		const storage = settlementData.storage;
		const tile = settlementData.tile;

		if (!storage) {
			const errorResponse = {
				success: false,
				error: 'Settlement storage not found',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		if (!tile) {
			const errorResponse = {
				success: false,
				error: 'Settlement tile not found',
				timestamp: Date.now(),
			};
			return callback ? callback(errorResponse) : undefined;
		}

		// Fetch settlement structures to get extractors
		const structureData = await getSettlementStructures(data.settlementId);

		// Filter for extractor structures
		const extractors = structureData
			.filter((s) => s.structureDef?.category === 'EXTRACTOR')
			.map((s) => ({
				...s.structure, // Spread the settlement structure (has id, settlementId, level, etc.)
				category: s.structureDef?.category,
				extractorType: s.structureDef?.extractorType,
				buildingType: s.structureDef?.buildingType,
			}));

		// Calculate production since last update
		// Using updatedAt as last collection time
		const lastCollectionTime = settlementData.settlement.updatedAt?.getTime() || Date.now();
		const biomeName = settlementData.biome?.name;
		const production = calculateTimedProduction(
			tile,
			extractors,
			lastCollectionTime,
			Date.now(),
			biomeName
		);

		// Add production to current storage
		const newResources = addResources(
			{
				food: storage.food,
				water: storage.water,
				wood: storage.wood,
				stone: storage.stone,
				ore: storage.ore,
			},
			production
		);

		// Update storage in database
		await updateSettlementStorage(storage.id, newResources);

		const response = {
			success: true,
			settlementId: data.settlementId,
			resources: newResources,
			production: production,
			timestamp: Date.now(),
		};

		if (callback) {
			callback(response);
		} else {
			socket.emit('resources-collected', response);
		}

		logger.info('[ACTION] Resources collected successfully', {
			settlementId: data.settlementId,
			playerId: socket.data.playerId,
		});
	} catch (error) {
		logger.error('[ACTION] Error collecting resources:', error);
		const errorResponse = {
			success: false,
			error: 'Failed to collect resources',
			timestamp: Date.now(),
		};

		if (callback) {
			callback(errorResponse);
		} else {
			socket.emit('error', {
				code: 'COLLECT_ERROR',
				message: 'Failed to collect resources',
				timestamp: Date.now(),
			});
		}
	}
}

/**
 * Handle socket disconnect
 */
async function handleDisconnect(socket: Socket, reason: string): Promise<void> {
	logger.info(`[DISCONNECT] Client disconnected: ${socket.id} (${reason})`, {
		playerId: socket.data.playerId,
		worldId: socket.data.worldId,
	});

	// Notify others in the world if player was in one
	if (socket.data.worldId && socket.data.playerId) {
		socket.to(`world:${socket.data.worldId}`).emit('player-left', {
			playerId: socket.data.playerId,
			timestamp: Date.now(),
		});
	}
}

/**
 * Handle socket errors
 */
function handleError(socket: Socket, error: Error): void {
	logger.error(`[ERROR] Socket error for ${socket.id}:`, error, {
		playerId: socket.data.playerId,
		worldId: socket.data.worldId,
	});
}

/**
 * Handle world creation request
 */
async function handleCreateWorld(
	socket: Socket,
	data: CreateWorldData,
	callback?: (response: CreateWorldResponse) => void
): Promise<void> {
	const startTime = Date.now();

	logger.info(`[CREATE WORLD] Request from ${socket.id}:`, {
		worldName: data.worldName,
		serverId: data.serverId,
		seed: data.seed,
		width: data.width,
		height: data.height,
	});

	try {
		// Validate input
		if (!data.worldName?.trim()) {
			const response: CreateWorldResponse = {
				success: false,
				error: 'World name is required',
				timestamp: Date.now(),
			};
			callback?.(response);
			return;
		}

		// Create world with provided or default settings
		const result = await createWorld({
			worldName: data.worldName.trim(),
			serverId: data.serverId ?? null,
			seed: data.seed ?? Math.floor(Math.random() * 1000000),
			width: data.width ?? 100,
			height: data.height ?? 100,
			// Default noise options for natural-looking terrain
			elevationOptions: {
				amplitude: 1,
				persistence: 0.5,
				frequency: 1,
				octaves: 4,
				scale: (x: number) => x / 50,
			},
			precipitationOptions: {
				amplitude: 1,
				persistence: 0.5,
				frequency: 1,
				octaves: 3,
				scale: (x: number) => x / 60,
			},
			temperatureOptions: {
				amplitude: 1,
				persistence: 0.4,
				frequency: 1,
				octaves: 3,
				scale: (x: number) => x / 80,
			},
		});

		const response: CreateWorldResponse = {
			success: true,
			worldId: result.worldId,
			worldName: data.worldName,
			stats: {
				regionCount: result.regionCount,
				tileCount: result.tileCount,
				duration: Date.now() - startTime,
			},
			timestamp: Date.now(),
		};

		logger.info(`[CREATE WORLD] World created successfully:`, {
			worldId: result.worldId,
			worldName: data.worldName,
			stats: response.stats,
		});

		callback?.(response);
	} catch (error) {
		logger.error('[CREATE WORLD] Failed to create world:', error, {
			worldName: data.worldName,
			error: error instanceof Error ? error.message : String(error),
		});

		const response: CreateWorldResponse = {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to create world',
			timestamp: Date.now(),
		};

		callback?.(response);
	}
}

/**
 * Handle world data request
 */
async function handleRequestWorldData(
	socket: Socket,
	data: RequestWorldDataData,
	callback?: (response: WorldDataResponse) => void
): Promise<void> {
	logger.info(`[REQUEST WORLD DATA] Request from ${socket.id}:`, {
		worldId: data.worldId,
		includeRegions: data.includeRegions,
	});

	try {
		// Validate input
		if (!data.worldId?.trim()) {
			const response: WorldDataResponse = {
				success: false,
				error: 'World ID is required',
				timestamp: Date.now(),
			};
			callback?.(response);
			return;
		}

		// Import db and worlds here to avoid circular dependencies
		const { db, worlds, regions } = await import('../db/index.js');
		const { eq } = await import('drizzle-orm');

		// Get world info
		const world = await db.query.worlds.findFirst({
			where: eq(worlds.id, data.worldId),
		});

		if (!world) {
			logger.warn(`[REQUEST WORLD DATA] World not found: ${data.worldId}`);
			const response: WorldDataResponse = {
				success: false,
				error: 'World not found',
				timestamp: Date.now(),
			};
			callback?.(response);
			return;
		}

		// Optionally include region data
		let regionData: WorldDataResponse['regions'] = undefined;
		if (data.includeRegions) {
			const dbRegions = await db.query.regions.findMany({
				where: eq(regions.worldId, data.worldId),
			});

			regionData = dbRegions.map((r) => ({
				id: r.id,
				worldId: r.worldId,
				name: r.name,
				xCoord: r.xCoord,
				yCoord: r.yCoord,
				elevationMap: r.elevationMap,
				precipitationMap: r.precipitationMap,
				temperatureMap: r.temperatureMap,
			}));

			logger.info(`[REQUEST WORLD DATA] Loaded ${regionData.length} regions`);
		}

		const response: WorldDataResponse = {
			success: true,
			world: {
				id: world.id,
				name: world.name,
				serverId: world.serverId,
				elevationSettings: world.elevationSettings,
				precipitationSettings: world.precipitationSettings,
				temperatureSettings: world.temperatureSettings,
				createdAt: world.createdAt,
				updatedAt: world.updatedAt,
			},
			regions: regionData,
			timestamp: Date.now(),
		};

		logger.info(`[REQUEST WORLD DATA] Successfully loaded world: ${world.name}`);
		callback?.(response);
	} catch (error) {
		logger.error('[REQUEST WORLD DATA] Error:', error);

		const response: WorldDataResponse = {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to load world data',
			timestamp: Date.now(),
		};

		callback?.(response);
	}
}

/**
 * Handle region data request with optional tiles and plots
 */
async function handleRequestRegion(
	socket: Socket,
	data: RequestRegionData,
	callback?: (response: RegionDataResponse) => void
): Promise<void> {
	logger.info(`[REQUEST REGION] Request from ${socket.id}:`, {
		regionId: data.regionId,
		includeTiles: data.includeTiles,
	});

	try {
		// Validate input
		if (!data.regionId?.trim()) {
			const response: RegionDataResponse = {
				success: false,
				error: 'Region ID is required',
				timestamp: Date.now(),
			};
			callback?.(response);
			return;
		}

		// Import db and regions here to avoid circular dependencies
		const { db, regions } = await import('../db/index.js');
		const { eq } = await import('drizzle-orm');

		// Get region with optional tiles
		const region = await db.query.regions.findFirst({
			where: eq(regions.id, data.regionId),
			with: data.includeTiles
				? {
						tiles: true, // No plot relations - Plot table removed Nov 28, 2025
					}
				: undefined,
		});

		if (!region) {
			logger.warn(`[REQUEST REGION] Region not found: ${data.regionId}`);
			const response: RegionDataResponse = {
				success: false,
				error: 'Region not found',
				timestamp: Date.now(),
			};
			callback?.(response);
			return;
		}

		// Build response with proper types
		const responseData: RegionDataResponse = {
			success: true,
			region: {
				id: region.id,
				worldId: region.worldId,
				name: region.name,
				xCoord: region.xCoord,
				yCoord: region.yCoord,
				elevationMap: region.elevationMap,
				precipitationMap: region.precipitationMap,
				temperatureMap: region.temperatureMap,
				tiles:
					data.includeTiles && 'tiles' in region && Array.isArray(region.tiles)
						? region.tiles.map(
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								(t: any) => ({
									id: t.id,
									biomeId: t.biomeId,
									regionId: t.regionId,
									elevation: t.elevation,
									temperature: t.temperature,
									precipitation: t.precipitation,
									type: t.type,
								})
							)
						: undefined,
			},
			timestamp: Date.now(),
		};

		logger.info(`[REQUEST REGION] Successfully loaded region: ${region.name}`, {
			tileCount: responseData.region?.tiles?.length || 0,
		});

		callback?.(responseData);
	} catch (error) {
		logger.error('[REQUEST REGION] Error:', error);

		const response: RegionDataResponse = {
			success: false,
			error: error instanceof Error ? error.message : 'Failed to load region data',
			timestamp: Date.now(),
		};

		callback?.(response);
	}
}
