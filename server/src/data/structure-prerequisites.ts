/**
 * Structure Prerequisites
 *
 * Manually extracted from GDD Section 4.4 (Prerequisites System)
 * Defines which structures require other structures to be built first.
 *
 * NOTE: This data uses structure NAMES as lookup keys (not IDs).
 * The seed script will resolve these names to actual database CUIDs.
 *
 * @see client/docs/game-design/GDD-Monolith.md Section 4.4
 */

export interface StructurePrerequisiteDefinition {
	structureName: string; // Structure name (e.g., 'Workshop', 'Town Hall')
	requiredStructureName: string; // Required structure name
	requiredLevel: number; // Minimum level of required structure
}

/**
 * Structure prerequisite definitions
 *
 * Based on GDD Section 4.4 and current available structures:
 * - Tent, Farm, Quarry, Mine, Lumber Mill, Fishing Dock, Well, Herb Garden: No prerequisites (basic structures)
 * - House, Warehouse: No prerequisites (basic infrastructure)
 * - Workshop: Requires Town Hall (intermediate structures need governance)
 * - Marketplace: Requires Town Hall (trade requires governance)
 *
 * NOTE: Only includes prerequisites for structures that currently exist in structures.ts
 * Future structures (Library, Guild structures, etc.) will be added when implemented.
 */
export const STRUCTURE_PREREQUISITES: StructurePrerequisiteDefinition[] = [
	// ===== Current Structure Prerequisites =====

	// Workshop requires Town Hall (governance for crafting)
	{
		structureName: 'Workshop',
		requiredStructureName: 'Town Hall',
		requiredLevel: 1,
	},

	// Marketplace requires Town Hall (governance for trade)
	{
		structureName: 'Marketplace',
		requiredStructureName: 'Town Hall',
		requiredLevel: 1,
	},
];

/**
 * Get prerequisites for a specific structure (by name)
 *
 * @param structureName - Structure to check prerequisites for
 * @returns Array of prerequisite definitions
 */
export function getStructurePrerequisites(
	structureName: string
): StructurePrerequisiteDefinition[] {
	return STRUCTURE_PREREQUISITES.filter((p) => p.structureName === structureName);
}

/**
 * Check if a structure has prerequisites (by name)
 *
 * @param structureName - Structure to check
 * @returns True if structure requires other structures
 */
export function hasPrerequisites(structureName: string): boolean {
	return STRUCTURE_PREREQUISITES.some((p) => p.structureName === structureName);
}
