/**
 * Disaster Damage Calculator
 *
 * Calculates structure damage, population casualties, and resource loss
 * during disaster IMPACT phase.
 *
 * GDD Reference: Section 3.5.4 (Disaster System - Damage Mechanics)
 *
 * Formulas:
 * - Net Damage = (Severity - Preparedness) ± 20% variance
 * - Structure Damage = Net Damage × (1 - Resistance)
 * - Casualties = Unsheltered × (Severity / 100) × Disaster Multiplier
 * - Hospital Save Rate = 50% (Level 1) to 75% (Level 5)
 * - Resource Loss = Storage Amount × (Structure Damage % / 100)
 */

import { db } from '../db/index.js';
import { settlementStructures, settlementStorage, settlementPopulation } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import type { DisasterEvent, Settlement } from '../db/schema.js';
import { logger } from '../utils/logger.js';

/**
 * Result of damage calculation for a single settlement
 */
export interface DamageCalculationResult {
	casualties: number;
	structuresDamaged: number;
	structuresDestroyed: number;
	resourcesLost: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};
	affectedStructures: Array<{
		structureId: string;
		name: string;
		oldHealth: number;
		newHealth: number;
	}>;
}

/**
 * Structure-specific disaster resistance multipliers
 */
const STRUCTURE_RESISTANCES: Record<string, Record<string, number>> = {
	// Seismic-resistant structures
	SEISMIC_FOUNDATION: {
		EARTHQUAKE: 0.6, // 60% reduction
		LANDSLIDE: 0.4,
	},
	// Fire-resistant structures
	FIRE_BREAK: {
		WILDFIRE: 0.7,
	},
	// Storm-resistant structures
	STORM_BARRIER: {
		HURRICANE: 0.6,
		TSUNAMI: 0.6,
		FLOOD: 0.5,
	},
	// General defensive structures
	FORTRESS: {
		ALL: 0.3, // 30% reduction to all disasters
	},
	ADVANCED_GREENHOUSE: {
		DROUGHT: 0.4,
		COLD_SNAP: 0.3,
	},
	DEEP_MINING_COMPLEX: {
		EARTHQUAKE: -0.4, // NEGATIVE = 40% MORE vulnerable
	},
};

/**
 * Disaster-specific casualty multipliers
 * Higher = more deadly to population
 */
const DISASTER_CASUALTY_MULTIPLIERS: Record<string, number> = {
	EARTHQUAKE: 1,
	TSUNAMI: 1.5,
	HURRICANE: 1.2,
	TORNADO: 1.3,
	FLOOD: 0.8,
	WILDFIRE: 0.9,
	DROUGHT: 0.6,
	PLAGUE: 1.2,
	BLIZZARD: 0.7,
	HEATWAVE: 0.8,
	VOLCANIC_ERUPTION: 1.4,
	LANDSLIDE: 1.1,
	SANDSTORM: 0.5,
	LOCUST_SWARM: 0.3,
	BLIGHT: 0.4,
	COLD_SNAP: 0.7,
	MONSOON: 0.9,
	AVALANCHE: 1.2,
	SINKHOLE: 1,
	METEOR_STRIKE: 1.8,
	SUPERSTORM: 1.4,
	MEGAQUAKE: 1.6,
	APOCALYPSE: 2,
};

/**
 * Production penalty multipliers per disaster type
 * Each value is a multiplier (1.0 = no penalty, 0.5 = -50% production)
 *
 * GDD Reference: Section 3.5.4 (Disaster Effects on Resources)
 */
const DISASTER_PRODUCTION_PENALTIES: Record<
	string,
	{
		food?: number;
		water?: number;
		wood?: number;
		stone?: number;
		ore?: number;
	}
