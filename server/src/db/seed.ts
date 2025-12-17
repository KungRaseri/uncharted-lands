/**
 * Database Seeding Script for Drizzle ORM
 *
 * Seeds initial data for the game, including biomes.
 * Run with: npx tsx src/db/seed.ts
 */

import 'dotenv/config';
import {
	db,
	biomes,
	structures,
	resources,
	structureRequirements,
	structurePrerequisites,
	accounts,
	servers,
	NewServer,
	NewWorld,
	worlds,
	regions,
	tiles,
} from './index.js';
import { createId } from '@paralleldrive/cuid2';
import { logger } from '../utils/logger.js';
import { eq, and } from 'drizzle-orm';
import { RESOURCES } from '../data/resources.js';
import { BIOMES } from '../data/biomes.js';
import { STRUCTURES } from '../data/structures.js';
import { STRUCTURE_PREREQUISITES } from '../data/structure-prerequisites.js';
import { getAllStructureCosts } from '../data/structure-costs.js';
import bcrypt from 'bcrypt';
import { isLocalDevelopment } from '../utils/environment.js';
// World generation imports moved to dynamic imports inside functions to avoid loading in production

/**
 * Biome definitions with environmental parameters and modifiers
 * Generated from master data file: src/data/biomes.ts
 */
const biomeData = BIOMES.map((biome) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { id: _id, ...biomeWithoutId } = biome;
	return {
		id: createId(),
		...biomeWithoutId,
	};
});

/**
 * Resource Master Data
 * Generated from master data file: src/data/resources.ts
 */
const resourcesData = RESOURCES.map((resource) => {
	return {
		id: createId(),
		...resource,
	};
});

/**
 * Structure Master Data
 * Generated from master data file: src/data/structures.ts
 * Enriched with metadata from structure-costs.ts for tier, construction time, and population
 */
const structuresData = STRUCTURES.map((structure) => {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { requirements: _requirements, ...structureWithoutRequirements } = structure;

	// Get metadata from structure-costs.ts
	const allCosts = getAllStructureCosts();
	// Match by structure name (e.g., 'Tent', 'House'), converted to uppercase to match cost definition IDs
	// Remove apostrophes and replace spaces with underscores (e.g., "Hunter's Lodge" → "HUNTING_LODGE")
	const structureName = structure.name.toUpperCase().replaceAll("'", '').replaceAll(/\s+/g, '_');
	const costDef = allCosts.find((c) => c.id === structureName || c.name === structureName);

	if (!costDef) {
		throw new Error(
			`Cost definition not found for structure: ${structure.name} (looking for ${structureName})`
		);
	}

	return {
		id: createId(),
		...structureWithoutRequirements,
		tier: costDef.tier,
		constructionTimeSeconds: costDef.constructionTimeSeconds,
		populationRequired: costDef.populationRequired,
		displayName: costDef.displayName,
	};
});

/**
 * Structure Requirements Data
 * Maps structures to their resource costs (using names for lookup)
 * Based on client/src/lib/game/structures.ts
 */
const structureRequirementsData = STRUCTURES.flatMap((structure) =>
	Object.entries(structure.requirements)
		.filter(([_, quantity]) => quantity && quantity > 0)
		.map(([resourceKey, quantity]) => {
			const resource = RESOURCES.find((r) => r.name === resourceKey);
			if (!resource) {
				throw new Error(
					`Resource with name "${resourceKey}" not found for structure "${structure.name}"`
				);
			}
			return {
				structureName: structure.name,
				resourceName: resource.name,
				quantity: quantity,
			};
		})
);

/**
 * Seed resources with upsert logic (create or update)
 */

async function seedResources() {
	logger.info(`[SEED] Starting resource seeding...`);

	let created = 0;
	let updated = 0;

	for (const resource of resourcesData) {
		try {
			// Check if resource exists
			const existing = await db.query.resources.findFirst({
				where: eq(resources.name, resource.name),
			});

			if (existing) {
				// Update existing resource (exclude id from update)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id: _id, ...resourceDataWithoutId } = resource;
				await db
					.update(resources)
					.set(resourceDataWithoutId)
					.where(eq(resources.name, resource.name));
				updated++;
				logger.info(`[SEED] Updated resource: ${resource.name}`);
			} else {
				// Insert new resource
				await db.insert(resources).values(resource);
				created++;
				logger.info(`[SEED] Created resource: ${resource.name}`);
			}
		} catch (error) {
			logger.error(`[SEED] Error seeding resource ${resource.name}:`, error);
			throw error;
		}
	}

	return { created, updated, total: resourcesData.length };
}

