/**
 * Resource Type Definitions (Client)
 *
 * ARCHITECTURAL DECISION: Central Type Repository
 * All resource-related types defined here as single source of truth.
 * Stores, API clients, and components import from this file.
 *
 * Type Categories:
 * 1. Resource Types - Individual resource definitions
 * 2. Storage Models - Resource storage from database
 * 3. Production Data - Resource generation information
 */

// ===== RESOURCE TYPES =====

/**
 * Base resource types in the game
 * Re-exported from game-config for consistency
 */
export type ResourceType = 'food' | 'water' | 'wood' | 'stone' | 'ore';

/**
 * Resource costs for structures and operations
 */
export interface ResourceCosts {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

/**
 * Individual resource with current and max values
 */
export interface Resource {
	current: number;
	max: number;
}

/**
 * Resource data for a single resource type
 * Used in stores and components
 */
export interface ResourceData {
	current: number;
	capacity: number;
	productionRate: number; // per hour
	consumptionRate: number; // per hour
}

/**
 * Resource with type identifier for display in components
 * Extends ResourceData with the resource type
 */
export interface ResourceWithType extends ResourceData {
	type: ResourceType;
}

// ===== STORAGE MODELS =====

/**
 * Complete resource state for a settlement
 * Maps each resource type to its data
 */
export interface ResourcesState {
	food: ResourceData;
	water: ResourceData;
	wood: ResourceData;
	stone: ResourceData;
	ore: ResourceData;
	settlementId: string | null;
	lastUpdate: number;
}

// ===== PRODUCTION DATA =====

/**
 * Production rate for a single resource
 */
export interface ProductionRate {
	resourceType: ResourceType;
	amount: number;
	interval: number; // seconds
}

/**
 * Aggregated production data
 */
export interface ProductionData {
	baseRate: number;
	modifiers: number;
	totalRate: number;
}

/**
 * Production rates for all resources
 */
export interface ProductionRates {
	food: number;
	water: number;
	wood: number;
	stone: number;
	ore: number;
}

/**
 * Extractor information for production calculations
 */
export interface ExtractorInfo {
	resourceType: ResourceType;
	level: number;
	quality: number;
	biomeModifier: number;
	health: number;
}
