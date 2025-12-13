/**
 * Disaster-specific TypeScript type definitions
 *
 * These types are used for disaster history tracking and UI components.
 * Complements socket-events.ts with persistent storage types.
 */

/**
 * Disaster History Record
 *
 * Represents a completed disaster event that affected a settlement.
 * Stored in the disasterHistory database table.
 */
export interface DisasterHistory {
	/** Unique identifier for this history record */
	id: string;

	/** Reference to the disaster event that occurred */
	disasterId: string;

	/** Settlement that was affected by this disaster */
	settlementId: string;

	/** Type of disaster (EARTHQUAKE, FLOOD, DROUGHT, etc.) */
	type: string;

	/** Severity score (0-100) */
	severity: number;

	/** Severity level category (MINOR, MODERATE, MAJOR, CATASTROPHIC) */
	severityLevel: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CATASTROPHIC';

	/** Number of population casualties (deaths) */
	casualties: number;

	/** Number of structures that took damage */
	structuresDamaged: number;

	/** Number of structures destroyed (0 health) */
	structuresDestroyed: number;

	/** Resources lost from damaged storage or disaster effects */
	resourcesLost: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};

	/** Resilience points gained from surviving this disaster */
	resilienceGained: number;

	/** When this disaster occurred */
	timestamp: Date | string; // Date object from API, string from JSON
}

/**
 * Disaster History Filters
 *
 * Used by DisasterHistoryPanel for filtering the list.
 */
export interface DisasterHistoryFilters {
	/** Filter by disaster type (empty = all types) */
	type?: string;

	/** Filter by severity level (empty = all levels) */
	severityLevel?: 'MINOR' | 'MODERATE' | 'MAJOR' | 'CATASTROPHIC';

	/** Date range start (optional) */
	fromDate?: Date;

	/** Date range end (optional) */
	toDate?: Date;
}

/**
 * Disaster History Sort Options
 *
 * Defines how to sort the disaster history list.
 */
export type DisasterHistorySortBy = 'timestamp' | 'severity' | 'casualties' | 'type';

export interface DisasterHistorySort {
	/** Field to sort by */
	by: DisasterHistorySortBy;

	/** Sort direction */
	direction: 'asc' | 'desc';
}