/**
 * Seed structures with upsert logic (create or update)
 */

async function seedStructures() {
	logger.info(`[SEED] Starting structure seeding...`);

	let created = 0;
	let updated = 0;

	for (const structure of structuresData) {
		try {
			// Check if structure exists
			const existing = await db.query.structures.findFirst({
				where: eq(structures.name, structure.name),
			});

			if (existing) {
				// Update existing structure (exclude id from update)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id: _id, ...structureDataWithoutId } = structure;
				await db
					.update(structures)
					.set(structureDataWithoutId)
					.where(eq(structures.name, structure.name));
				updated++;
				logger.info(`[SEED] Updated structure: ${structure.name}`);
			} else {
				// Insert new structure
				await db.insert(structures).values(structure);
				created++;
				logger.info(`[SEED] Created structure: ${structure.name}`);
			}
		} catch (error) {
			logger.error(`[SEED] Error seeding structure ${structure.name}:`, error);
			throw error;
		}
	}

	return { created, updated, total: structuresData.length };
}

/**
 * Seed structure requirements with upsert logic (create or update)
 * Links structures to their resource costs using composite key lookup
 */

async function seedStructureRequirements() {
	logger.info(`[SEED] Starting structure requirements seeding...`);

	let created = 0;
	let updated = 0;

	for (const req of structureRequirementsData) {
		try {
			// Look up structure and resource IDs by name
			const structure = await db.query.structures.findFirst({
				where: eq(structures.name, req.structureName),
			});

			const resource = await db.query.resources.findFirst({
				where: eq(resources.name, req.resourceName),
			});

			if (!structure) {
				logger.warn(`[SEED] Structure not found: ${req.structureName}`);
				continue;
			}

			if (!resource) {
				logger.warn(`[SEED] Resource not found: ${req.resourceName}`);
				continue;
			}

			// Check if requirement exists (composite key: structureId + resourceId)
			const existing = await db.query.structureRequirements.findFirst({
				where: and(
					eq(structureRequirements.structureId, structure.id),
					eq(structureRequirements.resourceId, resource.id)
				),
			});

			if (existing) {
				// Update existing requirement
				await db
					.update(structureRequirements)
					.set({ quantity: req.quantity })
					.where(
						and(
							eq(structureRequirements.structureId, structure.id),
							eq(structureRequirements.resourceId, resource.id)
						)
					);
				updated++;
			} else {
				// Insert new requirement
				await db.insert(structureRequirements).values({
					id: createId(),
					structureId: structure.id,
					resourceId: resource.id,
					quantity: req.quantity,
				});
				created++;
			}
		} catch (error) {
			logger.error(
				`[SEED] Error seeding requirement ${req.structureName} -> ${req.resourceName}:`,
				error
			);
			throw error;
		}
	}

	return { created, updated, total: structureRequirementsData.length };
}

/**
 * Seed structure prerequisites with upsert logic (create or update)
 */
async function seedStructurePrerequisites() {
	logger.info(`[SEED] Starting structure prerequisites seeding...`);

	let created = 0;
	let updated = 0;

	for (const prerequisite of STRUCTURE_PREREQUISITES) {
		try {
			// Resolve structure names to IDs
			const structure = await db
				.select({ id: structures.id })
				.from(structures)
				.where(eq(structures.name, prerequisite.structureName))
				.limit(1);

			const requiredStructure = await db
				.select({ id: structures.id })
				.from(structures)
				.where(eq(structures.name, prerequisite.requiredStructureName))
				.limit(1);

			if (structure.length === 0) {
				logger.warn(
					`[SEED] Structure "${prerequisite.structureName}" not found, skipping prerequisite`
				);
				continue;
			}

			if (requiredStructure.length === 0) {
				logger.warn(
					`[SEED] Required structure "${prerequisite.requiredStructureName}" not found, skipping prerequisite`
				);
				continue;
			}

			const structureId = structure[0].id;
			const requiredStructureId = requiredStructure[0].id;

			// Check if prerequisite already exists
			const existing = await db
				.select()
				.from(structurePrerequisites)
				.where(
					and(
						eq(structurePrerequisites.structureId, structureId),
						eq(structurePrerequisites.requiredStructureId, requiredStructureId)
					)
				)
				.limit(1);

			if (existing.length > 0) {
				// Update existing prerequisite
				await db
					.update(structurePrerequisites)
					.set({
						requiredLevel: prerequisite.requiredLevel,
					})
					.where(eq(structurePrerequisites.id, existing[0].id));
				updated++;
			} else {
				// Insert new prerequisite
				await db.insert(structurePrerequisites).values({
					id: createId(),
					structureId: structureId,
					requiredStructureId: requiredStructureId,
					requiredLevel: prerequisite.requiredLevel,
				});
				created++;
			}
		} catch (error) {
			logger.error(
				`[SEED] Error seeding prerequisite ${prerequisite.structureName} -> ${prerequisite.requiredStructureName}:`,
				error
			);
			throw error;
		}
	}

	return { created, updated, total: STRUCTURE_PREREQUISITES.length };
}

