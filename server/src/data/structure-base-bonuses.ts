/**
 * Structure Base Bonuses Configuration
 *
 * Defines the base modifier calculation formulas for each structure.
 * These modifiers are dynamically calculated based on structure level.
 *
 * Source: GDD-Monolith.md Section 4.3 "Resource Modifiers"
 * Replaces: Deprecated area/solar/wind fields from structure-requirements.ts
 *
 * @see client/docs/game-design/GDD-Monolith.md Section 4.3
 */

/**
 * Scaling formula types for modifier calculation
 */
export type ScalingFormula = 'LINEAR' | 'EXPONENTIAL' | 'DIMINISHING';

/**
 * Structure base bonus definition
 * Defines how modifiers scale with structure level
 */
export interface StructureBaseBonusDefinition {
	structureName: string; // Structure name (e.g., 'Farm', 'Quarry')
	modifierType: string; // Modifier type (e.g., 'foodModifier', 'stoneModifier')
	baseValue: number; // Base value at level 1
	scalingFormula: ScalingFormula; // How the bonus scales with level
	scalingFactor: number; // Multiplier/exponent for scaling
}

/**
 * Structure Base Bonuses
 *
 * Based on GDD Section 4.3:
 * - EXTRACTORS: Provide resource modifiers (food, water, wood, stone, ore)
 * - BUILDINGS: Provide utility bonuses (housing, storage, etc.)
 *
 * Scaling Formulas:
 * - LINEAR: value = baseValue + (level - 1) * scalingFactor
 * - EXPONENTIAL: value = baseValue * (scalingFactor ^ (level - 1))
 * - DIMINISHING: value = baseValue * (1 + log(1 + level * scalingFactor))
 *
 * NOTE: Only includes modifiers for structures that currently exist in structures.ts
 */
export const STRUCTURE_BASE_BONUSES: StructureBaseBonusDefinition[] = [
	// ===== EXTRACTOR MODIFIERS =====

	// Farm: Food production extractor
	{
		structureName: 'Farm',
		modifierType: 'foodModifier',
		baseValue: 1.0,
		scalingFormula: 'LINEAR',
		scalingFactor: 0.1, // +10% per level
	},

	// Well: Water production extractor
	{
		structureName: 'Well',
		modifierType: 'waterModifier',
		baseValue: 1.0,
		scalingFormula: 'LINEAR',
		scalingFactor: 0.1, // +10% per level
	},

	// Lumber Mill: Wood production extractor
	{
		structureName: 'Lumber Mill',
		modifierType: 'woodModifier',
		baseValue: 1.0,
		scalingFormula: 'LINEAR',
		scalingFactor: 0.1, // +10% per level
	},

	// Quarry: Stone production extractor
	{
		structureName: 'Quarry',
		modifierType: 'stoneModifier',
		baseValue: 1.0,
		scalingFormula: 'LINEAR',
		scalingFactor: 0.1, // +10% per level
	},

	// Mine: Ore production extractor
	{
		structureName: 'Mine',
		modifierType: 'oreModifier',
		baseValue: 1.0,
		scalingFormula: 'LINEAR',
		scalingFactor: 0.1, // +10% per level
	},

	// Fishing Dock: Food production extractor (water-based)
	{
		structureName: 'Fishing Dock',
		modifierType: 'foodModifier',
		baseValue: 0.8,
		scalingFormula: 'LINEAR',
		scalingFactor: 0.08, // +8% per level (slightly lower than Farm)
	},

	// Herb Garden: Food production extractor (medicinal/consumable)
	{
		structureName: 'Herb Garden',
		modifierType: 'foodModifier',
		baseValue: 0.5,
		scalingFormula: 'LINEAR',
		scalingFactor: 0.05, // +5% per level (specialty resource)
	},

	// ===== BUILDING MODIFIERS =====

	// Town Hall: Administrative efficiency bonus
	{
		structureName: 'Town Hall',
		modifierType: 'administrativeEfficiency',
		baseValue: 1.0,
		scalingFormula: 'DIMINISHING',
		scalingFactor: 0.2, // Diminishing returns on admin efficiency
	},

	// Workshop: Construction speed bonus
	{
		structureName: 'Workshop',
		modifierType: 'constructionSpeed',
		baseValue: 1.0,
		scalingFormula: 'DIMINISHING',
		scalingFactor: 0.15, // Diminishing returns on build speed
	},

	// Marketplace: Trade efficiency bonus
	{
		structureName: 'Marketplace',
		modifierType: 'tradeEfficiency',
		baseValue: 1.0,
		scalingFormula: 'LINEAR',
		scalingFactor: 0.1, // +10% per level
	},
];

/**
 * Calculate modifier value based on structure level
 *
 * @param bonus - Structure base bonus definition
 * @param level - Current structure level
 * @returns Calculated modifier value
 */
export function calculateModifierValue(bonus: StructureBaseBonusDefinition, level: number): number {
	if (level < 1) {
		throw new Error(`Invalid structure level: ${level}. Level must be >= 1.`);
	}

	switch (bonus.scalingFormula) {
		case 'LINEAR':
			// value = baseValue + (level - 1) * scalingFactor
			return bonus.baseValue + (level - 1) * bonus.scalingFactor;

		case 'EXPONENTIAL':
			// value = baseValue * (scalingFactor ^ (level - 1))
			return bonus.baseValue * Math.pow(bonus.scalingFactor, level - 1);

		case 'DIMINISHING':
			// value = baseValue * (1 + log(1 + level * scalingFactor))
			return bonus.baseValue * (1 + Math.log(1 + level * bonus.scalingFactor));

		default:
			throw new Error(`Unknown scaling formula: ${bonus.scalingFormula}`);
	}
}

/**
 * Get all base bonuses for a specific structure
 *
 * @param structureName - Structure to get bonuses for
 * @returns Array of base bonus definitions
 */
export function getStructureBonuses(structureName: string): StructureBaseBonusDefinition[] {
	return STRUCTURE_BASE_BONUSES.filter((b) => b.structureName === structureName);
}

/**
 * Check if a structure has base bonuses
 *
 * @param structureName - Structure to check
 * @returns True if structure has base bonuses
 */
export function hasBaseBonuses(structureName: string): boolean {
	return STRUCTURE_BASE_BONUSES.some((b) => b.structureName === structureName);
}
