/**
 * Shared TypeScript types for REST API
 *
 * These types are used by both client and server to ensure
 * type safety across the API boundary.
 */

// ============================================================================
// Base Types
// ============================================================================

export interface ApiResponse<T = unknown> {
	success: boolean;
	data?: T;
	error?: string;
	code?: string;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
}

// ============================================================================
// World Types
// ============================================================================

export interface World {
	id: string;
	name: string;
	seed: number;
	width: number;
	height: number;
	elevationMap: number[][] | null;
	precipitationMap: number[][] | null;
	temperatureMap: number[][] | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	// Additional properties from Prisma schema
	serverId?: string;
	server?: GameServer; // Eager-loaded relation
	regions?: Region[]; // Eager-loaded relations
}

export interface WorldWithRelations extends World {
	regions?: Region[];
	servers?: GameServer[];
	server?: GameServer; // Singular server relation
}

export interface CreateWorldRequest {
	name: string;
	seed?: number;
	width?: number;
	height?: number;
	regions?: CreateRegionRequest[];
	tiles?: CreateTileRequest[];
	plots?: CreatePlotRequest[];
}

export interface UpdateWorldRequest {
	name?: string;
	seed?: number;
	width?: number;
	height?: number;
}

// ============================================================================
// Region Types
// ============================================================================

export interface Region {
	id: string;
	worldId: string;
	x: number;
	y: number;
	createdAt: Date | string;
	updatedAt: Date | string;
	// Additional properties from Prisma schema
	name?: string;
	xCoord?: number; // Alias for x
	yCoord?: number; // Alias for y
	world?: World; // Eager-loaded relation
	tiles?: Tile[]; // Eager-loaded tiles
}

export interface RegionWithRelations extends Region {
	world?: World;
	tiles?: Tile[];
}

export interface CreateRegionRequest {
	worldId: string;
	x: number;
	y: number;
}

// ============================================================================
// Tile Types
// ============================================================================

export interface Tile {
	id: string;
	regionId: string;
	x: number;
	y: number;
	elevation: number;
	precipitation: number;
	temperature: number;
	biomeId: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	// Additional properties from Prisma schema
	type?: 'LAND' | 'OCEAN';
}

export interface TileWithRelations extends Tile {
	region?: Region;
	biome?: Biome;
	plots?: Plot[];
	Region?: Region; // Capitalized Prisma relation
	Biome?: Biome; // Capitalized Prisma relation
	Plots?: Plot[]; // Capitalized Prisma relation
}

export interface CreateTileRequest {
	regionId: string;
	x: number;
	y: number;
	elevation: number;
	precipitation: number;
	temperature: number;
	biomeId?: string;
}

// ============================================================================
// Plot Types
// ============================================================================

export interface Plot {
	id: string;
	tileId: string;
	x: number;
	y: number;
	area: number;
	solar: number;
	wind: number;
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface PlotWithRelations extends Plot {
	tile?: TileWithRelations;
	settlement?: Settlement;
	Settlement?: Settlement; // Capitalized Prisma relation
}

export interface CreatePlotRequest {
	tileId: string;
	x: number;
	y: number;
	area: number;
	solar: number;
	wind: number;
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

// ============================================================================
// Biome Types
// ============================================================================

export interface Biome {
	id: string;
	name: string;
	description: string | null;
	minPrecipitation: number;
	maxPrecipitation: number;
	minTemperature: number;
	maxTemperature: number;
	color: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}

// ============================================================================
// Server Types
// ============================================================================

export interface GameServer {
	id: string;
	name: string;
	region: string | null;
	isActive: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
	// Additional properties from Prisma schema
	hostname?: string;
	port?: number;
	status?: 'ONLINE' | 'OFFLINE' | 'MAINTENANCE';
	_count?: {
		worlds: number;
	};
}

export interface GameServerWithRelations extends GameServer {
	worlds?: World[];
}

export interface CreateServerRequest {
	name: string;
	region?: string;
	isActive?: boolean;
}

export interface UpdateServerRequest {
	name?: string;
	region?: string;
	isActive?: boolean;
}

// ============================================================================
// Player Types
// ============================================================================

export type PlayerRole = 'MEMBER' | 'SUPPORT' | 'ADMINISTRATOR';

export interface Player {
	id: string;
	authId: string;
	username: string;
	email: string;
	role: PlayerRole;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface PlayerProfile {
	id: string;
	playerId: string;
	displayName: string | null;
	avatar: string | null;
	bio: string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
	// Aliases for compatibility with old Prisma schema
	username?: string; // Alias for displayName
	picture?: string; // Alias for avatar
}

export interface PlayerWithRelations extends Player {
	profile?: PlayerProfile;
	settlements?: Settlement[];
}

export interface UpdatePlayerRequest {
	role: PlayerRole;
}

// ============================================================================
// Settlement Types
// ============================================================================

export interface Settlement {
	id: string;
	name: string;
	playerId: string;
	plotId: string;
	population: number;
	populationCapacity: number;
	area: number;
	areaCapacity: number;
	solar: number;
	solarCapacity: number;
	wind: number;
	windCapacity: number;
	food: number;
	foodCapacity: number;
	water: number;
	waterCapacity: number;
	wood: number;
	woodCapacity: number;
	stone: number;
	stoneCapacity: number;
	ore: number;
	oreCapacity: number;
	lastCollected: Date | string | null;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface SettlementWithRelations extends Settlement {
	player?: Player;
	plot?: PlotWithRelations;
	structures?: Structure[];
}

// ============================================================================
// Structure Types
// ============================================================================

export type StructureType = 'house' | 'farm' | 'well' | 'lumber_mill' | 'quarry' | 'mine';

export interface Structure {
	id: string;
	settlementId: string;
	type: StructureType;
	level: number;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface StructureWithRelations extends Structure {
	settlement?: Settlement;
}

// ============================================================================
// Admin Dashboard Types
// ============================================================================

export interface DashboardStats {
	counts: {
		worlds: number;
		servers: number;
		players: number;
		regions: number;
		tiles: number;
		plots: number;
	};
	recentWorlds: World[];
	recentServers: GameServer[];
	recentPlayers: PlayerWithRelations[];
}

// ============================================================================
// Query Types
// ============================================================================

export interface WorldQuery {
	includeRegions?: boolean;
	includeServers?: boolean;
}

export interface RegionQuery {
	worldId?: string;
	includeTiles?: boolean;
}

export interface PlayerQuery {
	includeProfile?: boolean;
	includeSettlements?: boolean;
}
