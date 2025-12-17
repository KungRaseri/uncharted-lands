/**
 * Population Calculator
 *
 * Calculates population growth, happiness, immigration, and emigration
 * for settlements in Uncharted Lands.
 *
 * @module game/population-calculator
 */

import type { Resources } from './resource-calculator.js';
import { MODIFIER_NAMES } from './modifier-names.js';
import { calculatePopulationCapacity } from './consumption-calculator.js';
import { logger } from '../utils/logger.js';

/**
 * Structure modifiers that affect population
 */
export interface Structure {
	name: string;
	modifiers: Array<{
		name: string;
		value: number;
	}>;
}

/**
 * Complete population state for a settlement
 */
export interface PopulationState {
	current: number;
	capacity: number;
	growthRate: number; // per hour
	happiness: number; // 0-100
	immigrationChance: number; // 0-1 probability per check
	emigrationChance: number; // 0-1 probability per check
	lastGrowthTick: number; // timestamp
}

/**
 * Factors affecting population happiness
 *
 * GDD Section 3.3: Reweighted for PvE Focus
 * - Resource Sufficiency: 30%
 * - Housing Quality: 20%
 * - Disaster Preparedness: 15%
 * - Recent Trauma: 15%
 * - Morale Bonuses: 15%
 * - NPC Relations: 5%
 */
export interface HappinessFactors {
	resourceSufficiency: number; // 0-100, based on resource availability (30%)
	housingQuality: number; // 0-100, based on housing structures (20%)
	disasterPreparedness: number; // 0-100, based on defense/shelter structures (15%)
	recentTrauma: number; // 0-100, penalty from recent disasters (15%)
	moraleBonuses: number; // 0-100, from entertainment structures (15%)
	npcRelations: number; // 0-100, from NPC settlement relationships (5%)
}

// Growth constants
const BASE_GROWTH_RATE = 0.02; // 2% per hour at max happiness
const HAPPINESS_THRESHOLD_HIGH = 75; // Immigration becomes likely
const HAPPINESS_THRESHOLD_LOW = 35; // Emigration becomes likely
const IMMIGRATION_BASE_CHANCE = 0.1; // 10% per check when happy
const EMIGRATION_BASE_CHANCE = 0.15; // 15% per check when unhappy
const IMMIGRATION_MIN_POP = 2;
const IMMIGRATION_MAX_POP = 5;
const EMIGRATION_MIN_POP = 1;
const EMIGRATION_MAX_POP = 3;

/**
 * Calculate morale bonus from structures
 *
 * @param structures - Array of settlement structures
 * @returns Total morale bonus (0-100+)
 */
export function calculateMorale(structures: Structure[]): number {
	let morale = 0;

	for (const structure of structures) {
		// Look for morale modifiers
		const moraleModifier = structure.modifiers.find((m) => m.name === MODIFIER_NAMES.MORALE_BONUS);

		if (moraleModifier) {
			morale += moraleModifier.value;
		}
	}

	return morale;
}

/**
 * Calculate resource sufficiency score
 *
 * @param population - Current population
 * @param resources - Current resource amounts
 * @returns Score from 0-100 indicating how well resourced the settlement is
 */
export function calculateResourceSufficiency(population: number, resources: Resources): number {
	// Calculate hours of food/water available
	const FOOD_PER_PERSON_PER_HOUR = 0.3; // 0.005 per tick × 3600 ticks
	const WATER_PER_PERSON_PER_HOUR = 0.6; // 0.01 per tick × 3600 ticks

	const foodHoursAvailable =
		population > 0 ? resources.food / (population * FOOD_PER_PERSON_PER_HOUR) : 100;
	const waterHoursAvailable =
		population > 0 ? resources.water / (population * WATER_PER_PERSON_PER_HOUR) : 100;

	// Score based on buffer size
	// 0-6 hours: Critical (0-30)
	// 6-24 hours: Low (30-60)
	// 24-72 hours: Good (60-90)
	// 72+ hours: Excellent (90-100)
	const foodScore = Math.min(100, (foodHoursAvailable / 72) * 100);
	const waterScore = Math.min(100, (waterHoursAvailable / 72) * 100);

	// Average of food and water scores
	return (foodScore + waterScore) / 2;
}

/**
 * Calculate housing quality score
 *
 * @param structures - Array of settlement structures
 * @param currentPop - Current population
 * @param capacity - Maximum population capacity
 * @returns Score from 0-100 indicating housing quality
 */
