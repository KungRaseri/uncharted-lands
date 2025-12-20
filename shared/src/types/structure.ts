/**
 * Structure Type Definitions
 *
 * ARCHITECTURAL DECISION:
 * This is the SINGLE SOURCE OF TRUTH for structure-related types.
 * All components, stores, and API clients should import from here.
 *
 * NOTE: ExtractorType, BuildingType, and StructureType are defined in game-config.ts
 * Import those from @uncharted-lands/shared directly.
 */

import type { ExtractorType, BuildingType } from './game-config.js';

// ============================================================================
// STRUCTURE DEFINITIONS
// ============================================================================

export type StructureCategory = 'BUILDING' | 'EXTRACTOR';
export type StructureType = ExtractorType | BuildingType;

/**
 * Structure definition interface (for type checking)
 *
 * NOTE: Actual structure data comes from the API (server/src/api/routes/structures-metadata.ts)
 */
export interface StructureDefinition {
	id: string;
	name: string;
	description: string;
	category: StructureCategory;
	type: string; // ExtractorType or BuildingType
	maxLevel: number;
	costs: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};
	prerequisites?: {
		structureId: string;
		minLevel: number;
	}[];
}

// ============================================================================
// RUNTIME STRUCTURE INSTANCES (from database)
// ============================================================================

/**
 * Structure instance (from SettlementStructure database table)
 * Represents an actual built structure in a settlement
 */
export interface Structure {
	id: string;
	settlementId: string;
	structureId: string; // Reference to StructureDefinition.id
	name: string;
	displayName: string;
	description: string;
	category: string;
	level: number;
	maxLevel: number;
	health: number;
	tileId?: string | null;
	slotPosition?: number | null;
	extractorType?: string | null;
	buildingType?: string | null;
	modifiers?: StructureModifier[];
	createdAt: string;
	updatedAt: string;
}

// ============================================================================
// API RESPONSE TYPES (from server endpoints)
// ============================================================================

/**
 * Structure modifier (calculated dynamically by server)
 * From StructureModifier database table
 */
export interface StructureModifier {
	id: string;
	type: string; // LINEAR, EXPONENTIAL, DIMINISHING
	name: string;
	description: string;
	value: number;
}

/**
 * Structure metadata from API (GET /api/structures/metadata)
 * Combines StructureDefinition + StructureRequirements + StructureModifiers
 * Server is authoritative source for all costs and prerequisites
 */
export interface StructureMetadata {
	id: string;
	name: string;
	displayName: string;
	description: string;
	category: string;
	type: string; // ExtractorType or BuildingType
	extractorType?: string;
	buildingType?: string;

	// Build costs (from StructureRequirements table)
	costs: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};

	// Additional metadata
	baseCost?: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};
	enabled?: boolean;
	constructionTime?: number; // in seconds
	populationRequired?: number;

	// Prerequisites (from StructurePrerequisites table)
	prerequisites?: {
		structureId: string;
		minimumLevel?: number;
	}[];

	// Requirements (area, solar, wind, etc.)
	requirements?: {
		area?: number;
		solar?: number;
		wind?: number;
		food?: number;
		water?: number;
		wood?: number;
		stone?: number;
		ore?: number;
	};

	// Modifiers (from StructureModifier table, dynamically calculated)
	modifiers?: StructureModifier[];
}
