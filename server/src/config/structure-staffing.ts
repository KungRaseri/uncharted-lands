/**
 * Structure Staffing Configuration
 *
 * Defines population requirements and bonuses for each structure type.
 *
 * Phase 1D: Population Assignment System
 *
 * @see AUDIT-GDD-vs-Implementation.md lines 545-575
 * @see GDD-Monolith.md Section 3.3.3 (Population Assignment)
 */

import { buildingTypeEnum, extractorTypeEnum } from '../db/schema.js';

// Extract the enum values as types
type BuildingType = (typeof buildingTypeEnum.enumValues)[number];
type ExtractorType = (typeof extractorTypeEnum.enumValues)[number];

/**
 * Staffing requirements for a structure
 */
export interface StaffingRequirement {
	/**
	 * Minimum population required for structure to function
	 * - 0: No workers needed (passive structure)
	 * - 1+: Required workers for basic operation
	 */
	required: number;

	/**
	 * Optional additional workers for bonus production
	 * - Total capacity = required + optional
	 * - Diminishing returns apply beyond required
	 */
	optional?: number;

	/**
	 * Production bonus per assigned worker (0-1 scale)
	 * - Example: 0.10 = +10% production per worker
	 * - Applied linearly up to max capacity
	 */
	bonusPerWorker?: number;

	/**
	 * Priority for auto-assignment (1-10, higher = higher priority)
	 * - 10: Critical (FARM, essential survival)
	 * - 7-9: Important (MINE, RESEARCH_LAB)
	 * - 4-6: Standard (WORKSHOP, WAREHOUSE)
	 * - 1-3: Optional (Future structures)
	 */
	priority: number;

	/**
	 * Description for UI display
	 */
	description: string;
}

/**
 * Staffing requirements for extractor structures
 *
 * Extractors are placed on resource tiles and produce resources.
 */
export const EXTRACTOR_STAFFING: Record<ExtractorType, StaffingRequirement> = {
	FARM: {
		required: 2,
		optional: 3, // Max 5 workers total
		bonusPerWorker: 0.1, // +10% production per worker
		priority: 10, // Highest priority (food is essential)
		description: 'Farmers work the fields to produce food',
	},

	LUMBER_MILL: {
		required: 2,
		optional: 4, // Max 6 workers total
		bonusPerWorker: 0.1,
		priority: 8, // High priority (wood for building)
		description: 'Loggers harvest and process timber',
	},

	QUARRY: {
		required: 2,
		optional: 4, // Max 6 workers total
		bonusPerWorker: 0.08,
		priority: 7, // Important (stone for structures)
		description: 'Quarry workers extract stone',
	},

	MINE: {
		required: 3,
		optional: 5, // Max 8 workers total
		bonusPerWorker: 0.08,
		priority: 7, // Important (ore for advanced structures)
		description: 'Miners extract ore and minerals',
	},

	FISHING_DOCK: {
		required: 2,
		optional: 3, // Max 5 workers total
		bonusPerWorker: 0.1,
		priority: 9, // Very high (alternative food source)
		description: 'Fishermen catch fish from water',
	},

	HUNTING_LODGE: {
		required: 2,
		optional: 3, // Max 5 workers total
		bonusPerWorker: 0.1,
		priority: 8, // High (pelts and food)
		description: 'Hunters gather pelts and game',
	},

	HERB_GARDEN: {
		required: 1,
		optional: 2, // Max 3 workers total
		bonusPerWorker: 0.12,
		priority: 6, // Medium (special resource)
		description: 'Herbalists cultivate medicinal plants',
	},

	WELL: {
		required: 1,
		optional: 1, // Max 2 workers total
		bonusPerWorker: 0.1,
		priority: 10, // Highest priority (water is essential)
		description: 'Well operators maintain water supply',
	},
};

/**
 * Staffing requirements for building structures
 *
 * Buildings provide various benefits to settlements.
 *
 * Current schema supports 7 building types:
 * HOUSE, STORAGE, BARRACKS, WORKSHOP, MARKETPLACE, TOWN_HALL, WALL
 */
export const BUILDING_STAFFING: Record<BuildingType, StaffingRequirement> = {
	// ===== HOUSING & STORAGE =====

	HOUSE: {
		required: 0, // Passive housing
		priority: 0, // Not assigned (passive)
		description: 'Residential housing for population',
	},

	STORAGE: {
		required: 1,
		optional: 2, // Max 3 workers total
		bonusPerWorker: 0.05, // +5% storage efficiency (reduce waste)
		priority: 5, // Medium priority
		description: 'Workers manage inventory and prevent waste',
	},

	// ===== INFRASTRUCTURE =====

	TOWN_HALL: {
		required: 2,
		optional: 3, // Max 5 workers total
		bonusPerWorker: 0.05, // +5% administrative efficiency
		priority: 6, // Medium-high priority
		description: 'Administrators manage settlement operations',
	},

	WORKSHOP: {
		required: 2,
		optional: 3, // Max 5 workers total
		bonusPerWorker: 0.1, // +10% faster construction/upgrades
		priority: 7, // Important for development
		description: 'Craftsmen speed up construction projects',
	},

	MARKETPLACE: {
		required: 1,
		optional: 2, // Max 3 workers total
		bonusPerWorker: 0.08, // +8% trade efficiency (future)
		priority: 4, // Lower priority (trade not critical early)
		description: 'Merchants facilitate trade and commerce',
	},

	// ===== MILITARY & DEFENSE =====

	BARRACKS: {
		required: 2,
		optional: 5, // Max 7 workers total
		bonusPerWorker: 0.1, // +10% defense effectiveness (future)
		priority: 5, // Medium priority (defense structures)
		description: 'Soldiers train and defend the settlement',
	},

	WALL: {
		required: 1,
		optional: 2, // Max 3 workers total
		bonusPerWorker: 0.05, // +5% wall integrity maintenance
		priority: 4, // Lower priority (passive defense)
		description: 'Guards patrol and maintain defensive walls',
	},
};

/**
 * Get staffing requirement for a specific structure
 */
export function getStaffingRequirement(
	category: 'BUILDING' | 'EXTRACTOR',
	type: BuildingType | ExtractorType
): StaffingRequirement {
	if (category === 'EXTRACTOR') {
		return EXTRACTOR_STAFFING[type as ExtractorType];
	}
	return BUILDING_STAFFING[type as BuildingType];
}

/**
 * Calculate total population needed (required workers only)
 */
export function calculateTotalPopulationNeeded(
	structures: Array<{ category: 'BUILDING' | 'EXTRACTOR'; type: BuildingType | ExtractorType }>
): number {
	return structures.reduce((total, structure) => {
		const staffing = getStaffingRequirement(structure.category, structure.type);
		return total + staffing.required;
	}, 0);
}

/**
 * Calculate maximum population capacity (required + optional)
 */
export function calculateMaxPopulationCapacity(
	structures: Array<{ category: 'BUILDING' | 'EXTRACTOR'; type: BuildingType | ExtractorType }>
): number {
	return structures.reduce((total, structure) => {
		const staffing = getStaffingRequirement(structure.category, structure.type);
		return total + staffing.required + (staffing.optional || 0);
	}, 0);
}