export function calculateHousingQuality(
	structures: Structure[],
	currentPop: number,
	capacity: number
): number {
	// Overcrowding penalty
	const crowdingRatio = currentPop / capacity;
	let qualityScore = 100;

	if (crowdingRatio > 0.9) {
		qualityScore -= 30; // Severely overcrowded
	} else if (crowdingRatio > 0.75) {
		qualityScore -= 15; // Overcrowded
	} else if (crowdingRatio < 0.5) {
		qualityScore += 10; // Lots of space
	}

	// Bonus for quality housing structures
	const hasHouses = structures.some((s) => s.name.toLowerCase().includes('house'));
	const hasCottages = structures.some((s) => s.name.toLowerCase().includes('cottage'));

	if (hasHouses) {
		qualityScore += 20;
	} else if (hasCottages) {
		qualityScore += 10;
	}

	return Math.min(100, Math.max(0, qualityScore));
}

/**
 * Calculate disaster preparedness score
 *
 * Based on:
 * - Shelter capacity coverage (0-100%)
 * - Warning systems (watchtowers, etc.)
 * - Hospital availability
 * - Defense structures (walls, fortifications)
 *
 * @param structures - Array of settlement structures
 * @param currentPop - Current population
 * @param capacity - Maximum population capacity
 * @returns Score from 0-100 indicating disaster preparedness
 */
export function calculateDisasterPreparedness(
	structures: Structure[],
	currentPop: number,
	_capacity: number
): number {
	let score = 0;

	// Shelter capacity coverage (up to 50 points)
	// Check for Emergency Shelter structures
	const shelterCapacity = structures.reduce((total, s) => {
		if (s.name.toLowerCase().includes('shelter') || s.name.toLowerCase().includes('bunker')) {
			// Each shelter protects 50 people (from GDD)
			const capacityMod = s.modifiers.find((m) => m.name.toLowerCase().includes('capacity'));
			return total + (capacityMod?.value || 50);
		}
		return total;
	}, 0);

	const shelterCoverage = currentPop > 0 ? Math.min(1, shelterCapacity / currentPop) : 0;
	score += shelterCoverage * 50;

	// Warning systems (up to 15 points)
	const hasWatchtower = structures.some(
		(s) => s.name.toLowerCase().includes('watchtower') || s.name.toLowerCase().includes('warning')
	);
	if (hasWatchtower) {
		score += 15;
	}

	// Hospital availability (up to 15 points)
	const hasHospital = structures.some((s) => s.name.toLowerCase().includes('hospital'));
	if (hasHospital) {
		score += 15;
	}

	// Defense structures (up to 20 points)
	const defenseRating = structures.reduce((total, s) => {
		const defenseModifier = s.modifiers.find((m) => m.name.toLowerCase().includes('defense'));
		return total + (defenseModifier?.value || 0);
	}, 0);

	score += Math.min(20, defenseRating * 0.2);

	return Math.min(100, score);
}

/**
 * Calculate recent trauma score
 *
 * Tracks penalty from recent disasters (decays over time)
 *
 * NOTE: Disasters not implemented yet (Phase 3)
 * Currently returns 100 (no trauma) as baseline
 *
 * Will be implemented in Phase 3 with:
 * - Time since last disaster with decay curve
 * - Disaster severity impact (0-100 → trauma penalty)
 * - Multiple disasters compound effect
 * - Relief Center accelerates recovery
 *
 * @param _lastDisasterTime - Timestamp of last disaster (unused until Phase 3)
 * @param _disasterSeverity - Severity of last disaster 0-100 (unused until Phase 3)
 * @returns Score from 0-100 (0 = max trauma, 100 = no trauma)
 */
export function calculateRecentTrauma(
	_lastDisasterTime?: number,
	_disasterSeverity?: number
): number {
	// Phase 3: Will implement disaster trauma tracking
	// For now, return 100 (no trauma baseline) so formula works correctly
	return 100;
}

/**
 * Calculate NPC relations score
 *
 * Based on relationships with NPC settlements
 *
 * NOTE: NPC system not implemented yet (Phase 4)
 * Currently returns 50 (neutral) as baseline
 *
 * Will be implemented in Phase 4 with:
 * - Relationship tiers: Hostile, Neutral, Friendly, Allied, Trusted
 * - Trusted NPCs: +10 points each
 * - Allied NPCs: +5 points each
 * - Friendly NPCs: +2 points each
 * - Hostile NPCs: -10 points each
 *
 * @param _npcRelationships - Map of NPC settlement relationships (unused until Phase 4)
 * @returns Score from 0-100 (50 = neutral baseline)
 */
export function calculateNPCRelations(_npcRelationships?: Map<string, number>): number {
	// Phase 4: Will implement NPC relationship tracking
	// For now, return 50 (neutral baseline) so formula works correctly
	return 50;
}

/**
 * Calculate overall happiness level
 *
 * GDD Section 3.3: Reweighted for PvE Focus
 *
 * @param factors - All factors affecting happiness
 * @returns Happiness score from 0-100
 */
