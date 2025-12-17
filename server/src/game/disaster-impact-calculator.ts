/**
 * Disaster Impact Calculator
 *
 * Calculates production modifiers based on active disasters and structure resistance.
 *
 * PHASE 3 IMPLEMENTATION (November 2025)
 *
 * Purpose:
 * - Calculate production modifiers for resources affected by disasters
 * - Apply structure resistance bonuses (e.g., Fortress, special defenses)
 * - Support compound disasters (multiple disasters affecting same/different resources)
 *
 * Integration:
 * - Returns modifiers (0.1 to 1.0) to multiply with production rates
 * - Example: Drought (60% severity) → 0.4 modifier → water production × 0.4
 * - Store result in Tile.baseProductionModifier field for persistence
 *
 * Future Phases:
 * - Phase 4: Disaster event system (when disasters trigger, duration, warnings)
 * - Phase 5: Population trauma tracking (calculateRecentTrauma implementation)
 * - Phase 6: UI display (ProductionPanel tooltips, disaster warnings)
 *
 * GDD Reference: Section 5.4 (Disaster System), Section 6.2 (Disaster Balance)
 */

import type { Resources } from './resource-calculator.js';

/**
 * Disaster types that can occur in the game
 *
 * Based on GDD Section 5.4: Disaster System
 * Each disaster affects different resources and biomes
 */
export enum DisasterType {
	// Weather Disasters
	DROUGHT = 'DROUGHT', // Reduces water/food production
	FLOOD = 'FLOOD', // Reduces food/wood production
	BLIZZARD = 'BLIZZARD', // Reduces all production
	HURRICANE = 'HURRICANE', // Reduces food/water production (coastal)
	TORNADO = 'TORNADO', // Reduces all production (localized)
	SANDSTORM = 'SANDSTORM', // Reduces stone/ore production (desert)
	HEATWAVE = 'HEATWAVE', // Reduces water/food production

	// Geological Disasters
	EARTHQUAKE = 'EARTHQUAKE', // Reduces stone/ore production
	VOLCANO = 'VOLCANO', // Reduces all production (regional)
	LANDSLIDE = 'LANDSLIDE', // Reduces stone/wood production
	AVALANCHE = 'AVALANCHE', // Reduces stone/ore production (mountain)

	// Environmental Disasters
	WILDFIRE = 'WILDFIRE', // Reduces wood production
	INSECT_PLAGUE = 'INSECT_PLAGUE', // Reduces food production
	BLIGHT = 'BLIGHT', // Reduces food production
	LOCUST_SWARM = 'LOCUST_SWARM', // Reduces food production
}

/**
 * Disaster severity levels
 *
 * Based on GDD Section 6.2: Disaster Severity Scale
 * Maps to world template settings (MILD, NORMAL, CATASTROPHIC)
 */
export type DisasterSeverity = 'MILD' | 'MODERATE' | 'MAJOR' | 'CATASTROPHIC';

/**
 * Severity to percentage mapping
 *
 * GDD Reference: Section 6.2 Disaster Balance
 * - MILD: 20% production reduction
 * - MODERATE: 40% production reduction
 * - MAJOR: 60% production reduction
 * - CATASTROPHIC: 80% production reduction
 */
const SEVERITY_IMPACT_MAP: Record<DisasterSeverity, number> = {
	MILD: 0.2, // 20% reduction → 0.8 multiplier
	MODERATE: 0.4, // 40% reduction → 0.6 multiplier
	MAJOR: 0.6, // 60% reduction → 0.4 multiplier (GDD example)
	CATASTROPHIC: 0.8, // 80% reduction → 0.2 multiplier
};

/**
 * Disaster to resource mapping
 *
 * Defines which resources are affected by each disaster type
 * Based on GDD disaster specifications and logical mappings
 */