/**
 * Seed biomes with upsert logic (create or update)
 */
async function seedBiomes() {
	logger.info(`[SEED] Starting biome seeding...`);

	let created = 0;
	let updated = 0;

	for (const biome of biomeData) {
		try {
			// Check if biome exists
			const existing = await db.query.biomes.findFirst({
				where: eq(biomes.name, biome.name),
			});

			if (existing) {
				// Update existing biome (preserve existing ID)
				// eslint-disable-next-line @typescript-eslint/no-unused-vars
				const { id: _id, ...biomeDataWithoutId } = biome;
				await db.update(biomes).set(biomeDataWithoutId).where(eq(biomes.name, biome.name));

				logger.info(`[SEED] Updated biome: ${biome.name} [ID: ${existing.id}]`);
				updated++;
			} else {
				// Insert new biome
				await db.insert(biomes).values(biome);

				logger.info(`[SEED] Created biome: ${biome.name} [ID: ${biome.id}]`);
				created++;
			}
		} catch (error) {
			logger.error(`[SEED] Failed to seed biome ${biome.name}:`, error);
			throw error;
		}
	}

	logger.info(`[SEED] Biome seeding complete: ${created} created, ${updated} updated`);

	return { created, updated, total: biomeData.length };
}

/**
 * Seed admin and test user accounts with upsert logic
 */
async function seedAccounts() {
	logger.info(`[SEED] Starting account seeding...`);

	const BCRYPT_ROUNDS = 10;
	let created = 0;
	let updated = 0;

	// Admin account data
	const adminAccountData = {
		email: 'admin@uncharted-lands.com',
		password: 'Admin123!',
		role: 'ADMINISTRATOR' as const,
		username: 'Admin',
		picture: '/avatars/admin.png',
	};

	// Test user account data
	const testUserData = {
		email: 'test@uncharted-lands.com',
		password: 'Test123!',
		role: 'MEMBER' as const,
		username: 'TestUser',
		picture: '/avatars/test-user.png',
	};

	const accountsToSeed = [adminAccountData, testUserData];

	for (const accountData of accountsToSeed) {
		try {
			// Check if account exists
			const existingAccount = await db.query.accounts.findFirst({
				where: eq(accounts.email, accountData.email),
			});

			if (existingAccount) {
				logger.info(`[SEED] Account already exists: ${accountData.email}`);
				updated++;
				continue;
			}

			// Hash the password
			const passwordHash = await bcrypt.hash(accountData.password, BCRYPT_ROUNDS);

			// Create account
			const accountId = createId();
			const userAuthToken = createId();

			await db.insert(accounts).values({
				id: accountId,
				email: accountData.email,
				passwordHash,
				userAuthToken,
				role: accountData.role,
			});

			created++;
			logger.info(`[SEED] Created account: ${accountData.email} (${accountData.role})`);
			logger.info(`[SEED]   Username: ${accountData.username}`);
			logger.info(`[SEED]   Password: ${accountData.password}`);
		} catch (error) {
			logger.error(`[SEED] Error seeding account ${accountData.email}:`, error);
			throw error;
		}
	}

	logger.info(`[SEED] Account seeding complete: ${created} created, ${updated} skipped`);

	return { created, updated, total: accountsToSeed.length };
}