export function calculateHappiness(factors: HappinessFactors): number {
	// GDD-specified weights (reweighted for PvE focus)
	const weights = {
		resourceSufficiency: 0.3, // Do we have food/water?
		housingQuality: 0.2, // Is housing adequate?
		disasterPreparedness: 0.15, // Shelters, warnings, defenses
		recentTrauma: 0.15, // Penalty from recent disasters (decays)
		moraleBonuses: 0.15, // Entertainment structures
		npcRelations: 0.05, // Positive relations with NPCs
	};

	const happiness =
		factors.resourceSufficiency * weights.resourceSufficiency +
		factors.housingQuality * weights.housingQuality +
		factors.disasterPreparedness * weights.disasterPreparedness +
		factors.recentTrauma * weights.recentTrauma +
		factors.moraleBonuses * weights.moraleBonuses +
		factors.npcRelations * weights.npcRelations;

	return Math.min(100, Math.max(0, happiness));
}

/**
 * Calculate population growth rate
 *
 * @param currentPop - Current population
 * @param capacity - Maximum population capacity
 * @param happiness - Happiness score (0-100)
 * @returns Growth rate as percentage per hour (can be negative)
 */
export function calculateGrowthRate(
	currentPop: number,
	capacity: number,
	happiness: number
): number {
	if (currentPop >= capacity) {
		return 0; // No growth when at capacity
	}

	// Growth slows as population approaches capacity
	const capacityFactor = 1 - currentPop / capacity;

	// Happiness affects growth rate
	// 0-30: Negative growth (-2% to 0%)
	// 30-50: Slow growth (0% to 1%)
	// 50-75: Normal growth (1% to 2%)
	// 75-100: Fast growth (2% to 4%)
	let happinessFactor = 0;
	if (happiness < 30) {
		happinessFactor = -1 + happiness / 30; // -1 to 0
	} else if (happiness < 50) {
		happinessFactor = (happiness - 30) / 20; // 0 to 1
	} else if (happiness < 75) {
		happinessFactor = 1 + (happiness - 50) / 25; // 1 to 2
	} else {
		happinessFactor = 2 + (happiness - 75) / 12.5; // 2 to 4
	}

	return BASE_GROWTH_RATE * happinessFactor * capacityFactor;
}

/**
 * Calculate immigration chance
 *
 * @param happiness - Happiness score (0-100)
 * @param currentPop - Current population
 * @param capacity - Maximum population capacity
 * @returns Probability of immigration event (0-1)
 */
export function calculateImmigrationChance(
	happiness: number,
	currentPop: number,
	capacity: number
): number {
	if (currentPop >= capacity) {
		return 0; // No room for immigrants
	}

	if (happiness < HAPPINESS_THRESHOLD_HIGH) {
		return 0; // Not attractive enough
	}

	// Higher happiness = higher chance
	const happinessFactor = (happiness - HAPPINESS_THRESHOLD_HIGH) / (100 - HAPPINESS_THRESHOLD_HIGH);

	// Lower population relative to capacity = higher chance
	const capacityFactor = 1 - currentPop / capacity;

	return IMMIGRATION_BASE_CHANCE * happinessFactor * capacityFactor;
}

/**
 * Calculate emigration chance
 *
 * @param happiness - Happiness score (0-100)
 * @param currentPop - Current population
 * @returns Probability of emigration event (0-1)
 */
export function calculateEmigrationChance(happiness: number, currentPop: number): number {
	if (currentPop <= 1) {
		return 0; // At least 1 person stays
	}

	if (happiness > HAPPINESS_THRESHOLD_LOW) {
		return 0; // People are content enough to stay
	}

	// Lower happiness = higher chance
	const unhappinessFactor = (HAPPINESS_THRESHOLD_LOW - happiness) / HAPPINESS_THRESHOLD_LOW;

	return EMIGRATION_BASE_CHANCE * unhappinessFactor;
}

/**
 * Process population change for a settlement
 *
 * @param current - Current population
 * @param growthRate - Growth rate per hour
 * @param timeSinceLastUpdate - Time elapsed in milliseconds
 * @returns New population after growth/decline
 */
export function applyPopulationGrowth(
	current: number,
	growthRate: number,
	timeSinceLastUpdate: number
): number {
	// Convert time to hours
	const hoursElapsed = timeSinceLastUpdate / (1000 * 60 * 60);

	// Calculate population change
	const change = Math.floor(current * growthRate * hoursElapsed);

	// Apply change (minimum 1 person)
	return Math.max(1, current + change);
}

/**
 * Determine immigration event details
 *
 * @returns Number of immigrants arriving
 */
