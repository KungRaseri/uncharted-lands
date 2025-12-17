/**
 * Population Assignment System
 *
 * Auto-assigns population to structures based on priority and availability.
 *
 * Phase 1D: Population Assignment System
 *
 * @see AUDIT-GDD-vs-Implementation.md lines 545-575
 * @see GDD-Monolith.md Section 3.3.3 (Population Assignment)
 */

import type { SettlementStructure, buildingTypeEnum, extractorTypeEnum } from '../db/schema.js';
import { getStaffingRequirement, type StaffingRequirement } from '../config/structure-staffing.js';

// Type inference for structure types
type BuildingType = (typeof buildingTypeEnum.enumValues)[number];
type ExtractorType = (typeof extractorTypeEnum.enumValues)[number];

/**
 * Structure with full type information for assignment
 */
export interface StructureWithType extends SettlementStructure {
	category: 'BUILDING' | 'EXTRACTOR';
	buildingType?: BuildingType;
	extractorType?: ExtractorType;
}

/**
 * Result of population assignment
 */
export interface AssignmentResult {
	/**
	 * Updated structures with new population assignments
	 */
	assignments: Map<string, number>; // structureId → populationAssigned

	/**
	 * Total population assigned across all structures
	 */
	totalAssigned: number;

	/**
	 * Population remaining unassigned
	 */
	remainingPopulation: number;

	/**
	 * Structures that couldn't be fully staffed
	 */
	understaffedStructures: Array<{
		structureId: string;
		required: number;
		assigned: number;
		deficit: number;
	}>;

	/**
	 * Structures that are fully staffed
	 */
	fullyStaffedStructures: string[];
}

/**
 * Auto-assign population to structures based on priority
 *
 * Algorithm:
 * 1. Sort structures by priority (10 = highest)
 * 2. Assign required workers to high-priority structures first
 * 3. Assign optional workers to structures with bonuses
 * 4. Track understaffed structures
 *
 * @param totalPopulation - Available population to assign
 * @param structures - Structures to staff
 * @returns Assignment result with updates
 */
export function autoAssignPopulation(
	totalPopulation: number,
	structures: StructureWithType[]
): AssignmentResult {
	const assignments = new Map<string, number>();
	const understaffedStructures: AssignmentResult['understaffedStructures'] = [];
	const fullyStaffedStructures: string[] = [];
	let remainingPopulation = totalPopulation;

	// Get staffing requirements for each structure
	const structuresWithRequirements = structures.map((structure) => {
		const type =
			structure.category === 'BUILDING' ? structure.buildingType! : structure.extractorType!;
		const staffing = getStaffingRequirement(structure.category, type);
		return {
			structure,
			staffing,
		};
	});

	// Sort by priority (highest first)
	const sortedStructures = structuresWithRequirements
		.filter(({ staffing }) => staffing.required > 0) // Only structures that need workers
		.sort((a, b) => b.staffing.priority - a.staffing.priority);

	// Phase 1: Assign required workers
	for (const { structure, staffing } of sortedStructures) {
		const required = staffing.required;
		const canAssign = Math.min(required, remainingPopulation);

		// Only set assignment if we actually assigned workers
		if (canAssign > 0) {
			assignments.set(structure.id, canAssign);
			remainingPopulation -= canAssign;
		}

		if (canAssign < required) {
			understaffedStructures.push({
				structureId: structure.id,
				required,
				assigned: canAssign,
				deficit: required - canAssign,
			});
		}
	}

	// Phase 2: Assign optional workers (if bonuses available)
	if (remainingPopulation > 0) {
		// Sort by bonus value (highest bonus first)
		const structuresWithBonuses = sortedStructures
			.filter(({ staffing }) => staffing.optional && staffing.optional > 0)
			.sort((a, b) => {
				const bonusA = a.staffing.bonusPerWorker || 0;
				const bonusB = b.staffing.bonusPerWorker || 0;
				return bonusB - bonusA; // Highest bonus first
			});

		for (const { structure, staffing } of structuresWithBonuses) {
			const currentAssigned = assignments.get(structure.id) || 0;
			const maxCapacity = staffing.required + (staffing.optional || 0);
			const availableSlots = maxCapacity - currentAssigned;

			if (availableSlots > 0 && remainingPopulation > 0) {
				const toAssign = Math.min(availableSlots, remainingPopulation);
				assignments.set(structure.id, currentAssigned + toAssign);
				remainingPopulation -= toAssign;
			}
		}
	}

	// Identify fully staffed structures
	for (const { structure, staffing } of sortedStructures) {
		const assigned = assignments.get(structure.id) || 0;
		const maxCapacity = staffing.required + (staffing.optional || 0);

		if (assigned >= maxCapacity) {
			fullyStaffedStructures.push(structure.id);
		}
	}

	const totalAssigned = totalPopulation - remainingPopulation;

	return {
		assignments,
		totalAssigned,
		remainingPopulation,
		understaffedStructures,
		fullyStaffedStructures,
	};
}

