/**
 * Modifier Calculator
 *
 * Dynamically calculates structure modifiers from config-based definitions.
 * NO DATABASE LOOKUPS - pure calculation from structure-modifiers.ts config.
 *
 * Phase 3: API Endpoint Refactoring
 * @see client/docs/STRUCTURE-DATA-ARCHITECTURE-ANALYSIS.md Phase 3
 * @see server/src/config/structure-modifiers.ts
 */

import {
	type ScalingFormula,
	type StructureModifierConfig,
	getStructureModifierConfig,
	hasModifiers,
} from '../config/structure-modifiers.js';
import {
	type StructurePrerequisiteDefinition,
	getStructurePrerequisites,
	hasPrerequisites,
} from '../data/structure-prerequisites.js';
import { db } from '../db/index.js';
import { structures, settlementStructures } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

/**
 * Calculated modifier result
 */
export interface CalculatedModifier {
	type: string; // e.g., 'FOOD_PRODUCTION'
	name: string; // e.g., 'Food Production'
	description: string; // Human-readable description
	value: number; // Calculated value at current level
}

/**
 * Prerequisite validation result
 */
export interface PrerequisiteValidationResult {
	isValid: boolean;
	missing: Array<{
		structureName: string;
		requiredLevel: number;
		currentLevel?: number; // undefined if structure doesn't exist
	}>;
}

/**
 * Scaling formula implementations
 */
const SCALING_FORMULAS: Record<ScalingFormula, (base: number, level: number) => number> = {
	/**
	 * LINEAR: Steady growth per level
	 * Formula: base × level
	 * Example: Level 1 = 10, Level 2 = 20, Level 5 = 50
	 */
	LINEAR: (base: number, level: number) => base * level,

	/**
	 * EXPONENTIAL: Accelerating growth per level
	 * Formula: base × 1.5^(level-1)
	 * Example: Level 1 = 10, Level 2 = 15, Level 5 = 50.6
	 */
	EXPONENTIAL: (base: number, level: number) => base * Math.pow(1.5, level - 1),

	/**
	 * DIMINISHING: Diminishing returns per level
	 * Formula: base × (1 + log2(level + 1))
	 * Example: Level 1 = 10, Level 2 = 15.8, Level 5 = 28.6
	 */
	DIMINISHING: (base: number, level: number) => base * (1 + Math.log2(level + 1)),
};

/**
 * Calculate the value of a single modifier at a given level
 *
 * @param config - Modifier configuration
 * @param level - Structure level (1-10)
 * @returns Calculated value (rounded to 2 decimals)
 */
export function calculateModifierValue(config: StructureModifierConfig, level: number): number {
	const formula = SCALING_FORMULAS[config.formula];
	const rawValue = formula(config.baseValue, level);
	return Math.round(rawValue * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate all modifiers for a structure at a given level
 *
 * This is the MAIN function used by API endpoints.
 * Replaces database lookups with dynamic config-based calculation.
 *
 * @param structureName - Structure name (e.g., 'Farm', 'Workshop')
 * @param level - Structure level (1-10)
 * @returns Array of calculated modifiers
 *
 * @example
 * ```typescript
 * // Calculate modifiers for a Level 3 Farm
 * const modifiers = calculateStructureModifiers('Farm', 3);
 * // Returns:
 * // [
 * //   { type: 'FOOD_PRODUCTION', name: 'Food Production', description: '...', value: 30 },
 * //   { type: 'HAPPINESS', name: 'Happiness Bonus', description: '...', value: 4 }
 * // ]
 * ```
 */
export function calculateStructureModifiers(
	structureName: string,
	level: number
): CalculatedModifier[] {
	// Get modifier configs for this structure
	const configs = getStructureModifierConfig(structureName);

	// Calculate each modifier's value at the given level
	return configs.map((config) => ({
		type: config.type,
		name: config.name,
		description: config.description,
		value: calculateModifierValue(config, level),
	}));
}

/**
 * Validate that all prerequisites for a structure are met in a settlement
 *
 * Used by POST /api/structures endpoint to prevent building structures
 * without required dependencies.
 *
 * @param db - Database instance
 * @param structureName - Structure to validate prerequisites for
 * @param settlementId - Settlement ID to check in
 * @returns Validation result with missing prerequisites
 *
 * @example
 * ```typescript
 * // Check if Workshop can be built (requires Town Hall level 1)
 * const result = await validatePrerequisites(db, 'Workshop', settlementId);
 * if (!result.isValid) {
 *   console.log('Missing:', result.missing);
 *   // Missing: [{ structureName: 'Town Hall', requiredLevel: 1, currentLevel: undefined }]
 * }
 * ```
 */
export async function validatePrerequisites(
	dbInstance: typeof db,
	structureName: string,
	settlementId: string
): Promise<PrerequisiteValidationResult> {
	// Get prerequisite definitions from config
	const prerequisites = getStructurePrerequisites(structureName);

	// No prerequisites = always valid
	if (prerequisites.length === 0) {
		return { isValid: true, missing: [] };
	}

	const missing: PrerequisiteValidationResult['missing'] = [];

	// Check each prerequisite
	for (const prereq of prerequisites) {
		// Look up required structure by NAME in structures table
		const requiredStructureDefinition = await dbInstance.query.structures.findFirst({
			where: eq(structures.name, prereq.requiredStructureName),
		});

		if (!requiredStructureDefinition) {
			// Structure definition doesn't exist (shouldn't happen)
			throw new Error(`Required structure definition not found: ${prereq.requiredStructureName}`);
		}

		// Check if settlement has this structure
		const settlementStructure = await dbInstance.query.settlementStructures.findFirst({
			where: and(
				eq(settlementStructures.settlementId, settlementId),
				eq(settlementStructures.structureId, requiredStructureDefinition.id)
			),
		});

		// Check if prerequisite is satisfied
		if (!settlementStructure || settlementStructure.level < prereq.requiredLevel) {
			missing.push({
				structureName: prereq.requiredStructureName,
				requiredLevel: prereq.requiredLevel,
				currentLevel: settlementStructure?.level, // undefined if doesn't exist
			});
		}
	}

	return {
		isValid: missing.length === 0,
		missing,
	};
}

/**
 * Get all prerequisites for a structure (config data only)
 *
 * Used by GET /api/structures/metadata endpoint to include prerequisite
 * information in structure definitions.
 *
 * @param structureName - Structure to get prerequisites for
 * @returns Array of prerequisite definitions (from config)
 *
 * @example
 * ```typescript
 * const prereqs = getPrerequisitesForStructure('Workshop');
 * // Returns:
 * // [{ structureName: 'Workshop', requiredStructureName: 'Town Hall', requiredLevel: 1 }]
 * ```
 */
export function getPrerequisitesForStructure(
	structureName: string
): StructurePrerequisiteDefinition[] {
	return getStructurePrerequisites(structureName);
}

/**
 * Check if a structure has any modifiers (config check only)
 *
 * @param structureName - Structure to check
 * @returns True if structure has modifier configurations
 */
export function structureHasModifiers(structureName: string): boolean {
	return hasModifiers(structureName);
}

/**
 * Check if a structure has any prerequisites (config check only)
 *
 * @param structureName - Structure to check
 * @returns True if structure has prerequisite requirements
 */
export function structureHasPrerequisites(structureName: string): boolean {
	return hasPrerequisites(structureName);
}
