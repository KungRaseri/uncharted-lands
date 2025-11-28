/**
 * Disaster Store (Svelte 5)
 *
 * Manages disaster state and real-time updates via Socket.IO events.
 * Handles the complete disaster lifecycle: WARNING → IMPACT → AFTERMATH → RESOLVED
 */

import { socketStore } from './socket';
import type {
	DisasterWarningData,
	DisasterImminentData,
	DisasterImpactStartData,
	DisasterDamageUpdateData,
	DisasterImpactEndData,
	DisasterAftermathData,
	DisasterResolvedData,
	StructureDamagedData
} from '$lib/types/socket-events';

interface DisasterEvent {
	id: string;
	type: string;
	severity: number;
	severityLevel: string;
	duration: number;
	affectedRegion?: string | null;
	affectedBiomes: string[];
}

interface DamageUpdate {
	structureId: string;
	structureName?: string;
	structureType: string;
	oldHealth: number;
	newHealth: number;
	damageDealt: number;
	timestamp: number;
}

interface AftermathSummary {
	totalDamage: number;
	structuresDamaged: number;
	structuresDestroyed: number;
	casualties: number;
	populationSheltered: number;
	estimatedRepairCost: {
		wood: number;
		stone: number;
		ore: number;
	};
	happinessLoss: number;
	emigrationIncrease: number;
}

class DisasterStore {
	// Active disaster state
	activeDisaster = $state<DisasterEvent | null>(null);

	// Warning state
	warningActive = $state(false);
	warningDismissed = $state(false);
	timeUntilImpact = $state<number | null>(null); // milliseconds

	// Impact state
	impactActive = $state(false);
	damageUpdates = $state<DamageUpdate[]>([]);
	totalDamageDealt = $state(0);
	structuresDamaged = $state(0);

	// Aftermath state
	aftermathSummary = $state<AftermathSummary | null>(null);
	aftermathModalOpen = $state(false);
	emergencyRepairWindowActive = $state(false);
	emergencyRepairTimeRemaining = $state<number | null>(null); // milliseconds

	private countdownInterval: ReturnType<typeof setInterval> | null = null;

	constructor() {
		this.setupSocketListeners();
		this.startCountdownTimer();
	}