> = {
	// Environmental disasters
	DROUGHT: { food: 0.5, water: 0.7 }, // Severe food/water shortage
	WILDFIRE: { wood: 0.6, food: 0.8 }, // Burns forests, destroys crops
	FLOOD: { food: 0.7, water: 0.7, wood: 0.7, stone: 0.7, ore: 0.7 }, // Widespread damage
	BLIZZARD: { food: 0.6, water: 0.8, wood: 0.9 }, // Freeze crops, hinder access
	HEATWAVE: { food: 0.7, water: 0.6 }, // Crops wilt, water evaporates

	// Geological disasters
	EARTHQUAKE: { stone: 0.5, ore: 0.5, wood: 0.8 }, // Mine collapse, quarry damage
	VOLCANIC_ERUPTION: { food: 0.4, water: 0.6, stone: 0.7 }, // Ash destroys crops
	LANDSLIDE: { stone: 0.6, wood: 0.7 }, // Buries quarries/forests
	SINKHOLE: { stone: 0.7, ore: 0.7 }, // Mining hazards
	AVALANCHE: { stone: 0.6, wood: 0.6 }, // Mountain resources blocked

	// Storm disasters
	HURRICANE: { food: 0.7, wood: 0.6, water: 0.8 }, // Wind damage
	TORNADO: { food: 0.6, wood: 0.5, stone: 0.8 }, // Extreme localized damage
	TSUNAMI: { food: 0.5, water: 0.8, wood: 0.6 }, // Coastal devastation
	MONSOON: { food: 0.7, wood: 0.8 }, // Heavy rain damage
	SANDSTORM: { food: 0.8, water: 0.8, stone: 0.9 }, // Reduced visibility

	// Biological disasters
	PLAGUE: { food: 0.8, water: 0.9 }, // Labor shortage (sick workers)
	LOCUST_SWARM: { food: 0.3 }, // Devour crops (-70%)
	BLIGHT: { food: 0.4 }, // Disease kills crops (-60%)

	// Rare disasters
	METEOR_STRIKE: { food: 0.5, water: 0.6, wood: 0.6, stone: 0.6, ore: 0.6 }, // Catastrophic
	COLD_SNAP: { food: 0.6, water: 0.8 }, // Sudden freeze
	SUPERSTORM: { food: 0.6, water: 0.7, wood: 0.5, stone: 0.8, ore: 0.9 }, // Extreme weather
	MEGAQUAKE: { stone: 0.4, ore: 0.4, wood: 0.6, food: 0.7, water: 0.8 }, // Massive seismic
	APOCALYPSE: { food: 0.3, water: 0.3, wood: 0.3, stone: 0.3, ore: 0.3 }, // World-ending
};

/**
 * Calculate production modifiers from all active disasters affecting a settlement
 *
 * Combines multiple disaster effects multiplicatively and applies time-based
 * intensity based on disaster phase (IMPACT = full penalty, AFTERMATH = decaying)
 *
 * @param activeDisasters - Disasters currently in IMPACT or AFTERMATH phase
 * @param settlement - Settlement being affected (for future biome-specific logic)
 * @param currentTime - Current game timestamp (milliseconds)
 * @returns Resource multipliers and total penalty percentage
 *
 * @example
 * // Single DROUGHT disaster in IMPACT phase
 * const result = calculateAllDisasterModifiers([drought], settlement, Date.now());
 * // result.resourceModifiers.food = 0.5 (50% production)
 * // result.resourceModifiers.water = 0.7 (70% production)
 *
 * @example
 * // Two disasters (DROUGHT + WILDFIRE) in IMPACT phase
 * const result = calculateAllDisasterModifiers([drought, wildfire], settlement, Date.now());
 * // result.resourceModifiers.food = 0.5 × 0.8 = 0.4 (40% production)
 */
