/**
 * Repair Cost Calculator
 *
 * Calculates the cost to repair damaged structures based on:
 * - Disaster type (different disasters have different repair costs)
 * - Health to restore
 * - Emergency discount window (50% off for 48 hours post-disaster)
 *
 * Source: GDD-Monolith.md Section 6.2 "Disaster Balance" - Repair Cost Multipliers
 * Last Updated: 2025-11-23
 */

import type { DisasterType } from '../db/schema.js';
import type { Resources } from './resource-calculator.js';
import * as schema from '../db/schema.js';

/**
 * Disaster-specific repair cost multipliers
 *
 * Cost per 10% health restored = Original Cost × Multiplier
 *
 * GDD Reasoning:
 * - Fire: Localized damage, easy to repair (15%)
 * - Storm: Water damage, roof repairs (20%)
 * - Drought: Infrastructure stress, cracking (20%)
 * - Earthquake: Foundation cracks, structural (25%)
 * - Flood: Water + mud + structural damage (30%)
 * - Tornado: Scattered debris, widespread (35%)
 * - Tsunami: Water + debris + foundation (40%)
 * - Catastrophic: Extreme damage, may be cheaper to rebuild (50%)
 */
export const DISASTER_REPAIR_MULTIPLIERS: Record<DisasterType, number> = {
	// Easy to repair (15-20%)
	WILDFIRE: 0.15,
	BLIZZARD: 0.2,

	// Moderate to repair (20-25%)
	DROUGHT: 0.2,
	HEATWAVE: 0.2,
	EARTHQUAKE: 0.25,

	// Hard to repair (30-40%)
	FLOOD: 0.3,
	TORNADO: 0.35,
	HURRICANE: 0.35,
	VOLCANO: 0.4,
	SANDSTORM: 0.25,

	// Very hard to repair (40-50%)
	INSECT_PLAGUE: 0.25, // Building damage is secondary, but contamination cleanup expensive
	LOCUST_SWARM: 0.25, // Similar to plague
	BLIGHT: 0.25,
	LANDSLIDE: 0.35,
	AVALANCHE: 0.35,
};

/**
 * Emergency repair discount settings
 */
export const EMERGENCY_REPAIR_CONFIG = {
	/** Duration of emergency discount window in milliseconds (48 hours) */
	DISCOUNT_WINDOW_MS: 48 * 60 * 60 * 1000,

	/** Discount percentage (0.5 = 50% off) */
	DISCOUNT_PERCENTAGE: 0.5,
};

export interface RepairCostParams {
	/** Structure object with requirements (from database query) */
	structure: typeof schema.structures.$inferSelect & {
		requirements: Array<{
			resource: { name: string };
			quantity: number;
		}>;
	};

	/** Current health (0-100) */
	currentHealth: number;

	/** Target health to restore to (0-100, default: 100) */
	targetHealth?: number;

	/** Type of disaster that caused the damage */
	disasterType: DisasterType;

	/** When the structure was damaged (for emergency discount calculation) */
	damagedAt?: Date;

	/** Whether to apply emergency discount (auto-calculated if damagedAt provided) */
	applyEmergencyDiscount?: boolean;
}

export interface RepairCostResult {
	/** Resources required to repair */
	cost: Partial<Resources>;

	/** Health restored by this repair */
	healthRestored: number;

	/** Whether emergency discount was applied */
	emergencyDiscountApplied: boolean;

	/** Time remaining in emergency discount window (ms, 0 if expired) */
	emergencyDiscountTimeRemaining: number;

	/** Normal cost (before discount, for comparison) */
	normalCost: Partial<Resources>;

	/** Disaster type that caused the damage */
	disasterType: DisasterType;

	/** Cost multiplier used */
	costMultiplier: number;
}

/**
 * Calculate the cost to repair a damaged structure
 *
 * Formula:
 * Repair Cost = Original Structure Cost × Disaster Multiplier × (Health Restored / 10)
 *
 * Example:
 * Hospital: { wood: 500, stone: 300, ore: 100 }
 * Earthquake damage: 30% health lost
 * Cost = { wood: 500, stone: 300, ore: 100 } × 0.25 × 3
 *      = { wood: 375, stone: 225, ore: 75 }
 *      = 75% of original cost to repair 30% damage
 *
 * With emergency discount (50% off):
 * Cost = { wood: 188, stone: 113, ore: 38 }
 */
