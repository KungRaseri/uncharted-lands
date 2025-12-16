/**
 * Structure Type Definitions (Client)
 *
 * ARCHITECTURAL DECISION:
 * This is the SINGLE SOURCE OF TRUTH for structure-related types on the client.
 * All components, stores, and API clients should import from here.
 *
 * Re-exports from game/structures.ts for structure definitions,
 * plus additional types for runtime structure instances and API responses.
 */

// ============================================================================
// STRUCTURE DEFINITIONS (from game rules)
// ============================================================================
export type {
	StructureCategory,
	StructureDefinition,
	ExtractorType,
	BuildingType,
	StructureType
} from '$lib/game/structures';

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
	category: string;
	level: number;
	health: number;
	tileId?: string | null;
	slotPosition?: number | null;
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

	// Prerequisites (from StructurePrerequisites table)
	prerequisites?: {
		structureId: string;
		minimumLevel?: number;
	}[];

	// Modifiers (from StructureModifier table, dynamically calculated)
	modifiers?: StructureModifier[];
}