export function calculateAllDisasterModifiers(
	activeDisasters: Array<{ type: string; status: string; impactEndedAt?: Date; resolvedAt?: Date }>,
	settlement: unknown, // For future use (biome-specific modifiers)
	currentTime: number
): {
	resourceModifiers: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};
	totalPenalty: number;
} {
	// Start with no penalties (1 = 100% production)
	const modifiers = {
		food: 1,
		water: 1,
		wood: 1,
		stone: 1,
		ore: 1,
	};

	// No disasters = no penalties
	if (!activeDisasters || activeDisasters.length === 0) {
		return { resourceModifiers: modifiers, totalPenalty: 0 };
	}

	// Apply each disaster's effects (multiplicative combination)
	for (const disaster of activeDisasters) {
		// Only affect disasters in IMPACT or AFTERMATH phases
		if (disaster.status !== 'IMPACT' && disaster.status !== 'AFTERMATH') {
			continue;
		}

		// Calculate time-based intensity (100% = full penalty)
		let intensity = 1;

		if (disaster.status === 'AFTERMATH') {
			// AFTERMATH phase: Decay from 100% to 0% over duration
			const aftermathStart = disaster.impactEndedAt?.getTime() || currentTime;
			const aftermathDuration =
				(disaster.resolvedAt?.getTime() || currentTime + 2592000000) - aftermathStart; // Default 30 days if no resolvedAt
			const timeInAftermath = currentTime - aftermathStart;

			// Linear decay: 100% → 0%
			intensity = Math.max(0, Math.min(1, 1 - timeInAftermath / aftermathDuration));
		}

		// Get disaster-specific penalties
		const penalties = DISASTER_PRODUCTION_PENALTIES[disaster.type] || {};

		// Apply penalties to each resource (multiplicative)
		// Formula: newModifier = currentModifier × (1 - ((1 - penalty) × intensity))
		// Example: 0.7 penalty at 100% intensity = multiply by 0.7
		// Example: 0.7 penalty at 50% intensity = multiply by 0.85
		if (penalties.food !== undefined) {
			modifiers.food *= 1 - (1 - penalties.food) * intensity;
		}
		if (penalties.water !== undefined) {
			modifiers.water *= 1 - (1 - penalties.water) * intensity;
		}
		if (penalties.wood !== undefined) {
			modifiers.wood *= 1 - (1 - penalties.wood) * intensity;
		}
		if (penalties.stone !== undefined) {
			modifiers.stone *= 1 - (1 - penalties.stone) * intensity;
		}
		if (penalties.ore !== undefined) {
			modifiers.ore *= 1 - (1 - penalties.ore) * intensity;
		}
	}

	// Calculate average penalty across all resources
	const totalPenalty =
		1 - (modifiers.food + modifiers.water + modifiers.wood + modifiers.stone + modifiers.ore) / 5;

	return { resourceModifiers: modifiers, totalPenalty };
}

/**
 * Calculate damage for a single settlement affected by disaster
 */
export async function calculateSettlementDamage(
	disaster: DisasterEvent,
	settlement: Settlement
): Promise<DamageCalculationResult> {
	try {
		logger.info(`[DAMAGE] Calculating damage for settlement ${settlement.id}`, {
			disasterId: disaster.id,
			disasterType: disaster.type,
			severity: disaster.severity,
		});

		// 1. Calculate preparedness score (0-100)
		const preparedness = await calculatePreparedness(settlement, disaster.type);

		// 2. Calculate base damage: (Severity - Preparedness) ± 20% variance
		const baseDamage = disaster.severity - preparedness;
		const variance = (Math.random() - 0.5) * 0.4; // ±20%
		const netDamage = Math.max(0, Math.min(100, baseDamage * (1 + variance)));

		logger.info(`[DAMAGE] Damage calculation`, {
			preparedness,
			baseDamage,
			variance,
			netDamage,
		});

		// 3. Apply damage to structures
		const structureDamage = await applyStructureDamage(settlement.id, disaster.type, netDamage);

		// 4. Calculate population casualties
		const casualties = await calculateCasualties(settlement, disaster, netDamage);

		// 5. Calculate resource loss from damaged storage
		const resourcesLost = await calculateResourceLoss(settlement.id, structureDamage);

		const result: DamageCalculationResult = {
			casualties,
			structuresDamaged: structureDamage.damaged.length,
			structuresDestroyed: structureDamage.destroyed.length,
			resourcesLost,
			affectedStructures: [...structureDamage.damaged, ...structureDamage.destroyed],
		};

		logger.info('[DAMAGE] Final damage calculation', {
			settlementId: settlement.id,
			disasterType: disaster.type,
			severity: disaster.severity,
			preparedness,
			netDamage,
			casualties: result.casualties,
			structuresDamaged: result.structuresDamaged,
			structuresDestroyed: result.structuresDestroyed,
		});

		return result;
	} catch (error) {
		logger.error(`[DAMAGE] Error calculating settlement damage`, {
			settlementId: settlement.id,
			error: error instanceof Error ? error.message : String(error),
		});

		// Return zero damage on error
		return {
			casualties: 0,
			structuresDamaged: 0,
			structuresDestroyed: 0,
			resourcesLost: { food: 0, water: 0, wood: 0, stone: 0, ore: 0 },
			affectedStructures: [],
		};
	}
}

