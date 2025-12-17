/**
 * World Template System
 *
 * Defines different gameplay modes with production/consumption multipliers
 * and disaster settings. Allows worlds to have different difficulty levels
 * and rulesets.
 */

/**
 * Available world template types
 */
export type WorldTemplateType =
	| 'STANDARD' // Balanced gameplay (1.0x/1.0x)
	| 'SURVIVAL' // Hardcore (0.7x production, 1.3x consumption)
	| 'RELAXED' // Casual building (1.5x production, 0.7x consumption)
	| 'FANTASY' // High magic (1.2x production, 0.9x consumption)
	| 'APOCALYPSE'; // Extreme challenge (0.5x production, 1.5x consumption)

/**
 * Complete world template configuration
 */
export interface WorldTemplate {
	id: WorldTemplateType;
	name: string;
	description: string;

	// Gameplay modifiers
	magicLevel: 'NONE' | 'LOW' | 'HIGH';
	difficulty: 'CASUAL' | 'NORMAL' | 'HARDCORE' | 'EXTREME';

	// Resource settings
	resourceAbundance: 'SCARCE' | 'NORMAL' | 'ABUNDANT' | 'EXTREME_SCARCITY';
	depletionEnabled: boolean;
	depletionRate: number; // Multiplier (0.5x to 2.0x)

	// Production/Consumption multipliers (Phase 1D implementation)
	productionMultiplier: number; // 0.5x to 2.0x
	consumptionMultiplier: number; // 0.7x to 1.5x

	// Population settings
	populationGrowthRate: number; // Multiplier for growth

	// Disaster settings (future phases)
	disasterFrequency: 'RARE' | 'NORMAL' | 'FREQUENT' | 'CONSTANT';
	disasterSeverity: 'MILD' | 'NORMAL' | 'CATASTROPHIC';

	// Feature flags (future phases)
	specialResourcesEnabled: boolean;
	npcSettlementsEnabled: boolean;
}

/**
 * Default template configurations
 * Based on GDD Section 5.1: World Template System
 */
export const DEFAULT_WORLD_TEMPLATES: Record<WorldTemplateType, WorldTemplate> = {
	STANDARD: {
		id: 'STANDARD',
		name: 'Standard Mode',
		description:
			'Balanced gameplay recommended for most players and first playthroughs. Low magic, normal resources, balanced disasters.',

		magicLevel: 'LOW',
		difficulty: 'NORMAL',

		resourceAbundance: 'NORMAL',
		depletionEnabled: true,
		depletionRate: 1, // 0.1% per hour extraction (baseline)

		productionMultiplier: 1,
		consumptionMultiplier: 1,

		populationGrowthRate: 1,

		disasterFrequency: 'NORMAL',
		disasterSeverity: 'NORMAL',

		specialResourcesEnabled: true,
		npcSettlementsEnabled: true,
	},

	SURVIVAL: {
		id: 'SURVIVAL',
		name: 'Survival Mode',
		description:
			'Hardcore realism for strategy enthusiasts. No magic, scarce resources, frequent catastrophic disasters. Depletion 1.5x faster.',

		magicLevel: 'NONE',
		difficulty: 'HARDCORE',

		resourceAbundance: 'SCARCE',
		depletionEnabled: true,
		depletionRate: 1.5, // 50% faster depletion

		productionMultiplier: 0.7, // 30% less production
		consumptionMultiplier: 1.3, // 30% more consumption

		populationGrowthRate: 0.8,

		disasterFrequency: 'FREQUENT',
		disasterSeverity: 'CATASTROPHIC',

		specialResourcesEnabled: false, // Realistic only
		npcSettlementsEnabled: true, // Limited
	},

	RELAXED: {
		id: 'RELAXED',
		name: 'Relaxed Mode',
		description:
			'Casual building focus with minimal survival pressure. Low magic, abundant resources, rare mild disasters. No resource depletion.',

		magicLevel: 'LOW',
		difficulty: 'CASUAL',

		resourceAbundance: 'ABUNDANT',
		depletionEnabled: false, // Infinite resources
		depletionRate: 0, // No depletion

		productionMultiplier: 1.5, // 50% more production
		consumptionMultiplier: 0.7, // 30% less consumption

		populationGrowthRate: 1.3,

		disasterFrequency: 'RARE',
		disasterSeverity: 'MILD',

		specialResourcesEnabled: true,
		npcSettlementsEnabled: true, // High density
	},

	FANTASY: {
		id: 'FANTASY',
		name: 'Fantasy Mode',
		description:
			'High magic gameplay with mystical resources and magical disasters. Slower depletion, faster regeneration.',

		magicLevel: 'HIGH',
		difficulty: 'NORMAL',

		resourceAbundance: 'NORMAL',
		depletionEnabled: true,
		depletionRate: 0.5, // 50% slower depletion, with regeneration

		productionMultiplier: 1.2, // 20% more production
		consumptionMultiplier: 0.9, // 10% less consumption

		populationGrowthRate: 1.1,

		disasterFrequency: 'NORMAL',
		disasterSeverity: 'NORMAL',

		specialResourcesEnabled: true, // Enhanced magical variants
		npcSettlementsEnabled: true, // Includes mystical settlements
	},

	APOCALYPSE: {
		id: 'APOCALYPSE',
		name: 'Apocalypse Mode',
		description:
			'Extreme challenge requiring guild cooperation. Low magic, extreme scarcity, constant mega-disasters. Solo play disabled.',

		magicLevel: 'LOW',
		difficulty: 'EXTREME',

		resourceAbundance: 'EXTREME_SCARCITY',
		depletionEnabled: true,
		depletionRate: 2, // 2x faster depletion

		productionMultiplier: 0.5, // 50% less production
		consumptionMultiplier: 1.5, // 50% more consumption

		populationGrowthRate: 0.5,

		disasterFrequency: 'CONSTANT',
		disasterSeverity: 'CATASTROPHIC',

		specialResourcesEnabled: true, // Very rare
		npcSettlementsEnabled: true, // Desperate, need constant aid
	},
};

/**
 * Get template configuration by type
 * @param worldTemplateType - Template type identifier
 * @returns Complete template configuration
 */
export function getWorldTemplateConfig(worldTemplateType: WorldTemplateType): WorldTemplate {
	return DEFAULT_WORLD_TEMPLATES[worldTemplateType];
}

/**
 * Validate if a string is a valid WorldTemplateType
 * @param value - String to validate
 * @returns True if valid template type
 */
export function isValidWorldTemplateType(value: string): value is WorldTemplateType {
	return ['STANDARD', 'SURVIVAL', 'RELAXED', 'FANTASY', 'APOCALYPSE'].includes(value);
}

/**
 * Get all available template types
 * @returns Array of template type identifiers
 */
export function getAvailableTemplateTypes(): WorldTemplateType[] {
	return ['STANDARD', 'SURVIVAL', 'RELAXED', 'FANTASY', 'APOCALYPSE'];
}