async function seedServer() {
	logger.info(`[SEED] Starting server seeding...`);

	const serverData: NewServer = {
		id: createId(),
		name: 'MAIN-DEV',
		hostname: 'main.dev.localhost',
		port: 5000,
		createdAt: new Date(),
		updatedAt: new Date(),
		status: 'ONLINE',
	};

	return await db.insert(servers).values(serverData).returning({ id: servers.id });
}

async function seedWorld(serverId: string) {
	logger.info(`[SEED] Starting world seeding...`);

	const worldData: NewWorld = {
		id: createId(),
		name: 'MAIN',
		elevationSettings: {
			scale: 1,
			octaves: 8,
			amplitude: 1,
			frequency: 0.05,
			persistence: 0.5,
		},
		precipitationSettings: {
			scale: 1,
			octaves: 8,
			amplitude: 1,
			frequency: 0.05,
			persistence: 0.5,
		},
		temperatureSettings: {
			scale: 1,
			octaves: 8,
			amplitude: 1,
			frequency: 0.05,
			persistence: 0.5,
		},
		status: 'ready',
		worldTemplateType: 'STANDARD',
		worldTemplateConfig: {
			id: 'STANDARD',
			name: 'Standard Mode',
			description:
				'Balanced gameplay recommended for most players and first playthroughs. Low magic, normal resources, balanced disasters.',
			magicLevel: 'LOW',
			difficulty: 'NORMAL',
			resourceAbundance: 'NORMAL',
			depletionEnabled: true,
			depletionRate: 1,
			productionMultiplier: 1,
			consumptionMultiplier: 1,
			populationGrowthRate: 1,
			disasterFrequency: 'NORMAL',
			disasterSeverity: 'NORMAL',
			specialResourcesEnabled: true,
			npcSettlementsEnabled: true,
		},
		serverId: serverId,
		createdAt: new Date(),
		updatedAt: new Date(),
	};

	return await db.insert(worlds).values(worldData).returning({ id: worlds.id });
}

/**
 * Seed regions for a world using world generation settings
 */