/**
 * Calculate settlement preparedness score (0-100)
 * Based on: shelter capacity, warning systems, disaster-specific defenses
 *
 * GDD Reference: Section 3.5.4 (Structure Damage & Repair System)
 */
async function calculatePreparedness(
	settlement: Settlement,
	disasterType: string
): Promise<number> {
	// Query all structures for settlement with structure definitions
	const structures = await db.query.settlementStructures.findMany({
		where: eq(settlementStructures.settlementId, settlement.id),
		with: {
			structure: true,
		},
	});

	let preparednessScore = 0;

	// Shelter capacity coverage (0-30 points)
	const shelterCapacity = structures
		.filter((s) => {
			const struct = Array.isArray(s.structure) ? s.structure[0] : s.structure;
			return struct?.buildingType === 'EMERGENCY_SHELTER';
		})
		.reduce((sum, s) => sum + 50 * s.level, 0); // 50 per shelter per level

	const population = await db.query.settlementPopulation.findFirst({
		where: eq(settlementPopulation.settlementId, settlement.id),
	});

	if (population && population.currentPopulation > 0) {
		const coveragePercent = Math.min(100, (shelterCapacity / population.currentPopulation) * 100);
		preparednessScore += (coveragePercent / 100) * 30;
	}

	// Warning systems active (0-15 points)
	const hasWatchtower = structures.some((s) => {
		const struct = Array.isArray(s.structure) ? s.structure[0] : s.structure;
		return struct?.buildingType === 'WATCHTOWER';
	});
	const hasMeteorology = structures.some((s) => {
		const struct = Array.isArray(s.structure) ? s.structure[0] : s.structure;
		return struct?.buildingType === 'METEOROLOGY_CENTER';
	});
	const hasSeismology = structures.some((s) => {
		const struct = Array.isArray(s.structure) ? s.structure[0] : s.structure;
		return struct?.buildingType === 'SEISMOLOGY_STATION';
	});

	if (hasWatchtower) preparednessScore += 5;
	if (hasMeteorology) preparednessScore += 5;
	if (hasSeismology) preparednessScore += 5;

	// Disaster-specific defenses (0-30 points)
	const defenseScore = calculateDefenseScore(structures, disasterType);
	preparednessScore += defenseScore;

	// Fortress specialization bonus (0-30 points)
	const hasFortress = structures.some((s) => {
		const struct = Array.isArray(s.structure) ? s.structure[0] : s.structure;
		return struct?.buildingType === 'FORTRESS';
	});
	if (hasFortress) preparednessScore += 30;

	// Resilience score bonus (0-20 points)
	// Assuming settlement has resilience field (0-100)
	if ('resilience' in settlement && typeof settlement.resilience === 'number') {
		preparednessScore += (settlement.resilience / 100) * 20;
	}

	return Math.min(100, preparednessScore);
}

/**
 * Calculate defense score from disaster-specific defensive structures
 */
function calculateDefenseScore(
	structures: Array<Record<string, unknown>>,
	disasterType: string
): number {
	let score = 0;

	for (const structure of structures) {
		const struct = Array.isArray(structure.structure)
			? structure.structure[0]
			: structure.structure;
		const resistances = STRUCTURE_RESISTANCES[struct?.buildingType || 'HOUSE'] || {};

		// Check specific resistance
		if (resistances[disasterType]) {
			score += Math.abs(resistances[disasterType]) * 30; // Convert to points
		}

		// Check general resistance
		if (resistances.ALL) {
			score += resistances.ALL * 30;
		}
	}

	return Math.min(30, score);
}