	private setupSocketListeners() {
		const socket = socketStore.getSocket();
		if (!socket) {
			console.warn('[DISASTER] Socket not available, listeners not set up');
			return;
		}

		// WARNING phase
		socket.on('disaster-warning', (data: DisasterWarningData) => {
			console.log('[DISASTER] Warning received:', data);
			this.activeDisaster = {
				id: data.disasterId,
				type: data.type,
				severity: data.severity,
				severityLevel: data.severityLevel,
				duration: 0, // Will be set on impact start
				affectedRegion: data.affectedRegion,
				affectedBiomes: data.affectedBiomes
			};
			this.warningActive = true;
			this.warningDismissed = false;
			this.timeUntilImpact = data.timeRemaining;
		});

		// IMMINENT phase (30 min warning)
		socket.on('disaster-imminent', (data: DisasterImminentData) => {
			console.log('[DISASTER] Imminent:', data);
			this.timeUntilImpact = data.impactIn;
			// Could trigger urgent notification here
		});

		// IMPACT start
		socket.on('disaster-impact-start', (data: DisasterImpactStartData) => {
			console.log('[DISASTER] Impact started:', data);
			this.warningActive = false;
			this.impactActive = true;
			this.damageUpdates = [];
			this.totalDamageDealt = 0;
			this.structuresDamaged = 0;

			if (this.activeDisaster) {
				this.activeDisaster.duration = data.duration;
			}
		});

		// DAMAGE updates (individual structure damage)
		socket.on('structure-damaged', (data: StructureDamagedData) => {
			console.log('[DISASTER] Structure damaged:', data);

			// Calculate damage dealt
			const oldHealth =
				this.damageUpdates.length > 0
					? this.damageUpdates[this.damageUpdates.length - 1].newHealth
					: 100;
			const damageDealt = Math.max(0, oldHealth - data.health);

			const update: DamageUpdate = {
				structureId: data.structureId,
				structureType: data.disasterType, // Type is actually in the event
				oldHealth: oldHealth,
				newHealth: data.health,
				damageDealt: damageDealt,
				timestamp: data.timestamp
			};

			this.damageUpdates.push(update);
			this.totalDamageDealt += damageDealt;
			this.structuresDamaged++;

			// Keep only last 20 updates (scrolling feed)
			if (this.damageUpdates.length > 20) {
				this.damageUpdates.shift();
			}
		});

		// DAMAGE progress updates
		socket.on('disaster-damage-update', (data: DisasterDamageUpdateData) => {
			console.log('[DISASTER] Damage update:', data.progress, '%');
			// Could update progress bar here
		});

		// IMPACT end
		socket.on('disaster-impact-end', (data: DisasterImpactEndData) => {
			console.log('[DISASTER] Impact ended:', data);
			this.impactActive = false;

			// Build aftermath summary from final data
			this.aftermathSummary = {
				totalDamage: this.totalDamageDealt,
				structuresDamaged: data.structuresDamaged,
				structuresDestroyed: data.structuresDestroyed,
				casualties: data.casualties,
				populationSheltered: 0, // TODO: Get from shelter system
				estimatedRepairCost: {
					wood: Math.floor(this.totalDamageDealt * 2),
					stone: Math.floor(this.totalDamageDealt * 1.5),
					ore: Math.floor(this.totalDamageDealt * 0.5)
				},
				happinessLoss: Math.floor(data.casualties * 0.5), // Estimate
				emigrationIncrease: data.casualties * 0.01 // 1% per casualty
			};
		});

		// AFTERMATH
		socket.on('disaster-aftermath', (data: DisasterAftermathData) => {
			console.log('[DISASTER] Aftermath phase:', data);
			this.aftermathModalOpen = true;
			this.emergencyRepairWindowActive = data.emergencyRepairDiscount;
			this.emergencyRepairTimeRemaining = 48 * 60 * 60 * 1000; // 48 hours
		});

		// RESOLVED (cleanup)
		socket.on('disaster-resolved', (data: DisasterResolvedData) => {
			console.log('[DISASTER] Resolved:', data);
			this.activeDisaster = null;
			this.warningActive = false;
			this.impactActive = false;
			this.emergencyRepairWindowActive = false;
			this.aftermathSummary = null;
		});
	}

	private startCountdownTimer() {
		// Clear any existing interval
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
		}

		this.countdownInterval = setInterval(() => {
			// Update warning countdown
			if (this.timeUntilImpact !== null && this.timeUntilImpact > 0) {
				this.timeUntilImpact -= 1000; // Decrement by 1 second
			}

			// Update emergency repair countdown
			if (this.emergencyRepairTimeRemaining !== null && this.emergencyRepairTimeRemaining > 0) {
				this.emergencyRepairTimeRemaining -= 1000;

				if (this.emergencyRepairTimeRemaining <= 0) {
					this.emergencyRepairWindowActive = false;
				}
			}
		}, 1000);
	}

	// Actions
	dismissWarning() {
		this.warningDismissed = true;
	}

	closeAftermathModal() {
		this.aftermathModalOpen = false;
	}

	// Computed values
	get warningBannerVisible() {
		return this.warningActive && !this.warningDismissed;
	}

	get impactBannerVisible() {
		return this.impactActive;
	}

	get timeUntilImpactFormatted() {
		if (!this.timeUntilImpact) return '';

		const hours = Math.floor(this.timeUntilImpact / (1000 * 60 * 60));
		const minutes = Math.floor((this.timeUntilImpact % (1000 * 60 * 60)) / (1000 * 60));

		return `${hours}h ${minutes}m`;
	}

	get emergencyRepairTimeFormatted() {
		if (!this.emergencyRepairTimeRemaining) return '';

		const hours = Math.floor(this.emergencyRepairTimeRemaining / (1000 * 60 * 60));

		return `${hours}h remaining`;
	}

	// Cleanup
	destroy() {
		if (this.countdownInterval) {
			clearInterval(this.countdownInterval);
		}
	}
}

export const disasterStore = new DisasterStore();