/**
 * Calculate production bonus from staffing
 *
 * Formula:
 * - If assigned < required: No bonus (partial staffing)
 * - If assigned >= required: Linear bonus per worker above minimum
 *
 * Example:
 * - FARM requires 2, has bonus 0.10 (+10% per worker)
 * - Assigned 4 workers → 2 extra workers → +20% production
 *
 * @param assigned - Population assigned to structure
 * @param staffing - Staffing requirements
 * @returns Production multiplier (1.0 = base, 1.2 = +20% bonus)
 */
export function calculateStaffingBonus(assigned: number, staffing: StaffingRequirement): number {
	// No bonus if not fully staffed (required workers)
	if (assigned < staffing.required) {
		return 1;
	}

	// Calculate bonus from optional workers
	const bonusWorkers = assigned - staffing.required;
	const bonusPerWorker = staffing.bonusPerWorker || 0;
	const totalBonus = bonusWorkers * bonusPerWorker;

	return 1 + totalBonus;
}

/**
 * Get structures that are not fully staffed (required workers missing)
 *
 * @param structures - Structures to check
 * @returns Understaffed structures with deficit information
 */
export function getUnstaffedStructures(structures: StructureWithType[]): Array<{
	structureId: string;
	required: number;
	assigned: number;
	deficit: number;
}> {
	const understaffed: ReturnType<typeof getUnstaffedStructures> = [];

	for (const structure of structures) {
		const type =
			structure.category === 'BUILDING' ? structure.buildingType! : structure.extractorType!;
		const staffing = getStaffingRequirement(structure.category, type);
		const assigned = structure.populationAssigned || 0;

		if (assigned < staffing.required) {
			understaffed.push({
				structureId: structure.id,
				required: staffing.required,
				assigned,
				deficit: staffing.required - assigned,
			});
		}
	}

	return understaffed;
}

/**
 * Validate that structure assignments don't exceed capacity
 *
 * @param structure - Structure to validate
 * @param assigned - Population assigned
 * @returns True if valid, false if over capacity
 */
export function validateAssignment(structure: StructureWithType, assigned: number): boolean {
	const type =
		structure.category === 'BUILDING' ? structure.buildingType! : structure.extractorType!;
	const staffing = getStaffingRequirement(structure.category, type);
	const maxCapacity = staffing.required + (staffing.optional || 0);
	return assigned <= maxCapacity;
}

/**
 * Calculate total production bonus for all structures
 *
 * @param structures - Structures with assignments
 * @returns Map of structureId → production multiplier
 */
export function calculateAllStaffingBonuses(structures: StructureWithType[]): Map<string, number> {
	const bonuses = new Map<string, number>();

	for (const structure of structures) {
		const type =
			structure.category === 'BUILDING' ? structure.buildingType! : structure.extractorType!;
		const staffing = getStaffingRequirement(structure.category, type);
		const assigned = structure.populationAssigned || 0;
		const bonus = calculateStaffingBonus(assigned, staffing);
		bonuses.set(structure.id, bonus);
	}

	return bonuses;
}
