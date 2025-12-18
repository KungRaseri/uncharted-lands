import {
	pgTable,
	text,
	timestamp,
	integer,
	doublePrecision,
	decimal,
	json,
	pgEnum,
	uniqueIndex,
	unique,
	index,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

// ===========================
// TYPES
// ===========================

export interface WorldTemplateConfig {
	id: string;
	name: string;
	description: string;
	magicLevel?: 'NONE' | 'LOW' | 'HIGH';
	difficulty?: 'CASUAL' | 'NORMAL' | 'HARDCORE' | 'EXTREME';
	resourceAbundance?: 'SCARCE' | 'NORMAL' | 'ABUNDANT' | 'EXTREME_SCARCITY';
	depletionEnabled?: boolean;
	depletionRate?: number;
	disasterFrequency?: 'RARE' | 'NORMAL' | 'FREQUENT' | 'CONSTANT';
	disasterSeverity?: 'MILD' | 'NORMAL' | 'CATASTROPHIC';
	specialResourcesEnabled?: boolean;
	npcSettlementsEnabled?: boolean;
	productionMultiplier?: number;
	consumptionMultiplier?: number;
	populationGrowthRate?: number;
}

// ===========================
// ENUMS
// ===========================

export const accountRoleEnum = pgEnum('AccountRole', ['MEMBER', 'SUPPORT', 'ADMINISTRATOR']);
export const serverStatusEnum = pgEnum('ServerStatus', ['OFFLINE', 'MAINTENANCE', 'ONLINE']);
export const tileTypeEnum = pgEnum('TileType', ['OCEAN', 'LAND']);
export const specialResourceEnum = pgEnum('SpecialResource', [
	'GEMS',
	'EXOTIC_WOOD',
	'MAGICAL_HERBS',
	'ANCIENT_STONE',
]);
export const resourceTypeEnum = pgEnum('ResourceType', [
	'FOOD',
	'WOOD',
	'STONE',
	'ORE',
	'CLAY',
	'HERBS',
	'PELTS',
	'GEMS',
	'EXOTIC_WOOD',
]);
export const structureCategoryEnum = pgEnum('StructureCategory', ['EXTRACTOR', 'BUILDING']);
export const extractorTypeEnum = pgEnum('ExtractorType', [
	'FARM',
	'WELL',
	'LUMBER_MILL',
	'QUARRY',
	'MINE',
	'FISHING_DOCK',
	'HUNTING_LODGE',
	'HERB_GARDEN',
]);
export const buildingTypeEnum = pgEnum('BuildingType', [
	'HOUSE',
	'STORAGE',
	'BARRACKS',
	'WORKSHOP',
	'MARKETPLACE',
	'TOWN_HALL',
	'WALL',
]);

// Disaster system enums (Phase 4 - November 2025)
export const disasterTypeEnum = pgEnum('DisasterType', [
	// Weather Disasters
	'DROUGHT',
	'FLOOD',
	'BLIZZARD',
	'HURRICANE',
	'TORNADO',
	'SANDSTORM',
	'HEATWAVE',
	// Geological Disasters
	'EARTHQUAKE',
	'VOLCANO',
	'LANDSLIDE',
	'AVALANCHE',
	// Environmental Disasters
	'WILDFIRE',
	'INSECT_PLAGUE',
	'BLIGHT',
	'LOCUST_SWARM',
]);

export const disasterStatusEnum = pgEnum('DisasterStatus', [
	'SCHEDULED', // Disaster scheduled, not yet announced
	'WARNING', // Warning issued, players can prepare
	'IMPACT', // Disaster actively causing damage
	'AFTERMATH', // Recovery phase
	'RESOLVED', // Fully resolved
]);

export const disasterSeverityEnum = pgEnum('DisasterSeverity', [
	'MILD', // 20% production reduction
	'MODERATE', // 40% production reduction
	'MAJOR', // 60% production reduction
	'CATASTROPHIC', // 80% production reduction
]);

export const biomeTypeEnum = pgEnum('BiomeType', [
	'GRASSLAND',
	'FOREST',
	'DESERT',
	'MOUNTAIN',
	'TUNDRA',
	'SWAMP',
	'COASTAL',
	'OCEAN',
]);

export const settlementTypeEnum = pgEnum('SettlementType', [
	'OUTPOST', // Tier 1: Small frontier camp (max pop 50)
	'VILLAGE', // Tier 2: Growing community (max pop 200)
	'TOWN', // Tier 3: Established settlement (max pop 500)
	'CITY', // Tier 4: Major population center (max pop 1000+)
]);

// ==================== DISASTER CONFIGURATION ====================

/**
 * Biome-specific disaster mappings (from GDD Section 5.3)
 *
 * Each biome has different disaster vulnerabilities:
 * - highRisk: 60% chance of selection
 * - moderateRisk: 30% chance of selection
 * - lowRisk: 10% chance of selection
 *
 * Single source of truth for disaster-biome relationships.
 * No duplication - disaster-scheduler.ts imports this constant.
 */
export const BIOME_DISASTER_MAP = {
	GRASSLAND: {
		highRisk: ['DROUGHT', 'TORNADO', 'LOCUST_SWARM'],
		moderateRisk: ['FLOOD', 'WILDFIRE', 'HEATWAVE'],
		lowRisk: ['EARTHQUAKE'],
	},
	FOREST: {
		highRisk: ['WILDFIRE', 'INSECT_PLAGUE', 'BLIGHT'],
		moderateRisk: ['FLOOD', 'TORNADO', 'DROUGHT'],
		lowRisk: ['EARTHQUAKE', 'HEATWAVE'],
	},
	DESERT: {
		highRisk: ['DROUGHT', 'SANDSTORM', 'HEATWAVE', 'LOCUST_SWARM'],
		moderateRisk: ['WILDFIRE'],
		lowRisk: ['FLOOD', 'BLIZZARD'],
	},
	MOUNTAIN: {
		highRisk: ['EARTHQUAKE', 'AVALANCHE', 'LANDSLIDE', 'VOLCANO'],
		moderateRisk: ['BLIZZARD', 'WILDFIRE'],
		lowRisk: ['FLOOD', 'TORNADO', 'DROUGHT'],
	},
	TUNDRA: {
		highRisk: ['BLIZZARD', 'AVALANCHE'],
		moderateRisk: ['EARTHQUAKE'],
		lowRisk: ['WILDFIRE', 'DROUGHT', 'HEATWAVE'],
	},
	SWAMP: {
		highRisk: ['FLOOD', 'INSECT_PLAGUE', 'BLIGHT'],
		moderateRisk: ['WILDFIRE', 'TORNADO'],
		lowRisk: ['DROUGHT', 'EARTHQUAKE'],
	},
	COASTAL: {
		highRisk: ['HURRICANE', 'FLOOD'],
		moderateRisk: ['EARTHQUAKE', 'TORNADO', 'WILDFIRE'],
		lowRisk: ['DROUGHT', 'BLIZZARD'],
	},
	OCEAN: {
		highRisk: [],
		moderateRisk: ['HURRICANE'],
		lowRisk: [],
	},
} as const;

/**
 * Type-safe biome type extracted from schema enum
 */
export type BiomeType = (typeof biomeTypeEnum.enumValues)[number];

/**
 * Type-safe disaster type extracted from schema enum
 */
export type DisasterType = (typeof disasterTypeEnum.enumValues)[number];

/**
 * Type-safe disaster severity extracted from schema enum
 */
export type DisasterSeverity = (typeof disasterSeverityEnum.enumValues)[number];

// ===========================
// TABLES
// ===========================

// Master structure definitions table
export const structures = pgTable('Structure', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text('name').notNull(),
	description: text('description').notNull(),
	category: structureCategoryEnum('category').notNull(),
	extractorType: extractorTypeEnum('extractorType'),
	buildingType: buildingTypeEnum('buildingType'),
	maxLevel: integer('maxLevel').notNull().default(10),
	// ✅ Phase 3: Added metadata fields to support database-first architecture
	tier: integer('tier').notNull().default(1), // Structure tier (1-5)
	constructionTimeSeconds: integer('constructionTimeSeconds').notNull().default(0), // Build time in seconds
	populationRequired: integer('populationRequired').notNull().default(0), // Population needed to operate
	displayName: text('displayName').notNull(), // User-friendly name
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

// Master resource definitions table
export const resources = pgTable('Resource', {
	id: text('id')
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text('name').notNull(),
	description: text('description').notNull(),
	category: text('category').notNull(), // 'BASE', 'SPECIAL'
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

export const accounts = pgTable('Account', {
	id: text('id').primaryKey(),
	email: text('email').notNull().unique(),
	passwordHash: text('passwordHash').notNull(),
	userAuthToken: text('userAuthToken').notNull().unique(),
	role: accountRoleEnum('role').default('MEMBER').notNull(),
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

export const profiles = pgTable('Profile', {
	id: text('id').primaryKey(),
	username: text('username').notNull().unique(),
	picture: text('picture').notNull(),
	accountId: text('accountId')
		.notNull()
		.unique()
		.references(() => accounts.id, { onDelete: 'cascade' }),
});

export const servers = pgTable(
	'Server',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull().unique(),
		hostname: text('hostname').notNull().default('localhost'),
		port: integer('port').notNull().default(5000),
		status: serverStatusEnum('status').default('OFFLINE').notNull(),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex('Server_hostname_port_key').on(table.hostname, table.port)]
);

export const profileServerData = pgTable(
	'ProfileServerData',
	{
		profileId: text('profileId')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		serverId: text('serverId')
			.notNull()
			.references(() => servers.id, { onDelete: 'cascade' }),
	},
	(table) => [
		uniqueIndex('ProfileServerData_profileId_serverId_key').on(table.profileId, table.serverId),
	]
);

export const worlds = pgTable(
	'World',
	{
		id: text('id').primaryKey(),
		name: text('name').notNull(),
		elevationSettings: json('elevationSettings').notNull(),
		precipitationSettings: json('precipitationSettings').notNull(),
		temperatureSettings: json('temperatureSettings').notNull(),
		status: text('status').notNull().default('generating'), // 'generating', 'ready', 'failed'
		worldTemplateType: text('worldTemplateType').notNull().default('STANDARD'),
		worldTemplateConfig: json('worldTemplateConfig').$type<WorldTemplateConfig>(),
		serverId: text('serverId')
			.notNull()
			.references(() => servers.id, { onDelete: 'cascade' }),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [uniqueIndex('World_name_serverId_key').on(table.name, table.serverId)]
);

export const regions = pgTable(
	'Region',
	{
		id: text('id').primaryKey(),
		xCoord: integer('xCoord').notNull().default(-1),
		yCoord: integer('yCoord').notNull().default(-1),
		name: text('name').notNull(),
		elevationMap: json('elevationMap').notNull(),
		precipitationMap: json('precipitationMap').notNull(),
		temperatureMap: json('temperatureMap').notNull(),
		worldId: text('worldId')
			.notNull()
			.references(() => worlds.id, { onDelete: 'cascade' }),
	},
	(table) => [
		uniqueIndex('Region_name_worldId_key').on(table.name, table.worldId),
		index('Region_worldId_xCoord_yCoord_idx').on(table.worldId, table.xCoord, table.yCoord),
		index('Region_xCoord_yCoord_idx').on(table.xCoord, table.yCoord),
	]
);

export const biomes = pgTable('Biome', {
	id: text('id').primaryKey(),
	name: text('name').notNull().unique(),
	precipitationMin: doublePrecision('precipitationMin').notNull(),
	precipitationMax: doublePrecision('precipitationMax').notNull(),
	temperatureMin: doublePrecision('temperatureMin').notNull(),
	temperatureMax: doublePrecision('temperatureMax').notNull(),
	plotsMin: integer('plotsMin').notNull().default(1),
	plotsMax: integer('plotsMax').notNull().default(10),
	plotAreaMin: integer('plotAreaMin').notNull().default(30),
	plotAreaMax: integer('plotAreaMax').notNull().default(50),
	solarModifier: integer('solarModifier').notNull().default(1),
	windModifier: integer('windModifier').notNull().default(1),
	foodModifier: integer('foodModifier').notNull().default(1),
	waterModifier: integer('waterModifier').notNull().default(1),
	woodModifier: integer('woodModifier').notNull().default(1),
	stoneModifier: integer('stoneModifier').notNull().default(1),
	oreModifier: integer('oreModifier').notNull().default(1),
});

// @ts-expect-error - Circular reference with settlements is expected and works at runtime
export const tiles = pgTable(
	'Tile',
	{
		id: text('id').primaryKey(),
		biomeId: text('biomeId')
			.notNull()
			.references(() => biomes.id),
		regionId: text('regionId')
			.notNull()
			.references(() => regions.id, { onDelete: 'cascade' }),
		xCoord: integer('xCoord').notNull().default(0),
		yCoord: integer('yCoord').notNull().default(0),
		elevation: doublePrecision('elevation').notNull(),
		temperature: doublePrecision('temperature').notNull(),
		precipitation: doublePrecision('precipitation').notNull(),
		type: tileTypeEnum('type').notNull(),
		// Resource quality (0-100)
		foodQuality: doublePrecision('foodQuality').notNull().default(50),
		waterQuality: doublePrecision('waterQuality').notNull().default(50),
		woodQuality: doublePrecision('woodQuality').notNull().default(50),
		stoneQuality: doublePrecision('stoneQuality').notNull().default(50),
		oreQuality: doublePrecision('oreQuality').notNull().default(50),
		specialResource: specialResourceEnum('specialResource'),
		// Settlement ownership
		// @ts-expect-error - Circular reference
		settlementId: text('settlementId').references(() => settlements.id, {
			onDelete: 'set null',
		}),
		plotSlots: integer('plotSlots').notNull().default(5),
		// Base production modifier for disaster impacts (Type 2: resource depletion)
		// Default 1.0 = normal production, 0.4 = 60% drought, etc.
		baseProductionModifier: doublePrecision('baseProductionModifier').notNull().default(1),
	},
	(table) => [
		index('Tile_regionId_idx').on(table.regionId),
		index('Tile_biomeId_idx').on(table.biomeId),
		index('Tile_type_idx').on(table.type),
		index('Tile_coords_idx').on(table.xCoord, table.yCoord),
		index('Tile_settlementId_idx').on(table.settlementId),
	]
);

// ❌ PLOT TABLE REMOVED (Schema Refactor - November 28, 2025)
// Plots are no longer needed - settlements claim tiles directly
// See: client/docs/game-design/SCHEMA-REFACTOR-ARTIFACT.md

// @ts-expect-error - Circular reference between settlementStorage and settlements
export const settlementStorage = pgTable(
	'SettlementStorage',
	{
		id: text('id').primaryKey(),
		// @ts-expect-error - Circular reference to settlements table
		settlementId: text('settlementId').references(() => settlements.id, {
			onDelete: 'cascade',
		}),
		food: integer('food').notNull(),
		water: integer('water').notNull(),
		wood: integer('wood').notNull(),
		stone: integer('stone').notNull(),
		ore: integer('ore').notNull(),
	},
	(table) => [index('SettlementStorage_settlementId_idx').on(table.settlementId)]
);

export const settlementPopulation = pgTable('SettlementPopulation', {
	id: text('id').primaryKey(),
	settlementId: text('settlementId')
		.notNull()
		.unique()
		.references(() => settlements.id, { onDelete: 'cascade' }),
	currentPopulation: integer('currentPopulation').notNull().default(10),
	happiness: integer('happiness').notNull().default(50),
	lastGrowthTick: timestamp('lastGrowthTick', { mode: 'date' }).defaultNow().notNull(),
	createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
});

// @ts-expect-error - Circular reference with tiles is expected and works at runtime
export const settlements = pgTable(
	'Settlement',
	{
		id: text('id').primaryKey(),
		// PRODUCTION BUG #10 FIX: Changed from plotId to tileId
		// Settlements are founded on tiles, not plots. Plots are subdivisions of tiles.
		// See: server/docs/settlement-tile-plot-relationship.md
		tileId: text('tileId')
			.notNull()
			// @ts-expect-error - Circular reference
			.references(() => tiles.id, { onDelete: 'cascade' }),
		playerProfileId: text('playerProfileId')
			.notNull()
			.references(() => profiles.id, { onDelete: 'cascade' }),
		settlementStorageId: text('settlementStorageId')
			.notNull()
			.unique()
			// @ts-expect-error - Circular reference to settlementStorage table
			.references(() => settlementStorage.id, { onDelete: 'cascade' }),
		name: text('name').notNull().default('Home Settlement'),
		// Settlement tier system (GDD Section 2.1)
		settlementType: settlementTypeEnum('settlementType').notNull().default('OUTPOST'),
		tier: integer('tier').notNull().default(1), // 1-4 corresponding to OUTPOST/VILLAGE/TOWN/CITY
		resilience: integer('resilience').notNull().default(0), // Disaster survival resilience score (0-100)
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [
		index('Settlement_playerProfileId_idx').on(table.playerProfileId),
		index('Settlement_tileId_idx').on(table.tileId),
	]
);

// Interface for contributingStructures JSON field
export interface ContributingStructure {
	structureId: string;
	structureName: string;
	level: number;
	value: number;
}

// Settlement modifiers aggregation table (Phase 4)
// Tracks pre-calculated total modifiers for each settlement by type
// Recalculated when structures are created/upgraded/deleted
export const settlementModifiers = pgTable(
	'SettlementModifier',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		settlementId: text('settlementId')
			.notNull()
			.references(() => settlements.id, { onDelete: 'cascade' }),
		modifierType: text('modifierType').notNull(),
		totalValue: decimal('totalValue', { precision: 10, scale: 2 }).notNull(),
		sourceCount: integer('sourceCount').notNull().default(0),
		contributingStructures: json('contributingStructures')
			.$type<ContributingStructure[]>()
			.default([]),
		lastCalculatedAt: timestamp('lastCalculatedAt', { mode: 'date' }).defaultNow().notNull(),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [
		unique().on(table.settlementId, table.modifierType),
		index('SettlementModifier_settlementId_idx').on(table.settlementId),
		index('SettlementModifier_modifierType_idx').on(table.modifierType),
		index('SettlementModifier_lastCalculatedAt_idx').on(table.lastCalculatedAt),
	]
);

// Normalized structure costs table
export const structureRequirements = pgTable(
	'StructureRequirement',
	{
		id: text('id').primaryKey(),
		structureId: text('structureId')
			.notNull()
			.references(() => structures.id, { onDelete: 'cascade' }),
		resourceId: text('resourceId')
			.notNull()
			.references(() => resources.id, { onDelete: 'cascade' }),
		quantity: integer('quantity').notNull(),
	},
	(table) => [
		index('StructureRequirement_structureId_idx').on(table.structureId),
		index('StructureRequirement_resourceId_idx').on(table.resourceId),
	]
);

// Structure prerequisites table - Option B1 (two nullable columns with FK constraints)
export const structurePrerequisites = pgTable(
	'StructurePrerequisite',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		structureId: text('structureId')
			.notNull()
			.references(() => structures.id, { onDelete: 'cascade' }),
		// ONE of these per row (not both) - enforced by CHECK constraint
		requiredStructureId: text('requiredStructureId').references(() => structures.id, {
			onDelete: 'cascade',
		}),
		requiredResearchId: text('requiredResearchId'), // FK to research table when it exists
		requiredLevel: integer('requiredLevel').notNull().default(1),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [
		index('StructurePrerequisite_structureId_idx').on(table.structureId),
		index('StructurePrerequisite_requiredStructureId_idx').on(table.requiredStructureId),
	]
);

export const settlementStructures = pgTable(
	'SettlementStructure',
	{
		id: text('id').primaryKey(),
		structureId: text('structureId')
			.notNull()
			.references(() => structures.id, { onDelete: 'restrict' }),
		settlementId: text('settlementId')
			.notNull()
			.references(() => settlements.id, { onDelete: 'cascade' }),
		level: integer('level').notNull().default(1),
		// ✅ CHANGED: Tile linkage for extractors (replaces plotId)
		// Extractors are built on specific tiles, in specific slots (0 to plotSlots-1)
		tileId: text('tileId').references(() => tiles.id, { onDelete: 'cascade' }),
		slotPosition: integer('slotPosition'), // Which slot on the tile (0 to plotSlots-1)
		// Population assignment for structure staffing
		populationAssigned: integer('populationAssigned').notNull().default(0),
		// Structure health system (0-100, for disaster damage tracking)
		health: integer('health').notNull().default(100),
		damagedAt: timestamp('damagedAt', { mode: 'date' }),
		lastRepairedAt: timestamp('lastRepairedAt', { mode: 'date' }),
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [
		index('SettlementStructure_settlementId_idx').on(table.settlementId),
		index('SettlementStructure_structureId_idx').on(table.structureId),
		index('SettlementStructure_tileId_idx').on(table.tileId), // ✅ NEW INDEX
	]
);

export const structureModifiers = pgTable('StructureModifier', {
	id: text('id').primaryKey(),
	settlementStructureId: text('settlementStructureId')
		.notNull()
		.references(() => settlementStructures.id, { onDelete: 'cascade' }),
	name: text('name').notNull(),
	description: text('description').notNull(),
	value: integer('value').notNull(),
});

// ===========================
// RELATIONS
// ===========================

export const structuresRelations = relations(structures, ({ many }) => ({
	requirements: many(structureRequirements),
	prerequisites: many(structurePrerequisites, { relationName: 'structurePrerequisites' }),
	requiredBy: many(structurePrerequisites, { relationName: 'requiredStructure' }),
	instances: many(settlementStructures),
}));

export const resourcesRelations = relations(resources, ({ many }) => ({
	requirements: many(structureRequirements),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	profile: one(profiles, {
		fields: [accounts.id],
		references: [profiles.accountId],
	}),
}));

export const profilesRelations = relations(profiles, ({ one, many }) => ({
	account: one(accounts, {
		fields: [profiles.accountId],
		references: [accounts.id],
	}),
	servers: many(profileServerData),
	settlements: many(settlements),
}));

export const profileServerDataRelations = relations(profileServerData, ({ one, many }) => ({
	profile: one(profiles, {
		fields: [profileServerData.profileId],
		references: [profiles.id],
	}),
	server: one(servers, {
		fields: [profileServerData.serverId],
		references: [servers.id],
	}),
	settlements: many(settlements),
}));

export const serversRelations = relations(servers, ({ many }) => ({
	players: many(profileServerData),
	worlds: many(worlds),
}));

export const worldsRelations = relations(worlds, ({ one, many }) => ({
	server: one(servers, {
		fields: [worlds.serverId],
		references: [servers.id],
	}),
	regions: many(regions),
}));

export const regionsRelations = relations(regions, ({ one, many }) => ({
	world: one(worlds, {
		fields: [regions.worldId],
		references: [worlds.id],
	}),
	tiles: many(tiles),
}));

export const biomesRelations = relations(biomes, ({ many }) => ({
	tiles: many(tiles),
}));

export const tilesRelations = relations(tiles, ({ one }) => ({
	biome: one(biomes, {
		fields: [tiles.biomeId],
		references: [biomes.id],
	}),
	region: one(regions, {
		fields: [tiles.regionId],
		references: [regions.id],
	}),
	settlement: one(settlements, {
		fields: [tiles.settlementId],
		references: [settlements.id],
	}),
	// ❌ REMOVED: plots relation (Plot table deleted)
}));

// ❌ REMOVED: plotsRelations (Plot table deleted)

export const settlementStorageRelations = relations(settlementStorage, ({ one }) => ({
	settlement: one(settlements, {
		fields: [settlementStorage.id],
		references: [settlements.settlementStorageId],
	}),
}));

export const settlementsRelations = relations(settlements, ({ one, many }) => ({
	storage: one(settlementStorage, {
		fields: [settlements.settlementStorageId],
		references: [settlementStorage.id],
	}),
	population: one(settlementPopulation, {
		fields: [settlements.id],
		references: [settlementPopulation.settlementId],
	}),
	tile: one(tiles, {
		fields: [settlements.tileId],
		references: [tiles.id],
	}),
	playerProfile: one(profiles, {
		fields: [settlements.playerProfileId],
		references: [profiles.id],
	}),
	structures: many(settlementStructures),
	// ❌ REMOVED: plots: many(plots) - Plot table deleted
}));

export const structureRequirementsRelations = relations(structureRequirements, ({ one }) => ({
	structure: one(structures, {
		fields: [structureRequirements.structureId],
		references: [structures.id],
	}),
	resource: one(resources, {
		fields: [structureRequirements.resourceId],
		references: [resources.id],
	}),
}));

export const structurePrerequisitesRelations = relations(structurePrerequisites, ({ one }) => ({
	structure: one(structures, {
		fields: [structurePrerequisites.structureId],
		references: [structures.id],
		relationName: 'structurePrerequisites',
	}),
	requiredStructure: one(structures, {
		fields: [structurePrerequisites.requiredStructureId],
		references: [structures.id],
		relationName: 'requiredStructure',
	}),
}));

export const settlementStructuresRelations = relations(settlementStructures, ({ one, many }) => ({
	structure: one(structures, {
		fields: [settlementStructures.structureId],
		references: [structures.id],
	}),
	settlement: one(settlements, {
		fields: [settlementStructures.settlementId],
		references: [settlements.id],
	}),
	tile: one(tiles, {
		fields: [settlementStructures.tileId],
		references: [tiles.id],
	}),
	// ❌ REMOVED: plot: one(plots, ...) - Plot table deleted, using tileId instead
	modifiers: many(structureModifiers),
}));

export const structureModifiersRelations = relations(structureModifiers, ({ one }) => ({
	settlementStructure: one(settlementStructures, {
		fields: [structureModifiers.settlementStructureId],
		references: [settlementStructures.id],
	}),
}));

// ===========================
// DISASTER SYSTEM (Phase 4 - November 2025)
// ===========================

// Disaster events table
export const disasterEvents = pgTable(
	'DisasterEvent',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		worldId: text('worldId')
			.notNull()
			.references(() => worlds.id, { onDelete: 'cascade' }),

		// Disaster properties
		type: disasterTypeEnum('type').notNull(),
		severity: integer('severity').notNull(), // 0-100 numeric value
		severityLevel: disasterSeverityEnum('severityLevel').notNull(), // MILD/MODERATE/MAJOR/CATASTROPHIC

		// Affected area (nullable for world-scale disasters)
		affectedRegionId: text('affectedRegionId').references(() => regions.id),
		affectedBiomes: json('affectedBiomes').$type<string[]>(), // Array of biome names

		// Timing
		scheduledAt: timestamp('scheduledAt', { mode: 'date' }).notNull(), // When disaster will start
		warningTime: integer('warningTime').notNull().default(7200), // Seconds of advance warning (default 2 hours)
		impactDuration: integer('impactDuration').notNull().default(3600), // Seconds of impact phase (default 1 hour)

		// State tracking
		status: disasterStatusEnum('status').notNull().default('SCHEDULED'),
		warningIssuedAt: timestamp('warningIssuedAt', { mode: 'date' }),
		impactStartedAt: timestamp('impactStartedAt', { mode: 'date' }),
		impactEndedAt: timestamp('impactEndedAt', { mode: 'date' }),

		// Flags
		imminentWarningIssued: integer('imminentWarningIssued').notNull().default(0), // Boolean: 0 = false, 1 = true

		// Metadata
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [
		index('disaster_world_idx').on(table.worldId),
		index('disaster_status_idx').on(table.status),
		index('disaster_scheduled_idx').on(table.scheduledAt),
		index('disaster_active_idx').on(table.worldId, table.status),
	]
);

// Disaster history table (records disaster impact per settlement)
export const disasterHistory = pgTable(
	'DisasterHistory',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		settlementId: text('settlementId')
			.notNull()
			.references(() => settlements.id, { onDelete: 'cascade' }),
		disasterId: text('disasterId')
			.notNull()
			.references(() => disasterEvents.id, { onDelete: 'cascade' }),

		// Impact data
		casualties: integer('casualties').notNull().default(0), // Population lost
		structuresDamaged: integer('structuresDamaged').notNull().default(0), // Structures with health < 100%
		structuresDestroyed: integer('structuresDestroyed').notNull().default(0), // Structures at 0% health
		resourcesLost: json('resourcesLost').$type<{
			food?: number;
			water?: number;
			wood?: number;
			stone?: number;
			ore?: number;
		}>(), // Resources lost from damaged storage

		// Recovery
		resilienceGained: integer('resilienceGained').notNull().default(5), // Resilience bonus from surviving

		// Metadata
		timestamp: timestamp('timestamp', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [
		index('disaster_history_settlement_idx').on(table.settlementId),
		index('disaster_history_disaster_idx').on(table.disasterId),
	]
);

// Relations
export const disasterEventsRelations = relations(disasterEvents, ({ one, many }) => ({
	world: one(worlds, {
		fields: [disasterEvents.worldId],
		references: [worlds.id],
	}),
	affectedRegion: one(regions, {
		fields: [disasterEvents.affectedRegionId],
		references: [regions.id],
	}),
	history: many(disasterHistory),
}));

export const disasterHistoryRelations = relations(disasterHistory, ({ one }) => ({
	settlement: one(settlements, {
		fields: [disasterHistory.settlementId],
		references: [settlements.id],
	}),
	disaster: one(disasterEvents, {
		fields: [disasterHistory.disasterId],
		references: [disasterEvents.id],
	}),
}));

// ===========================
// CONSTRUCTION QUEUE (Phase 3 - November 2025)
// ===========================

/**
 * Construction Queue System
 * Manages time-based building queue for settlements
 * - Max 3 simultaneous constructions (IN_PROGRESS)
 * - Max 10 total queue size
 * - Emergency construction: 2x speed, 2.5x cost during disasters
 */
export const constructionQueue = pgTable(
	'ConstructionQueue',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		settlementId: text('settlementId')
			.notNull()
			.references(() => settlements.id, { onDelete: 'cascade' }),

		// Structure Details
		structureType: text('structureType').notNull(), // 'FARM', 'HOUSE', etc.

		// Timing
		startedAt: timestamp('startedAt', { mode: 'date' }), // NULL if queued but not started
		completesAt: timestamp('completesAt', { mode: 'date' }), // When construction finishes

		// Resources (already deducted when queued)
		resourcesCost: json('resourcesCost').notNull().$type<{
			wood?: number;
			stone?: number;
			ore?: number;
			food?: number;
			water?: number;
		}>(),

		// Queue Management
		status: text('status').notNull().default('QUEUED'), // 'QUEUED', 'IN_PROGRESS', 'COMPLETE', 'CANCELLED'
		position: integer('position').notNull(), // 0-2 = active, 3-9 = queued

		// Emergency Construction (2x speed, 2.5x cost during disasters)
		isEmergency: integer('isEmergency').notNull().default(0), // 0 = false, 1 = true

		// Metadata
		createdAt: timestamp('createdAt', { mode: 'date' }).defaultNow().notNull(),
		updatedAt: timestamp('updatedAt', { mode: 'date' }).defaultNow().notNull(),
	},
	(table) => [
		index('construction_queue_settlement_idx').on(table.settlementId),
		index('construction_queue_status_idx').on(table.status),
		index('construction_queue_active_idx').on(table.settlementId, table.status),
	]
);

// Relations
export const constructionQueueRelations = relations(constructionQueue, ({ one }) => ({
	settlement: one(settlements, {
		fields: [constructionQueue.settlementId],
		references: [settlements.id],
	}),
}));

// ===========================
// TYPE EXPORTS
// ===========================

export type Structure = typeof structures.$inferSelect;
export type NewStructure = typeof structures.$inferInsert;

export type Resource = typeof resources.$inferSelect;
export type NewResource = typeof resources.$inferInsert;

export type StructureRequirement = typeof structureRequirements.$inferSelect;
export type NewStructureRequirement = typeof structureRequirements.$inferInsert;

export type StructurePrerequisite = typeof structurePrerequisites.$inferSelect;
export type NewStructurePrerequisite = typeof structurePrerequisites.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;

export type Server = typeof servers.$inferSelect;
export type NewServer = typeof servers.$inferInsert;

export type ProfileServerData = typeof profileServerData.$inferSelect;
export type NewProfileServerData = typeof profileServerData.$inferInsert;

export type World = typeof worlds.$inferSelect;
export type NewWorld = typeof worlds.$inferInsert;

export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;

export type Biome = typeof biomes.$inferSelect;
export type NewBiome = typeof biomes.$inferInsert;

export type Tile = typeof tiles.$inferSelect;
export type NewTile = typeof tiles.$inferInsert;

// ❌ REMOVED: Plot and NewPlot types - Plot table deleted

export type SettlementStorage = typeof settlementStorage.$inferSelect;
export type NewSettlementStorage = typeof settlementStorage.$inferInsert;

export type Settlement = typeof settlements.$inferSelect;
export type NewSettlement = typeof settlements.$inferInsert;

export type SettlementModifier = typeof settlementModifiers.$inferSelect;
export type NewSettlementModifier = typeof settlementModifiers.$inferInsert;

export type SettlementStructure = typeof settlementStructures.$inferSelect;
export type NewSettlementStructure = typeof settlementStructures.$inferInsert;

export type StructureModifier = typeof structureModifiers.$inferSelect;
export type NewStructureModifier = typeof structureModifiers.$inferInsert;

export type DisasterEvent = typeof disasterEvents.$inferSelect;
export type NewDisasterEvent = typeof disasterEvents.$inferInsert;

export type DisasterHistory = typeof disasterHistory.$inferSelect;
export type NewDisasterHistory = typeof disasterHistory.$inferInsert;

export type ConstructionQueue = typeof constructionQueue.$inferSelect;
export type NewConstructionQueue = typeof constructionQueue.$inferInsert;