export function calculateRepairCost(params: RepairCostParams): RepairCostResult {
	const {
		structure,
		currentHealth,
		targetHealth = 100,
		disasterType,
		damagedAt,
		applyEmergencyDiscount,
	} = params;

	// Validation
	if (currentHealth < 0 || currentHealth > 100) {
		throw new Error(`Invalid current health: ${currentHealth}. Must be 0-100.`);
	}
	if (targetHealth < 0 || targetHealth > 100) {
		throw new Error(`Invalid target health: ${targetHealth}. Must be 0-100.`);
	}
	if (targetHealth <= currentHealth) {
		throw new Error(
			`Target health (${targetHealth}) must be greater than current health (${currentHealth}).`
		);
	}

	// ✅ Phase 4: Extract structure costs from database requirements
	// Mirror pattern from structure-validation.ts
	const structureCost: Record<string, number> = {};
	for (const req of structure.requirements) {
		const resourceName = req.resource.name;
		if (resourceName && req.quantity > 0) {
			structureCost[resourceName.toLowerCase()] = req.quantity;
		}
	}

	// Calculate health to restore
	const healthRestored = targetHealth - currentHealth;

	// Get disaster-specific multiplier
	const costMultiplier = DISASTER_REPAIR_MULTIPLIERS[disasterType];
	if (costMultiplier === undefined) {
		throw new Error(`Unknown disaster type: ${disasterType}`);
	}

	// Calculate base repair cost
	// Cost = Original Cost × Multiplier × (Health Restored / 10)
	const normalCost: Partial<Resources> = {};
	for (const [resource, baseCost] of Object.entries(structureCost)) {
		if (baseCost && baseCost > 0) {
			const resourceCost = baseCost * costMultiplier * (healthRestored / 10);
			normalCost[resource as keyof Resources] = Math.ceil(resourceCost);
		}
	}

	// Determine if emergency discount applies
	let emergencyDiscountApplied = false;
	let emergencyDiscountTimeRemaining = 0;

	if (damagedAt) {
		const now = new Date();
		const timeSinceDamage = now.getTime() - damagedAt.getTime();
		const windowRemaining = EMERGENCY_REPAIR_CONFIG.DISCOUNT_WINDOW_MS - timeSinceDamage;

		if (windowRemaining > 0) {
			emergencyDiscountTimeRemaining = windowRemaining;
			emergencyDiscountApplied = true;
		}
	} else if (applyEmergencyDiscount === true) {
		// Manual override
		emergencyDiscountApplied = true;
	}

	// Apply emergency discount if applicable
	const cost: Partial<Resources> = { ...normalCost };
	if (emergencyDiscountApplied) {
		for (const resource of Object.keys(cost) as Array<keyof Resources>) {
			if (cost[resource]) {
				cost[resource] = Math.ceil(cost[resource] * EMERGENCY_REPAIR_CONFIG.DISCOUNT_PERCENTAGE);
			}
		}
	}

	return {
		cost,
		healthRestored,
		emergencyDiscountApplied,
		emergencyDiscountTimeRemaining,
		normalCost,
		disasterType,
		costMultiplier,
	};
}

/**
 * Calculate repair cost for full restoration (to 100% health)
 *
 * Convenience wrapper around calculateRepairCost
 */
export function calculateFullRepairCost(
	structure: typeof schema.structures.$inferSelect & {
		requirements: Array<{
			resource: { name: string };
			quantity: number;
		}>;
	},
	currentHealth: number,
	disasterType: DisasterType,
	damagedAt?: Date
): RepairCostResult {
	return calculateRepairCost({
		structure,
		currentHealth,
		targetHealth: 100,
		disasterType,
		damagedAt,
	});
}

/**
 * Check if player has sufficient resources to repair a structure
 *
 * @param repairCost - Result from calculateRepairCost
 * @param availableResources - Player's current resources
 * @returns Object with canAfford boolean and missing resources
 */
export function canAffordRepair(
	repairCost: RepairCostResult,
	availableResources: Resources
): { canAfford: boolean; missing: Partial<Resources> } {
	const missing: Partial<Resources> = {};
	let canAfford = true;

	for (const [resource, required] of Object.entries(repairCost.cost)) {
		const requiredAmount = required as number | undefined;
		if (requiredAmount && requiredAmount > 0) {
			const available = availableResources[resource as keyof Resources] || 0;
			if (available < requiredAmount) {
				missing[resource as keyof Resources] = requiredAmount - available;
				canAfford = false;
			}
		}
	}

	return { canAfford, missing };
}

/**
 * Get recommended repair priority based on structure health
 *
 * Returns priority level (1-5, where 1 is most urgent)
 */
export function getRepairPriority(health: number): {
	priority: 1 | 2 | 3 | 4 | 5;
	label: string;
	urgent: boolean;
} {
	if (health === 0) {
		return { priority: 1, label: 'DESTROYED', urgent: true };
	}
	if (health < 20) {
		return { priority: 1, label: 'CRITICAL', urgent: true };
	}
	if (health < 40) {
		return { priority: 2, label: 'POOR', urgent: true };
	}
	if (health < 60) {
		return { priority: 3, label: 'DAMAGED', urgent: false };
	}
	if (health < 80) {
		return { priority: 4, label: 'GOOD', urgent: false };
	}
	return { priority: 5, label: 'EXCELLENT', urgent: false };
}
