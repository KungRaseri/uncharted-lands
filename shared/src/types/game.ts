/**
 * Game-related TypeScript types for client components
 *
 * These types extend the API types with component-specific structures
 * and include nested relations commonly used in the UI.
 */

// ============================================================================
// Base Game Types (matching server schema)
// ============================================================================

export type TileType = 'LAND' | 'OCEAN';
export type Role = 'MEMBER' | 'SUPPORT' | 'ADMINISTRATOR';
export type ServerStatus = 'OFFLINE' | 'MAINTENANCE' | 'ONLINE';

// ============================================================================
// Biome Types
// ============================================================================

export interface Biome {
	id: string;
	name: string;
	precipitationMin: number;
	precipitationMax: number;
	temperatureMin: number;
	temperatureMax: number;
	solarModifier: number;
	windModifier: number;
	foodModifier: number;
	waterModifier: number;
	woodModifier: number;
	stoneModifier: number;
	oreModifier: number;
}

// ============================================================================
// Settlement Types
// ============================================================================

export type SettlementType = 'OUTPOST' | 'VILLAGE' | 'TOWN' | 'CITY';

export interface Settlement {
	id: string;
	name: string;
	playerProfileId: string;
	tileId: string;
	founded: Date | string;
	settlementType: SettlementType;
	tier: number; // 1-4
	resilience: number; // 0-100
}

// ============================================================================
// Tile Types (with nested relations)
// ============================================================================

export interface TileBase {
	id: string;
	biomeId: string;
	regionId: string;
	x: number;
	y: number;
	xCoord: number;
	yCoord: number;
	elevation: number;
	temperature: number;
	precipitation: number;
	type: TileType;
	createdAt: Date | string;
	updatedAt: Date | string;
	baseProductionModifier: number;
	// Resource quality fields (0-100)
	foodQuality: number;
	waterQuality: number;
	woodQuality: number;
	stoneQuality: number;
	oreQuality: number;
	specialResource?: string | null;
	settlementId?: string | null;
	plotSlots: number;
}

export interface TileWithBiome extends TileBase {
	Biome: Biome;
}

export interface TileWithRelations extends TileBase {
	biome?: Biome;
	settlement?: Settlement;
}

// Convenient type alias for most common use case
export type Tile = TileWithBiome | TileWithRelations;

// ============================================================================
// Region Types (with nested relations)
// ============================================================================

export interface RegionBase {
	id: string;
	xCoord: number;
	yCoord: number;
	name: string;
	worldId: string;
	elevationMap?: number[][];
	precipitationMap?: number[][];
	temperatureMap?: number[][];
}

export interface Region extends RegionBase {
	tiles?: TileWithRelations[];
}

export interface RegionWithTiles extends RegionBase {
	tiles: TileWithRelations[];
}

// ============================================================================
// Region Statistics
// ============================================================================

/**
 * Region statistics for elevation and tile composition
 * Used for region analysis and tooltips
 */
export interface RegionStats {
	avgElevation: number;
	minElevation: number;
	maxElevation: number;
	landTiles: number;
	oceanTiles: number;
}

// ============================================================================
// World Types
// ============================================================================

export interface WorldBase {
	id: string;
	name: string;
	status?: string;
	elevationSettings: unknown;
	precipitationSettings: unknown;
	temperatureSettings: unknown;
	serverId: string;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface World extends WorldBase {
	regions?: Region[];
	server?: GameServer;
}

export interface WorldWithRegions extends WorldBase {
	regions: Region[];
}

export interface WorldWithServer extends WorldBase {
	server: GameServer;
}

export interface WorldWithRelations extends WorldBase {
	regions?: Region[];
	server?: GameServer;
	servers?: GameServer[]; // Legacy field from API
}

// ============================================================================
// Server Types
// ============================================================================

export interface GameServer {
	id: string;
	name: string;
	hostname: string;
	port: number;
	status: ServerStatus;
	createdAt: Date | string;
	updatedAt: Date | string;
	_count?: {
		worlds: number;
	};
}

// ============================================================================
// Player/Profile Types
// ============================================================================

export interface PlayerProfile {
	id: string;
	username: string;
	picture: string;
	accountId: string;
}

export interface Account {
	id: string;
	email: string;
	passwordHash: string;
	userAuthToken: string;
	role: Role;
	createdAt: Date | string;
	updatedAt: Date | string;
	profile?: PlayerProfile | null;
}

// ============================================================================
// Component-specific Types
// ============================================================================

export interface WorldInfo {
	landTiles: number;
	oceanTiles: number;
	settlements: number;
}

export interface SettlementWithStorage {
	id: string;
	name: string;
	playerProfileId: string;
	tileId: string;
	founded: Date | string;
	storage?: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	} | null;
	structures?: Array<{
		id: string;
		type: string;
	}> | null;
}
