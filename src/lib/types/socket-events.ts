/**
 * Socket.IO Event Type Definitions (Client-side)
 *
 * Mirrors server/src/types/socket-events.ts for type safety
 */

// ===== DISASTER EVENTS =====

export interface DisasterWarningData {
	disasterId: string;
	type: string; // 'EARTHQUAKE', 'FLOOD', 'DROUGHT', etc.
	severity: number; // 0-100
	severityLevel: string; // 'MINOR', 'MODERATE', 'MAJOR', 'CATASTROPHIC'
	affectedRegion?: string | null;
	affectedBiomes: string[];
	timeRemaining: number; // milliseconds until impact
	recommendedActions: string[];
}

export interface DisasterImminentData {
	disasterId: string;
	type: string;
	severity: number;
	impactIn: number; // milliseconds (30 min warning)
}

export interface DisasterImpactStartData {
	disasterId: string;
	type: string;
	severity: number;
	duration: number; // milliseconds (5 min to 2 hours)
}

export interface DisasterDamageUpdateData {
	disasterId: string;
	progress: number; // 0-100 percentage
	timestamp: number;
}

export interface DisasterImpactEndData {
	disasterId: string;
	type: string;
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
}

export interface DisasterAftermathData {
	disasterId: string;
	settlementId: string;
	emergencyRepairDiscount: boolean; // 50% off for 48 hours
}

export interface DisasterResolvedData {
	settlementId: string;
	disasterType: string;
	resilienceGain: number; // +5 resilience
	newResilience: number;
}

export interface StructureDamagedData {
	settlementId: string;
	structureId: string;
	health: number; // New health percentage (0-100)
	disasterType: string;
	timestamp: number;
}

export interface StructureDestroyedData {
	settlementId: string;
	structureId: string;
	disasterType: string;
}

export interface CasualtiesReportData {
	settlementId: string;
	casualties: number;
	remainingPopulation: number;
	disasterType: string;
}

export interface EmergencyAidReceivedData {
	settlementId: string;
	fromPlayer: string;
	resources: {
		food?: number;
		water?: number;
		wood?: number;
		stone?: number;
		ore?: number;
	};
}

// ===== CONSTRUCTION EVENTS =====

export interface ConstructionStartedData {
	settlementId: string;
	structureId: string;
	structureType: string;
	completesAt: number; // timestamp
	queuePosition: 'ACTIVE' | number;
}

export interface ConstructionProgressData {
	settlementId: string;
	structureId: string;
	progress: number; // 0-100 percentage
}

export interface ConstructionCompleteData {
	settlementId: string;
	structureId: string;
	structureType: string;
	constructionTime: number; // milliseconds
}

export interface QueueUpdatedData {
	settlementId: string;
	queue: Array<{
		structureId: string;
		structureType: string;
		position: number;
		estimatedCompletion: number; // timestamp
	}>;
}

// ===== RESOURCE EVENTS =====

export interface ResourceTickData {
	settlementId: string;
	resources: {
		food: number;
		water: number;
		wood: number;
		stone: number;
		ore: number;
	};
	timestamp: number;
}

// ===== POPULATION EVENTS =====

export interface PopulationGrowthData {
	settlementId: string;
	currentPopulation: number;
	change: number;
	happiness: number;
}

export interface PopulationWarningData {
	settlementId: string;
	warning: string;
	severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface SettlerArrivedData {
	settlementId: string;
	count: number;
	newPopulation: number;
}

export interface SettlerLeftData {
	settlementId: string;
	count: number;
	newPopulation: number;
	reason: string;
}

// ===== GENERAL EVENTS =====

export interface GameStateData {
	settlements: Record<string, unknown>[]; // Full settlement data
	timestamp: number;
}

export interface StateUpdateData {
	type: string;
	data: Record<string, unknown>;
	timestamp: number;
}

export interface ErrorData {
	message: string;
	code?: string;
	details?: Record<string, unknown>;
}