export function calculateImmigrationAmount(): number {
	return Math.floor(
		Math.random() * (IMMIGRATION_MAX_POP - IMMIGRATION_MIN_POP + 1) + IMMIGRATION_MIN_POP
	);
}

/**
 * Determine emigration event details
 *
 * @param currentPop - Current population (to avoid over-emigration)
 * @returns Number of emigrants leaving
 */
export function calculateEmigrationAmount(currentPop: number): number {
	const baseAmount = Math.floor(
		Math.random() * (EMIGRATION_MAX_POP - EMIGRATION_MIN_POP + 1) + EMIGRATION_MIN_POP
	);

	// Don't let everyone leave
	return Math.min(baseAmount, Math.floor(currentPop * 0.2));
}

/**
 * Calculate complete population state for a settlement
 *
 * GDD Section 3.3: Population Dynamics
 *
 * @param currentPop - Current population
 * @param structures - Settlement structures
 * @param resources - Current resources
 * @param lastGrowthTick - Timestamp of last growth calculation
 * @param lastDisasterTime - Timestamp of last disaster (optional, for trauma calculation)
 * @param disasterSeverity - Severity of last disaster 0-100 (optional)
 * @param npcRelationships - Map of NPC settlement relationships (optional)
 * @returns Complete population state
 */
export function calculatePopulationState(
	currentPop: number,
	structures: Structure[],
	resources: Resources,
	lastGrowthTick: number = Date.now(),
	lastDisasterTime?: number,
	disasterSeverity?: number,
	npcRelationships?: Map<string, number>
): PopulationState {
	// Calculate capacity
	const capacity = calculatePopulationCapacity(structures);
	logger.debug('[CAPACITY ASSIGNMENT DEBUG]', {
		capacityValue: capacity,
		capacityType: typeof capacity,
		capacityIsNaN: Number.isNaN(capacity),
		structuresCount: structures.length,
	});

	// Calculate happiness factors (GDD Section 3.3 weights)
	const resourceSufficiency = calculateResourceSufficiency(currentPop, resources);
	const housingQuality = calculateHousingQuality(structures, currentPop, capacity);
	const disasterPreparedness = calculateDisasterPreparedness(structures, currentPop, capacity);
	const recentTrauma = calculateRecentTrauma(lastDisasterTime, disasterSeverity);
	const moraleBonuses = calculateMorale(structures); // Entertainment structures
	const npcRelations = calculateNPCRelations(npcRelationships);

	const happinessFactors: HappinessFactors = {
		resourceSufficiency,
		housingQuality,
		disasterPreparedness,
		recentTrauma,
		moraleBonuses,
		npcRelations,
	};

	const happiness = calculateHappiness(happinessFactors);

	// Calculate rates and chances
	const growthRate = calculateGrowthRate(currentPop, capacity, happiness);
	const immigrationChance = calculateImmigrationChance(happiness, currentPop, capacity);
	const emigrationChance = calculateEmigrationChance(happiness, currentPop);

	logger.debug('[RETURN VALUE DEBUG]', {
		capacity_beforeReturn: capacity,
		current_beforeReturn: currentPop,
		growthRate_beforeReturn: growthRate,
		happiness_beforeReturn: happiness,
	});

	return {
		current: currentPop,
		capacity,
		growthRate,
		happiness,
		immigrationChance,
		emigrationChance,
		lastGrowthTick,
	};
}

/**
 * Get a human-readable happiness description
 *
 * @param happiness - Happiness score (0-100)
 * @returns Description string
 */
export function getHappinessDescription(happiness: number): string {
	if (happiness >= 90) return 'Ecstatic';
	if (happiness >= 75) return 'Very Happy';
	if (happiness >= 60) return 'Happy';
	if (happiness >= 45) return 'Content';
	if (happiness >= 30) return 'Unhappy';
	if (happiness >= 15) return 'Very Unhappy';
	return 'Miserable';
}

/**
 * Get a summary of population state for display
 */
export function getPopulationSummary(state: PopulationState) {
	// Determine population status
	let status = 'Stable';
	if (state.happiness >= HAPPINESS_THRESHOLD_HIGH) {
		status = 'Growing';
	} else if (state.happiness <= HAPPINESS_THRESHOLD_LOW) {
		status = 'Declining';
	}

	return {
		current: state.current,
		capacity: state.capacity,
		capacityPercent: Math.floor((state.current / state.capacity) * 100),
		happiness: Math.floor(state.happiness),
		happinessDescription: getHappinessDescription(state.happiness),
		growthRate: state.growthRate.toFixed(2),
		immigrationChance: Math.floor(state.immigrationChance * 100),
		emigrationChance: Math.floor(state.emigrationChance * 100),
		status,
	};
}