async function seedRegions(worldId: string) {
	logger.info(`[SEED] Starting region seeding for world ${worldId}...`);

	// Dynamic import of world generation utilities (only loaded in development)
	const { generateWorldLayers } = await import('../game/world-generator.js');

	// Get the world settings
	const world = await db.query.worlds.findFirst({
		where: eq(worlds.id, worldId),
	});

	if (!world) {
		throw new Error(`World not found: ${worldId}`);
	}

	// Use the world's settings to generate regions
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const mapOptions: any = {
		serverId: world.serverId,
		worldName: world.name,
		width: 100, // Default to 100x100 for development
		height: 100,
		seed: Date.now(),
	};

	// Cast settings to any to access properties (they're stored as JSON)
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const elevationSettings = world.elevationSettings as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const precipitationSettings = world.precipitationSettings as any;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const temperatureSettings = world.temperatureSettings as any;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const elevationOptions: any = {
		amplitude: elevationSettings?.amplitude || 1,
		persistence: elevationSettings?.persistence || 0.5,
		frequency: elevationSettings?.frequency || 0.05,
		octaves: elevationSettings?.octaves || 8,
		scale: (x: number) => x * (elevationSettings?.scale || 1),
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const precipitationOptions: any = {
		amplitude: precipitationSettings?.amplitude || 1,
		persistence: precipitationSettings?.persistence || 0.5,
		frequency: precipitationSettings?.frequency || 0.05,
		octaves: precipitationSettings?.octaves || 8,
		scale: (x: number) => x * (precipitationSettings?.scale || 1),
	};

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const temperatureOptions: any = {
		amplitude: temperatureSettings?.amplitude || 1,
		persistence: temperatureSettings?.persistence || 0.5,
		frequency: temperatureSettings?.frequency || 0.05,
		octaves: temperatureSettings?.octaves || 8,
		scale: (x: number) => x * (temperatureSettings?.scale || 1),
	};

	// Generate world layers
	logger.info(`[SEED] Generating world layers...`);
	const regionData = await generateWorldLayers(
		mapOptions,
		elevationOptions,
		precipitationOptions,
		temperatureOptions
	);

	// Create region records
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const regionRecords = regionData.map((region: any) => ({
		id: createId(),
		worldId: worldId,
		name: `Region ${region.xCoord},${region.yCoord}`,
		xCoord: region.xCoord,
		yCoord: region.yCoord,
		elevationMap: region.elevationMap,
		precipitationMap: region.precipitationMap,
		temperatureMap: region.temperatureMap,
	}));

	logger.info(`[SEED] Inserting ${regionRecords.length} regions...`);

	// Insert regions in batches
	const regionBatchSize = 100;
	for (let i = 0; i < regionRecords.length; i += regionBatchSize) {
		const batch = regionRecords.slice(i, i + regionBatchSize);
		await db.insert(regions).values(batch);
		logger.info(`[SEED] Inserted regions ${i} to ${i + batch.length}`);
	}

	logger.info(`[SEED] Region seeding complete: ${regionRecords.length} regions created`);

	return { created: regionRecords.length, regions: regionRecords };
}

interface RegionRecord {
	id: string;
	worldId: string;
	name: string;
	xCoord: number;
	yCoord: number;
	elevationMap: number[][];
	precipitationMap: number[][];
	temperatureMap: number[][];
}

/**
 * Seed tiles for all regions in a world
 */
async function seedTiles(regionResult: { created: number; regions: RegionRecord[] }) {
	logger.info(`[SEED] Starting tile seeding for ${regionResult.created} regions...`);

	// Dynamic import of utility functions (only loaded in development)
	const { normalizeValue } = await import('../game/world-generator.js');
	const { getAllBiomes, findBiome } = await import('./queries.js');
	const { calculateResourceQuality, calculatePlotSlots, determineSpecialResource } =
		await import('../utils/resource-quality.js');

	// Load all biomes from database
	const allBiomes = await getAllBiomes();

	if (allBiomes.length === 0) {
		throw new Error('No biomes found in database. Please ensure biomes are seeded first.');
	}

	logger.info(`[SEED] Loaded ${allBiomes.length} biomes`);

	// Generate tiles for each region
	const tileRecords: Array<{
		id: string;
		regionId: string;
		biomeId: string;
		type: 'OCEAN' | 'LAND';
		elevation: number;
		precipitation: number;
		temperature: number;
		xCoord: number;
		yCoord: number;
		foodQuality: number;
		waterQuality: number;
		woodQuality: number;
		stoneQuality: number;
		oreQuality: number;
		plotSlots: number;
		specialResource?: 'GEMS' | 'EXOTIC_WOOD' | 'MAGICAL_HERBS' | 'ANCIENT_STONE' | null;
	}> = [];

	const seed = Date.now();
	let processedRegions = 0;

	for (const region of regionResult.regions) {
		const elevationMap = region.elevationMap;
		const precipitationMap = region.precipitationMap;
		const temperatureMap = region.temperatureMap;

		for (const [x, row] of elevationMap.entries()) {
			for (const [y, elevation] of row.entries()) {
				const type = elevation < 0 ? 'OCEAN' : 'LAND';
				const normalizedPrecip = normalizeValue(precipitationMap[x][y], 0, 450);
				const normalizedTemp = normalizeValue(temperatureMap[x][y], -10, 32);

				const biome = await findBiome(normalizedPrecip, normalizedTemp);

				if (!biome?.id) {
					throw new Error(
						`Failed to determine biome for tile at region ${region.xCoord}:${region.yCoord}, tile ${x}:${y}`
					);
				}

				// Calculate resource quality based on biome
				const tileSeed = seed + x * 1000 + y;
				const resourceQuality = calculateResourceQuality(biome, tileSeed);
				const plotSlots = calculatePlotSlots(biome);
				const specialResource = determineSpecialResource(biome, (tileSeed % 100) / 100);

				tileRecords.push({
					id: createId(),
					regionId: region.id,
					biomeId: biome.id,
					type,
					elevation: elevationMap[x][y],
					precipitation: precipitationMap[x][y],
					temperature: temperatureMap[x][y],
					xCoord: x,
					yCoord: y,
					foodQuality: resourceQuality.foodQuality,
					waterQuality: resourceQuality.waterQuality,
					woodQuality: resourceQuality.woodQuality,
					stoneQuality: resourceQuality.stoneQuality,
					oreQuality: resourceQuality.oreQuality,
					plotSlots,
					specialResource,
				});
			}
		}

		processedRegions++;
		if (processedRegions % 10 === 0) {
			logger.info(
				`[SEED] Processed ${processedRegions}/${regionResult.regions.length} regions`
			);
		}
	}

	logger.info(`[SEED] Generated ${tileRecords.length} tiles`);
	logger.info(`[SEED] Inserting tiles into database...`);

	// Insert tiles in batches
	const tileBatchSize = 500;
	for (let i = 0; i < tileRecords.length; i += tileBatchSize) {
		const batch = tileRecords.slice(i, i + tileBatchSize);
		await db.insert(tiles).values(batch);
		logger.info(`[SEED] Inserted tiles ${i} to ${i + batch.length}`);
	}

	logger.info(`[SEED] Tile seeding complete: ${tileRecords.length} tiles created`);

	return { created: tileRecords.length };
}

/**
 * ✅ Phase 4: Seed Settlement Modifiers
 *
 * NOTE: Currently not used because seed script doesn't create test settlements/structures.
 * When test settlements are added in the future, call this function to pre-populate
 * settlement modifier aggregations.
 *
 * This demonstrates how to use the aggregator after creating settlements with structures.
 * In practice, the lifecycle hooks added in Task 4.5 (structures.ts) will handle this
 * automatically during normal gameplay.
 *
 * @param settlementIds - Array of settlement IDs to aggregate modifiers for
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function seedSettlementModifiers(settlementIds: string[]) {
	logger.info('[SEED] Starting settlement modifier aggregation for test data...');

	// Dynamic import to avoid loading in production when not needed
	const { aggregateSettlementModifiers } =
		await import('../game/settlement-modifier-aggregator.js');

	let successCount = 0;
	let errorCount = 0;

	for (const settlementId of settlementIds) {
		try {
			await aggregateSettlementModifiers(settlementId);
			successCount++;
			logger.debug(`[SEED] Aggregated modifiers for settlement ${settlementId}`);
		} catch (error) {
			errorCount++;
			logger.error(`[SEED] Failed to aggregate modifiers for settlement ${settlementId}`, {
				error: error instanceof Error ? error.message : 'Unknown error',
			});
		}
	}

	logger.info('[SEED] Settlement modifier aggregation complete', {
		total: settlementIds.length,
		success: successCount,
		errors: errorCount,
	});

	return { total: settlementIds.length, success: successCount, errors: errorCount };
}

/**
 * Main seeding execution
 */
logger.info('[SEED] Starting database seeding...');

if (isLocalDevelopment) {
	logger.warn('[SEED] Development/Test data will be seeded.');
}

try {
	// Seed accounts (admin and test user)
	const accountResult = await seedAccounts();

	// Seed structures
	const structureResult = await seedStructures();

	// Seed Resources
	const resourceResult = await seedResources();

	// Seed Structure Requirements
	const structureRequirementResult = await seedStructureRequirements();

	// Seed Structure Prerequisites
	const structurePrerequisiteResult = await seedStructurePrerequisites();

	// Seed biomes
	const biomeResult = await seedBiomes();

	let serverResult, worldResult, regionResult, tileResult;
	if (isLocalDevelopment) {
		serverResult = await seedServer();
		worldResult = await seedWorld(serverResult[0].id);
		regionResult = await seedRegions(worldResult[0].id);
		tileResult = await seedTiles(regionResult);
	}

	logger.info('[SEED] ✅ Seeding completed successfully!', {
		accounts: {
			created: accountResult.created,
			updated: accountResult.updated,
			total: accountResult.total,
		},
		structures: {
			created: structureResult.created,
			updated: structureResult.updated,
			total: structureResult.total,
		},
		resources: {
			created: resourceResult.created,
			updated: resourceResult.updated,
			total: resourceResult.total,
		},
		structureRequirements: {
			created: structureRequirementResult.created,
			updated: structureRequirementResult.updated,
			total: structureRequirementResult.total,
		},
		structurePrerequisites: {
			created: structurePrerequisiteResult.created,
			updated: structurePrerequisiteResult.updated,
			total: structurePrerequisiteResult.total,
		},
		biomes: {
			created: biomeResult.created,
			updated: biomeResult.updated,
			total: biomeResult.total,
		},
		...(isLocalDevelopment && {
			server: {
				id: serverResult?.[0]?.id,
			},
			world: {
				id: worldResult?.[0]?.id,
			},
			regions: {
				created: regionResult?.created,
			},
			tiles: {
				created: tileResult?.created,
			},
		}),
	});
} catch (error) {
	logger.error('[SEED] ❌ Seeding failed', error);
	process.exit(1);
} finally {
	// Close database connection
	await db.$client.end();
	process.exit(0);
}