const DISASTER_RESOURCE_IMPACT: Record<DisasterType, (keyof Resources)[]> = {
	// Weather Disasters
	DROUGHT: ['water', 'food'], // Dry conditions reduce water availability and crop growth
	FLOOD: ['food', 'wood'], // Waterlogged fields, damaged trees
	BLIZZARD: ['food', 'water', 'wood', 'stone', 'ore'], // Freezing conditions halt all production
	HURRICANE: ['food', 'water', 'wood'], // Coastal storms damage crops, water supply, forests
	TORNADO: ['food', 'water', 'wood', 'stone'], // Localized destruction across multiple resources
	SANDSTORM: ['stone', 'ore', 'food'], // Desert storms bury quarries and mines
	HEATWAVE: ['water', 'food'], // Extreme heat dries water sources, wilts crops

	// Geological Disasters
	EARTHQUAKE: ['stone', 'ore', 'wood'], // Structural damage to quarries, mines, lumber mills
	VOLCANO: ['food', 'water', 'wood', 'stone', 'ore'], // Ash and lava affect all production
	LANDSLIDE: ['stone', 'wood', 'food'], // Debris blocks quarries and farms
	AVALANCHE: ['stone', 'ore', 'wood'], // Mountain disasters bury mines and quarries

	// Environmental Disasters
	WILDFIRE: ['wood', 'food'], // Burns forests and crops
	INSECT_PLAGUE: ['food'], // Insects devour crops
	BLIGHT: ['food'], // Plant disease kills crops
	LOCUST_SWARM: ['food'], // Locusts consume all vegetation
};

/**
 * Disaster impact data for a single disaster
 */
export interface DisasterImpact {
	/** Type of disaster */
	disasterType: DisasterType;

	/** Severity level (maps to reduction percentage) */
	severity: DisasterSeverity;

	/** Affected resource types (optional override, defaults to DISASTER_RESOURCE_IMPACT map) */
	affectedResources?: (keyof Resources)[];
}

/**
 * Structure modifier for disaster resistance
 *
 * Based on GDD structure modifiers:
 * - Fortress: 30% all disaster resistance
 * - Seismic Foundation: 60% earthquake resistance
 * - Fire Resistant Wood: 70% fire resistance
 * - Storm Barrier: 60% flood/tsunami resistance
 * - Advanced Greenhouse: 40% drought resistance
 */
export interface DisasterResistance {
	/** General disaster resistance (applies to all disaster types) */
	general?: number;

	/** Specific disaster type resistances (overrides general) */
	specific?: Partial<Record<DisasterType, number>>;
}

/**
 * Calculate production modifier for a resource based on active disasters
 *
 * Formula (GDD Section 6.2):
 * 1. Base Impact = Severity percentage (e.g., MAJOR = 60%)
 * 2. Resistance Reduction = Impact × (1 - Resistance)
 * 3. Final Modifier = 1 - Reduced Impact
 *
 * Example:
 * - Drought (MAJOR, 60%) on water with Fortress (30% resistance):
 *   - Base Impact: 60% reduction
 *   - With Resistance: 60% × (1 - 0.30) = 42% reduction
 *   - Final Modifier: 1 - 0.42 = 0.58 (58% of normal production)
 *
 * Compound Disasters:
 * - Same resource: Multiplicative stacking
 *   - Drought (60%) + Heatwave (40%) on water:
 *   - Modifier = (1 - 0.6) × (1 - 0.4) = 0.4 × 0.6 = 0.24 (24% production)
 * - Different resources: Separate calculations
 *
 * @param resourceType - The resource being produced
 * @param disasters - Array of active disasters affecting the settlement
 * @param resistance - Structure-based resistance modifiers
 * @returns Production modifier (0.1 to 1.0) to multiply with base production
 */
export function calculateDisasterModifier(
	resourceType: keyof Resources,
	disasters: DisasterImpact[],
	resistance: DisasterResistance = {}
): number {
	// No disasters = normal production
	if (!disasters || disasters.length === 0) {
		return 1;
	}

	// Filter disasters that affect this resource
	const relevantDisasters = disasters.filter((disaster) => {
		const affectedResources =
			disaster.affectedResources || DISASTER_RESOURCE_IMPACT[disaster.disasterType];
		return affectedResources.includes(resourceType);
	});

	// No relevant disasters = normal production
	if (relevantDisasters.length === 0) {
		return 1;
	}

	// Calculate compound impact (multiplicative stacking)
	let finalModifier = 1;

	for (const disaster of relevantDisasters) {
		// Get base impact percentage from severity
		const baseImpact = SEVERITY_IMPACT_MAP[disaster.severity];

		// Get resistance for this disaster type
		const disasterResistance = getDisasterResistance(disaster.disasterType, resistance);

		// Apply resistance (reduces impact)
		// Formula: Reduced Impact = Base Impact × (1 - Resistance)
		// Example: 60% impact with 30% resistance = 60% × 0.7 = 42% final impact
		const reducedImpact = baseImpact * (1 - disasterResistance);

		// Convert impact to modifier (1.0 = no impact, 0.0 = total destruction)
		// Example: 42% impact → 0.58 modifier (58% of normal production)
		const disasterModifier = 1 - reducedImpact;

		// Compound with previous disasters (multiplicative)
		// Example: First disaster 0.6, second disaster 0.8 → 0.6 × 0.8 = 0.48
		finalModifier *= disasterModifier;
	}

	// Minimum modifier is 0.1 (10% production, never complete shutdown)
	// This ensures some resources always trickle in for recovery
	return Math.max(0.1, finalModifier);
}

