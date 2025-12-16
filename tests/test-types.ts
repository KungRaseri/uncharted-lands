/**
 * Test Utility Types
 *
 * TypeScript utility types for creating test-specific mock objects.
 * These types use Pick, Partial, Omit, and Required to compose
 * granular base types into minimal test variants.
 *
 * USAGE:
 * - Import these types in test files
 * - Use them to create type-safe mocks without all production properties
 * - Prevents test breakage when production types evolve
 */

// ============================================================================
// BUILDING & STRUCTURE TEST TYPES
// ============================================================================

/**
 * Minimal Building type for tests
 * Uses TypeScript Partial<T> to make all properties optional for test mocks
 */
export type TestBuilding = Partial<{
	id: string;
	structureId: string;
	name: string;
	description: string;
	level: number;
	maxLevel: number;
	health: number;
	extractorType: string | null;
	buildingType: string | null;
	category: string;
	modifiers: Array<{
		id: string;
		name: string;
		description: string;
		value: number;
	}>;
}>;

/**
 * Minimal Extractor type for tests
 * Uses Partial<T> to allow creating mocks with only needed properties
 */
export type TestExtractor = Partial<{
	id: string;
	type: string;
	level: number;
	health: number;
	extractorType: string;
	category: string;
	tileId: string;
	slotPosition: number;
	production: number;
	modifiers: Array<{
		id: string;
		name: string;
		description: string;
		value: number;
	}>;
}>;

/**
 * Minimal Structure type for tests
 * Omits server-only properties like requirements
 */
export type TestStructure = Partial<{
	id: string;
	structureId: string;
	name: string;
	category: string;
	level: number;
	health: number;
	tileId: string | null;
	slotPosition: number | null;
}>;

/**
 * Minimal StructureModifier for tests
 * All properties required for modifiers
 */
export type TestStructureModifier = {
	id?: string;
	name: string;
	description: string;
	value: number;
	type?: string; // Optional for backwards compatibility
};

// ============================================================================
// RESOURCE & TILE TEST TYPES
// ============================================================================

/**
 * Minimal Tile type for tests
 * Uses Pick<T, K> to select only essential properties
 * Excludes removed properties: worldId, regionId, biomeId
 */
export type TestTile = Partial<{
	id: string;
	x: number;
	y: number;
	tileType: string;
	elevation: number;
	foodQuality: number;
	waterQuality: number;
	woodQuality: number;
	stoneQuality: number;
	oreQuality: number;
}>;

/**
 * Minimal SettlementStructure for tests
 * Excludes settlementId (removed from interface)
 */
export type TestSettlementStructure = Partial<{
	id: string;
	structureId: string;
	level: number;
	health: number;
	tileId: string | null;
	slotPosition: number | null;
	category: string;
}>;

// ============================================================================
// REGION & WORLD TEST TYPES
// ============================================================================

/**
 * Minimal RegionBase type for tests
 * Allows creating regions with just coordinates for grid calculations
 */
export type TestRegion = Partial<{
	id: string;
	name: string;
	worldId: string;
	xCoord: number;
	yCoord: number;
	biomeId: string;
	elevation: number;
	precipitation: number;
	temperature: number;
}>;

// ============================================================================
// CONFIG TEST TYPES
// ============================================================================

/**
 * Minimal GameConfig for tests
 * Uses Omit<T, K> to exclude complex properties like biomeDisplay
 */
export type TestGameConfig = Partial<{
	productionRates: Array<{
		resourceType: string;
		baseRate: number;
		biome?: string;
	}>;
	resourceMetadata: Record<string, unknown>;
	biomeDisplay: Record<string, unknown>;
}>;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a test building with minimal required properties
 */
export function createTestBuilding(overrides: TestBuilding = {}): TestBuilding {
	return {
		id: 'test-building-1',
		structureId: 'HOUSE',
		name: 'Test House',
		level: 1,
		maxLevel: 5,
		health: 100,
		buildingType: 'HOUSING',
		extractorType: null,
		category: 'BUILDING',
		modifiers: [],
		...overrides
	};
}

/**
 * Create a test extractor with minimal required properties
 */
export function createTestExtractor(overrides: TestExtractor = {}): TestExtractor {
	return {
		id: 'test-extractor-1',
		type: 'FARM',
		level: 1,
		health: 100,
		extractorType: 'FARM',
		category: 'EXTRACTOR',
		...overrides
	};
}

/**
 * Create a test region with minimal required properties
 */
export function createTestRegion(overrides: TestRegion = {}): TestRegion {
	return {
		xCoord: 0,
		yCoord: 0,
		...overrides
	};
}

/**
 * Create a test tile with minimal required properties
 */
export function createTestTile(overrides: TestTile = {}): TestTile {
	return {
		id: 'test-tile-1',
		x: 0,
		y: 0,
		tileType: 'grassland',
		foodQuality: 100,
		waterQuality: 100,
		...overrides
	};
}

/**
 * Create a test structure with minimal required properties
 */
export function createTestStructure(
	overrides: TestSettlementStructure = {}
): TestSettlementStructure {
	return {
		id: 'test-structure-1',
		structureId: 'FARM',
		level: 1,
		health: 100,
		category: 'EXTRACTOR',
		...overrides
	};
}