/**
 * Apply damage to structures based on disaster type and resistance
 * Returns damaged and destroyed structures
 */
async function applyStructureDamage(
	settlementId: string,
	disasterType: string,
	netDamage: number
): Promise<{
	damaged: Array<{ structureId: string; name: string; oldHealth: number; newHealth: number }>;
	destroyed: Array<{ structureId: string; name: string; oldHealth: number; newHealth: number }>;
}> {
	const damaged: Array<{
		structureId: string;
		name: string;
		oldHealth: number;
		newHealth: number;
	}> = [];
	const destroyed: Array<{
		structureId: string;
		name: string;
		oldHealth: number;
		newHealth: number;
	}> = [];

	// Query all structures in settlement
	const structures = await db.query.settlementStructures.findMany({
		where: eq(settlementStructures.settlementId, settlementId),
		with: {
			structure: true,
		},
	});

	for (const structure of structures) {
		const oldHealth = structure.health || 100;

		// Calculate structure-specific resistance
		let resistance = 0;
		const struct = Array.isArray(structure.structure)
			? structure.structure[0]
			: structure.structure;
		const resistances = STRUCTURE_RESISTANCES[struct?.buildingType || 'HOUSE'] || {};

		if (resistances[disasterType]) {
			resistance = resistances[disasterType];
		} else if (resistances.ALL) {
			resistance = resistances.ALL;
		}

		// Apply damage formula: damage = netDamage × (1 - resistance)
		const structureDamage = netDamage * (1 - resistance);
		const newHealth = Math.max(0, oldHealth - structureDamage);

		// Update structure health in database
		await db
			.update(settlementStructures)
			.set({ health: newHealth })
			.where(eq(settlementStructures.id, structure.id));

		// Track damaged vs destroyed
		if (newHealth === 0) {
			destroyed.push({
				structureId: structure.id,
				name: struct?.name || struct?.buildingType || 'Unknown',
				oldHealth,
				newHealth,
			});
		} else if (newHealth < oldHealth) {
			damaged.push({
				structureId: structure.id,
				name: struct?.name || struct?.buildingType || 'Unknown',
				oldHealth,
				newHealth,
			});
		}
	}

	logger.info(`[DAMAGE] Structure damage applied`, {
		settlementId,
		damaged: damaged.length,
		destroyed: destroyed.length,
	});

	return { damaged, destroyed };
}

/**
 * Calculate population casualties based on shelter capacity and hospital
 *
 * GDD Reference: Section 3.3.4 (Disaster Impact on Population)
 */