/**
 * Get resistance value for a specific disaster type
 *
 * Priority:
 * 1. Specific resistance for this disaster type
 * 2. General resistance (applies to all disasters)
 * 3. No resistance (0)
 *
 * @param disasterType - Type of disaster
 * @param resistance - Structure resistance data
 * @returns Resistance value (0.0 to 1.0, where 0.6 = 60% resistance)
 */
function getDisasterResistance(disasterType: DisasterType, resistance: DisasterResistance): number {
	// Check for specific resistance first
	const specificResistance = resistance.specific?.[disasterType];
	if (specificResistance !== undefined) {
		return clampResistance(specificResistance);
	}

	// Fall back to general resistance
	if (resistance.general !== undefined) {
		return clampResistance(resistance.general);
	}

	// No resistance
	return 0;
}

/**
 * Clamp resistance value to valid range (0.0 to 1.0)
 *
 * @param resistance - Raw resistance value
 * @returns Clamped resistance (0.0 to 1.0)
 */
function clampResistance(resistance: number): number {
	return Math.max(0, Math.min(1, resistance));
}

/**
 * Calculate disaster modifiers for ALL resources
 *
 * Useful for batch calculations or UI display
 *
 * @param disasters - Array of active disasters
 * @param resistance - Structure-based resistance modifiers
 * @returns Object with modifiers for each resource type
 */
export function calculateAllDisasterModifiers(
	disasters: DisasterImpact[],
	resistance: DisasterResistance = {}
): Resources {
	return {
		food: calculateDisasterModifier('food', disasters, resistance),
		water: calculateDisasterModifier('water', disasters, resistance),
		wood: calculateDisasterModifier('wood', disasters, resistance),
		stone: calculateDisasterModifier('stone', disasters, resistance),
		ore: calculateDisasterModifier('ore', disasters, resistance),
	};
}

/**
 * Check if a disaster affects a specific resource
 *
 * @param disasterType - Type of disaster
 * @param resourceType - Resource to check
 * @returns True if disaster affects this resource
 */
export function doesDisasterAffectResource(
	disasterType: DisasterType,
	resourceType: keyof Resources
): boolean {
	const affectedResources = DISASTER_RESOURCE_IMPACT[disasterType];
	return affectedResources.includes(resourceType);
}

/**
 * Get all resources affected by a disaster
 *
 * @param disasterType - Type of disaster
 * @returns Array of affected resource types
 */
export function getAffectedResources(disasterType: DisasterType): (keyof Resources)[] {
	return DISASTER_RESOURCE_IMPACT[disasterType];
}

/**
 * Convert severity number (0-100) to severity level
 *
 * Based on GDD Section 6.2: Disaster Severity Scale
 * - 0-25: MILD
 * - 26-50: MODERATE
 * - 51-75: MAJOR
 * - 76-100: CATASTROPHIC
 *
 * @param severityValue - Numeric severity (0-100)
 * @returns Severity level enum
 */
export function getSeverityLevel(severityValue: number): DisasterSeverity {
	if (severityValue <= 25) return 'MILD';
	if (severityValue <= 50) return 'MODERATE';
	if (severityValue <= 75) return 'MAJOR';
	return 'CATASTROPHIC';
}

/**
 * Get human-readable description of disaster impact
 *
 * @param disaster - Disaster impact data
 * @param resistance - Structure resistance
 * @returns Description string (e.g., "Drought (MAJOR) reducing water production by 42%")
 */
export function getDisasterDescription(
	disaster: DisasterImpact,
	resistance: DisasterResistance = {}
): string {
	const affectedResources =
		disaster.affectedResources || DISASTER_RESOURCE_IMPACT[disaster.disasterType];
	const baseImpact = SEVERITY_IMPACT_MAP[disaster.severity];

	// Calculate average impact across affected resources
	const disasterResistance = getDisasterResistance(disaster.disasterType, resistance);
	const reducedImpact = baseImpact * (1 - disasterResistance);
	const impactPercentage = Math.round(reducedImpact * 100);

	const resourceList = affectedResources.join(', ');

	return `${disaster.disasterType} (${disaster.severity}) reducing ${resourceList} production by ${impactPercentage}%`;
}
