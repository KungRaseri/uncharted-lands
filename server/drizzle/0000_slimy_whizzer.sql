CREATE TYPE "public"."AccountRole" AS ENUM('MEMBER', 'SUPPORT', 'ADMINISTRATOR');--> statement-breakpoint
CREATE TYPE "public"."BiomeType" AS ENUM('GRASSLAND', 'FOREST', 'DESERT', 'MOUNTAIN', 'TUNDRA', 'SWAMP', 'COASTAL', 'OCEAN');--> statement-breakpoint
CREATE TYPE "public"."BuildingType" AS ENUM('HOUSE', 'STORAGE', 'BARRACKS', 'WORKSHOP', 'MARKETPLACE', 'TOWN_HALL', 'WALL');--> statement-breakpoint
CREATE TYPE "public"."DisasterSeverity" AS ENUM('MILD', 'MODERATE', 'MAJOR', 'CATASTROPHIC');--> statement-breakpoint
CREATE TYPE "public"."DisasterStatus" AS ENUM('SCHEDULED', 'WARNING', 'IMPACT', 'AFTERMATH', 'RESOLVED');--> statement-breakpoint
CREATE TYPE "public"."DisasterType" AS ENUM('DROUGHT', 'FLOOD', 'BLIZZARD', 'HURRICANE', 'TORNADO', 'SANDSTORM', 'HEATWAVE', 'EARTHQUAKE', 'VOLCANO', 'LANDSLIDE', 'AVALANCHE', 'WILDFIRE', 'INSECT_PLAGUE', 'BLIGHT', 'LOCUST_SWARM');--> statement-breakpoint
CREATE TYPE "public"."ExtractorType" AS ENUM('FARM', 'WELL', 'LUMBER_MILL', 'QUARRY', 'MINE', 'FISHING_DOCK', 'HUNTING_LODGE', 'HERB_GARDEN');--> statement-breakpoint
CREATE TYPE "public"."ResourceType" AS ENUM('FOOD', 'WOOD', 'STONE', 'ORE', 'CLAY', 'HERBS', 'PELTS', 'GEMS', 'EXOTIC_WOOD');--> statement-breakpoint
CREATE TYPE "public"."ServerStatus" AS ENUM('OFFLINE', 'MAINTENANCE', 'ONLINE');--> statement-breakpoint
CREATE TYPE "public"."SettlementType" AS ENUM('OUTPOST', 'VILLAGE', 'TOWN', 'CITY');--> statement-breakpoint
CREATE TYPE "public"."SpecialResource" AS ENUM('GEMS', 'EXOTIC_WOOD', 'MAGICAL_HERBS', 'ANCIENT_STONE');--> statement-breakpoint
CREATE TYPE "public"."StructureCategory" AS ENUM('EXTRACTOR', 'BUILDING');--> statement-breakpoint
CREATE TYPE "public"."TileType" AS ENUM('OCEAN', 'LAND');--> statement-breakpoint
CREATE TABLE "Account" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"passwordHash" text NOT NULL,
	"userAuthToken" text NOT NULL,
	"role" "AccountRole" DEFAULT 'MEMBER' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Account_email_unique" UNIQUE("email"),
	CONSTRAINT "Account_userAuthToken_unique" UNIQUE("userAuthToken")
);
--> statement-breakpoint
CREATE TABLE "Biome" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"precipitationMin" double precision NOT NULL,
	"precipitationMax" double precision NOT NULL,
	"temperatureMin" double precision NOT NULL,
	"temperatureMax" double precision NOT NULL,
	"plotsMin" integer DEFAULT 1 NOT NULL,
	"plotsMax" integer DEFAULT 10 NOT NULL,
	"plotAreaMin" integer DEFAULT 30 NOT NULL,
	"plotAreaMax" integer DEFAULT 50 NOT NULL,
	"solarModifier" integer DEFAULT 1 NOT NULL,
	"windModifier" integer DEFAULT 1 NOT NULL,
	"foodModifier" integer DEFAULT 1 NOT NULL,
	"waterModifier" integer DEFAULT 1 NOT NULL,
	"woodModifier" integer DEFAULT 1 NOT NULL,
	"stoneModifier" integer DEFAULT 1 NOT NULL,
	"oreModifier" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "Biome_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "ConstructionQueue" (
	"id" text PRIMARY KEY NOT NULL,
	"settlementId" text NOT NULL,
	"structureType" text NOT NULL,
	"startedAt" timestamp,
	"completesAt" timestamp,
	"resourcesCost" json NOT NULL,
	"status" text DEFAULT 'QUEUED' NOT NULL,
	"position" integer NOT NULL,
	"isEmergency" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DisasterEvent" (
	"id" text PRIMARY KEY NOT NULL,
	"worldId" text NOT NULL,
	"type" "DisasterType" NOT NULL,
	"severity" integer NOT NULL,
	"severityLevel" "DisasterSeverity" NOT NULL,
	"affectedRegionIds" json NOT NULL,
	"affectedBiomes" json NOT NULL,
	"scheduledAt" timestamp NOT NULL,
	"warningTime" integer DEFAULT 7200 NOT NULL,
	"impactDuration" integer DEFAULT 3600 NOT NULL,
	"status" "DisasterStatus" DEFAULT 'SCHEDULED' NOT NULL,
	"warningIssuedAt" timestamp,
	"impactStartedAt" timestamp,
	"impactEndedAt" timestamp,
	"imminentWarningIssued" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "DisasterHistory" (
	"id" text PRIMARY KEY NOT NULL,
	"settlementId" text NOT NULL,
	"disasterId" text NOT NULL,
	"casualties" integer DEFAULT 0 NOT NULL,
	"structuresDamaged" integer DEFAULT 0 NOT NULL,
	"structuresDestroyed" integer DEFAULT 0 NOT NULL,
	"resourcesLost" json,
	"resilienceGained" integer DEFAULT 5 NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ProfileServerData" (
	"profileId" text NOT NULL,
	"serverId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Profile" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"picture" text NOT NULL,
	"accountId" text NOT NULL,
	CONSTRAINT "Profile_username_unique" UNIQUE("username"),
	CONSTRAINT "Profile_accountId_unique" UNIQUE("accountId")
);
--> statement-breakpoint
CREATE TABLE "Region" (
	"id" text PRIMARY KEY NOT NULL,
	"xCoord" integer DEFAULT -1 NOT NULL,
	"yCoord" integer DEFAULT -1 NOT NULL,
	"name" text NOT NULL,
	"elevationMap" json NOT NULL,
	"precipitationMap" json NOT NULL,
	"temperatureMap" json NOT NULL,
	"worldId" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Resource" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Server" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"hostname" text DEFAULT 'localhost' NOT NULL,
	"port" integer DEFAULT 5000 NOT NULL,
	"status" "ServerStatus" DEFAULT 'OFFLINE' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Server_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "SettlementModifier" (
	"id" text PRIMARY KEY NOT NULL,
	"settlementId" text NOT NULL,
	"modifierType" text NOT NULL,
	"totalValue" numeric(10, 2) NOT NULL,
	"sourceCount" integer DEFAULT 0 NOT NULL,
	"contributingStructures" json DEFAULT '[]'::json,
	"lastCalculatedAt" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "SettlementModifier_settlementId_modifierType_unique" UNIQUE("settlementId","modifierType")
);
--> statement-breakpoint
CREATE TABLE "SettlementPopulation" (
	"id" text PRIMARY KEY NOT NULL,
	"settlementId" text NOT NULL,
	"currentPopulation" integer DEFAULT 10 NOT NULL,
	"happiness" integer DEFAULT 50 NOT NULL,
	"lastGrowthTick" timestamp DEFAULT now() NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "SettlementPopulation_settlementId_unique" UNIQUE("settlementId")
);
--> statement-breakpoint
CREATE TABLE "SettlementStorage" (
	"id" text PRIMARY KEY NOT NULL,
	"settlementId" text NOT NULL,
	"food" integer NOT NULL,
	"water" integer NOT NULL,
	"wood" integer NOT NULL,
	"stone" integer NOT NULL,
	"ore" integer NOT NULL,
	CONSTRAINT "SettlementStorage_settlementId_unique" UNIQUE("settlementId")
);
--> statement-breakpoint
CREATE TABLE "SettlementStructure" (
	"id" text PRIMARY KEY NOT NULL,
	"structureId" text NOT NULL,
	"settlementId" text NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"tileId" text,
	"slotPosition" integer,
	"populationAssigned" integer DEFAULT 0 NOT NULL,
	"health" integer DEFAULT 100 NOT NULL,
	"damagedAt" timestamp,
	"lastRepairedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Settlement" (
	"id" text PRIMARY KEY NOT NULL,
	"tileId" text NOT NULL,
	"playerProfileId" text NOT NULL,
	"name" text DEFAULT 'Home Settlement' NOT NULL,
	"settlementType" "SettlementType" DEFAULT 'OUTPOST' NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"resilience" integer DEFAULT 0 NOT NULL,
	"areaUsed" integer DEFAULT 0 NOT NULL,
	"areaCapacity" integer DEFAULT 500 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StructureModifier" (
	"id" text PRIMARY KEY NOT NULL,
	"settlementStructureId" text NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"value" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StructurePrerequisite" (
	"id" text PRIMARY KEY NOT NULL,
	"structureId" text NOT NULL,
	"requiredStructureId" text,
	"requiredResearchId" text,
	"requiredLevel" integer DEFAULT 1 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "StructureRequirement" (
	"id" text PRIMARY KEY NOT NULL,
	"structureId" text NOT NULL,
	"resourceId" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Structure" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"category" "StructureCategory" NOT NULL,
	"extractorType" "ExtractorType",
	"buildingType" "BuildingType",
	"maxLevel" integer DEFAULT 10 NOT NULL,
	"tier" integer DEFAULT 1 NOT NULL,
	"constructionTimeSeconds" integer DEFAULT 0 NOT NULL,
	"populationRequired" integer DEFAULT 0 NOT NULL,
	"displayName" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Tile" (
	"id" text PRIMARY KEY NOT NULL,
	"biomeId" text NOT NULL,
	"regionId" text NOT NULL,
	"xCoord" integer DEFAULT 0 NOT NULL,
	"yCoord" integer DEFAULT 0 NOT NULL,
	"elevation" double precision NOT NULL,
	"temperature" double precision NOT NULL,
	"precipitation" double precision NOT NULL,
	"type" "TileType" NOT NULL,
	"foodQuality" double precision DEFAULT 50 NOT NULL,
	"waterQuality" double precision DEFAULT 50 NOT NULL,
	"woodQuality" double precision DEFAULT 50 NOT NULL,
	"stoneQuality" double precision DEFAULT 50 NOT NULL,
	"oreQuality" double precision DEFAULT 50 NOT NULL,
	"specialResource" "SpecialResource",
	"settlementId" text,
	"plotSlots" integer DEFAULT 5 NOT NULL,
	"baseProductionModifier" double precision DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "World" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"elevationSettings" json NOT NULL,
	"precipitationSettings" json NOT NULL,
	"temperatureSettings" json NOT NULL,
	"status" text DEFAULT 'generating' NOT NULL,
	"worldTemplateType" text DEFAULT 'STANDARD' NOT NULL,
	"worldTemplateConfig" json,
	"serverId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ConstructionQueue" ADD CONSTRAINT "ConstructionQueue_settlementId_Settlement_id_fk" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DisasterEvent" ADD CONSTRAINT "DisasterEvent_worldId_World_id_fk" FOREIGN KEY ("worldId") REFERENCES "public"."World"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DisasterHistory" ADD CONSTRAINT "DisasterHistory_settlementId_Settlement_id_fk" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "DisasterHistory" ADD CONSTRAINT "DisasterHistory_disasterId_DisasterEvent_id_fk" FOREIGN KEY ("disasterId") REFERENCES "public"."DisasterEvent"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProfileServerData" ADD CONSTRAINT "ProfileServerData_profileId_Profile_id_fk" FOREIGN KEY ("profileId") REFERENCES "public"."Profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ProfileServerData" ADD CONSTRAINT "ProfileServerData_serverId_Server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."Server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Profile" ADD CONSTRAINT "Profile_accountId_Account_id_fk" FOREIGN KEY ("accountId") REFERENCES "public"."Account"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Region" ADD CONSTRAINT "Region_worldId_World_id_fk" FOREIGN KEY ("worldId") REFERENCES "public"."World"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SettlementModifier" ADD CONSTRAINT "SettlementModifier_settlementId_Settlement_id_fk" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SettlementPopulation" ADD CONSTRAINT "SettlementPopulation_settlementId_Settlement_id_fk" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SettlementStorage" ADD CONSTRAINT "SettlementStorage_settlementId_Settlement_id_fk" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SettlementStructure" ADD CONSTRAINT "SettlementStructure_structureId_Structure_id_fk" FOREIGN KEY ("structureId") REFERENCES "public"."Structure"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SettlementStructure" ADD CONSTRAINT "SettlementStructure_settlementId_Settlement_id_fk" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "SettlementStructure" ADD CONSTRAINT "SettlementStructure_tileId_Tile_id_fk" FOREIGN KEY ("tileId") REFERENCES "public"."Tile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_tileId_Tile_id_fk" FOREIGN KEY ("tileId") REFERENCES "public"."Tile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Settlement" ADD CONSTRAINT "Settlement_playerProfileId_Profile_id_fk" FOREIGN KEY ("playerProfileId") REFERENCES "public"."Profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StructureModifier" ADD CONSTRAINT "StructureModifier_settlementStructureId_SettlementStructure_id_fk" FOREIGN KEY ("settlementStructureId") REFERENCES "public"."SettlementStructure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StructurePrerequisite" ADD CONSTRAINT "StructurePrerequisite_structureId_Structure_id_fk" FOREIGN KEY ("structureId") REFERENCES "public"."Structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StructurePrerequisite" ADD CONSTRAINT "StructurePrerequisite_requiredStructureId_Structure_id_fk" FOREIGN KEY ("requiredStructureId") REFERENCES "public"."Structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StructureRequirement" ADD CONSTRAINT "StructureRequirement_structureId_Structure_id_fk" FOREIGN KEY ("structureId") REFERENCES "public"."Structure"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "StructureRequirement" ADD CONSTRAINT "StructureRequirement_resourceId_Resource_id_fk" FOREIGN KEY ("resourceId") REFERENCES "public"."Resource"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Tile" ADD CONSTRAINT "Tile_biomeId_Biome_id_fk" FOREIGN KEY ("biomeId") REFERENCES "public"."Biome"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Tile" ADD CONSTRAINT "Tile_regionId_Region_id_fk" FOREIGN KEY ("regionId") REFERENCES "public"."Region"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "Tile" ADD CONSTRAINT "Tile_settlementId_Settlement_id_fk" FOREIGN KEY ("settlementId") REFERENCES "public"."Settlement"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "World" ADD CONSTRAINT "World_serverId_Server_id_fk" FOREIGN KEY ("serverId") REFERENCES "public"."Server"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "construction_queue_settlement_idx" ON "ConstructionQueue" USING btree ("settlementId");--> statement-breakpoint
CREATE INDEX "construction_queue_status_idx" ON "ConstructionQueue" USING btree ("status");--> statement-breakpoint
CREATE INDEX "construction_queue_active_idx" ON "ConstructionQueue" USING btree ("settlementId","status");--> statement-breakpoint
CREATE INDEX "disaster_world_idx" ON "DisasterEvent" USING btree ("worldId");--> statement-breakpoint
CREATE INDEX "disaster_status_idx" ON "DisasterEvent" USING btree ("status");--> statement-breakpoint
CREATE INDEX "disaster_scheduled_idx" ON "DisasterEvent" USING btree ("scheduledAt");--> statement-breakpoint
CREATE INDEX "disaster_active_idx" ON "DisasterEvent" USING btree ("worldId","status");--> statement-breakpoint
CREATE INDEX "disaster_history_settlement_idx" ON "DisasterHistory" USING btree ("settlementId");--> statement-breakpoint
CREATE INDEX "disaster_history_disaster_idx" ON "DisasterHistory" USING btree ("disasterId");--> statement-breakpoint
CREATE UNIQUE INDEX "ProfileServerData_profileId_serverId_key" ON "ProfileServerData" USING btree ("profileId","serverId");--> statement-breakpoint
CREATE UNIQUE INDEX "Region_name_worldId_key" ON "Region" USING btree ("name","worldId");--> statement-breakpoint
CREATE INDEX "Region_worldId_xCoord_yCoord_idx" ON "Region" USING btree ("worldId","xCoord","yCoord");--> statement-breakpoint
CREATE INDEX "Region_xCoord_yCoord_idx" ON "Region" USING btree ("xCoord","yCoord");--> statement-breakpoint
CREATE UNIQUE INDEX "Server_hostname_port_key" ON "Server" USING btree ("hostname","port");--> statement-breakpoint
CREATE INDEX "SettlementModifier_settlementId_idx" ON "SettlementModifier" USING btree ("settlementId");--> statement-breakpoint
CREATE INDEX "SettlementModifier_modifierType_idx" ON "SettlementModifier" USING btree ("modifierType");--> statement-breakpoint
CREATE INDEX "SettlementModifier_lastCalculatedAt_idx" ON "SettlementModifier" USING btree ("lastCalculatedAt");--> statement-breakpoint
CREATE INDEX "SettlementStorage_settlementId_idx" ON "SettlementStorage" USING btree ("settlementId");--> statement-breakpoint
CREATE INDEX "SettlementStructure_settlementId_idx" ON "SettlementStructure" USING btree ("settlementId");--> statement-breakpoint
CREATE INDEX "SettlementStructure_structureId_idx" ON "SettlementStructure" USING btree ("structureId");--> statement-breakpoint
CREATE INDEX "SettlementStructure_tileId_idx" ON "SettlementStructure" USING btree ("tileId");--> statement-breakpoint
CREATE INDEX "Settlement_playerProfileId_idx" ON "Settlement" USING btree ("playerProfileId");--> statement-breakpoint
CREATE INDEX "Settlement_tileId_idx" ON "Settlement" USING btree ("tileId");--> statement-breakpoint
CREATE INDEX "StructurePrerequisite_structureId_idx" ON "StructurePrerequisite" USING btree ("structureId");--> statement-breakpoint
CREATE INDEX "StructurePrerequisite_requiredStructureId_idx" ON "StructurePrerequisite" USING btree ("requiredStructureId");--> statement-breakpoint
CREATE INDEX "StructureRequirement_structureId_idx" ON "StructureRequirement" USING btree ("structureId");--> statement-breakpoint
CREATE INDEX "StructureRequirement_resourceId_idx" ON "StructureRequirement" USING btree ("resourceId");--> statement-breakpoint
CREATE INDEX "Tile_regionId_idx" ON "Tile" USING btree ("regionId");--> statement-breakpoint
CREATE INDEX "Tile_biomeId_idx" ON "Tile" USING btree ("biomeId");--> statement-breakpoint
CREATE INDEX "Tile_type_idx" ON "Tile" USING btree ("type");--> statement-breakpoint
CREATE INDEX "Tile_coords_idx" ON "Tile" USING btree ("xCoord","yCoord");--> statement-breakpoint
CREATE INDEX "Tile_settlementId_idx" ON "Tile" USING btree ("settlementId");--> statement-breakpoint
CREATE UNIQUE INDEX "World_name_serverId_key" ON "World" USING btree ("name","serverId");