async function calculateCasualties(
	settlement: Settlement,
	disaster: DisasterEvent,
	netDamage: number
): Promise<number> {
	// Query population
	const population = await db.query.settlementPopulation.findFirst({
		where: eq(settlementPopulation.settlementId, settlement.id),
	});

	if (!population || population.currentPopulation === 0) {
		return 0;
	}

	// Query structures for shelter capacity
	const structures = await db.query.settlementStructures.findMany({
		where: eq(settlementStructures.settlementId, settlement.id),
		with: {
			structure: true,
		},
	});

	const shelterCapacity = structures
		.filter((s) => {
			const struct = Array.isArray(s.structure) ? s.structure[0] : s.structure;
			return struct?.buildingType === 'EMERGENCY_SHELTER';
		})
		.reduce((sum, s) => sum + 50 * s.level, 0);

	// Calculate unsheltered population
	const unsheltered = Math.max(0, population.currentPopulation - shelterCapacity);

	// Get disaster-specific multiplier
	const multiplier = DISASTER_CASUALTY_MULTIPLIERS[disaster.type] || 1;

	// Calculate base casualties
	const baseCasualties = unsheltered * (netDamage / 100) * multiplier;

	// Apply hospital treatment
	const hospital = structures.find((s) => {
		const struct = Array.isArray(s.structure) ? s.structure[0] : s.structure;
		return struct?.buildingType === 'HOSPITAL';
	});
	let hospitalSaveRate = 0;

	if (hospital) {
		// Hospital is functional if it exists and has health > 20%
		// Resource check for medical supplies can be added in Phase 5
		if (hospital.health && hospital.health > 20) {
			// Save rate: 50% (Level 1) to 75% (Level 5)
			hospitalSaveRate = 0.5 + (hospital.level - 1) * 0.05;
			hospitalSaveRate = Math.min(0.75, hospitalSaveRate);
		}
	}

	// Final casualties after hospital treatment
	const finalCasualties = Math.floor(baseCasualties * (1 - hospitalSaveRate));

	// Update population in database
	if (finalCasualties > 0) {
		await db
			.update(settlementPopulation)
			.set({
				currentPopulation: Math.max(0, population.currentPopulation - finalCasualties),
			})
			.where(eq(settlementPopulation.id, population.id));

		logger.info(`[DAMAGE] Casualties applied`, {
			settlementId: settlement.id,
			totalPopulation: population.currentPopulation,
			unsheltered,
			baseCasualties: Math.floor(baseCasualties),
			hospitalSaveRate,
			finalCasualties,
		});
	}

	return finalCasualties;
}

/**
 * Calculate resource loss from damaged storage structures
 *
 * When storage structures are damaged, a percentage of stored resources is lost
 */
async function calculateResourceLoss(
	settlementId: string,
	structureDamage: {
		damaged: Array<{ structureId: string; name: string; oldHealth: number; newHealth: number }>;
		destroyed: Array<{ structureId: string; name: string; oldHealth: number; newHealth: number }>;
	}
): Promise<{ food: number; water: number; wood: number; stone: number; ore: number }> {
	const resourcesLost = { food: 0, water: 0, wood: 0, stone: 0, ore: 0 };

	// Find damaged storage structures
	const damagedStorage = [...structureDamage.damaged, ...structureDamage.destroyed].filter(
		(s) => s.name.includes('WAREHOUSE') || s.name.includes('STORAGE')
	);

	if (damagedStorage.length === 0) {
		return resourcesLost;
	}

	// Query current storage
	const storage = await db.query.settlementStorage.findFirst({
		where: eq(settlementStorage.settlementId, settlementId),
	});

	if (!storage) {
		return resourcesLost;
	}

	// Calculate total damage percentage across all storage structures
	const totalHealthLost = damagedStorage.reduce((sum, s) => sum + (s.oldHealth - s.newHealth), 0);
	const avgDamagePercent = totalHealthLost / damagedStorage.length;

	// Apply loss percentage to each resource
	const lossMultiplier = avgDamagePercent / 100;

	resourcesLost.food = Math.floor((storage.food || 0) * lossMultiplier);
	resourcesLost.water = Math.floor((storage.water || 0) * lossMultiplier);
	resourcesLost.wood = Math.floor((storage.wood || 0) * lossMultiplier);
	resourcesLost.stone = Math.floor((storage.stone || 0) * lossMultiplier);
	resourcesLost.ore = Math.floor((storage.ore || 0) * lossMultiplier);

	// Update storage in database
	if (Object.values(resourcesLost).some((v) => v > 0)) {
		await db
			.update(settlementStorage)
			.set({
				food: Math.max(0, (storage.food || 0) - resourcesLost.food),
				water: Math.max(0, (storage.water || 0) - resourcesLost.water),
				wood: Math.max(0, (storage.wood || 0) - resourcesLost.wood),
				stone: Math.max(0, (storage.stone || 0) - resourcesLost.stone),
				ore: Math.max(0, (storage.ore || 0) - resourcesLost.ore),
			})
			.where(eq(settlementStorage.id, storage.id));

		logger.info(`[DAMAGE] Resource loss applied`, {
			settlementId,
			damagedStorageCount: damagedStorage.length,
			avgDamagePercent,
			resourcesLost,
		});
	}

	return resourcesLost;
}
